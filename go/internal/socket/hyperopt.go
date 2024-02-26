package socket

import (
	"encoding/json"
	"fmt"
	"log"

	"github.com/gorilla/websocket"
)

type HyperoptClient struct {
	Connection *websocket.Conn
}

func NewHyperoptClient(connection *websocket.Conn) *HyperoptClient {
	return &HyperoptClient{Connection: connection}
}

func (c *HyperoptClient) Listen(s *SocketServer) {
	for {
		messageType, message, err := c.Connection.ReadMessage()

		if err != nil {
			fmt.Println(err)
			break
		}

		if messageType == websocket.CloseMessage {
			// TODO: Handle master client disconnect
			break
		}

		m := Message{}

		if err = json.Unmarshal(message, &m); err != nil {
			log.Printf("Error unmarshalling message: %s\n", err.Error())
			continue
		}

		if s.hyperoptHandlers[m.ID] == nil {
			log.Printf("Unrecognized message ID: %s\n", m.ID)
			continue
		}

		go s.hyperoptHandlers[m.ID](c.Connection, message)
	}
}
