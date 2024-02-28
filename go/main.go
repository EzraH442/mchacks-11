package main

import (
	"log"
	"socket"
)

func main() {
	socketServer := socket.NewSocketServer()
	err := socketServer.Start(true)

	log.Println(err)
}
