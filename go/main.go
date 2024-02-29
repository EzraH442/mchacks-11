package main

import (
	"log"
	"socket"
)

func main() {
	socketServer := socket.NewSocketServer()
	err := socketServer.Listen(true)

	log.Println(err)
}
