package socket

type HyperoptMessageId string

const (
	HyperoptInitMessageID              HyperoptMessageId = "init-hyperopt"
	HyperoptStartOptimizationMessageID HyperoptMessageId = "start-optimization"
	HyperoptSendResultsMessageID       HyperoptMessageId = "results"
	HyperoptTrainingFailedMessageID    HyperoptMessageId = "training-failed"
)

type HyperoptInitMessage struct {
	ID                HyperoptMessageId `json:"id"`
	SearchSpace       interface{}       `json:"search_space"`
	InitialBestConfig interface{}       `json:"initial_best_config"`
}

type HyperoptStartOptimizationMessage struct {
	ID HyperoptMessageId `json:"id"`
}

type HyperoptSendResultsMessage struct {
	ID       HyperoptMessageId `json:"id"`
	ParamsID string            `json:"params_id"`
	Loss     float64           `json:"loss"`
}

type TrainingFailedMessage struct {
	ID       HyperoptMessageId `json:"id"`
	ParamsID string            `json:"params_id"`
}

func (c *HyperoptClient) SendInitMessage(searchSpace interface{}, initialBestConfig interface{}) {
	c.send <- HyperoptInitMessage{
		ID:                HyperoptInitMessageID,
		SearchSpace:       searchSpace,
		InitialBestConfig: initialBestConfig,
	}
}

func (c *HyperoptClient) SendStartOptimizationMessage() {
	c.send <- HyperoptStartOptimizationMessage{
		ID: HyperoptStartOptimizationMessageID,
	}
}

func (c *HyperoptClient) SendResultsMessage(paramsID string, loss float64) {
	c.send <- HyperoptSendResultsMessage{
		ID:       HyperoptSendResultsMessageID,
		ParamsID: paramsID,
		Loss:     loss,
	}
}

func (c *HyperoptClient) SendTrainingFailedMessage(paramsID string) {
	c.send <- TrainingFailedMessage{
		ID:       HyperoptTrainingFailedMessageID,
		ParamsID: paramsID,
	}
}
