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

type Server struct {
	MasterClients  map[*websocket.Conn]*MasterClient
	Clients        map[*websocket.Conn]*WorkerClient
	workerHandlers map[string]func(connection *websocket.Conn, message []byte)
	masterHandlers map[string]func(connection *websocket.Conn, message []byte)
}

func New(
	workerHandlers map[string]func(connection *websocket.Conn, message []byte),
	masterHandlers map[string]func(connection *websocket.Conn, message []byte),
) *Server {
	return &Server{
		Clients:        make(map[*websocket.Conn]*WorkerClient),
		MasterClients:  make(map[*websocket.Conn]*MasterClient),
		workerHandlers: workerHandlers,
		masterHandlers: masterHandlers,
	}
}

func (s *Server) Start() {
	http.HandleFunc("/master", s.masterHandler)
	http.HandleFunc("/worker", s.workerHandler)
	http.ListenAndServe(":8080", nil)
}

func (s *Server) AddWorkerHandler(id string, handler func(connection *websocket.Conn, message []byte)) {
	s.workerHandlers[id] = handler
}

func (s *Server) AddMasterHandler(id string, handler func(connection *websocket.Conn, message []byte)) {
	s.masterHandlers[id] = handler
}

func (server *Server) masterHandler(w http.ResponseWriter, r *http.Request) {
	connection, _ := upgrader.Upgrade(w, r, nil)

	server.MasterClients[connection] = &MasterClient{
		Connection: connection,
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

		if server.workerHandlers[m.ID] == nil {
			fmt.Println("Unrecognized message ID: " + m.ID)
		}

		go server.workerHandlers[m.ID](connection, message)
	}

	delete(server.Clients, connection) // Removing the connection

	connection.Close()
}

func (server *Server) workerHandler(w http.ResponseWriter, r *http.Request) {
	connection, _ := upgrader.Upgrade(w, r, nil)

	server.Clients[connection] = &WorkerClient{
		Connection: connection,
		Status:     Idle,
	}

	for c := range server.MasterClients {
		c.WriteJSON(TextMessage{ID: "new-client", Message: fmt.Sprint(connection.RemoteAddr())})
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

		if server.workerHandlers[m.ID] == nil {
			fmt.Println("Unrecognized message ID: " + m.ID)
		}

		go server.workerHandlers[m.ID](connection, message)
	}

	delete(server.Clients, connection) // Removing the connection

	connection.Close()
}

func (server *Server) WriteJSON(message interface{}) {
	for c := range server.Clients {
		server.Clients[c].Connection.WriteJSON(message)
	}
}
