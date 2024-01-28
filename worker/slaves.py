import numpy as np

import tensorflow as tf
from tensorflow.keras.datasets import mnist
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Dense, BatchNormalization
from tensorflow.keras.optimizers import Adam

(x_train, y_train), (x_test, y_test) = mnist.load_data()

x_train = x_train / 255.0
x_test = x_test / 255.0

# Flatten the images and convert labels to integers
x_train = x_train.reshape((x_train.shape[0], -1))
x_test = x_test.reshape((x_test.shape[0], -1))

# Convert labels to integers
y_train = np.array(y_train)
y_test = np.array(y_test)

def create_custom_nn(num_layers, layer_neurons, input_shape, output_shape, epsi):
    model = Sequential()
    model.add(Dense(layer_neurons[0], activation='relu', input_shape=(784,)))  # Update input_shape to match flattened images
    for i in range(num_layers-1):
        model.add(Dense(layer_neurons[i+1], activation='relu'))
    model.add(Dense(output_shape, activation='softmax'))
    model.add(BatchNormalization(epsilon=epsi))

    return model


def test_model(chromosome):
    model = create_custom_nn(chromosome[0], chromosome[1], 784, 10, chromosome[2])
    custom_optimizer = Adam(learning_rate=(chromosome[3]/10))

    # Compile the model with the custom optimizer
    model.compile(optimizer=custom_optimizer,
                  loss=tf.keras.losses.SparseCategoricalCrossentropy(from_logits=True),
                  metrics=['accuracy'])

    # Train the model
    model.fit(x_train, y_train, epochs=10, batch_size=128, validation_data=(x_test, y_test), verbose=0)

    # Evaluate the model on the test set
    test_loss, test_accuracy = model.evaluate(x_test, y_test, verbose=2)

    return test_accuracy