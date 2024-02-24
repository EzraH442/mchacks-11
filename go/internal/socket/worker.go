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
	ID         uuid.UUID
	Name       string
	Connection *websocket.Conn
	Status     ClientStatus
}

func NewWorker(connection *websocket.Conn) *WorkerClient {
	return &WorkerClient{
		Status:     Idle,
		ID:         uuid.New(),
		Connection: connection,
		Name:       ng.Generate(),
	}
}

func (c *WorkerClient) SendHyperparameters(hyperparameters interface{}, channel chan<- interface{}, server *Server) {
	if c.Status != Idle {
		fmt.Printf("Client is not idle, cannot send hyperparameters")
		return
	}

	c.Status = Running
	c.Connection.WriteJSON(HyperparametersMessage{ID: "start-hyperparameters", Hyperparameters: hyperparameters})
	fmt.Printf("Sent hyperparameters %s to client %s\n", fmt.Sprint(hyperparameters), c.Connection.RemoteAddr())
	ch := c.Connection.CloseHandler
	c.Connection.SetCloseHandler(func(code int, text string) error {
		if c.Status == Running {
			fmt.Printf("Client %s disconnected while running\n", c.Connection.RemoteAddr())
			// recycle hyperparameters
			channel <- hyperparameters
			for _, mc := range server.MasterClients {
				mc.SendClientDisconnectedMessage(c)
			}

			delete(server.WorkerClients, c.Connection) // Removing the connection
		}
		return ch()(code, text)
	})
}

func (c *WorkerClient) SendFinished() {
	c.Connection.WriteJSON(TextMessage{ID: "finished-training", Message: "Finished training"})
}
