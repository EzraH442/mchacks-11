package main

import (
	"fmt"
	"socket"
)

func main() {
	socketServer := socket.NewSocketServer()
	err := socketServer.Start(true)

	fmt.Println(err)
}
