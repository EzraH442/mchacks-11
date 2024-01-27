from websockets.sync.client import connect
import json


class Worker:

    def __init__(self, server, port=8080):
        self.server = server
        self.port = port

    def send_result(self, message):
        with connect(self.server + ":" + str(self.port)) as websocket:
            websocket.send(message)
            ret = websocket.recv()
            print(f"Send {ret} to master")


NewSocket = Worker("ws://localhost")
NewSocket.send_result(json.dumps({"msg": "wee", "ID": "ping"}))



