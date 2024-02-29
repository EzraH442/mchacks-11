package socket

import (
	"log"

	"github.com/gorilla/websocket"
)

type HyperoptClient struct {
	*ClientBase
	Readable
}

func NewHyperoptClient(connection *websocket.Conn, hub *Hub) *HyperoptClient {
	client := &HyperoptClient{
		ClientBase: NewClientBase(connection, hub),
	}

	client.handle(string(HyperoptRecieveNextParamResponsesID), client.handleHyperoptRecieveNextParamsResponse)

	return client
}

func (c *HyperoptClient) unregister() {
	c.hub.unregisterHyperoptClient <- c
}

func (c *HyperoptClient) readPump() {
	defer func() {
		log.Printf("(%s) Unregistering hyperopt client", c.ID)
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
