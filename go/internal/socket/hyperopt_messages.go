package socket

const (
	HyperoptInitMessageID               = "init-hyperopt"
	HyperoptStartOptimizationMessageID  = "start-optimization"
	HyperoptSendResultsMessageID        = "results"
	HyperoptRecieveNextParamResponsesID = "push-opt-params"
)

type HyperoptInitMessage struct {
	ID                string      `json:"id"`
	SearchSpace       interface{} `json:"search_space"`
	InitialBestConfig interface{} `json:"initial_best_config"`
}

type HyperoptStartOptimizationMessage struct {
	ID string `json:"id"`
}

type HyperoptSendResultsMessage struct {
	ID       string  `json:"id"`
	ParamsID string  `json:"params_id"`
	Loss     float64 `json:"loss"`
}

func (c *HyperoptClient) SendInitMessage(searchSpace interface{}, initialBestConfig interface{}) {
	c.Connection.WriteJSON(HyperoptInitMessage{
		ID:                HyperoptInitMessageID,
		SearchSpace:       searchSpace,
		InitialBestConfig: initialBestConfig,
	})
}

func (c *HyperoptClient) SendStartOptimizationMessage() {
	c.Connection.WriteJSON(HyperoptStartOptimizationMessage{
		ID: HyperoptStartOptimizationMessageID,
	})
}

func (c *HyperoptClient) SendResultsMessage(paramsID string, loss float64) {
	c.Connection.WriteJSON(HyperoptSendResultsMessage{
		ID:       HyperoptSendResultsMessageID,
		ParamsID: paramsID,
		Loss:     loss,
	})
}

type HyperoptRecieveNextParamsResponse struct {
	ID       string      `json:"id"`
	ParamsID string      `json:"params_id"`
	Params   interface{} `json:"params"`
}
