import websockets
import json
import asyncio
import genetic
import messages

def job_fail(err):
    return json.dumps({"msg": err, "id": "1"})


class Worker:

    def __init__(self, server, port=8080):
        self.server = server
        self.port = port
        self.addr = self.server + ":" + str(self.port)

    async def begin_training(self):
        num_generations = 10000
        num_parents_mating = 3
        sol_per_pop = 30
        num_genes = 6
        low_end = -2
        high_end = 10

        desired_output = 100
        solution = (4, -2, 3.5, 5, -11, -4.7)

        return await genetic.genetic_algorithm(num_generations, num_parents_mating, sol_per_pop, num_genes, low_end, high_end,
                                         desired_output, solution)

    async def wait_and_reply(self):
        async with websockets.connect(self.addr) as websocket:
            print(f"Connected to {self.addr}.")
            await websocket.send(messages.newReadyToTrainMessage())
            while True:
                try:
                    status = await websocket.recv()
                    print(json.loads(status)["id"])

                    if json.loads(status)["id"] == "start-hyperparameters":
                        best, output = await self.begin_training()
                        await websocket.send(messages.newSendResultsMessage(output))
                    #genetic.genetic_algorithm()

                except websockets.ConnectionClosed:
                    print(f"Connection to {self.addr} closed.")
                    break
                except Exception as e:
                    await websocket.send(job_fail(e))
                    break


NewSocket = Worker("ws://localhost")
asyncio.run(NewSocket.wait_and_reply())
