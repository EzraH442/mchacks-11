package socket

import (
	"encoding/json"
	"log"
	"time"
)

const (
	ReadyToTrainResponseId          = "ready-to-train"
	RecieveParamsResultsResponseID  = "recieve-params-results"
	RecieveTrainingFailedResponseID = "recieve-training-failed"
)

type RecieveParamsResultsResponse struct {
	ID       string  `json:"id"`
	ParamsId string  `json:"params_id"`
	Loss     float64 `json:"loss"`
}

type RecieveTrainingFailedResponse struct {
	ID       string `json:"id"`
	ParamsId string `json:"params_id"`
	Error    string `json:"error"`
}

func (c *WorkerClient) handleReadyToTrain(message []byte) {
	c.Status = Idle

	if c.hub.masterClient != nil {
		c.hub.masterClient.SendClientReadyToTrainMessage(c)
	}

	c.hub.availableWorkers <- c
}

func (c *WorkerClient) handleRecieveParamsResults(message []byte) {
	r := RecieveParamsResultsResponse{}
	err := json.Unmarshal(message, &r)
	if err != nil {
		log.Printf("Error unmarshaling json %s\n", err)
		return
	}

	trainingRun := c.hub.trainingIdStateMap[r.ParamsId]
	trainingRun.Status = TrainingStateFinished
	trainingRun.Loss = r.Loss
	c.hub.trainingIdStateMap[r.ParamsId] = trainingRun

	c.Status = Idle

	if c.hub.masterClient != nil {
		c.hub.masterClient.SendClientFinishedTrainingMessage(c, r.ParamsId, r.Loss, time.Now().UnixMilli())
	}
	if c.hub.hyperoptClient != nil {
		c.hub.hyperoptClient.SendResultsMessage(r.ParamsId, r.Loss)
	}

	c.hub.availableWorkers <- c
}

func (c *WorkerClient) handleRecieveTrainingFailed(message []byte) {
	r := RecieveTrainingFailedResponse{}
	err := json.Unmarshal(message, &r)
	if err != nil {
		log.Printf("Error unmarshaling json %s\n", err)
	}

	if c.hub.hyperoptClient != nil {
		c.hub.hyperoptClient.SendTrainingFailedMessage(r.ParamsId)
	}
}
