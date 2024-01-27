import websockets
from websockets.sync.client import connect
import json
import asyncio


class Worker:

    def __init__(self, server, port=8080):
        self.server = server
        self.port = port
        self.addr = self.server + ":" + str(self.port)
        self.ws = connect(self.addr)

    def _job_fail(self, err):
        return json.dumps({"msg": err, "id": "1"})

    def send_result(self, message):
        with connect(self.server + ":" + str(self.port)) as websocket:
            websocket.send(message)
            ret = websocket.recv()
            print(f"Send {ret} to master")

    def send_ready(self):
        self.ws.send(json.dumps({"id": "ready-to-train"}))
        print("Sent to server")

    async def wait_reply(self):
        while True:
            try:
                status = await self.ws.recv()
            except websockets.ConnectionClosed:
                print(f"Connection to {self.addr} closed.")
                break

            # pass data to genetic_algo

            await self.ws.send(json.dumps({"msg": status, "id": "2"}))
            print("success")


NewSocket = Worker("ws://localhost")
NewSocket.send_ready()
asyncio.run(NewSocket.wait_reply())



