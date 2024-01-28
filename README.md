This project distributes the hyper-parameters used in a tensorflow model over different machines to make the learning and getting the optimal solution faster.
The only requirement is to download the repo and the requirements:
  - run the main computer as the server by running it as the master
  - run the others computers as the workers
The code splits the hyper-paarmeters itself taking into account the power of each machine, once the accuracy aimed for is reached, the main will return the optimal parameters to use for the training
