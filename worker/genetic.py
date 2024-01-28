import pygad
import numpy
import json
import os
import random


def initialize_population(sol_per_pop, num_genes, low_end, high_end):
    population = []
    for _ in range(sol_per_pop):
        chromosome = []
        for _ in range(num_genes):
            gene = random.uniform(low_end, high_end)
            chromosome.append(gene)
        population.append(chromosome)
    return population


def calculate_fitness(solution, function_inputs, desired_output):
    elementwise_multiplication = [x * y for x, y in zip(solution, function_inputs)]
    output = sum(elementwise_multiplication)
    fitness = 1.0 / numpy.abs(output - desired_output)
    return fitness


def select_parents(population, num_parents_mating, desired_output, solution):
    parents = []
    for _ in range(num_parents_mating):
        max_fitness = -1
        max_fitness_index = -1
        for i in range(len(population)):
            fitness = calculate_fitness(population[i], solution, desired_output)
            if fitness > max_fitness:
                max_fitness = fitness
                max_fitness_index = i
        parents.append(population[max_fitness_index])
        population.pop(max_fitness_index)
    return parents


def crossover(parents, num_genes):
    offspring = []
    for i in range(len(parents) - 1):
        parent1 = parents[i]
        parent2 = parents[(i + 1)]
        child = []
        for j in range(num_genes):
            if random.random() < 0.5:
                child.append(parent1[j])
            else:
                child.append(parent2[j])
        offspring.append(child)
    return offspring


def mutate(offspring):
    for i in range(len(offspring)):
        for j in range(len(offspring[i])):
            if random.random() < 0.1:
                offspring[i][j] = offspring[i][j] + random.uniform(-1, 1)
    return offspring


async def genetic_algorithm(num_generations, num_parents_mating, sol_per_pop, num_genes, low_end, high_end, desired_output,
                      solution):
    population = initialize_population(sol_per_pop, num_genes, low_end, high_end)
    output = 0
    while abs(output - desired_output) > 1:
        parents = select_parents(population, num_parents_mating, desired_output, solution)
        offspring = crossover(parents, num_genes)
        offspring = mutate(offspring)
        population = parents + offspring
        best = select_parents(population, 1, desired_output, solution)
        best = best[0]
        elementwise_multiplication = [x * y for x, y in zip(solution, best)]
        output = sum(elementwise_multiplication)
    return best, output

#best, output = genetic_algorithm(num_generations, num_parents_mating, sol_per_pop, num_genes, low_end, high_end,
                                 #desired_output, solution)