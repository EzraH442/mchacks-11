import logging
import os
import websocket
import json
import time
import messages
import tensorflow as tf

server = "ws://localhost:8080"

SendClientParamsMessageID = "send-params"
SendFileMessage = "send-files"


websocket.enableTrace(True)
logging.basicConfig(
    filename="worker.log", level=logging.INFO, format="%(asctime)s: %(message)s"
)


def build_training_params(params: dict, v_table):
    ret = {}

    for k, v in params.items():
        if v in v_table:
            print(f"Eval: {v}")
            ret[k] = eval(v)
        else:
            ret[k] = v

    return ret


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

        elif data["id"] == SendClientParamsMessageID:
            self.send_params_handler(data)

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

        f = open("model.py", "w")
        f.write(model_file)
        f.close()

        self.ws_connection.send(messages.create_ready_to_train_message())

    def send_params_handler(self, data):
        logging.info(f"Received Params: {data}")
        params_id = data["params_id"]
        params = data["params"]
        v_table = data["v_table"]

        # train and evaluate the model
        p = build_training_params(params, v_table)

        logging.info(f"Training with Params: {p}")
        model = eval(self.training_file)(p)
        loss = eval(self.training_file)(model)

        self.ws_connection.send(
            messages.create_recieve_results_message(params_id, loss)
        )

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
