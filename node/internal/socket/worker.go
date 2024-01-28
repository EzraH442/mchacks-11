package socket

import (
	"fmt"

	"github.com/google/uuid"
	"github.com/goombaio/namegenerator"
	"github.com/gorilla/websocket"
)

var ng namegenerator.Generator

func init() {
	ng = namegenerator.NewNameGenerator(42)
}

type ClientStatus int

const (
	Idle ClientStatus = iota
	Running
)

type WorkerClient struct {
	ID         string
	Name       string
	Connection *websocket.Conn
	Status     ClientStatus
}

func NewWorker(connection *websocket.Conn) *WorkerClient {
	return &WorkerClient{
		Status:     Idle,
		ID:         uuid.NewString(),
		Connection: connection,
		Name:       ng.Generate(),
	}
}

func (c *WorkerClient) SendHyperparameters(hyperparameters interface{}) {
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
