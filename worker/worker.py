import websockets
import json
import asyncio


def job_fail(err):
    return json.dumps({"msg": err, "id": "1"})


class Worker:

    def __init__(self, server, port=8080):
        self.server = server
        self.port = port
        self.addr = self.server + ":" + str(self.port)

    async def wait_and_reply(self):
        async with websockets.connect(self.addr) as websocket:
            await websocket.send(json.dumps({"id": "ready-to-train"}))
            while True:
                try:
                    status = await websocket.recv()
                    # if json.loads(status)["id"] == "start-hyperparameters":

                except websockets.ConnectionClosed:
                    print(f"Connection to{self.addr} closed.")
                    break
                except Exception as e:
                    await websocket.send(job_fail(e))
                    break


NewSocket = Worker("ws://localhost")
asyncio.run(NewSocket.wait_and_reply())
