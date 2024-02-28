package socket

import (
	"encoding/json"
	"log"

	"github.com/gorilla/websocket"
)

type MasterClient struct {
	Connection *websocket.Conn
	Name       string
}

func NewMasterClient(connection *websocket.Conn) *MasterClient {
	return &MasterClient{Connection: connection, Name: ng.Generate()}
}

func (c *MasterClient) Listen(s *SocketServer) {
	if s.Trace {
		log.Printf("Master client (%s) connected\n", c.Name)
	}

	for {
		if s.Trace {
			log.Printf("Reading message from master client (%s)\n", c.Name)
		}

		messageType, message, err := c.Connection.ReadMessage()

		if err != nil {
			log.Println(err)
			break
		}

		if messageType != websocket.TextMessage {
			log.Printf("Received non-text message from master client (%s)\n", c.Name)
			continue
		}

		m := Message{}

		if err = json.Unmarshal(message, &m); err != nil {
			log.Printf("Error unmarshalling message: %s\n", err.Error())
			continue
		}

		if s.Trace {
			log.Printf("Received message from master client (%s): %s\n", c.Name, m.ID)
		}

		if s.masterHandlers[m.ID] == nil {
			log.Printf("Unrecognized message ID: %s\n", m.ID)
			continue
		}

		if s.Trace {
			log.Printf("Handling message from master client (%s): %s\n", c.Name, m.ID)
		}

		go s.masterHandlers[m.ID](c.Connection, message)
	}
}
