package socket

import (
	"encoding/json"
	"fmt"
	"log"

	"github.com/google/uuid"
	"github.com/goombaio/namegenerator"
	"github.com/gorilla/websocket"
)

var ng namegenerator.Generator

func init() {
	ng = namegenerator.NewNameGenerator(42)
}

type ClientStatus int

const (
	Idle ClientStatus = iota
	Running
)

type WorkerClient struct {
	ID         uuid.UUID
	Name       string
	Connection *websocket.Conn
	Status     ClientStatus
}

type SendClientParamsMessage struct {
	ID       string      `json:"id"`
	Params   interface{} `json:"params"`
	ParamsID string      `json:"params_id"`
}

const (
	SendClientParamsMessageID      = "send-params"
	RecieveClientResultsResponseID = "recieve-results"
)

func NewWorker(connection *websocket.Conn) *WorkerClient {
	return &WorkerClient{
		Status:     Idle,
		ID:         uuid.New(),
		Connection: connection,
		Name:       ng.Generate(),
	}
}

func (c *WorkerClient) Listen(s *SocketServer) {
	for {
		messageType, message, err := c.Connection.ReadMessage()

		if err != nil {
			fmt.Println(err)
			break
		}

		if messageType == websocket.CloseMessage {
			s.onWorkerDisconnect(c.Connection)
			break
		}

		m := Message{}

		if err = json.Unmarshal(message, &m); err != nil {
			log.Printf("Error unmarshalling message: %s\n", err.Error())
			continue
		}

		if s.workerHandlers[m.ID] == nil {
			log.Printf("Unrecognized message ID: %s\n", m.ID)
			continue
		}

		go s.hyperoptHandlers[m.ID](c.Connection, message)
	}
}

func (c *WorkerClient) SendParams(params interface{}, paramsID string) {
	c.Connection.WriteJSON(SendClientParamsMessage{ID: SendClientParamsMessageID, Params: params, ParamsID: paramsID})
}
