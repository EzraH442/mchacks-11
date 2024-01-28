import numpy as np
from keras.datasets import mnist
import random
import websockets
import json
import asyncio
import messages

class GeneticServer:
    def __init__(self):
        self.server = "ws://localhost:8080"
        self.accuracy = []
        self.chromosomes = []

    async def listener(self):
        async with websockets.connect(self.server) as websocket:
            print(f"Connected to {self.server}.")
            await websocket.send(messages.newReadyToWorkMessage())
            while True:
                try:
                    status = await websocket.recv()
                    data = json.loads(status)
                    if data["ID"] == "genetic-algorithm-status-update":
                        for entry in data["accuracy"]:
                            self.accuracy.append(entry)
                        for entry in data["chromosomes"]:
                            self.chromosomes.append(entry)
                        self._begin_genetic_algorithm()
                except websockets.ConnectionClosed:
                    print(f"Connection to {self.server} closed.")
                    break

    def _begin_genetic_algorithm(self):
        size = len(self.accuracy)
        accuracy = [(self.accuracy.pop(), self.chromosomes.pop()) for i in range(0, size)]
        # to do : further steps of genetic algorithm should go here since this method's call implies that
        # it's ready to be run


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
        chromosome.append(random.uniform(low_end_randomized, high_end_randomized))          # epsilon value
        chromosome.append(random.uniform(low_end_randomized, high_end_randomized))          # learning rate
        population.append(chromosome)
    return population


Gene = GeneticServer()
Gene.listener()

def select_parents(population, num_parents_mating, accuracies):
    # accuracies = [test_model(chromosome) for chromosome in population]

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


