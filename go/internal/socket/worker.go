package socket

import (
	"encoding/json"
	"fmt"
	"io"
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
	NotReady
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
	VTable   interface{} `json:"v_table"`
}

type SendFilesMessage struct {
	ID               string `json:"id"`
	ModelFileID      string `json:"model_file_id"`
	TrainingFileID   string `json:"training_file_id"`
	EvaluationFileID string `json:"evaluation_file_id"`
	ModelFile        string `json:"model_file"`
	TrainingFile     string `json:"training_file"`
	EvaluationFile   string `json:"evaluation_file"`
}

const (
	SendClientParamsMessageID = "send-params"
	SendFileMessage           = "send-files"
)

const (
	ReadyToTrainResponseId          = "ready-to-train"
	RecieveParamsResultsResponseID  = "recieve-params-results"
	RecieveTrainingFailedResponseID = "recieve-training-failed"
)

func NewWorker(connection *websocket.Conn) *WorkerClient {
	return &WorkerClient{
		Status:     NotReady,
		ID:         uuid.New(),
		Connection: connection,
		Name:       ng.Generate(),
	}
}

func (c *WorkerClient) Listen(s *SocketServer) {
	if s.Trace {
		log.Printf("Worker client (%s) connected\n", c.Name)
	}

	for {
		if s.Trace {
			log.Printf("Reading message from worker client (%s)\n", c.Name)
		}

		messageType, message, err := c.Connection.ReadMessage()

		if err != nil {
			fmt.Println(err)
			break
		}

		if messageType != websocket.TextMessage {
			log.Printf("Received non-text message from worker client (%s)\n", c.Name)
			continue
		}

		m := Message{}

		if err = json.Unmarshal(message, &m); err != nil {
			log.Printf("Error unmarshalling message: %s\n", err.Error())
			continue
		}

		if s.Trace {
			log.Printf("Received message from worker client (%s): %s\n", c.Name, m.ID)
		}

		if s.workerHandlers[m.ID] == nil {
			log.Printf("Unrecognized message ID: %s\n", m.ID)
			continue
		}

		if s.Trace {
			log.Printf("Handling message from worker client (%s): %s\n", c.Name, m.ID)
		}

		go s.workerHandlers[m.ID](c.Connection, message)
	}
}

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

func (c *WorkerClient) SendParamsMessage(params interface{}, paramsID string, vTable interface{}) {
	c.Connection.WriteJSON(SendClientParamsMessage{ID: SendClientParamsMessageID, Params: params, ParamsID: paramsID, VTable: vTable})
}

// janky way to send files but should work for testing
func (c *WorkerClient) SendFiles(modelFileId, trainingFileId, evaluationFileId string) {
	modelFile, err := readFile(modelFileId)
	if err != nil {
		log.Println(err)
		return
	}

	trainingFile, err := readFile(trainingFileId)
	if err != nil {
		log.Println(err)
		return
	}

	evaluationFile, err := readFile(evaluationFileId)
	if err != nil {
		log.Println(err)
		return
	}

	modelFileBytes, err := io.ReadAll(modelFile)
	if err != nil {
		log.Println(err)
		return
	}

	trainingFileBytes, err := io.ReadAll(trainingFile)
	if err != nil {
		log.Println(err)
		return
	}

	evaluationFileBytes, err := io.ReadAll(evaluationFile)
	if err != nil {
		log.Println(err)
		return
	}

	message := SendFilesMessage{
		ID:               SendFileMessage,
		ModelFileID:      modelFileId,
		TrainingFileID:   trainingFileId,
		EvaluationFileID: evaluationFileId,
		ModelFile:        string(modelFileBytes),
		TrainingFile:     string(trainingFileBytes),
		EvaluationFile:   string(evaluationFileBytes),
	}

	c.Connection.WriteJSON(message)
}
