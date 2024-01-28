import json


def newReadyToTrainMessage():
    # After sending this message, the worker will wait for the master to
    # send the hyperparameters to train the model with, after which it will
    # send the results back to the master with newSendResultsMessage.
    return json.dumps({"ID": "ready-to-train", "msg": ""})

def newReadyToWorkMessage():
    # This message serves as a ready signal for the genetic algorithm server,
    # which will then wait to receive a list of accuracies and chromosomes from
    # the master server
    return json.dumps({"ID": "ready-genetic-algorithm", "msg": ""})

def newSendResultsMessage(accuracy, hyperparameters):
    return json.dumps(
        {"ID": "recieve-test-results", "accuracy": accuracy, "hyperparameters": hyperparameters}
    )
