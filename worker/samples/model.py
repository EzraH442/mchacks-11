# To add p1 searching for positive reward and p2 negative reward we will need to:
# X 1. make the reward given be positive if player 1 and negative if player 2 won, instead of just positive depending on the turn
# X 2. make the generate action pick the min value for player to and max value for player 1
# X 3. make the update_Q function use the min value for player 2 and max value for player 1
# X 4. make the play_optimal_move function use the min value for player 2 and max value for player 1
# X 5. make the action_mask mask with negative infinity for player 1 and positive infinity for player 2
# X 6. could also make turn input switch from positive to negative depending on the player, instead of just 1 and 2
# 7. remove punishment/reward and just use like player 1 reward, player 2 reward (which should be equal but negatives of each other)
# might be able to look just one move ahead, and set the q of previous position to argmin or argmax of next positions, instead of looking two moves ahead.

import datetime
import numpy as np
import tensorflow as tf
import random
import copy
import matplotlib.pyplot as plt
from itertools import product
from IPython.display import clear_output
import pickle
import gym
import cv2

# 2. Deep Q-Learning Olivier claims this part, anyone who touches it will be assaulted
# https://towardsdatascience.com/deep-q-learning-tutorial-mindqn-2a4c855abffc


class DQNModel:
    class SumTree(object):
        # https://medium.com/free-code-camp/improvements-in-deep-q-learning-dueling-double-dqn-prioritized-experience-replay-and-fixed-58b130cc5682
        data_pointer = 0

        def __init__(self, capacity):
            self.capacity = int(
                capacity
            )  # number of leaf nodes (final nodes) that contains experiences

            self.tree = np.zeros(2 * self.capacity - 1)  # sub tree
            self.data = np.zeros(self.capacity, object)  # contains the experiences

        def add(self, priority, data):
            tree_index = self.data_pointer + self.capacity - 1
            self.data[self.data_pointer] = data
            self.update(tree_index, priority)
            self.data_pointer += 1

            if self.data_pointer >= self.capacity:
                self.data_pointer = 0

        def update(self, tree_index, priority):
            change = priority - self.tree[tree_index]
            self.tree[tree_index] = priority
            while tree_index != 0:
                tree_index = (tree_index - 1) // 2
                self.tree[tree_index] += change

        def get_leaf(self, v):
            parent_index = 0
            while True:
                left_child_index = 2 * parent_index + 1
                right_child_index = left_child_index + 1
                if left_child_index >= len(self.tree):
                    leaf_index = parent_index
                    break
                else:
                    if v <= self.tree[left_child_index]:
                        parent_index = left_child_index
                    else:
                        v -= self.tree[left_child_index]
                        parent_index = right_child_index
            data_index = leaf_index - self.capacity + 1
            return leaf_index, self.tree[leaf_index], self.data[data_index]

        @property
        def total_priority(self):
            return self.tree[0]

    class Memory(object):
        def __init__(
            self,
            capacity,
            initial_priority=1.0,
            per_epsilon=0.01,
            per_alpha=0.6,
            per_beta=0.4,
            per_beta_increase=0.001,
        ):
            self.tree = DQNModel.SumTree(capacity)
            self.initial_priority = initial_priority  # (max) priority
            self.per_epsilon = per_epsilon  # Hyperparameter that we use to avoid some experiences to have 0 probability of being taken
            self.per_alpha = per_alpha  # Hyperparameter that we use to make a tradeoff between taking only exp with high priority and sampling randomly
            self.per_beta = (
                per_beta  # importance-sampling, from initial value increasing to 1
            )
            self.per_beta_increase = per_beta_increase  # increase in beta

        def store(self, experience):
            max_priority = np.max(self.tree.tree[-self.tree.capacity :])
            if max_priority == 0:
                max_priority = self.initial_priority
            self.tree.add(max_priority, experience)

        def sample(self, n):
            minibatch = []
            batch_index, batch_ISWeights = np.empty((n,), dtype=np.int32), np.empty(
                (n, 1), dtype=np.float32
            )
            priority_segment = self.tree.total_priority / n
            self.per_beta = np.min([1.0, self.per_beta + self.per_beta_increase])
            # print("Tree Priority ", self.tree.total_priority)

            for i in range(n):
                a, b = priority_segment * i, priority_segment * (i + 1)
                # print(a, b)
                value = np.random.uniform(a, b)
                index, priority, data = self.tree.get_leaf(value)
                sampling_probabilities = priority / self.tree.total_priority
                batch_ISWeights[i, 0] = np.power(
                    n * sampling_probabilities, -self.per_beta
                )
                batch_index[i] = index
                experience = data
                minibatch.append(experience)
            return batch_index, minibatch, batch_ISWeights

        def batch_update(self, tree_index, abs_errors):
            abs_errors += self.per_epsilon
            # print("Abs Errors ", abs_errors)
            clipped_errors = np.minimum(abs_errors, 1.0)
            ps = np.power(clipped_errors, self.per_alpha)
            for ti, p in zip(tree_index, ps):
                self.tree.update(ti, p)

    def __init__(
        self,
        model_name=datetime.datetime.now().timestamp(),
        config=None,
        env=None,
        start_episode=0,
    ):
        self.config = config
        self.model_name = model_name
        self.env = gym.make("ALE/MsPacman-v5")
        self.num_actions = self.env.action_space.n
        self.observation_shape = self.env.observation_space.shape
        # self.action_names = atari.get_action_meanings()

        # print("Creating Models")
        self.model = self.create_model(
            conv_layers=config["conv_layers"],
            num_units_per_dense_layer=config["num_units_per_dense_layer"],
            activation=config["activation"],
            kernel_initializer=config["kernel_initializer"],
            optimizer_function=config["optimizer_function"],
            learning_rate=config["learning_rate"],
            loss_function=config["loss_function"],
            dueling=config["dueling"],
        )
        self.target_model = self.create_model(
            conv_layers=config["conv_layers"],
            num_units_per_dense_layer=config["num_units_per_dense_layer"],
            activation=config["activation"],
            kernel_initializer=config["kernel_initializer"],
            optimizer_function=config["optimizer_function"],
            learning_rate=config["learning_rate"],
            loss_function=config["loss_function"],
            dueling=config["dueling"],
        )

        # print("Setting Config Variables")
        self.target_model.set_weights(self.model.get_weights())
        self.num_episodes = int(config["num_episodes"])
        self.discount_factor = config["discount_factor"]
        self.transfer_frequency = int(config["transfer_frequency"])
        self.epsilon = config["start_epsilon"]  # a number between 0 and 1 (epsilon)
        self.epsilon_decay_type = config["epsilon_decay_type"]
        self.epsilon_decay = config["epsilon_decay"]
        self.min_epsilon = config["min_epsilon"]
        self.steps = 0
        self.replay_batch_size = int(config["replay_batch_size"])
        self.replay_period = int(config["replay_period"])
        self.memory_size = max(int(config["memory_size"]), self.replay_batch_size)
        self.start_episode = start_episode
        self.ema_beta = config["ema_beta"]
        self.soft_update = config["soft_update"]

        self.memory = DQNModel.Memory(
            self.memory_size,
            # initial_priority=1.0,
            per_epsilon=config["per_epsilon"],
            per_alpha=config["per_alpha"],
            per_beta=config["per_beta"],
            per_beta_increase=config["per_beta_increase"],
        )

    def create_model(
        self,
        num_units_per_dense_layer=[512],
        conv_layers=[
            [64, 4, (1, 1)],
        ],
        activation="relu",
        kernel_initializer="he_uniform",
        optimizer_function=tf.keras.optimizers.legacy.Adam(0.001),
        learning_rate=0.001,
        loss_function=tf.keras.losses.Huber(),
        dueling=True,
    ):
        if len(conv_layers) > 0:
            X_input = tf.keras.layers.Input(shape=(84, 84, 4))
            X = X_input
            for c in conv_layers:
                X = tf.keras.layers.Conv2D(
                    c[0],
                    c[1],
                    strides=c[2],
                    padding="valid",  # could do same if valid errors
                    activation=activation,
                    kernel_initializer=kernel_initializer,
                    # input_shape=(84, 84),
                    data_format="channels_last",
                )(X)
            X = tf.keras.layers.Flatten()(X)
        else:
            X_input = tf.keras.layers.Input(shape=(84 * 84,))
            X = X_input

        for d in num_units_per_dense_layer:
            X = tf.keras.layers.Dense(
                d, activation=activation, kernel_initializer=kernel_initializer
            )(X)

        if dueling:
            V = tf.keras.layers.Dense(
                1, kernel_initializer=kernel_initializer, activation="linear", name="V"
            )(X)
            A = tf.keras.layers.Dense(
                self.num_actions,
                kernel_initializer=kernel_initializer,
                activation="linear",
                name="Ai",
            )(X)
            A = tf.keras.layers.Lambda(
                lambda a: a - tf.reduce_mean(a, axis=1, keepdims=True), name="Ao"
            )(A)
            Q = tf.keras.layers.Add(name="Q")([V, A])
        else:
            Q = tf.keras.layers.Dense(
                self.num_actions,
                activation="linear",
                kernel_initializer=kernel_initializer,
            )(X)

        Q_model = tf.keras.models.Model(inputs=[X_input], outputs=[Q])
        Q_model.compile(
            loss=loss_function,
            optimizer=optimizer_function(learning_rate=learning_rate),
        )
        return Q_model

    def export(self, episode=-1, best_model=False):
        if episode != -1:
            path = "./models/{}_{}_episodes.keras".format(
                self.model_name, episode + self.start_episode
            )
        else:
            path = "./models/{}.keras".format(self.model_name)

        if best_model:
            path = "./models/best_model.keras"

        self.model.save(path)

    def resize_image(self, image):
        image = image[30:-12, 5:-4]
        image = np.average(image, axis=2)
        image = cv2.resize(image, (84, 84), interpolation=cv2.INTER_NEAREST)
        image = np.array(image, dtype=np.uint8)
        return image

    def prepare_state(self, state):
        # print("State Shape", state.shape)
        frames = np.array([self.resize_image(image) for image in state])
        # state = state[30:-12, 5:-4]
        # state = np.average(state, axis=2)
        # state = cv2.resize(state, (84, 84), interpolation=cv2.INTER_NEAREST)
        # state = np.array(state, dtype=np.uint8)
        # print("Data Shape", frames.shape)
        return np.moveaxis(frames, 0, -1)

    def predict(self, state):
        state_input = np.expand_dims(self.prepare_state(state), axis=0)
        # print("Single Item Input Shape", state_input.shape)
        return self.model(state_input).numpy().flatten()

    def fill_memory(self):
        # print("Filling Memory")
        self.env.reset()
        frames = np.array([self.env.step(0)[0] for i in range(4)])
        state = copy.deepcopy(frames[-4:])
        for i in range(self.memory_size):
            # print("Memory Filling: ", i, " of ", self.memory_size)
            # clear_output(wait=True)
            action = self.env.action_space.sample()
            next_state, reward, terminated, truncated, info = self.env.step(action)
            np.append(frames, next_state)
            next_state = copy.deepcopy(frames[-4:])
            experience = (
                self.prepare_state(state),
                action,
                reward,
                self.prepare_state(next_state),
                terminated,
            )
            self.memory.store(experience)
            state = next_state
            if terminated:
                self.env.reset()
                frames = np.array([self.env.step(0)[0] for i in range(4)])
                state = copy.deepcopy(frames[-4:])
        # print("Memory Filled")

    def experience_replay(self):
        tree_index, minibatch, ISWeights = self.memory.sample(self.replay_batch_size)

        # print(minibatch[0])
        initial_states = np.array([experience[0] for experience in minibatch])
        initial_actions = np.array([experience[1] for experience in minibatch])
        initial_rewards = np.array([experience[2] for experience in minibatch])
        next_states = np.array([experience[3] for experience in minibatch])
        game_won = np.array([experience[4] for experience in minibatch])

        # print(game_won)
        # print(initial_states.shape)
        if self.replay_batch_size < 64:
            initial_Qs = self.model.predict_on_batch(initial_states)
        else:
            initial_Qs = self.model.predict(initial_states, batch_size=4, verbose=0)
        # print("Initial Qs: ", initial_Qs)
        update_Qs = copy.deepcopy(initial_Qs)
        if self.replay_batch_size < 64:
            next_Qs = self.target_model.predict_on_batch(next_states)
        else:
            next_Qs = self.target_model.predict(next_states, batch_size=4, verbose=0)
        next_max_Qs = np.max(next_Qs, axis=1)
        update_Qs = copy.deepcopy(initial_Qs)
        # print("Initial Qs: ", update_Qs)
        for i in range(len(update_Qs)):
            if game_won[i]:
                update_Qs[i][initial_actions[i]] = initial_rewards[i]
            else:
                update_Qs[i][initial_actions[i]] = (
                    initial_rewards[i] + self.discount_factor * next_max_Qs[i]
                )
        # print("Updated Qs: ", update_Qs)
        if self.replay_batch_size < 64:
            self.model.train_on_batch(
                x=initial_states, y=update_Qs, sample_weight=ISWeights
            )
        else:
            self.model.fit(
                x=initial_states,
                y=update_Qs,
                sample_weight=ISWeights,
                batch_size=4,
                epochs=1,
                verbose=0,
            )
        # print("Error: ", update_Qs - initial_Qs)
        abs_errors = np.max(np.abs(update_Qs - initial_Qs), axis=1)
        # print("Absolute Error: ", abs_errors)

        self.memory.batch_update(tree_index, abs_errors)

    def generate_action_epsilon_greedy(self, q) -> int:
        # if the random number is less than the exploration rate, choose a random action
        # otherwise choose the best action
        if random.random() < self.epsilon:
            return self.env.action_space.sample()
        else:
            # return np.argmax(self.action_mask(q))
            return np.argmax(q)

    def update_epsilon(self):
        if self.epsilon > self.min_epsilon:
            if self.epsilon_decay_type == "linear":
                self.epsilon -= self.epsilon_decay
            elif self.epsilon_decay_type == "exponential":
                self.epsilon *= 1 - self.epsilon_decay
        else:
            self.epsilon = self.min_epsilon

    def update_target_model(self):
        if self.soft_update:
            new_weights = self.target_model.get_weights()

            counter = 0
            for wt, wp in zip(
                self.target_model.get_weights(),
                self.model.get_weights(),
            ):
                wt = (self.ema_beta * wt) + ((1 - self.ema_beta) * wp)
                new_weights[counter] = wt
                counter += 1
            self.target_model.set_weights(new_weights)
        else:
            if self.steps % self.transfer_frequency == 0:
                self.target_model.set_weights(self.model.get_weights())

    def run_episode(self):
        self.env.reset()
        frames = np.array([self.env.step(0)[0] for i in range(4)])
        state = copy.deepcopy(frames[-4:])
        total_Q = 0
        max_abs_average_Q = 0
        max_Q = 0
        epochs = 0
        terminated = False
        total_reward = 0

        for skip in range(90):
            self.env.step(0)

        while not terminated:
            epochs += 1
            # print("Timesteps: ", epochs)
            # print("Epsilon: ", self.epsilon)
            # clear_output(wait=True)
            initial_Q = self.predict(state)
            total_Q += sum(initial_Q) / len(initial_Q)
            max_abs_average_Q = max(
                sum(np.abs(initial_Q)) / len(initial_Q), max_abs_average_Q
            )

            action = self.generate_action_epsilon_greedy(initial_Q)
            max_Q += initial_Q[action]

            next_state, reward, terminated, truncated, info = self.env.step(action)
            np.append(frames, next_state)
            next_state = copy.deepcopy(frames[-4:])
            experience = (
                self.prepare_state(state),
                action,
                reward,
                self.prepare_state(next_state),
                terminated,
            )
            self.memory.store(experience)
            state = next_state

            total_reward += reward
            self.steps += 1
            self.update_target_model()
            # self.env.render()
            if (self.steps % self.replay_period) == 0:
                self.experience_replay()

            self.update_epsilon()
        average_Q = total_Q / epochs
        return total_reward, average_Q, max_Q / epochs, max_abs_average_Q

    def train(self, save_plots=True):
        stat_reward = np.zeros(self.num_episodes, float)
        stat_average_Q = np.zeros(self.num_episodes, float)
        stat_max_Q = np.zeros(self.num_episodes, float)
        # num_trials_without_improvement = 0
        # previous_test_results = -100000
        # early_stop = False
        self.fill_memory()
        print("Model: {}".format(self.model_name))
        print("Config: {}".format(self.config))

        for i in range(self.num_episodes):
            (
                total_reward,
                average_Q,
                max_Q,
                max_abs_average_Q,
            ) = self.run_episode()
            # print("Model: {}".format(self.model_name))
            # print("Config: {}".format(self.config))
            # # print("Last Test Result: {}".format(previous_test_results))
            # print("{}%".format(round((i / self.num_episodes * 100), 3)))
            # print("Max Absolute Average Q: {}".format(max_abs_average_Q))
            # clear_output(wait=True)

            stat_reward[i] = total_reward

            stat_average_Q[i] = average_Q
            stat_max_Q[i] = max_Q

        self.env.close()

    def play(self, num_games=1):
        env = gym.make("ALE/MsPacman-v5", render_mode="human")
        average_reward = 0
        for i in range(num_games):
            env.reset()
            state = env.step(0)[0]
            frames = np.array([env.step(0)[0] for i in range(4)])
            state = copy.deepcopy(frames[-4:])
            terminated = False
            while not terminated:
                initial_Q = self.predict(state)
                action = self.generate_action_epsilon_greedy(initial_Q)
                next_state, reward, terminated, info = env.step(action)
                np.append(frames, next_state)
                next_state = copy.deepcopy(frames[-4:])
                average_reward += reward
                state = next_state
        env.close()
        average_reward = average_reward / num_games
        return average_reward
