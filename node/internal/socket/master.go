package socket

import (
	"github.com/gorilla/websocket"
)

type MasterClient struct {
	Connection *websocket.Conn
}

type ClientConnectionStatusMessage struct {
	ID       string `json:"id"`
	WorkerID string `json:"worker_id"`
	IP       string `json:"ip"`
	Status   string `json:"status"`
}

type ClientTrainingStatusMessage struct {
	ID       string `json:"id"`
	WorkerID string `json:"worker_id"`
}

func (c *MasterClient) SendClientConnectedMessage(worker *WorkerClient) {
	c.Connection.WriteJSON(ClientConnectionStatusMessage{
		ID:       "client-connected",
		WorkerID: worker.ID,
		IP:       worker.Connection.RemoteAddr().String(),
		Status:   "idle",
	})
}

func (c *MasterClient) SendClientStartedTrainingMessage(worker *WorkerClient) {
	c.Connection.WriteJSON(ClientTrainingStatusMessage{
		ID:       "client-started-training",
		WorkerID: worker.ID,
	})
}

func (c *MasterClient) SendClientFinishedTrainingMessage(worker *WorkerClient) {
	c.Connection.WriteJSON(ClientTrainingStatusMessage{
		ID:       "client-finished-training",
		WorkerID: worker.ID,
	})
}

func (c *MasterClient) SendClientDisconnectedMessage(worker *WorkerClient) {
	c.Connection.WriteJSON(ClientConnectionStatusMessage{
		ID:       "client-disconnected",
		WorkerID: worker.ID,
		IP:       worker.Connection.RemoteAddr().String(),
		Status:   "idle",
	})
}

func (c *MasterClient) SendFinished() {
	// c.Connection.WriteJSON(TextMessage{ID: "client-disconnected", Message: ""})
}
