package main

import (
	"encoding/json"
	"fmt"
	"socket"
	"sync"

	"github.com/gorilla/websocket"
)

type Trainer struct {
	Training     bool
	combinations chan interface{}
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
		combinations: make(chan interface{}),
		workers:      make(chan *socket.WorkerClient),
	}
}

func (tr *Trainer) Train(parameters []interface{}) {
	fmt.Println("Starting testing " + fmt.Sprint(len(parameters)) + " combinations")
	tr.Training = true

	tr.combinations = make(chan interface{}, 8192)
	tr.workers = make(chan *socket.WorkerClient, len(tr.server.WorkerClients))

	go func() {
		for _, c := range tr.server.WorkerClients {
			tr.workers <- c
		}
	}()

	go func() {
		for _, p := range parameters {
			tr.combinations <- p
		}
	}()

	go func() {
		for {
			worker := <-tr.workers
			combination := <-tr.combinations
			fmt.Printf("Sending Parameters: %+v to %s\n", combination, worker.Connection.RemoteAddr())
			worker.SendHyperparameters(combination)

			for _, mc := range tr.server.MasterClients {
				mc.SendClientStartedTrainingMessage(worker, combination)
			}
		}
	}()
}

type StartTrainingMessage struct {
	ID         string        `json:"id"`
	Parameters []interface{} `json:"parameters"`
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
			StartTrainingMessage := StartTrainingMessage{}
			err := json.Unmarshal(message, &StartTrainingMessage)

			if err != nil {
				fmt.Println(err)
				return
			}

			Trainer.Train(StartTrainingMessage.Parameters)
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
	testResults := socket.TestResults{}
	err := json.Unmarshal(message, &testResults)
	if err != nil {
		fmt.Println(err)
	}

	for _, mc := range tr.server.MasterClients {
		mc.SendClientFinishedTrainingMessage(worker, testResults)
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
