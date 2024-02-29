package socket

import (
	"io"
	"log"
)

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

func (c *WorkerClient) SendParamsMessage(params interface{}, paramsID string, vTable interface{}) {
	c.send <- SendClientParamsMessage{ID: SendClientParamsMessageID, Params: params, ParamsID: paramsID, VTable: vTable}
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

	c.send <- message
}
