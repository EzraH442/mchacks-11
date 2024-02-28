export enum EResultsStatus {
  NOT_STARTED = 'not-started',
  IN_PROGRESS = 'in-progress',
  FINISHED = 'finished',
}

export enum EClientStatus {
  IDLE = 'idle',
  NOT_READY = 'not-ready',
  WORKING = 'working',
  DISCONNECTED = 'disconnected',
}

export enum EHyperparameterParameterType {
  UNIFORM = 'uniform',
  CHOICE = 'choice',
  QUNIFORM = 'quniform',
}

export enum EHyperparameterDataType {
  BOOL = 'bool',
  NUMBER = 'number',
  TEXT = 'text',
}

export interface IAddFormField {
  fieldName: string;
  hpType: EHyperparameterParameterType;
  type: EHyperparameterDataType;
  array: boolean;
}

export interface ISearchSpaceFormProps {
  fieldName: string;
  min?: number;
  max?: number;
  q?: number;
  options?: any[];
}

/* from connect-4-rl/pacman
  'conv_layers': hp.choice('conv_layers', [[[32, 8, (4, 4)], [64, 4, (2, 2)], [64, 3, (1, 1)]]]),
  'num_units_per_dense_layer': hp.choice('num_units_per_dense_layer', [[512]]),
  'activation': hp.choice('activation', ['relu', 'sigmoid']),
  'kernel_initializer': hp.choice('kernel_initializer', ['glorot_uniform', 'glorot_normal', 'he_uniform', 'he_normal']),
  'learning_rate': hp.uniform('learning_rate', 0.00001, 0.005),
  'optimizer_function': hp.choice('optimizer_function', [tf.keras.optimizers.legacy.Adam, tf.keras.optimizers.legacy.SGD]),
  'loss_function': hp.choice('loss_function', [tf.keras.losses.Huber(), tf.keras.losses.MeanSquaredError()]),
  'discount_factor': hp.uniform('discount_factor', 0.5, 0.99),
  'num_episodes': hp.choice('num_episodes', [100, 200, 300]),
  'transfer_frequency': hp.choice('transfer_frequency', [1, 2, 4, 8, 16, 32, 64, 128, 256, 512, 1024, 2048, 4096, 8192, 16384, 32768]),
  'start_epsilon': hp.uniform('start_epsilon', 0.1, 1),
  'epsilon_decay': hp.uniform('epsilon_decay', 0.0001, 0.1),
  'epsilon_decay_type': hp.choice('epsilon_decay_type', ['exponential', 'linear']),
  'min_epsilon': hp.uniform('min_epsilon', 0.0001, 0.6),
  'memory_size': hp.choice('memory_size', [64, 128, 256, 512, 1024, 2048, 4096, 8192, 16384, 32768]), # memory cannot be smaller than batch size
  'replay_period': scope.int(hp.quniform('replay_period', 1, 20, 1)),
  'replay_batch_size': 
  hp.choice('replay_batch_size', [1, 2, 4, 8, 16, 32, 64]),
  'ema_beta': hp.uniform('ema_beta', 0.8, 0.99),
  'soft_update': hp.choice('soft_update', [True, False]),
  'per_epsilon': hp.uniform('per_epsilon', 0.0001, 0.1),
  'per_alpha': hp.choice('per_alpha', [0, 0.05, 0.1, 0.15, 0.2, 0.25, 0.3, 0.35, 0.4, 0.45, 0.5, 0.55, 0.6, 0.65, 0.7, 0.75, 0.8, 0.85, 0.9, 0.95, 1]),
  'per_beta': hp.choice('per_beta', [0, 0.05, 0.1, 0.15, 0.2, 0.25, 0.3, 0.35, 0.4, 0.45, 0.5, 0.55, 0.6, 0.65, 0.7, 0.75, 0.8, 0.85, 0.9, 0.95, 1]),
  'per_beta_increase': hp.uniform('per_beta_increase', 0, 0.01),
  'dueling': hp.choice('dueling', [True])
*/

