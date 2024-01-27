package socket

import (
	"github.com/gorilla/websocket"
)

type MasterClient struct {
	Connection *websocket.Conn
}

func (c *MasterClient) SendClientConnectedMessage(workerID string) {
	c.Connection.WriteJSON(TextMessage{ID: "client-connected", Message: workerID})
}

func (c *MasterClient) SendClientStartedTrainingMessage(message string) {
	c.Connection.WriteJSON(TextMessage{ID: "client-started-training", Message: message})
}

func (c *MasterClient) SendClientFinishedTrainingMessage(message string) {
	c.Connection.WriteJSON(TextMessage{ID: "client-finished-training", Message: message})
}

func (c *MasterClient) SendClientDisconnectedMessage(workerID string) {
	c.Connection.WriteJSON(TextMessage{ID: "client-disconnected", Message: workerID})
}

func (c *MasterClient) SendFinished() {
	c.Connection.WriteJSON(TextMessage{ID: "client-disconnected", Message: ""})
}
