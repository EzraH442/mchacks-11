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
	ID              string      `json:"id"`
	Hyperparameters interface{} `json:"hyperparameters"`
}

type TestResults struct {
	ID              string      `json:"ID"`
	Accuracy        []float64   `json:"accuracy"`
	Hyperparameters interface{} `json:"hyperparameters"`
}

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		return true // Accepting all requests
	},
}

type Server struct {
	MasterClients  map[*websocket.Conn]*MasterClient
	WorkerClients  map[*websocket.Conn]*WorkerClient
	workerHandlers map[string]func(connection *websocket.Conn, message []byte)
	masterHandlers map[string]func(connection *websocket.Conn, message []byte)
}

func New(
	workerHandlers map[string]func(connection *websocket.Conn, message []byte),
	masterHandlers map[string]func(connection *websocket.Conn, message []byte),
) *Server {
	return &Server{
		WorkerClients:  make(map[*websocket.Conn]*WorkerClient),
		MasterClients:  make(map[*websocket.Conn]*MasterClient),
		workerHandlers: workerHandlers,
		masterHandlers: masterHandlers,
	}
}

func (s *Server) Start() error {
	http.HandleFunc("/master", s.masterHandler)
	http.HandleFunc("/", s.workerHandler)
	err := http.ListenAndServe(":8080", nil)
	fmt.Print(err)
	return err
}

func (s *Server) AddWorkerHandler(id string, handler func(connection *websocket.Conn, message []byte)) {
	s.workerHandlers[id] = handler
}

func (s *Server) AddMasterHandler(id string, handler func(connection *websocket.Conn, message []byte)) {
	s.masterHandlers[id] = handler
}

func (server *Server) masterHandler(w http.ResponseWriter, r *http.Request) {
	connection, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		fmt.Println("Error upgrading connection: " + err.Error())
		return
	}

	MasterClient := MasterClient{Connection: connection}
	server.MasterClients[connection] = &MasterClient

	for {
		messageType, message, err := connection.ReadMessage()
		if err != nil || messageType == websocket.CloseMessage {
			fmt.Println(err)
			break // Exit the loop if the client tries to close the connection or the connection is interrupted
		}

		m := Message{}
		if err = json.Unmarshal(message, &m); err != nil {
			fmt.Println(err)
			continue
		}

		fmt.Printf("Recieved message: %s\n", string(message))
		if server.workerHandlers[m.ID] == nil {
			fmt.Println("Unrecognized message ID: " + m.ID)
		}

		go server.workerHandlers[m.ID](connection, message)
	}

	delete(server.WorkerClients, connection) // Removing the connection

	connection.Close()
}

func (server *Server) workerHandler(w http.ResponseWriter, r *http.Request) {
	connection, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		fmt.Println("Error upgrading connection: " + err.Error())
		return
	}
	worker := NewWorker(connection)
	server.WorkerClients[connection] = worker

	for _, mc := range server.MasterClients {
		mc.SendClientConnectedMessage(worker)
	}

	for {
		messageType, message, err := connection.ReadMessage()
		if err != nil || messageType == websocket.CloseMessage {
			break // Exit the loop if the client tries to close the connection or the connection is interrupted
		}

		m := Message{}
		if err = json.Unmarshal(message, &m); err != nil {
			fmt.Println(err)
			continue
		}

		fmt.Printf("Recieved message: %s\n", string(message))
		if server.workerHandlers[m.ID] == nil {
			fmt.Println("Unrecognized message ID: " + m.ID)
		}

		go server.workerHandlers[m.ID](connection, message)
	}

	for _, mc := range server.MasterClients {
		mc.SendClientDisconnectedMessage(worker)
	}

	delete(server.WorkerClients, connection) // Removing the connection

	connection.Close()
}

func (server *Server) WriteJSON(message interface{}) {
	for _, wc := range server.WorkerClients {
		wc.Connection.WriteJSON(message)
	}
}