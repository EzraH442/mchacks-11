package socket

import (
	"github.com/gorilla/websocket"
)

type MasterClient struct {
	Connection *websocket.Conn
}

type Worker struct {
	WorkerID string `json:"worker_id"`
	IP       string `json:"ip"`
	Status   string `json:"status"`
}

type ClientConnectionStatusMessage struct {
	ID     string `json:"id"`
	Worker Worker `json:"worker"`
}

type ClientStartedTrainingMessage struct {
	ID       string `json:"id"`
	WorkerID string `json:"worker_id"`
}

type ClientFinishedTrainingMessage struct {
	ID       string      `json:"id"`
	WorkerID string      `json:"worker_id"`
	Result   TestResults `json:"result"`
}

type GetAllClientsMessage struct {
	ID      string   `json:"id"`
	Workers []Worker `json:"workers"`
}

type GeneticAlgorithmStatusUpdateMessage struct {
	ID     string      `json:"id"`
	Status interface{} `json:"status"`
}

func (c *MasterClient) SendGetAllClientsMessage(Workers []Worker) {
	c.Connection.WriteJSON(GetAllClientsMessage{
		ID:      "get-all-clients",
		Workers: Workers,
	})
}

func (c *MasterClient) SendClientConnectedMessage(worker *WorkerClient) {
	c.Connection.WriteJSON(ClientConnectionStatusMessage{
		ID:     "client-connected",
		Worker: Worker{WorkerID: worker.ID, IP: worker.Connection.RemoteAddr().String(), Status: "idle"},
	})
}

func (c *MasterClient) SendClientStartedTrainingMessage(worker *WorkerClient) {
	c.Connection.WriteJSON(ClientStartedTrainingMessage{
		ID:       "client-started-training",
		WorkerID: worker.ID,
	})
}

func (c *MasterClient) SendClientFinishedTrainingMessage(worker *WorkerClient, result TestResults) {
	c.Connection.WriteJSON(ClientFinishedTrainingMessage{
		ID:       "client-finished-training",
		WorkerID: worker.ID,
		Result:   result,
	})
}

func (c *MasterClient) SendClientDisconnectedMessage(worker *WorkerClient) {
	c.Connection.WriteJSON(ClientConnectionStatusMessage{
		ID:     "client-disconnected",
		Worker: Worker{WorkerID: worker.ID, IP: worker.Connection.RemoteAddr().String(), Status: "idle"},
	})
}

func (c *MasterClient) SendGeneticAlgorithmStatusUpdateMessage(status interface{}) {
	c.Connection.WriteJSON(GeneticAlgorithmStatusUpdateMessage{
		ID:     "genetic-algorithm-status-update",
		Status: status,
	})
}

func (c *MasterClient) SendFinished() {
	// c.Connection.WriteJSON(TextMessage{ID: "client-disconnected", Message: ""})
}
