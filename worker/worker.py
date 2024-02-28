import logging
import websocket
import json
import time
import messages

server = "ws://localhost:8080"

SendClientParamsMessageID = "send-params"
SendFileMessage = "send-files"

websocket.enableTrace(True)
logging.basicConfig(
    filename="worker.log", level=logging.INFO, format="%(asctime)s: %(message)s"
)


class Worker:
    def __init__(self) -> None:
        print("Worker Created")
        self.model_file = None
        self.training_file = None
        self.eval_file = None
        self.ws_connection = self.create_connection()
        print("Worker Initialized")

    def listen(self):
        self.ws_connection.run_forever()

    def create_connection(self):
        logging.info(f"Creating Connection to {server}/worker")

        try:
            ws = websocket.WebSocketApp(
                f"{server}/worker",
                on_open=self.on_open,
                on_message=self.message_handler,
                on_error=self.on_error,
                on_close=self.on_close,
            )
            return ws

        except Exception as e:
            logging.error(f"Error: {e}")
            return None

    def init_handler(self, space, initial_best_config):
        logging.info(
            f"Initializing Search Space: {space}, and initial best config: {initial_best_config}"
        )

        self.search_space = space
        self.initial_best_config = initial_best_config

        self.start_optimization_handler()

    def message_handler(self, other, message):
        logging.info(f"Received: {message}")

        data = json.loads(message)
        logging.debug(f"Received: {data}")

        if "id" not in data:
            logging.info("Invalid message")

        elif data["id"] == SendFileMessage:
            self.send_files_handler(data)

        # elif data["id"] == "init-hyperopt":
        #     self.init_handler(data["search_space"], data["initial_best_config"])

        # elif data["id"] == "results":
        #     self.get_results_handler(data["results"])

        # elif data["id"] == "start-optimization":
        #     self.start_optimization_handler()

    def send_files_handler(self, data):

        id = data["id"]
        model_file = data["model_file"]
        training_file = data["training_file"]
        evaluation_file = data["evaluation_file"]

        model_file_id = data["model_file_id"]
        training_file_id = data["training_file_id"]
        evaluation_file_id = data["evaluation_file_id"]

        self.model_file = model_file
        self.training_file = training_file
        self.evaluation_file = evaluation_file

        self.ws_connection.send(messages.create_ready_to_train_message())

    def on_open(self, ws):
        logging.info("Connection Opened")

    def on_error(self, ws, error):
        logging.error(f"Error: {error}")

    def on_close(self, close_status_code, close_msg, test):
        print(close_status_code, close_msg, test)
        logging.info("Connection Closed - sleeping for 5 seconds and reconnecting...")
        time.sleep(5)
        self.ws_connection = self.create_connection()
        self.ws_connection.run_forever()

    def close(self):
        self.ws_connection.close()


def main():
    worker = Worker()
    worker.listen()


main()
