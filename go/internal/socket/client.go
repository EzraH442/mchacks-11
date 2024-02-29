package socket

import (
	"encoding/json"
	"log"
	"time"

	"github.com/google/uuid"
	"github.com/goombaio/namegenerator"
	"github.com/gorilla/websocket"
)

var ng = namegenerator.NewNameGenerator(0)

const (
	writeWait  = 10 * time.Second
	pongWait   = 60 * time.Second
	pingPeriod = (pongWait * 9) / 10
)

type Readable interface {
	unregister()
	readPump()
}

type Client interface {
	writePump()
	handle(id string, handler func(message []byte))
}

type ClientBase struct {
	Client
	ID         string
	Connection *websocket.Conn
	hub        *Hub
	send       chan interface{}
	handlers   map[string]func(message []byte)
}

func NewClientBase(connection *websocket.Conn, hub *Hub) *ClientBase {
	return &ClientBase{
		ID:         uuid.NewString(),
		hub:        hub,
		Connection: connection,
		send:       make(chan interface{}),
		handlers:   make(map[string]func(message []byte)),
	}
}

func (c *ClientBase) readMessage() error {
	messageType, message, err := c.Connection.ReadMessage()
	if err != nil {
		// close error happened
		log.Printf("(%s) Close error: %v", c.ID, err)
		return err
	}
	log.Printf("(%s) Message received: %v", c.ID, message)
	if messageType != websocket.TextMessage {
		return nil
	}

	m := Message{}
	err = json.Unmarshal(message, &m)
	if err != nil {
		log.Printf("Error unmarshalling message: %v", err)
		return nil
	}

	if handler, ok := c.handlers[m.ID]; ok {
		log.Printf("Handling message: %+v", m)
		handler(message)
	} else {
		log.Printf("No handler found")
	}
	return nil
}

func (c *ClientBase) writePump() {
	ticker := time.NewTicker(pingPeriod)
	defer func() {
		c.Connection.Close()
	}()
	for {
		select {
		case message, ok := <-c.send:
			c.Connection.SetWriteDeadline(time.Now().Add(writeWait))
			if !ok {
				c.Connection.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}

			log.Printf("(%s) Sending message: %+v", c.ID, message)
			err := c.Connection.WriteJSON(message)
			if err != nil {
				return
			}

		case <-ticker.C:
			c.Connection.SetWriteDeadline(time.Now().Add(writeWait))
			if err := c.Connection.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}

func (c *ClientBase) handle(id string, handler func(message []byte)) {
	log.Printf("(%s) registering handler for id: %s", c.ID, id)
	c.handlers[id] = handler
}
