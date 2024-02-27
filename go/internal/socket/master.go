package socket

import (
	"encoding/json"
	"fmt"
	"log"

	"github.com/gorilla/websocket"
)

type MasterClient struct {
	Connection *websocket.Conn
}

func NewMasterClient(connection *websocket.Conn) *MasterClient {
	return &MasterClient{Connection: connection}
}

func (c *MasterClient) Listen(s *SocketServer) {
	name := ng.Generate()

	if s.Trace {
		log.Printf("Master client (%s) connected\n", name)
	}

	for {
		if s.Trace {
			log.Printf("Reading message from master client (%s)\n", name)
		}

		messageType, message, err := c.Connection.ReadMessage()

		if err != nil {
			fmt.Println(err)
			break
		}

		if messageType == websocket.CloseMessage {
			if s.Trace {
				log.Printf("Master client (%s) disconnected\n", name)
			}
			// TODO: Handle master client disconnect
			break
		}

		m := Message{}

		if err = json.Unmarshal(message, &m); err != nil {
			log.Printf("Error unmarshalling message: %s\n", err.Error())
			continue
		}

		if s.Trace {
			log.Printf("Received message from master client (%s): %s\n", name, m.ID)
		}

		if s.masterHandlers[m.ID] == nil {
			log.Printf("Unrecognized message ID: %s\n", m.ID)
			continue
		}

		if s.Trace {
			log.Printf("Handling message from master client (%s): %s\n", name, m.ID)
		}

		go s.masterHandlers[m.ID](c.Connection, message)
	}
}
