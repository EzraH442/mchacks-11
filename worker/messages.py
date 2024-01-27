import json


def newReadyToTrainMessage():
    # After sending this message, the worker will wait for the master to
    # send the hyperparameters to train the model with, after which it will
    # send the results back to the master with newSendResultsMessage.
    return json.dumps({"ID": "new-ready-to-train", "msg": ""})


def newSendResultsMessage(results):
    return json.dumps({"ID": "recieve-test-results", "msg": results})
