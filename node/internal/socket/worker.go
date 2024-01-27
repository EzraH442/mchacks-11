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
	Finished
)

type WorkerClient struct {
	ID         string
	Connection *websocket.Conn
	Status     ClientStatus
}

func NewWorker(connection *websocket.Conn) *WorkerClient {
	return &WorkerClient{
		Status:     Idle,
		ID:         uuid.NewString(),
		Connection: connection,
	}
}

func (c *WorkerClient) SendHyperparameters(hyperparameters map[string]int) {
	if c.Status != Idle {
		fmt.Printf("Client is not idle, cannot send hyperparameters")
	}

	c.Status = Running
	c.Connection.WriteJSON(HyperparametersMessage{ID: "start-hyperparameters", Hyperparameters: hyperparameters})
	fmt.Printf("Sent hyperparameters %s to client %s\n", fmt.Sprint(hyperparameters), c.Connection.RemoteAddr())
}
