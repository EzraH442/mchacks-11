package socket

import (
	"log"

	"github.com/gorilla/websocket"
)

type MasterClient struct {
	*ClientBase
	Readable
}

func NewMasterClient(connection *websocket.Conn, hub *Hub) *MasterClient {
	client := &MasterClient{
		ClientBase: NewClientBase(connection, hub),
	}

	client.handle(InitiateTrainingResponseID, client.handleInitiateTraining)
	client.handle(GetAllClientsResponseID, client.handleGetAllClients)
	client.handle(PingResponseID, client.handlePing)

	return client
}

func (c *MasterClient) unregister() {
	c.hub.unregisterMasterClient <- c
}

func (c *MasterClient) readPump() {
	defer func() {
		log.Printf("(%s) Unregistering master client", c.ID)
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
