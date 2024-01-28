package socket

import (
	"fmt"

	"github.com/google/uuid"
	"github.com/gorilla/websocket"
)

type ClientStatus int

const (
	Idle ClientStatus = iota
	Running
)

type WorkerClient struct {
	ID         string
	Connection *websocket.Conn
	Status     ClientStatus
}

type Dummy struct {
	NumLayers    int     `json:"num_layers"`
	LayerNeurons []int   `json:"layer_neurons"`
	Epsilon      float64 `json:"epsi"`
	LearningRate float64 `json:"learning_rate"`
}

func NewWorker(connection *websocket.Conn) *WorkerClient {
	return &WorkerClient{
		Status:     Idle,
		ID:         uuid.NewString(),
		Connection: connection,
	}
}

func (c *WorkerClient) SendHyperparameters(hyperparameters Dummy) {
	if c.Status != Idle {
		fmt.Printf("Client is not idle, cannot send hyperparameters")
		return
	}

	c.Status = Running
	c.Connection.WriteJSON(HyperparametersMessage{ID: "start-hyperparameters", Hyperparameters: hyperparameters})
	fmt.Printf("Sent hyperparameters %s to client %s\n", fmt.Sprint(hyperparameters), c.Connection.RemoteAddr())
}

func (c *WorkerClient) SendFinished() {
	c.Connection.WriteJSON(TextMessage{ID: "finished-training", Message: "Finished training"})
}
