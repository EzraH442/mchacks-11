Flow:

1. Upload required files (on frontend):

- file with model, file that trains model, file that evaluates the model
- files get sent to hyperoptimizer worker node

2. Set up hyperparameter search space and initial point (on frontend)

- master node recieves message (search space serialized JSON)
- master node sends message with this data serialized as JSON to hyperoptimizer worker node

3. Start training:

a)

- hyperopt sends master node the initial batch of hyperparameters
- master node distributes the nodes to the workers
- master node recieves results from the workers
- master node sends results to hyperopt
- hyperopt sends master node the next batch of hyperparameters
- repeat until hyperopt is done -> send master node the message that optimization has completed

b)

- worker connects
- worker is sent the file with model, the file the trains model, and the file that evaulates the model
- worker waits until they get sent a set of hyperparameters to train
- worker trains the model
- worker finishes training and sends the results back to master node

c)

- every time the master node recieves an update, notify the frontend
- ... WIP ...
