import json

RecieveClientResultsResponseID = "recieve-results"
ReadyToTrainResponseId = "ready-to-train"
RecieveParamsResultsResponseID = "recieve-params-results"


def create_ws_message(message_id, data):
    message = {"ID": message_id}
    for k, v in data.items():
        message[k] = v
    return json.dumps(message)


def create_ready_to_train_message():
    return create_ws_message(ReadyToTrainResponseId, {})


def create_recieve_results_message(params_id: str, loss: float):
    return create_ws_message(
        RecieveClientResultsResponseID, {"params_id": params_id, "loss": loss}
    )
