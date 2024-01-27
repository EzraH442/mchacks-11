package socket

import (
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/gorilla/websocket"
)

type Message struct {
	Msg string `json:"msg"`
	ID  string `json:"id"`
}

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	// CheckOrigin: func(r *http.Request) bool {
	// 	return true // Accepting all requests
	// },
}

type Server struct {
	clients  map[*websocket.Conn]bool
	handlers map[string]func(connection *websocket.Conn, message []byte)
}

func New(handlers map[string]func(connection *websocket.Conn, message []byte)) *Server {
	return &Server{make(map[*websocket.Conn]bool), handlers}
}

func (server *Server) Start() {
	http.HandleFunc("/", server.handler)
	fmt.Println("Server listening on port 8080")
	http.ListenAndServe(":8080", nil)
}

func (server *Server) handler(w http.ResponseWriter, r *http.Request) {

	connection, _ := upgrader.Upgrade(w, r, nil)

	server.clients[connection] = true // Save the connection using it as a key

	for {
		messageType, message, err := connection.ReadMessage()
		m := Message{}
		err = json.Unmarshal(message, &m)
		fmt.Println(m.ID)
		fmt.Println(m.Msg)
		fmt.Println(string(message))

		if err != nil || messageType == websocket.CloseMessage {
			break // Exit the loop if the client tries to close the connection or the connection is interrupted
		}

		if server.handlers[m.ID] == nil {
			fmt.Println("Unrecognized message ID: " + m.ID)
		}

		go server.handlers[m.ID](connection, message)
	}

	delete(server.clients, connection) // Removing the connection

	connection.Close()
}

func (server *Server) WriteJSON(message interface{}) {
	for conn := range server.clients {
		conn.WriteJSON(message)
	}
}
