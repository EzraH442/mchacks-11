package socket

import (
	"github.com/gorilla/websocket"
)

type MasterClient struct {
	Connection *websocket.Conn
}
