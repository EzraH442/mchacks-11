package socket

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/gorilla/websocket"
)

type ParamsInfo struct {
	ParamsID string
	Params   interface{}
	VTable   interface{}
}

type Hub struct {
	workerClients    map[*websocket.Conn]*WorkerClient
	subcriberClients map[*websocket.Conn]*SubscriberClient
	masterClient     *MasterClient
	hyperoptClient   *HyperoptClient

	registerWorkerClient       chan *WorkerClient
	unregisterWorkerClient     chan *WorkerClient
	registerSubscriberClient   chan *SubscriberClient
	unregisterSubscriberClient chan *SubscriberClient
	registerMasterClient       chan *MasterClient
	unregisterMasterClient     chan *MasterClient
	registerHyperoptClient     chan *HyperoptClient
	unregisterHyperoptClient   chan *HyperoptClient

	paramsQueue      chan ParamsInfo
	availableWorkers chan *WorkerClient

	trainingIdStateMap map[string]TrainingRun
	clientJobMap       map[*websocket.Conn]string

	modelFileId      string
	trainingFileId   string
	evaluationFileId string
}

func newHub() *Hub {
	return &Hub{
		workerClients:              make(map[*websocket.Conn]*WorkerClient),
		subcriberClients:           make(map[*websocket.Conn]*SubscriberClient),
		registerWorkerClient:       make(chan *WorkerClient),
		unregisterWorkerClient:     make(chan *WorkerClient),
		registerSubscriberClient:   make(chan *SubscriberClient),
		unregisterSubscriberClient: make(chan *SubscriberClient),
		registerMasterClient:       make(chan *MasterClient),
		unregisterMasterClient:     make(chan *MasterClient),
		registerHyperoptClient:     make(chan *HyperoptClient),
		unregisterHyperoptClient:   make(chan *HyperoptClient),
		paramsQueue:                make(chan ParamsInfo),
		availableWorkers:           make(chan *WorkerClient),
		trainingIdStateMap:         make(map[string]TrainingRun),
		clientJobMap:               make(map[*websocket.Conn]string),
	}
}

func (h *Hub) a() {
	for {
		params := <-h.paramsQueue

		worker := <-h.availableWorkers

		for _, ok := h.workerClients[worker.Connection]; !ok; {
			fmt.Println("got disconnected worker")
			worker = <-h.availableWorkers
		}

		worker.SendParamsMessage(params.Params, params.ParamsID, params.VTable)

		h.clientJobMap[worker.Connection] = params.ParamsID
		h.trainingIdStateMap[params.ParamsID] = TrainingRun{
			Status: TrainingStateRunning,
			Info:   params,
		}

		if h.masterClient != nil {
			h.masterClient.SendClientStartedTrainingMessage(worker, params.ParamsID, params.Params, time.Now().UnixMilli())
		}
	}

	// TODO: send subscriber messages
}

func (h *Hub) run() {
	go h.a()
	for {
		select {
		case workerClient := <-h.registerWorkerClient:
			h.workerClients[workerClient.Connection] = workerClient

			if h.masterClient != nil {
				h.masterClient.SendClientConnectedMessage(workerClient)
			}

			if h.modelFileId != "" && h.trainingFileId != "" && h.evaluationFileId != "" {
				workerClient.SendFiles(h.modelFileId, h.trainingFileId, h.evaluationFileId)
			}

		case workerClient := <-h.unregisterWorkerClient:
			fmt.Println(h.workerClients[workerClient.Connection])
			if _, ok := h.workerClients[workerClient.Connection]; ok {
				if h.masterClient != nil {
					h.masterClient.SendClientDisconnectedMessage(workerClient)
				}

				delete(h.workerClients, workerClient.Connection)
				close(workerClient.send)
			}

			if currentJob, ok := h.clientJobMap[workerClient.Connection]; ok {
				log.Printf("(%s) job %s will be requeued", workerClient.ID, currentJob)
				job := h.trainingIdStateMap[currentJob]
				delete(h.clientJobMap, workerClient.Connection)
				h.paramsQueue <- job.Info
			} else {
				log.Printf("(%s) no job to requeue", workerClient.ID)
			}

		case masterClient := <-h.registerMasterClient:
			h.masterClient = masterClient

		case masterClient := <-h.unregisterMasterClient:
			if h.masterClient != nil {
				h.masterClient = nil
				close(masterClient.send)
			}

		case hyperoptClient := <-h.registerHyperoptClient:
			h.hyperoptClient = hyperoptClient

		case hyperoptClient := <-h.unregisterHyperoptClient:
			if h.hyperoptClient != nil {
				h.hyperoptClient = nil
				close(hyperoptClient.send)
			}

		case subscriberClient := <-h.registerSubscriberClient:
			h.subcriberClients[subscriberClient.Connection] = subscriberClient

		case subscriberClient := <-h.unregisterSubscriberClient:
			if _, ok := h.subcriberClients[subscriberClient.Connection]; ok {
				delete(h.subcriberClients, subscriberClient.Connection)
				close(subscriberClient.send)
			}

		}
	}
}