export const DefaultFormProps: IAddFormField[] = [
  {
    fieldName: 'conv_layers',
    hpType: EHyperparameterParameterType.CHOICE,
    type: EHyperparameterDataType.NUMBER,
    array: true,
  },
  {
    fieldName: 'num_units_per_dense_layer',
    hpType: EHyperparameterParameterType.CHOICE,
    type: EHyperparameterDataType.NUMBER,
    array: true,
  },
  {
    fieldName: 'activation',
    hpType: EHyperparameterParameterType.CHOICE,
    type: EHyperparameterDataType.TEXT,
    array: false,
  },
  {
    fieldName: 'kernel_initializer',
    hpType: EHyperparameterParameterType.CHOICE,
    type: EHyperparameterDataType.TEXT,
    array: false,
  },
  {
    fieldName: 'learning_rate',
    hpType: EHyperparameterParameterType.UNIFORM,
    type: EHyperparameterDataType.NUMBER,
    array: false,
  },
  {
    fieldName: 'optimizer_function',
    hpType: EHyperparameterParameterType.CHOICE,
    type: EHyperparameterDataType.TEXT,
    array: false,
  },
  {
    fieldName: 'loss_function',
    hpType: EHyperparameterParameterType.CHOICE,
    type: EHyperparameterDataType.TEXT,
    array: false,
  },
  {
    fieldName: 'discount_factor',
    hpType: EHyperparameterParameterType.UNIFORM,
    type: EHyperparameterDataType.NUMBER,
    array: false,
  },
  {
    fieldName: 'num_episodes',
    hpType: EHyperparameterParameterType.CHOICE,
    type: EHyperparameterDataType.NUMBER,
    array: false,
  },
  {
    fieldName: 'transfer_frequency',
    hpType: EHyperparameterParameterType.CHOICE,
    type: EHyperparameterDataType.NUMBER,
    array: false,
  },
  {
    fieldName: 'start_epsilon',
    hpType: EHyperparameterParameterType.UNIFORM,
    type: EHyperparameterDataType.NUMBER,
    array: false,
  },
  {
    fieldName: 'epsilon_decay',
    hpType: EHyperparameterParameterType.UNIFORM,
    type: EHyperparameterDataType.NUMBER,
    array: false,
  },
  {
    fieldName: 'epsilon_decay_type',
    hpType: EHyperparameterParameterType.CHOICE,
    type: EHyperparameterDataType.TEXT,
    array: false,
  },
  {
    fieldName: 'min_epsilon',
    hpType: EHyperparameterParameterType.UNIFORM,
    type: EHyperparameterDataType.NUMBER,
    array: false,
  },
  {
    fieldName: 'memory_size',
    hpType: EHyperparameterParameterType.CHOICE,
    type: EHyperparameterDataType.NUMBER,
    array: false,
  },
  {
    fieldName: 'replay_period',
    hpType: EHyperparameterParameterType.QUNIFORM,
    type: EHyperparameterDataType.NUMBER,
    array: false,
  },
  {
    fieldName: 'replay_batch_size',
    hpType: EHyperparameterParameterType.CHOICE,
    type: EHyperparameterDataType.NUMBER,
    array: false,
  },
  {
    fieldName: 'ema_beta',
    hpType: EHyperparameterParameterType.UNIFORM,
    type: EHyperparameterDataType.NUMBER,
    array: false,
  },
  {
    fieldName: 'soft_update',
    hpType: EHyperparameterParameterType.CHOICE,
    type: EHyperparameterDataType.BOOL,
    array: false,
  },
  {
    fieldName: 'per_epsilon',
    hpType: EHyperparameterParameterType.UNIFORM,
    type: EHyperparameterDataType.NUMBER,
    array: false,
  },
  {
    fieldName: 'per_alpha',
    hpType: EHyperparameterParameterType.CHOICE,
    type: EHyperparameterDataType.NUMBER,
    array: false,
  },
  {
    fieldName: 'per_beta',
    hpType: EHyperparameterParameterType.CHOICE,
    type: EHyperparameterDataType.NUMBER,
    array: false,
  },
  {
    fieldName: 'per_beta_increase',
    hpType: EHyperparameterParameterType.UNIFORM,
    type: EHyperparameterDataType.NUMBER,
    array: false,
  },
  {
    fieldName: 'dueling',
    hpType: EHyperparameterParameterType.CHOICE,
    type: EHyperparameterDataType.BOOL,
    array: false,
  },
];

