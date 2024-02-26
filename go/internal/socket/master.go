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
	for {
		messageType, message, err := c.Connection.ReadMessage()

		if err != nil {
			fmt.Println(err)
			break
		}

		if messageType == websocket.CloseMessage {
			// TODO: Handle master client disconnect
			break
			break
		}

		m := Message{}

		if err = json.Unmarshal(message, &m); err != nil {
			log.Printf("Error unmarshalling message: %s\n", err.Error())
			continue
		}

		if s.masterHandlers[m.ID] == nil {
			log.Printf("Unrecognized message ID: %s\n", m.ID)
			continue
		}

		go s.masterHandlers[m.ID](c.Connection, message)
	}
}
