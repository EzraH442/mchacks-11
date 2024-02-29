package socket

import (
	"github.com/gorilla/websocket"
)

type SubscriberClient struct {
	*ClientBase
	Readable
}

func NewSubscriberClient(connection *websocket.Conn, hub *Hub) *SubscriberClient {
	return &SubscriberClient{
		ClientBase: NewClientBase(connection, hub),
	}
}

func (c *SubscriberClient) unregister() {
	c.hub.unregisterSubscriberClient <- c
}

func (c *SubscriberClient) readPump() {
	defer func() {
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
