package main

import (
	"fmt"
	"socket"
	"sync"

	"github.com/gorilla/websocket"
)

func dummyChannel(ch chan socket.Dummy) {
	for i := 0; i < 10; i++ {
		ch <- socket.Dummy{
			NumLayers:    1,
			LayerNeurons: []int{i * 10}, // []int{128}
			Epsilon:      0.5,
			LearningRate: 0.01,
		}
	}
}

type Trainer struct {
	Training     bool
	combinations chan socket.Dummy
	workers      chan *socket.WorkerClient
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
		combinations: make(chan socket.Dummy),
		workers:      make(chan *socket.WorkerClient),
	}
}

func (tr *Trainer) Train(parameters map[string][]int) {
	tr.Training = true
	fmt.Println("Starting optimizing")
	// TODO convert the map of hyperparameters into a channel of combinations to test

	tr.combinations = make(chan socket.Dummy, 8192)
	go dummyChannel(tr.combinations)

	go func() {
		for _, c := range tr.server.WorkerClients {
			tr.workers <- c
		}
	}()

	go func(ch1 <-chan socket.Dummy, ch2 <-chan *socket.WorkerClient) {
		for hyperparameters := range ch1 {
			worker := <-ch2

			worker.SendHyperparameters(hyperparameters)

			for _, mc := range tr.server.MasterClients {
				mc.SendClientStartedTrainingMessage(worker)
			}
		}
	}(tr.combinations, tr.workers)

}

func main() {
	var wg sync.WaitGroup

	pingpong := map[string]func(connection *websocket.Conn, message []byte){
		"ping": pingHandler,
		"pong": pongHandler,
	}

	s := socket.New(pingpong, pingpong)
	Trainer := NewTrainer(s)

	s.AddWorkerHandler("recieve-test-results", Trainer.recieveTestResultsHandler)
	s.AddWorkerHandler("ready-to-train", Trainer.readyToTrainHandler)
	s.AddMasterHandler("get-all-clients", func(connection *websocket.Conn, message []byte) {
		slice := make([]socket.Worker, 0, len(s.WorkerClients))
		for _, worker := range s.WorkerClients {
			slice = append(slice, socket.Worker{
				WorkerID: worker.ID,
				IP:       worker.Connection.RemoteAddr().String(),
				Status:   fmt.Sprint(worker.Status),
			})
		}

		s.MasterClients[connection].SendGetAllClientsMessage(slice)
	})

	s.AddMasterHandler("start-training", func(connection *websocket.Conn, message []byte) {
		if !Trainer.Training {
			Trainer.Train(make(map[string][]int))
		} else {
			fmt.Println("Already training")
		}
	})

	// "recieve-test-results": Trainer.recieveTestResultsHandler,
	wg.Add(1)

	go func() {
		s.Start()
		defer wg.Done()
	}()
	fmt.Println("Server started on port 8080")

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
	fmt.Printf("Recieved test results from %s: %s\n", fmt.Sprint(connection.RemoteAddr()), string(message))

	worker := tr.server.WorkerClients[connection]
	worker.Status = socket.Idle

	for _, mc := range tr.server.MasterClients {
		mc.SendClientFinishedTrainingMessage(worker)
	}

	// if len(tr.combinations) == 0 {
	// 	close(tr.combinations)
	// 	close(tr.workers)

	// 	for _, wc := range tr.server.WorkerClients {
	// 		wc.SendFinished()
	// 	}
	// 	for _, mc := range tr.server.MasterClients {
	// 		mc.SendFinished()
	// 	}
	// 	fmt.Println("Finished optimizing")
	// } else {

	if tr.Training {
		tr.workers <- worker
	}
	//}
}

func (tr *Trainer) readyToTrainHandler(connection *websocket.Conn, message []byte) {
	if tr.Training {
		tr.workers <- tr.server.WorkerClients[connection]
	}
}
