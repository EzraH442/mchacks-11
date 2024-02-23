package socket

import (
	"github.com/gorilla/websocket"
)

type HyperoptClient struct {
	Connection *websocket.Conn
}

type HyperoptWorker struct {
	WorkerID string `json:"worker_id"`
	IP       string `json:"ip"`
	Name     string `json:"name"`
	Status   string `json:"status"`
}

type HyperoptClientConnectionMessage struct {
	ID     string `json:"id"`
	Worker Worker `json:"worker"`
}

type HyperoptInitMessage struct {
	ID                string      `json:"id"`
	SearchSpace       interface{} `json:"search_space"`
	InitialBestConfig interface{} `json:"initial_best_config"`
}

type HyperoptSendResultsMessage struct {
	ID      string      `json:"id"`
	Results interface{} `json:"results"`
}

type HyperoptStartOptimizationMessage struct {
	ID string `json:"id"`
}

func (c *HyperoptClient) SendInitMessage(searchSpace interface{}, initialBestConfig interface{}) {
	c.Connection.WriteJSON(HyperoptInitMessage{
		ID:                "init-hyperopt",
		SearchSpace:       searchSpace,
		InitialBestConfig: initialBestConfig,
	})
}

func (c *HyperoptClient) SendResultsMessage(results interface{}) {
	c.Connection.WriteJSON(HyperoptSendResultsMessage{
		ID:      "results",
		Results: results,
	})
}

func (c *HyperoptClient) SendStartOptimizationMessage() {
	c.Connection.WriteJSON(HyperoptStartOptimizationMessage{
		ID: "start-optimization",
	})
}
