package socket

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"

	"github.com/google/uuid"
	"github.com/gorilla/websocket"
)

type HyperparametersMessage struct {
	ID              string      `json:"id"`
	Hyperparameters interface{} `json:"hyperparameters"`
}

type ErrorResponse struct {
	Message string `json:"message"`
}

type UploadTrainingFilesResponse struct {
	ModelFileUUID      string `json:"model-file-uuid"`
	TrainingFileUUID   string `json:"training-file-uuid"`
	EvaluationFileUUID string `json:"evaluation-file-uuid"`
}

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		return true // Accepting all requests
	},
}

type Server struct {
	MasterClients  map[*websocket.Conn]*MasterClient
	WorkerClients  map[*websocket.Conn]*WorkerClient
	workerHandlers map[string]func(connection *websocket.Conn, message []byte)
	masterHandlers map[string]func(connection *websocket.Conn, message []byte)
}

func New(
	workerHandlers map[string]func(connection *websocket.Conn, message []byte),
	masterHandlers map[string]func(connection *websocket.Conn, message []byte),
) *Server {
	return &Server{
		WorkerClients:  make(map[*websocket.Conn]*WorkerClient),
		MasterClients:  make(map[*websocket.Conn]*MasterClient),
		workerHandlers: workerHandlers,
		masterHandlers: masterHandlers,
	}
}

func (s *Server) Start() error {
	http.HandleFunc("/master", s.masterHandler)
	http.HandleFunc("/", s.workerHandler)
	http.HandleFunc("/upload-training-files", s.uploadTrainingFilesHandler)
	err := http.ListenAndServe(":8080", nil)
	fmt.Print(err)
	return err
}

func (s *Server) uploadTrainingFilesHandler(res http.ResponseWriter, req *http.Request) {
	modelFile, _, err := req.FormFile("model-file")

	if err != nil {
		fmt.Println(err)
		res.WriteHeader(400)
		b, _ := json.Marshal(ErrorResponse{Message: err.Error()})
		res.Write(b)
		return
	}

	trainingFile, _, err := req.FormFile("training-file")

	if err != nil {
		fmt.Println(err)
		res.WriteHeader(400)
		b, _ := json.Marshal(ErrorResponse{Message: err.Error()})
		res.Write(b)
		return
	}

	evaluationFile, _, err := req.FormFile("evaluation-file")

	if err != nil {
		fmt.Println(err)
		res.WriteHeader(400)
		b, _ := json.Marshal(ErrorResponse{Message: err.Error()})
		res.Write(b)
		return
	}

	modelFileUUID := uuid.New().String()
	trainingFileUUID := uuid.New().String()
	evaluationFileUUID := uuid.New().String()

	b, _ := json.Marshal(UploadTrainingFilesResponse{
		ModelFileUUID:      modelFileUUID,
		TrainingFileUUID:   trainingFileUUID,
		EvaluationFileUUID: evaluationFileUUID,
	})

	res.Write(b)

	modelFilePath := fmt.Sprintf("uploads/%s", modelFileUUID)
	trainingFilePath := fmt.Sprintf("uploads/%s", trainingFileUUID)
	evaluationFilePath := fmt.Sprintf("uploads/%s", evaluationFileUUID)

	modelFileButes, err := io.ReadAll(modelFile)

	if err != nil {
		fmt.Println(err)
	}

	trainingFileButes, err := io.ReadAll(trainingFile)

	if err != nil {
		fmt.Println(err)
	}

	evaluationFileButes, err := io.ReadAll(evaluationFile)

	if err != nil {
		fmt.Println(err)
	}

	err = os.WriteFile(modelFilePath, modelFileButes, 0644)

	if err != nil {
		fmt.Println(err)
	}

	err = os.WriteFile(trainingFilePath, trainingFileButes, 0644)

	if err != nil {
		fmt.Println(err)
	}

	err = os.WriteFile(evaluationFilePath, evaluationFileButes, 0644)

	if err != nil {
		fmt.Println(err)
	}
}

func (s *Server) AddWorkerHandler(id string, handler func(connection *websocket.Conn, message []byte)) {
	s.workerHandlers[id] = handler
}

func (s *Server) AddMasterHandler(id string, handler func(connection *websocket.Conn, message []byte)) {
	s.masterHandlers[id] = handler
}

func (server *Server) masterHandler(w http.ResponseWriter, r *http.Request) {
	connection, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		fmt.Println("Error upgrading connection: " + err.Error())
		return
	}

	MasterClient := MasterClient{Connection: connection}
	server.MasterClients[connection] = &MasterClient

	for {
		messageType, message, err := connection.ReadMessage()
		if err != nil || messageType == websocket.CloseMessage {
			fmt.Println(err)
			break // Exit the loop if the client tries to close the connection or the connection is interrupted
		}

		m := Message{}
		if err = json.Unmarshal(message, &m); err != nil {
			fmt.Println(err)
			continue
		}

		fmt.Printf("Recieved message: %s\n", string(message))
		if server.workerHandlers[m.ID] == nil {
			fmt.Println("Unrecognized message ID: " + m.ID)
		}

		go server.workerHandlers[m.ID](connection, message)
	}

	delete(server.WorkerClients, connection) // Removing the connection

	connection.Close()
}

func (server *Server) workerHandler(w http.ResponseWriter, r *http.Request) {
	connection, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		fmt.Println("Error upgrading connection: " + err.Error())
		return
	}
	worker := NewWorker(connection)
	server.WorkerClients[connection] = worker

	for _, mc := range server.MasterClients {
		mc.SendClientConnectedMessage(worker)
	}

	for {
		messageType, message, err := connection.ReadMessage()
		if err != nil || messageType == websocket.CloseMessage {
			break // Exit the loop if the client tries to close the connection or the connection is interrupted
		}

		m := Message{}
		if err = json.Unmarshal(message, &m); err != nil {
			fmt.Println(err)
			continue
		}

		fmt.Printf("Recieved message: %s\n", string(message))
		if server.workerHandlers[m.ID] == nil {
			fmt.Println("Unrecognized message ID: " + m.ID)
		}

		go server.workerHandlers[m.ID](connection, message)
	}

	for _, mc := range server.MasterClients {
		mc.SendClientDisconnectedMessage(worker)
	}

	delete(server.WorkerClients, connection) // Removing the connection

	connection.Close()
}

func (server *Server) WriteJSON(message interface{}) {
	for _, wc := range server.WorkerClients {
		wc.Connection.WriteJSON(message)
	}
}
