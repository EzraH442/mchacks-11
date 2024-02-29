package socket

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

type PongMessage struct {
	ID string `json:"id"`
}

type WorkerInfo struct {
	WorkerID string `json:"worker_id"`
	IP       string `json:"ip"`
	Status   int    `json:"status"`
	Name     string `json:"name"`
}

type ClientConnectionStatusMessage struct {
	ID     string     `json:"id"`
	Worker WorkerInfo `json:"worker"`
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
	ID      string       `json:"id"`
	Workers []WorkerInfo `json:"workers"`
}

type UploadFilesMessage struct {
	ModelFileId      string `json:"model_file_id"`
	TrainingFileId   string `json:"training_file_id"`
	EvlauationFileId string `json:"evaluation_file_id"`
}

func (c *MasterClient) SendPongMessage() {
	c.send <- PongMessage{ID: PongMessageId}
}

func (c *MasterClient) SendGetAllClientsMessage(Workers []WorkerInfo) {
	c.send <- GetAllClientsMessage{
		ID:      AllClientsMessageID,
		Workers: Workers,
	}
}

func (c *MasterClient) SendClientConnectedMessage(worker *WorkerClient) {
	c.send <- ClientConnectionStatusMessage{
		ID: ClientConnectedMessageID,
		Worker: WorkerInfo{
			WorkerID: worker.ID,
			IP:       worker.Connection.RemoteAddr().String(),
			Status:   int(worker.Status),
			Name:     worker.Name,
		},
	}
}

func (c *MasterClient) SendClientReadyToTrainMessage(worker *WorkerClient) {
	c.send <- ClientReadyToTrainMessage{
		ID:       ClientReadyToTrainMessageID,
		WorkerID: worker.ID,
	}
}

func (c *MasterClient) SendClientStartedTrainingMessage(worker *WorkerClient, parametersID string, parameters interface{}, startedAt int64) {
	c.send <- ClientStartedTrainingMessage{
		ID:           ClientStartedTrainingMessageID,
		WorkerID:     worker.ID,
		ParametersID: parametersID,
		Parameters:   parameters,
		StartedAt:    startedAt,
	}
}

func (c *MasterClient) SendClientFinishedTrainingMessage(worker *WorkerClient, parametersID string, loss float64, finishedAt int64) {
	c.send <- ClientFinishedTrainingMessage{
		ID:           ClientFinishedTrainingMessageID,
		WorkerID:     worker.ID,
		ParametersID: parametersID,
		Loss:         loss,
		FinishedAt:   finishedAt,
	}
}

func (c *MasterClient) SendClientDisconnectedMessage(worker *WorkerClient) {
	c.send <- ClientConnectionStatusMessage{
		ID: ClientDisconnectedMessageID,
		Worker: WorkerInfo{
			WorkerID: worker.ID,
			IP:       worker.Connection.RemoteAddr().String(),
			Status:   int(worker.Status),
			Name:     worker.Name,
		},
	}
}

func (c *MasterClient) SendClientNotReadyToTrainMessage(worker *WorkerClient) {
	c.send <- ClientReadyToTrainMessage{
		ID:       ClientNotReadyToTrainMessageID,
		WorkerID: worker.ID,
	}
}

func (c *MasterClient) SendTrainingCompletedMessage() {
	c.send <- Message{ID: TrainingCompletedMessageID}
}
