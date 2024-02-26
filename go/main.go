package main

import (
	"fmt"
	"socket"
)

func main() {
	socketServer := socket.NewSocketServer()
	err := socketServer.Start()

	fmt.Println(err)
}
