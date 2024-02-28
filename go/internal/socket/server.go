package socket

import (
	"encoding/json"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"os"
	"time"

	"github.com/google/uuid"
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

	modelFileId      string
	trainingFileId   string
	evaluationFileId string

	Trace bool
}

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		return true // Accepting all requests
	},
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
	s.MasterClient.SendClientConnectedMessage(client)
	client.SendFiles(s.modelFileId, s.trainingFileId, s.evaluationFileId)
	client.Listen(s)
}

const MAX_UPLOAD_SIZE = 1024 * 1024 * 50 // 50 MB

func writeFile(f multipart.File) (string, error) {
	id := uuid.NewString()
	dst, err := os.Create("uploads/" + id)
	if err != nil {
		fmt.Println(err)
		return "", err
	}
	defer dst.Close()
	_, err = io.Copy(dst, f)
	if err != nil {
		fmt.Println(err)
		return "", err
	}
	return id, nil
}

func readFile(id string) (*os.File, error) {
	return os.Open("uploads/" + id)
}

func (s *SocketServer) uploadHandler(w http.ResponseWriter, r *http.Request) {
	//set cors headero
	w.Header().Set("Access-Control-Allow-Origin", "*")

	if r.Method != "POST" {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}

	if err := r.ParseMultipartForm(MAX_UPLOAD_SIZE); err != nil {
		fmt.Println(err)
		http.Error(w, "Files too large", http.StatusBadRequest)
		return
	}

	modelFile, _, err := r.FormFile("model")
	if err != nil {
		fmt.Println(err)
		http.Error(w, "Error processing model file", http.StatusBadRequest)
		return
	}
	defer modelFile.Close()
	modelFileId, err := writeFile(modelFile)

	if err != nil {
		fmt.Println(err)
		http.Error(w, "Error processing model file", http.StatusBadRequest)
		return
	}

	trainingFile, _, err := r.FormFile("training")
	if err != nil {
		fmt.Println(err)
		http.Error(w, "Error processing training file", http.StatusBadRequest)
		return
	}
	defer trainingFile.Close()
	trainingFileId, err := writeFile(trainingFile)
	if err != nil {
		fmt.Println(err)
		http.Error(w, "Error processing training file", http.StatusBadRequest)
		return
	}

	evaluationFile, _, err := r.FormFile("evaluation")
	if err != nil {
		fmt.Println(err)
		http.Error(w, "Error processing evaluation file", http.StatusBadRequest)
		return
	}
	defer evaluationFile.Close()
	evaluationFileId, err := writeFile(evaluationFile)
	if err != nil {
		fmt.Println(err)
		http.Error(w, "Error processing evaluation file", http.StatusBadRequest)
		return
	}

	s.modelFileId = modelFileId
	s.trainingFileId = trainingFileId
	s.evaluationFileId = evaluationFileId

	UploadFilesMessage := UploadFilesMessage{
		ModelFileId:      modelFileId,
		TrainingFileId:   trainingFileId,
		EvlauationFileId: evaluationFileId,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(UploadFilesMessage)
}

func (s *SocketServer) Start(clean bool) error {
	// create uploads folder if not exists
	err := os.MkdirAll("uploads", os.ModePerm)
	if err != nil {
		return err
	}

	// if clean, remove all files in uploads folder
	if clean {
		files, err := os.ReadDir("uploads")
		if err != nil {
			return err
		}
		for _, file := range files {
			err := os.Remove("uploads/" + file.Name())
			if err != nil {
				return err
			}
		}
	}

	http.HandleFunc("/master", s.masterHandler)
	http.HandleFunc("/hyperopt", s.hyperoptHandler)
	http.HandleFunc("/worker", s.workerHandler)

	http.HandleFunc("/upload", s.uploadHandler)
	fmt.Println("Starting server on :8080")

	err = http.ListenAndServe(":8080", nil)
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

	s.workerHandlers[ReadyToTrainResponseId] = s.onRecievedClientReadyToTrain
	s.workerHandlers[RecieveParamsResultsResponseID] = s.onRecievedTrainingResults

	s.Trace = true // default verbose logging info
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

func (s *SocketServer) onRecievedTrainingResults(conn *websocket.Conn, message []byte) {
	response := RecieveParamsResultsResponse{}
	err := json.Unmarshal(message, &response)

	if err != nil {
		fmt.Println(err)
		return
	}

	trainingRun := s.trainingIdStateMap[response.ParamsId]
	trainingRun.Status = TrainingStateFinished
	trainingRun.Loss = response.Loss
	s.trainingIdStateMap[response.ParamsId] = trainingRun
	worker := s.WorkerClients[conn]
	worker.Status = Idle

	s.MasterClient.SendClientFinishedTrainingMessage(s.WorkerClients[conn], response.ParamsId, response.Loss, time.Now().UnixMilli())
	s.HyperoptClient.SendResultsMessage(response.ParamsId, response.Loss)
	s.availableWorkers <- worker
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

	var worker = <-s.availableWorkers // maybe not necessary?

	for worker == nil {
		fmt.Println("got disconnected worker")
		worker = <-s.availableWorkers
	}

	worker.SendParamsMessage(HyperoptRecieveNextParamsResponse.Params, HyperoptRecieveNextParamsResponse.ParamsID)

	s.clientJobMap[worker.Connection] = HyperoptRecieveNextParamsResponse.ParamsID
	s.trainingIdStateMap[HyperoptRecieveNextParamsResponse.ParamsID] = TrainingRun{
		ID:     HyperoptRecieveNextParamsResponse.ParamsID,
		Status: TrainingStateRunning,
		Params: HyperoptRecieveNextParamsResponse.Params,
	}

	s.MasterClient.SendClientStartedTrainingMessage(worker, HyperoptRecieveNextParamsResponse.ParamsID, HyperoptRecieveNextParamsResponse.Params, time.Now().UnixMilli())
}

func (s *SocketServer) onRecievedClientReadyToTrain(conn *websocket.Conn, message []byte) {
	if s.Trace {
		fmt.Println("Recieved ReadyToTrainResponseId")
	}
	s.WorkerClients[conn].Status = Idle
	s.MasterClient.SendClientReadyToTrainMessage(s.WorkerClients[conn])
	s.availableWorkers <- s.WorkerClients[conn]
}