const (
	TrainingStateIdle = iota
	TrainingStateRunning
	TrainingStateFinished
)

type TrainingRun struct {
	Status int
	Loss   float64
	Info   ParamsInfo
}

type SocketServer struct {
	hub    *Hub
	server *http.Server
	Trace  bool
}

func NewSocketServer() *SocketServer {
	return &SocketServer{
		hub: newHub(),
		server: &http.Server{
			Addr: ":8080",
		},
	}
}

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	// Allow connections from any origin
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

func serveWorkerClientWs(hub *Hub, w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println(err)
		return
	}

	client := NewWorkerClient(conn, hub)
	hub.registerWorkerClient <- client

	go client.writePump()
	go client.readPump()
}

func serveMasterClientWs(hub *Hub, w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println(err)
		return
	}
	client := NewMasterClient(conn, hub)
	hub.registerMasterClient <- client

	go client.writePump()
	go client.readPump()
}

func serveHyperoptClientWs(hub *Hub, w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println(err)
		return
	}
	client := NewHyperoptClient(conn, hub)
	hub.registerHyperoptClient <- client

	go client.writePump()
	go client.readPump()
}

func serveSubscriberClientWs(hub *Hub, w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println(err)
		return
	}
	client := NewSubscriberClient(conn, hub)
	hub.registerSubscriberClient <- client

	go client.writePump()
	go client.readPump()
}

func (s *SocketServer) uploadHandler(w http.ResponseWriter, r *http.Request) {
	//set cors headero
	w.Header().Set("Access-Control-Allow-Origin", "*")

	if r.Method != "POST" {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}

	if err := r.ParseMultipartForm(MAX_UPLOAD_SIZE); err != nil {
		log.Println(err)
		http.Error(w, "Files too large", http.StatusBadRequest)
		return
	}

	modelFile, _, err := r.FormFile("model")
	if err != nil {
		log.Println(err)
		http.Error(w, "Error processing model file", http.StatusBadRequest)
		return
	}
	defer modelFile.Close()
	modelFileId, err := writeFile(modelFile)

	if err != nil {
		log.Println(err)
		http.Error(w, "Error processing model file", http.StatusBadRequest)
		return
	}

	trainingFile, _, err := r.FormFile("training")
	if err != nil {
		log.Println(err)
		http.Error(w, "Error processing training file", http.StatusBadRequest)
		return
	}
	defer trainingFile.Close()
	trainingFileId, err := writeFile(trainingFile)
	if err != nil {
		log.Println(err)
		http.Error(w, "Error processing training file", http.StatusBadRequest)
		return
	}

	evaluationFile, _, err := r.FormFile("evaluation")
	if err != nil {
		log.Println(err)
		http.Error(w, "Error processing evaluation file", http.StatusBadRequest)
		return
	}
	defer evaluationFile.Close()
	evaluationFileId, err := writeFile(evaluationFile)
	if err != nil {
		log.Println(err)
		http.Error(w, "Error processing evaluation file", http.StatusBadRequest)
		return
	}

	s.hub.modelFileId = modelFileId
	s.hub.trainingFileId = trainingFileId
	s.hub.evaluationFileId = evaluationFileId

	UploadFilesMessage := UploadFilesMessage{
		ModelFileId:      modelFileId,
		TrainingFileId:   trainingFileId,
		EvlauationFileId: evaluationFileId,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(UploadFilesMessage)

	// invalidate all workers

	for _, worker := range s.hub.workerClients {
		worker.Status = NotReady

		if s.hub.masterClient != nil {
			s.hub.masterClient.SendClientNotReadyToTrainMessage(worker)
		}
	}

	// send files to all workers
	for _, worker := range s.hub.workerClients {
		worker.SendFiles(modelFileId, trainingFileId, evaluationFileId)
	}
}

func (s *SocketServer) Listen(clean bool) error {

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

	go s.hub.run()

	http.HandleFunc("/upload", s.uploadHandler)

	http.HandleFunc("/worker", func(w http.ResponseWriter, r *http.Request) {
		serveWorkerClientWs(s.hub, w, r)
	})

	http.HandleFunc("/master", func(w http.ResponseWriter, r *http.Request) {
		serveMasterClientWs(s.hub, w, r)
	})

	http.HandleFunc("/hyperopt", func(w http.ResponseWriter, r *http.Request) {
		serveHyperoptClientWs(s.hub, w, r)
	})

	http.HandleFunc("/subscriber", func(w http.ResponseWriter, r *http.Request) {
		serveSubscriberClientWs(s.hub, w, r)
	})

	log.Println("Listening on :8080")
	return s.server.ListenAndServe()
}
