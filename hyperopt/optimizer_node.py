import time
from hyperopt import Trials, fmin, tpe
import json
import websocket
import uuid
import logging

websocket.enableTrace(True)
logging.basicConfig(
    filename="hyperopt.log", level=logging.INFO, format="%(asctime)s: %(message)s"
)


def create_ws_message(message_id, data):
    return json.dumps({"message_id": message_id, "data": data})


def create_push_opt_params_message(params, id):
    p = {"params": params, "id": id}
    return create_ws_message("push-opt-params", p)


server = "ws://localhost:8080"


class Optimizer:
    def __init__(self) -> None:
        print("Optimizer Created")
        self.search_space = None
        self.initial_best_config = None
        self.training_history = []
        self.ws_connection = self.create_connection()
        self.results_map = dict()
        self.parallelism = 8
        self.trials = Trials()
        print("Optimizer Initialized")

    def listen(self):
        self.ws_connection.run_forever()

    def create_connection(self):
        logging.info(f"Creating Connection to {server}/hyperopt")

        try:
            ws = websocket.WebSocketApp(
                f"{server}/hyperopt",
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

    def get_results_handler(self, results):
        logging.debug(f"Received Results: {results}")

        params_id = results["params_id"]
        loss = results["loss"]
        params = results["params"]

        self.results_map[params_id] = (params, loss)

    def start_optimization_handler(self):
        logging.info("Starting Optimization")

        best = fmin(
            fn=self.objective,  # Objective Function to optimize
            space=self.search_space,  # Hyperparameter's Search Space
            points_to_evaluate=self.initial_best_config,
            algo=tpe.suggest,  # Optimization algorithm (representative TPE)
            max_evals=100,  # Number of optimization attempts
            trials=self.training_history,  # Record the results
            trials_save_file="./pacman_trials.p",
        )

        logging.info(f"Optimization Completed. Best Parameters: {best}")
        self.ws_connection.send(create_ws_message("optimization-completed", best))

    def objective(self, params):
        logging.info(f"Optimizing with Parameters: {params}")

        params_id = uuid.uuid4().hex
        self.results_map[params_id] = None
        self.ws_connection.send(create_push_opt_params_message(params, params_id))

        while self.results_map[params_id] is None:
            time.sleep(1)

        logging.info(f"objective function completed for params: {params}")
        params, loss = self.results_map[params_id]
        return loss

    def message_handler(self, other, message):
        logging.info(f"Received: {message}")

        data = json.loads(message)
        logging.debug(f"Received: {data}")

        if "id" not in data:
            logging.info("Invalid message")

        elif data["id"] == "init-hyperopt":
            self.init_handler(data["search_space"], data["initial_best_config"])

        elif data["id"] == "results":
            self.get_results_handler(data["results"])

        elif data["id"] == "start-optimization":
            self.start_optimization_handler()

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
    optimizer = Optimizer()
    optimizer.listen()


main()
