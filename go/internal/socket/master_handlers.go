package socket

import "encoding/json"

const (
	InitiateTrainingResponseID = "initiate-training"
	StartTrainingResponseID    = "start-training"
	PauseTrainingResponseID    = "pause-training"
	PingResponseID             = "ping"
	GetAllClientsResponseID    = "get-all-clients"
)

type InitiateTrainingResponse struct {
	ID            string      `json:"id"`
	InitialParams interface{} `json:"initial_params"`
	SearchSpace   interface{} `json:"search_space"`
}

type StartTrainingResponse struct {
	ID string `json:"id"`
}

type PauseTrainingResponse struct {
	ID string `json:"id"`
}

type PingResponse struct {
	ID string `json:"id"`
}

type GetAllClientsResponse struct {
	ID string `json:"id"`
}

func (c *MasterClient) handleInitiateTraining(message []byte) {
	r := InitiateTrainingResponse{}
	json.Unmarshal(message, &r)
	c.hub.hyperoptClient.SendInitMessage(r.SearchSpace, r.InitialParams)
}

func (c *MasterClient) handleGetAllClients(message []byte) {
	clients := []WorkerInfo{}

	for _, client := range c.hub.workerClients {
		clients = append(clients, WorkerInfo{
			WorkerID: client.ID,
			IP:       client.Connection.RemoteAddr().String(),
			Status:   int(client.Status),
			Name:     client.Name,
		})
	}

	c.SendGetAllClientsMessage(clients)
}

func (c *MasterClient) handlePing(message []byte) {
	c.SendPongMessage()
}
