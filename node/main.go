package main

import (
	"fmt"
	"socket"
	"sync"

	"github.com/gorilla/websocket"
)

func dummyChannel(ch chan map[string]int) {
	ch <- map[string]int{
		"a": 10,
		"b": 10,
		"c": 10,
	}
	ch <- map[string]int{
		"a": 10,
		"b": 10,
		"c": 20,
	}
	ch <- map[string]int{
		"a": 10,
		"b": 10,
		"c": 30,
	}
	ch <- map[string]int{
		"a": 10,
		"b": 20,
		"c": 30,
	}
}

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

func (tr *Trainer) Train(parameters map[string][]int) {
	fmt.Println("Starting optimizing")
	// TODO convert the map of hyperparameters into a channel of combinations to test

	tr.combinations = make(chan map[string]int)
	go dummyChannel(tr.combinations)

	go func(ch1 <-chan map[string]int, ch2 <-chan *websocket.Conn) {
		for {
			var hyperparameters map[string]int
			var slave *websocket.Conn
			select {
			case h := <-ch1:
				fmt.Println("Recieved new hyperparameters: " + fmt.Sprint(h))
				hyperparameters = h
				// send hyperparameters to a slave
			case con := <-ch2:
				fmt.Println("Recieved new slave: " + fmt.Sprint(con.RemoteAddr()))
				slave = con
			}

			tr.server.Clients[slave].SendHyperparameters(hyperparameters)
		}
	}(tr.combinations, tr.slaves)
	fmt.Println("Finished optimizing")

}

func main() {
	var wg sync.WaitGroup

	handlers := map[string]func(connection *websocket.Conn, message []byte){
		"ping": pingHandler,
		"pong": pongHandler,
	}

	s := socket.New(handlers)
	Trainer := NewTrainer(s)

	s.AddHandler("recieve-test-results", Trainer.recieveTestResultsHandler)
	s.AddHandler("ready-to-train", Trainer.readyToTrainHandler)

	// "recieve-test-results": Trainer.recieveTestResultsHandler,
	wg.Add(1)

	go func() {
		s.Start()
		defer wg.Done()
	}()
	fmt.Println("Server started on port 8080")

	wg.Add(1)
	go func() {
		Trainer.Train(make(map[string][]int))
	}()
	wg.Wait()
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

func (tr *Trainer) readyToTrainHandler(connection *websocket.Conn, message []byte) {
	tr.slaves <- connection
}
