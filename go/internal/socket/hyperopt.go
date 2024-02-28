package socket

import (
	"encoding/json"
	"log"

	"github.com/gorilla/websocket"
)

type HyperoptClient struct {
	Connection *websocket.Conn
	Name       string
}

func NewHyperoptClient(connection *websocket.Conn) *HyperoptClient {
	return &HyperoptClient{Connection: connection, Name: ng.Generate()}
}

func (c *HyperoptClient) Listen(s *SocketServer) {
	name := ng.Generate()

	if s.Trace {
		log.Printf("Hyperopt client (%s) connected\n", name)
	}

	for {
		messageType, message, err := c.Connection.ReadMessage()

		if err != nil {
			log.Println(err)
			break
		}

		if messageType != websocket.TextMessage {
			log.Printf("Received non-text message from hyperopt client (%s)\n", c.Name)
			continue
		}

		m := Message{}

		if err = json.Unmarshal(message, &m); err != nil {
			log.Printf("Error unmarshalling message: %s\n", err.Error())
			continue
		}

		if s.Trace {
			log.Printf("Received message from hyperopt client (%s): %s\n", name, m.ID)
		}

		if s.hyperoptHandlers[m.ID] == nil {
			log.Printf("Unrecognized message ID: %s\n", m.ID)
			continue
		}

		if s.Trace {
			log.Printf("Handling message from hyperopt client (%s): %s\n", name, m.ID)
		}

		go s.hyperoptHandlers[m.ID](c.Connection, message)
	}
}
