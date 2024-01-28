import numpy as np
from keras.datasets import mnist
import random

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

def initialize_population(sol_per_pop, num_genes, nb_neurons_possible, low_end_randomized, high_end_randomized):
    population = []
    for _ in range(sol_per_pop):
        chromosome = []
        nb_layers = random.randint(1, 2)
        chromosome.append(nb_layers)
        nb_on_layers=[]
        for _ in range(nb_layers):
            nb_on_layers.append(random.choice(nb_neurons_possible))
        chromosome.append(nb_on_layers)
        chromosome.append(random.uniform(low_end_randomized, high_end_randomized))
        chromosome.append(random.uniform(low_end_randomized, high_end_randomized))
        population.append(chromosome)
    return population


def select_parents(population, num_parents_mating):
    accuracies = [test_model(chromosome) for chromosome in population]

    # Combine individuals with their corresponding accuracy
    individuals_with_accuracies = list(zip(population, accuracies))

    # Sort individuals based on accuracy in descending order
    individuals_with_accuracies.sort(key=lambda x: x[1], reverse=True)

    # Select the top individuals based on num_parents_mating
    selected_parents = individuals_with_accuracies[:num_parents_mating]
    # Extract parents and their accuracies separately
    parents, parent_accuracies = zip(*selected_parents)
    parents = list(parents)

    # Ensure the format of parents
    return parents, parent_accuracies


def crossover(parents):
    offspring = []
    for i in range(sol_per_pop - num_parents_mating):
        parent1 = parents[0]
        parent2 = parents[1]
        child = [0, [], 0, 0]
        for j in range(len(parent1)):
            if j == 1:
                for k in range(child[0]):
                    if (parent1[0] > k) and (parent2[0] > k):
                        if random.random() < 0.5:
                            child[1].append(parent1[j][k])
                        else:
                            child[1].append(parent2[j][k])
                    elif parent1[0] > k:
                        child[1].append(parent1[j][k])
                    elif parent2[0] > k:
                        child[1].append(parent2[j][k])
                    else:
                        child[1].append(random.choice(nb_neurons_possible))
            else:
                if random.random() < 0.5:
                    child[j]=parent1[j]
                else:
                    child[j]=parent2[j]
        offspring.append(child)
    for j in range(len(offspring)):
        if isinstance(offspring[j][1], int):
            offspring[j][1] = [offspring[j][1]]
    return offspring


def mutate(offspring):
    for i in range(len(offspring)):
        for j in range(len(offspring[i])):
            if j == 0:
                if random.random() < 0.1 and offspring[i][j] == 2:
                    x = random.randint(-1, 1)
                    offspring[i][j] = offspring[i][j] + x
                    if x == -1:
                        offspring[i][j+1] = offspring[i][j+1][:-1]
                    elif x == 1:
                        offspring[i][j+1].append(random.choice(nb_neurons_possible))
                elif random.random() < 0.1 and offspring[i][j] == 1:
                    x = random.randint(0, 1)
                    offspring[i][j] = offspring[i][j] + x
                    if x == 1:
                        offspring[i][j+1].append(random.choice(nb_neurons_possible))
                elif random.random() < 0.1 and offspring[i][j] == 3:
                    x = random.randint(-1, 0)
                    offspring[i][j] = offspring[i][j] + x
                    if x == -1:
                        offspring[i][j+1] = offspring[i][j+1][:-1]
            elif j == 1:
                if random.random()<0.1 and offspring[i][0]==1:
                    offspring[i][1] = nb_neurons_possible[random.randint(0, 4)]
                else:
                    for k in range(offspring[i][0]):
                        if random.random()<0.1:
                            offspring[i][j][k] = nb_neurons_possible[random.randint(0, 4)]
            else:
                if random.random() < 0.1 and 0.2<offspring[i][j]<0.8:
                    offspring[i][j] = offspring[i][j] + random.uniform(-0.2, 0.2)
    for j in range(len(offspring)):
        if isinstance(offspring[j][1], int):
            offspring[j][1] = [offspring[j][1]]
    return offspring

def genetic_algorithm(num_generations, num_parents_mating, sol_per_pop, num_genes, nb_neurons_possible, low_end_randomized, high_end_randomized, aim_accuracy):
    population = initialize_population(sol_per_pop, num_genes, nb_neurons_possible, low_end_randomized, high_end_randomized)
    parents, accuracies = select_parents(population, num_parents_mating)
    print('Initial best:', parents[0], '\tInitial best accuracy:', accuracies[0])
    output_accuracy=0
    while output_accuracy < aim_accuracy: 
        offspring = crossover(parents)
        offspring = mutate(offspring)
        population = parents + offspring
        parents, accuracies = select_parents(population, num_parents_mating)
        best, output_accuracy = parents[0], accuracies[0] 
        print(population)
        print('Best:', best, '\tBest Accuracy:', output_accuracy)
    
    return best, output_accuracy

num_generations = 10000
num_parents_mating = 2
sol_per_pop = 5
num_genes = 3
nb_neurons_possible = [32, 48, 64, 96, 128]
#low_end_nb_neurons = 32
#high_end_nb_neurons = 128
low_end_randomized = 0
high_end_randomized = 1

aim_accuracy = 0.98


best, output = genetic_algorithm(num_generations, num_parents_mating, sol_per_pop, num_genes, nb_neurons_possible, low_end_randomized, high_end_randomized, aim_accuracy)
print(best, output)


