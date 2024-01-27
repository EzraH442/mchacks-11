package socket

import (
	"github.com/gorilla/websocket"
)

type MasterClient struct {
	Connection *websocket.Conn
}

func (c *MasterClient) SendClientConnectedMessage(workerID string) {
	c.Connection.WriteJSON(TextMessage{ID: "text-message", Message: workerID})
}

func (c *MasterClient) SendClientStartedTrainingMessage(message string) {
	c.Connection.WriteJSON(TextMessage{ID: "text-message", Message: message})
}

func (c *MasterClient) SendClientFinishedTrainingMessage(message string) {
	c.Connection.WriteJSON(TextMessage{ID: "text-message", Message: message})
}

func (c *MasterClient) SendClientDisconnectedMessage(workerID string) {
	c.Connection.WriteJSON(TextMessage{ID: "text-message", Message: workerID})
}
