package socket

import (
	"fmt"

	"github.com/google/uuid"
)

const (
	PongMessageId                   = "pong"
	ClientConnectedMessageID        = "client-connected"
	ClientDisconnectedMessageID     = "client-disconnected"
	AllClientsMessageID             = "get-all-clients"
	ClientFinishedTrainingMessageID = "client-finished-training"
	ClientStartedTrainingMessageID  = "client-started-training"
	TrainingCompletedMessageID      = "training-completed"
	ClientReadyToTrainMessageID     = "ready-to-train"
	ClientNotReadyToTrainMessageID  = "not-ready-to-train"
)

type Worker struct {
	WorkerID uuid.UUID `json:"worker_id"`
	IP       string    `json:"ip"`
	Name     string    `json:"name"`
	Status   string    `json:"status"`
}

type Message struct {
	ID string `json:"id"`
}

type PongMessage struct {
	ID string `json:"id"`
}

type ClientConnectionStatusMessage struct {
	ID     string `json:"id"`
	Worker Worker `json:"worker"`
}

type ClientStartedTrainingMessage struct {
	ID           string      `json:"id"`
	WorkerID     string      `json:"worker_id"`
	ParametersID string      `json:"parameters_id"`
	Parameters   interface{} `json:"parameters"`
	StartedAt    int64       `json:"time_started"`
}

type ClientFinishedTrainingMessage struct {
	ID           string  `json:"id"`
	WorkerID     string  `json:"worker_id"`
	ParametersID string  `json:"parameters_id"`
	Loss         float64 `json:"loss"`
	FinishedAt   int64   `json:"time_finished"`
}

type ClientReadyToTrainMessage struct {
	ID       string `json:"id"`
	WorkerID string `json:"worker_id"`
}

type GetAllClientsMessage struct {
	ID      string   `json:"id"`
	Workers []Worker `json:"workers"`
}

type UploadFilesMessage struct {
	ModelFileId      string `json:"model_file_id"`
	TrainingFileId   string `json:"training_file_id"`
	EvlauationFileId string `json:"evaluation_file_id"`
}

func (c *MasterClient) SendPongMessage() {
	c.Connection.WriteJSON(PongMessage{ID: PongMessageId})
}

func (c *MasterClient) SendGetAllClientsMessage(Workers []Worker) {
	c.Connection.WriteJSON(GetAllClientsMessage{
		ID:      AllClientsMessageID,
		Workers: Workers,
	})
}

func (c *MasterClient) SendClientConnectedMessage(worker *WorkerClient) {
	c.Connection.WriteJSON(ClientConnectionStatusMessage{
		ID: ClientConnectedMessageID,
		Worker: Worker{
			WorkerID: worker.ID,
			IP:       worker.Connection.RemoteAddr().String(),
			Status:   fmt.Sprint(worker.Status),
			Name:     worker.Name,
		},
	})
}

func (c *MasterClient) SendClientReadyToTrainMessage(worker *WorkerClient) {
	c.Connection.WriteJSON(ClientReadyToTrainMessage{
		ID:       ClientReadyToTrainMessageID,
		WorkerID: worker.ID.String(),
	})
}

func (c *MasterClient) SendClientStartedTrainingMessage(worker *WorkerClient, parametersID string, parameters interface{}, startedAt int64) {
	c.Connection.WriteJSON(ClientStartedTrainingMessage{
		ID:           ClientStartedTrainingMessageID,
		WorkerID:     worker.ID.String(),
		ParametersID: parametersID,
		Parameters:   parameters,
		StartedAt:    startedAt,
	})
}

func (c *MasterClient) SendClientFinishedTrainingMessage(worker *WorkerClient, parametersID string, loss float64, finishedAt int64) {
	c.Connection.WriteJSON(ClientFinishedTrainingMessage{
		ID:           ClientFinishedTrainingMessageID,
		WorkerID:     worker.ID.String(),
		ParametersID: parametersID,
		Loss:         loss,
		FinishedAt:   finishedAt,
	})
}

func (c *MasterClient) SendClientDisconnectedMessage(worker *WorkerClient) {
	c.Connection.WriteJSON(ClientConnectionStatusMessage{
		ID: ClientDisconnectedMessageID,
		Worker: Worker{
			WorkerID: worker.ID,
			IP:       worker.Connection.RemoteAddr().String(),
			Status:   fmt.Sprint(worker.Status),
			Name:     worker.Name,
		},
	})
}

func (c *MasterClient) SendClientNotReadyToTrainMessage(worker *WorkerClient) {
	c.Connection.WriteJSON(ClientReadyToTrainMessage{
		ID:       ClientNotReadyToTrainMessageID,
		WorkerID: worker.ID.String(),
	})
}

func (c *MasterClient) SendTrainingCompletedMessage() {
	c.Connection.WriteJSON(Message{ID: TrainingCompletedMessageID})
}

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
