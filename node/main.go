package main

import (
	"socket"

	"github.com/gorilla/websocket"
)

type Trainer struct {
	combinations chan map[string]int
	slaves       chan *websocket.Conn
	server       *socket.Server
}

//	hyperparameters := map[string][]int{
//		"a": {10, 20, 30},

//		"b": {10, 20, 30, 40},
//		"c": {10, 20, 30},
//	}
func NewTrainer(server *socket.Server) *Trainer {
	return &Trainer{
		server:       server,
		combinations: make(chan map[string]int),
		slaves:       make(chan *websocket.Conn),
	}
}

func (tr *Trainer) Train() {

	// convert the map of hyperparameters into a channel of combinations to test

	go func(ch1 <-chan map[string]int, ch2 <-chan *websocket.Conn) {
		for {
			var hyperparameters map[string]int
			var slave *websocket.Conn
			select {
			case h := <-ch1:
				hyperparameters = h
				// send hyperparameters to a slave
			case con := <-ch2:
				slave = con
			}

			tr.server.Clients[slave].SendHyperparameters(hyperparameters)
		}
	}(tr.combinations, tr.slaves)

}

func main() {
	handlers := map[string]func(connection *websocket.Conn, message []byte){
		"ping": pingHandler,
		"pong": pongHandler,
	}

	s := socket.New(handlers)
	Trainer := NewTrainer(s)
	s.AddHandler("recieve-test-results", Trainer.recieveTestResultsHandler)

	// "recieve-test-results": Trainer.recieveTestResultsHandler,
	s.Start()

}

type TextResponse struct {
	Message string `json:"message"`
}

func pingHandler(connection *websocket.Conn, message []byte) {
	connection.WriteJSON(TextResponse{Message: "ping"})
}

func pongHandler(connection *websocket.Conn, message []byte) {
	connection.WriteJSON(TextResponse{Message: "pong"})
}

func (tr *Trainer) recieveTestResultsHandler(connection *websocket.Conn, message []byte) {
	tr.server.Clients[connection].Status = socket.Idle
	tr.slaves <- connection

	if len(tr.combinations) == 0 {
		close(tr.combinations)
		close(tr.slaves)
	}
}
