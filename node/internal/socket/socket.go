package socket

import (
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/gorilla/websocket"
)

type Message struct {
	ID string `json:"id"`
}

type TextMessage struct {
	ID      string `json:"id"`
	Message string `json:"message"`
}

type HyperparametersMessage struct {
	ID              string         `json:"id"`
	Hyperparameters map[string]int `json:"hyperparameters"`
}

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	// CheckOrigin: func(r *http.Request) bool {
	// 	return true // Accepting all requests
	// },
}

type ClientStatus int

const (
	Idle ClientStatus = iota
	Running
	Finished
)

type Client struct {
	Connection *websocket.Conn
	Status     ClientStatus
}

func (c *Client) SendHyperparameters(hyperparameters map[string]int) {
	if c.Status != Idle {
		fmt.Printf("Client is not idle, cannot send hyperparameters")
	}

	c.Status = Running
	c.Connection.WriteJSON(HyperparametersMessage{ID: "start-hyperparameters", Hyperparameters: hyperparameters})
	fmt.Printf("Sent hyperparameters %s to client %s\n", fmt.Sprint(hyperparameters), c.Connection.RemoteAddr())
}

type Server struct {
	Clients          map[*websocket.Conn]*Client
	handlers         map[string]func(connection *websocket.Conn, message []byte)
	availableClients chan string
}

func New(handlers map[string]func(connection *websocket.Conn, message []byte)) *Server {
	return &Server{
		Clients:          make(map[*websocket.Conn]*Client),
		handlers:         handlers,
		availableClients: make(chan string),
	}
}

func (s *Server) Start() {
	http.HandleFunc("/", s.handler)
	http.ListenAndServe(":8080", nil)
}

func (s *Server) AddHandler(id string, handler func(connection *websocket.Conn, message []byte)) {
	s.handlers[id] = handler
}

func (server *Server) handler(w http.ResponseWriter, r *http.Request) {

	connection, _ := upgrader.Upgrade(w, r, nil)

	server.Clients[connection] = &Client{
		Connection: connection,
		Status:     Idle,
	}

	for {
		messageType, message, err := connection.ReadMessage()
		m := Message{}
		json.Unmarshal(message, &m)
		fmt.Println(m.ID)
		fmt.Println(string(message))

		if err != nil || messageType == websocket.CloseMessage {
			break // Exit the loop if the client tries to close the connection or the connection is interrupted
		}

		if server.handlers[m.ID] == nil {
			fmt.Println("Unrecognized message ID: " + m.ID)
		}

		go server.handlers[m.ID](connection, message)
	}

	delete(server.Clients, connection) // Removing the connection

	connection.Close()
}

func (server *Server) WriteJSON(message interface{}) {
	for c := range server.Clients {
		server.Clients[c].Connection.WriteJSON(message)
	}
}
