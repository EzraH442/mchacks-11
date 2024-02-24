package socket

import (
	"net/http"

	"github.com/gorilla/websocket"
)

const (
	TrainingStateIdle = iota
	TrainingStateRunning
	TrainingStateFinished
)

type SocketServer struct {
	WorkerClients    map[*websocket.Conn]*WorkerClient
	HyperoptClient   *HyperoptClient
	MasterClient     *MasterClient
	workerHandlers   map[string]func(connection *websocket.Conn, message []byte)
	hyperoptHandlers map[string]func(connection *websocket.Conn, message []byte)
	masterHandlers   map[string]func(connection *websocket.Conn, message []byte)
	trainingStateMap map[string]int
	clientJobMap     map[*websocket.Conn]string
	paramsQueue      chan interface{}
	availableWorkers chan *WorkerClient
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
	err := http.ListenAndServe(":8080", nil)
	if err != nil {
		return err
	}
	return nil
}

func NewSocketServer(
	workerHandlers map[string]func(connection *websocket.Conn, message []byte),
	hyperoptHandlers map[string]func(connection *websocket.Conn, message []byte),
	masterHandlers map[string]func(connection *websocket.Conn, message []byte),
) *SocketServer {
	return &SocketServer{
		WorkerClients:    make(map[*websocket.Conn]*WorkerClient),
		workerHandlers:   workerHandlers,
		hyperoptHandlers: hyperoptHandlers,
		masterHandlers:   masterHandlers,
		trainingStateMap: make(map[string]int),
		paramsQueue:      make(chan interface{}, 64),
		availableWorkers: make(chan *WorkerClient, 64),
	}
}

func (s *SocketServer) onWorkerDisconnect(conn *websocket.Conn) {
	jobID, ok := s.clientJobMap[conn]

	if ok {
		state, ok := s.trainingStateMap[jobID]
		if ok && state == TrainingStateRunning {
			s.trainingStateMap[jobID] = TrainingStateIdle
			s.clientJobMap[conn] = ""
			delete(s.clientJobMap, conn)
			s.trainingStateMap[s.clientJobMap[conn]] = TrainingStateIdle

			// TODO - repush unfinished job to queue
		}
	}

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
}
