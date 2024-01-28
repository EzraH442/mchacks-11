import json


def newReadyToTrainMessage():
    # After sending this message, the worker will wait for the master to
    # send the hyperparameters to train the model with, after which it will
    # send the results back to the master with newSendResultsMessage.
    return json.dumps({"ID": "ready-to-train", "msg": ""})


def newSendResultsMessage(accuracy, chromosomes):
    return json.dumps(
        {"ID": "recieve-test-results", "accuracy": results, "chromosomes": chromosomes}
    )
