package socket

import (
	"log"

	"github.com/gorilla/websocket"
)

type WorkerClientStatus int

const (
	Idle WorkerClientStatus = iota
	NotReady
	Running
)

type WorkerClient struct {
	*ClientBase
	Readable
	Name   string
	Status WorkerClientStatus
}

func NewWorkerClient(connection *websocket.Conn, hub *Hub) *WorkerClient {
	client := &WorkerClient{
		ClientBase: NewClientBase(connection, hub),
		Name:       ng.Generate(),
	}

	client.handle(ReadyToTrainResponseId, client.handleReadyToTrain)
	client.handle(RecieveParamsResultsResponseID, client.handleRecieveParamsResults)
	client.handle(RecieveTrainingFailedResponseID, client.handleRecieveTrainingFailed)

	return client
}

func (c *WorkerClient) unregister() {
	c.hub.unregisterWorkerClient <- c
}

func (c *WorkerClient) readPump() {
	defer func() {
		log.Printf("(%s) Unregistering worker client", c.ID)
		c.unregister()
		c.Connection.Close()
	}()

	for {
		err := c.readMessage()
		if err != nil {
			break
		}
	}
}
