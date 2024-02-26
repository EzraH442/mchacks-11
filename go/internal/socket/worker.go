package socket

import (
	"encoding/json"
	"fmt"
	"log"

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

func (c *WorkerClient) Listen(s *SocketServer) {
	for {
		messageType, message, err := c.Connection.ReadMessage()

		if err != nil {
			fmt.Println(err)
			break
		}

		if messageType == websocket.CloseMessage {
			// TODO: notify master socket of client disconnect
			// TODO: resend hyperparameters to hyperopt client if client disconnects while running a set of hyperparameters
			break
		}

		m := Message{}

		if err = json.Unmarshal(message, &m); err != nil {
			log.Printf("Error unmarshalling message: %s\n", err.Error())
			continue
		}

		if s.workerHandlers[m.ID] == nil {
			log.Printf("Unrecognized message ID: %s\n", m.ID)
			continue
		}

		go s.hyperoptHandlers[m.ID](c.Connection, message)
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
	c.Connection.WriteJSON(Message{ID: "finished-training"})
}
