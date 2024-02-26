package socket

import (
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/gorilla/websocket"
)

const (
	TrainingStateIdle = iota
	TrainingStateRunning
	TrainingStateFinished
)

type TrainingRun struct {
	ID     string
	Status int
	Loss   float64
	Params interface{}
}

type SocketServer struct {
	WorkerClients    map[*websocket.Conn]*WorkerClient
	HyperoptClient   *HyperoptClient
	MasterClient     *MasterClient
	workerHandlers   map[string]func(connection *websocket.Conn, message []byte)
	hyperoptHandlers map[string]func(connection *websocket.Conn, message []byte)
	masterHandlers   map[string]func(connection *websocket.Conn, message []byte)

	paramsQueue      chan interface{}
	availableWorkers chan *WorkerClient

	trainingIdStateMap map[string]TrainingRun
	clientJobMap       map[*websocket.Conn]string
}

func (s *SocketServer) masterHandler(w http.ResponseWriter, r *http.Request) {
	if s.MasterClient != nil {
		w.WriteHeader(http.StatusForbidden)
		return
	}

	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		return
	}
	defer conn.Close()

	s.MasterClient = &MasterClient{Connection: conn}
	s.MasterClient.Listen(s)

	s.MasterClient = nil
	s.MasterClient.Connection.Close()
}

func (s *SocketServer) hyperoptHandler(w http.ResponseWriter, r *http.Request) {
	if s.HyperoptClient != nil {
		w.WriteHeader(http.StatusForbidden)
		return
	}

	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		return
	}
	defer conn.Close()

	s.HyperoptClient = &HyperoptClient{Connection: conn}
	s.HyperoptClient.Listen(s)
	// clean up
	s.HyperoptClient = nil
	s.HyperoptClient.Connection.Close()
}

func (s *SocketServer) workerHandler(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		return
	}
	defer conn.Close()

	client := NewWorker(conn)
	s.WorkerClients[conn] = client
	client.Listen(s)
	delete(s.WorkerClients, conn)
	conn.Close()
}

func (s *SocketServer) Start() error {
	http.HandleFunc("/master", s.masterHandler)
	http.HandleFunc("/hyperopt", s.hyperoptHandler)
	http.HandleFunc("/", s.workerHandler)

	// http.HandleFunc("/upload-training-files", s.uploadTrainingFilesHandler) TODO - add route for uploading training files (model file, training file, evaluation file)
	fmt.Println("Starting server on :8080")
	err := http.ListenAndServe(":8080", nil)
	if err != nil {
		return err
	}
	return nil
}

func NewSocketServer() *SocketServer {
	s := &SocketServer{
		WorkerClients:      make(map[*websocket.Conn]*WorkerClient),
		workerHandlers:     make(map[string]func(connection *websocket.Conn, message []byte)),
		hyperoptHandlers:   make(map[string]func(connection *websocket.Conn, message []byte)),
		masterHandlers:     make(map[string]func(connection *websocket.Conn, message []byte)),
		trainingIdStateMap: make(map[string]TrainingRun),
		paramsQueue:        make(chan interface{}, 64),
		availableWorkers:   make(chan *WorkerClient, 64),
	}

	s.masterHandlers[InitiateTrainingResponseID] = s.onRecievedInitialSearchSpaceAndInitialPoint
	s.masterHandlers[GetAllClientsResponseID] = s.onRecievedAllClients
	s.masterHandlers[PingResponseID] = s.onMasterRecievedPing
	s.hyperoptHandlers[HyperoptRecieveNextParamResponsesID] = s.onRecievedNextHyperparametersFromHyperopt

	return s
}

func (s *SocketServer) onWorkerDisconnect(conn *websocket.Conn) {
	c := s.WorkerClients[conn]

	if c.Status == Running {
		paramsID := s.clientJobMap[c.Connection]
		delete(s.clientJobMap, c.Connection)
		batch := s.trainingIdStateMap[paramsID]
		s.paramsQueue <- batch
	}

	s.MasterClient.SendClientDisconnectedMessage(s.WorkerClients[c.Connection])
}

func (s *SocketServer) onRecievedNextHyperparameters(conn *websocket.Conn, message []byte) {
}

func (s *SocketServer) onRecievedTrainingResults(conn *websocket.Conn, message []byte) {
}

func (s *SocketServer) onRecievedHyperoptComplete(conn *websocket.Conn, message []byte) {
}

func (s *SocketServer) onRecievePauseTraining(conn *websocket.Conn, message []byte) {
}

func (s *SocketServer) onRecievedStartTraining(conn *websocket.Conn, message []byte) {
}

func (s *SocketServer) onRecievedInitialSearchSpaceAndInitialPoint(conn *websocket.Conn, message []byte) {
	r := InitiateTrainingResponse{}
	json.Unmarshal(message, &r)
	s.HyperoptClient.SendInitMessage(r.SearchSpace, r.InitialParams)
}

func (s *SocketServer) onRecievedAllClients(conn *websocket.Conn, message []byte) {
	clients := []Worker{}
	for _, client := range s.WorkerClients {
		clients = append(clients, Worker{WorkerID: client.ID,
			IP:     client.Connection.RemoteAddr().String(),
			Status: fmt.Sprint(client.Status),
			Name:   client.Name,
		})
	}
	s.MasterClient.SendGetAllClientsMessage(clients)
}

func (s *SocketServer) onMasterRecievedPing(conn *websocket.Conn, message []byte) {
	s.MasterClient.SendPongMessage()
}

func (s *SocketServer) onRecievedNextHyperparametersFromHyperopt(conn *websocket.Conn, message []byte) {
	HyperoptRecieveNextParamsResponse := HyperoptRecieveNextParamsResponse{}
	err := json.Unmarshal(message, &HyperoptRecieveNextParamsResponse)

	if err != nil {
		fmt.Println(err)
		return
	}

	worker := <-s.availableWorkers
	worker.SendParams(HyperoptRecieveNextParamsResponse.Params, HyperoptRecieveNextParamsResponse.ParamsID)

	s.clientJobMap[worker.Connection] = HyperoptRecieveNextParamsResponse.ParamsID
	s.trainingIdStateMap[HyperoptRecieveNextParamsResponse.ParamsID] = TrainingRun{
		ID:     HyperoptRecieveNextParamsResponse.ParamsID,
		Status: TrainingStateRunning,
		Params: HyperoptRecieveNextParamsResponse.Params,
	}

	s.MasterClient.SendClientStartedTrainingMessage(worker, HyperoptRecieveNextParamsResponse.ParamsID, HyperoptRecieveNextParamsResponse.Params, time.Now().UnixMilli())
}