export const DefaultSearchSpace: ISearchSpaceFormProps[] = [
  {
    fieldName: 'conv_layers',
    options: [
      [32, 8, [4, 4]],
      [64, 4, [2, 2]],
      [64, 3, [1, 1]],
    ],
  },
  {
    fieldName: 'num_units_per_dense_layer',
    options: [[512]],
  },
  {
    fieldName: 'activation',
    options: ['relu', 'sigmoid'],
  },
  {
    fieldName: 'kernel_initializer',
    options: ['glorot_uniform', 'glorot_normal', 'he_uniform', 'he_normal'],
  },
  {
    fieldName: 'learning_rate',
    min: 0.00001,
    max: 0.005,
  },
  {
    fieldName: 'optimizer_function',
    options: [
      'tf.keras.optimizers.legacy.Adam',
      'tf.keras.optimizers.legacy.SGD',
    ],
  },
  {
    fieldName: 'loss_function',
    options: ['tf.keras.losses.Huber()', 'tf.keras.losses.MeanSquaredError()'],
  },
  {
    fieldName: 'discount_factor',
    min: 0.5,
    max: 0.99,
  },
  {
    fieldName: 'num_episodes',
    options: [100, 200, 300],
  },
  {
    fieldName: 'transfer_frequency',
    options: [
      1, 2, 4, 8, 16, 32, 64, 128, 256, 512, 1024, 2048, 4096, 8192, 16384,
      32768,
    ],
  },
  {
    fieldName: 'start_epsilon',
    min: 0.1,
    max: 1,
  },
  {
    fieldName: 'epsilon_decay',
    min: 0.0001,
    max: 0.1,
  },
  {
    fieldName: 'epsilon_decay_type',
    options: ['exponential', 'linear'],
  },
  {
    fieldName: 'min_epsilon',
    min: 0.0001,
    max: 0.6,
  },
  {
    fieldName: 'memory_size',
    options: [64, 128, 256, 512, 1024, 2048, 4096, 8192, 16384, 32768],
  },
  {
    fieldName: 'replay_period',
    min: 1,
    max: 20,
    q: 1,
  },
  {
    fieldName: 'replay_batch_size',
    options: [1, 2, 4, 8, 16, 32, 64],
  },
  {
    fieldName: 'ema_beta',
    min: 0.85,
    max: 0.99,
  },
  {
    fieldName: 'soft_update',
    options: [true, false],
  },
  {
    fieldName: 'per_epsilon',
    min: 0.0001,
    max: 0.1,
  },
  {
    fieldName: 'per_alpha',
    options: [
      0, 0.05, 0.1, 0.15, 0.2, 0.25, 0.3, 0.35, 0.4, 0.45, 0.5, 0.55, 0.6, 0.65,
      0.7, 0.75, 0.8, 0.85, 0.9, 0.95, 1,
    ],
  },
  {
    fieldName: 'per_beta',
    options: [
      0, 0.05, 0.1, 0.15, 0.2, 0.25, 0.3, 0.35, 0.4, 0.45, 0.5, 0.55, 0.6, 0.65,
      0.7, 0.75, 0.8, 0.85, 0.9, 0.95, 1,
    ],
  },
  {
    fieldName: 'per_beta_increase',
    min: 0,
    max: 0.01,
  },
  {
    fieldName: 'dueling',
    options: [true],
  },
];

/* from connect-4-rl
initial_best_config = [{
  'conv_layers': 0,
  'num_units_per_dense_layer': 0,
  'activation': 0,
  'kernel_initializer': 0,
  'learning_rate': 0.001,
  'optimizer_function': 0,
  'loss_function': 0,
  'discount_factor': 0.7,
  'num_episodes': 0,
  'transfer_frequency': 10,
  'start_epsilon': 1.0,
  'epsilon_decay': 0.0001,
  'epsilon_decay_type': 1,
  'min_epsilon': 0.4,
  'memory_size': 8, # memory cannot be smaller than batch size
  'replay_period': 1,
  'replay_batch_size': 5,
  'ema_beta': 0.99,
  'soft_update': 0,
  'per_epsilon': 0.001,
  'per_alpha': 12,
  'per_beta': 8,
  'per_beta_increase': 0.001,
  'dueling': 0
 */

export const DefaultInitialPoint: any = {
  conv_layers: [32, 8, [4, 4]],
  num_units_per_dense_layer: [512],
  activation: 'relu',
  kernel_initializer: 'glorot_uniform',
  learning_rate: 0.001,
  optimizer_function: 'tf.keras.optimizers.legacy.Adam',
  loss_function: 'tf.keras.losses.Huber()',
  discount_factor: 0.7,
  num_episodes: 100,
  transfer_frequency: 1024,
  start_epsilon: 1.0,
  epsilon_decay: 0.001,
  epsilon_decay_type: 'linear',
  min_epsilon: 0.4,
  memory_size: 16384,
  replay_period: 1,
  replay_batch_size: 32,
  ema_beta: 0.99,
  soft_update: true,
  per_epsilon: 0.001,
  per_alpha: 0.6,
  per_beta: 0.4,
  per_beta_increase: 0.001,
  dueling: true,
};
