import { ControllerRenderProps, useFieldArray, useForm } from 'react-hook-form';
import AddFormFieldModal, {
  HyperparameterDataType,
  HyperparameterParameterType,
  IAddFormField,
} from './AddFormFieldModal';
import { Form, FormControl, FormField, FormItem, FormLabel } from './ui/form';
import { useEffect, useState } from 'react';
import { Checkbox } from './ui/checkbox';
import { Input } from './ui/input';
import { X } from 'lucide-react';

interface DynamicFormProps {
  onSubmit: (data: any) => void;
  disabled?: boolean;
}

interface ISearchSpaceFormProps {
  fieldName: string;
  min?: number;
  max?: number;
  q?: number;
  options?: any[];
}

/* from connect-4-rl

        'conv_layers': hp.choice('conv_layers', [
            [],
            [[32, 4, (1, 1)]],
            [[64, 4, (1, 1)]],
            [[128, 4, (1, 1)]],
            [[256, 4, (1, 1)]],
            [[512, 4, (1, 1)]],
            [[1024, 4, (1, 1)]],
        ]),
        'num_units_per_dense_layer': hp.choice('num_units_per_dense_layer', [[], [64], [128], [256], [512], [1024], [2048], [48, 24, 12], [96, 48, 24], [4084], [2048, 1024], [2048, 1024, 512]]),
        'activation': hp.choice('activation', ['relu', 'sigmoid']),
        'kernel_initializer': hp.choice('kernel_initializer', ['glorot_uniform', 'glorot_normal', 'he_uniform', 'he_normal']),
        'learning_rate': hp.uniform('learning_rate', 0.00001, 0.0025),
        'optimizer_function': hp.choice('optimizer_function', [tf.keras.optimizers.legacy.Adam, tf.keras.optimizers.legacy.SGD]),
        'loss_function': hp.choice('loss_function', [tf.keras.losses.Huber(), tf.keras.losses.MeanSquaredError()]),
        'discount_factor': hp.uniform('discount_factor', 0.85, 0.99),
        'num_episodes': scope.int(hp.quniform('num_episodes', 2000, 10000, 1)),
        'transfer_frequency': hp.choice('transfer_frequency', [1, 2, 4, 8, 16, 32, 64, 128, 256, 512, 1024, 2048, 4096, 8192, 16384, 32768]),
        'start_epsilon': hp.uniform('start_epsilon', 0.1, 1),
        'epsilon_decay': hp.uniform('epsilon_decay', 0.0001, 0.1),
        'epsilon_decay_type': hp.choice('epsilon_decay_type', ['exponential', 'linear']),
        'min_epsilon': hp.uniform('min_epsilon', 0.0001, 0.6),
        'memory_size': scope.int(hp.quniform('memory_size', 64, 32768, 2)), # memory cannot be smaller than batch size
        'replay_period': scope.int(hp.quniform('replay_period', 1, 10, 1)),
        'replay_batch_size': 
        hp.choice('replay_batch_size', [1, 2, 4, 8, 16, 32, 64]),
        'ema_beta': hp.uniform('ema_beta', 0.95, 0.99),
        'soft_update': hp.choice('soft_update', [True, False]),
        'per_epsilon': hp.uniform('per_epsilon', 0.0001, 0.1),
        'per_alpha': hp.choice('per_alpha', [0, 0.05, 0.1, 0.15, 0.2, 0.25, 0.3, 0.35, 0.4, 0.45, 0.5, 0.55, 0.6, 0.65, 0.7, 0.75, 0.8, 0.85, 0.9, 0.95, 1]),
        'per_beta': hp.choice('per_beta', [0, 0.05, 0.1, 0.15, 0.2, 0.25, 0.3, 0.35, 0.4, 0.45, 0.5, 0.55, 0.6, 0.65, 0.7, 0.75, 0.8, 0.85, 0.9, 0.95, 1]),
        'per_beta_increase': hp.uniform('per_beta_increase', 0, 0.01),
        'dueling': hp.choice('dueling', [True, False])

*/

const DefaultFormProps: IAddFormField[] = [
  {
    fieldName: 'conv_layers',
    hpType: HyperparameterParameterType.CHOICE,
    type: HyperparameterDataType.NUMBER,
    array: true,
  },
  {
    fieldName: 'num_units_per_dense_layer',
    hpType: HyperparameterParameterType.CHOICE,
    type: HyperparameterDataType.NUMBER,
    array: true,
  },
  {
    fieldName: 'activation',
    hpType: HyperparameterParameterType.CHOICE,
    type: HyperparameterDataType.TEXT,
    array: false,
  },
  {
    fieldName: 'kernel_initializer',
    hpType: HyperparameterParameterType.CHOICE,
    type: HyperparameterDataType.TEXT,
    array: false,
  },
  {
    fieldName: 'learning_rate',
    hpType: HyperparameterParameterType.UNIFORM,
    type: HyperparameterDataType.NUMBER,
    array: false,
  },
  {
    fieldName: 'optimizer_function',
    hpType: HyperparameterParameterType.CHOICE,
    type: HyperparameterDataType.TEXT,
    array: false,
  },
  {
    fieldName: 'loss_function',
    hpType: HyperparameterParameterType.CHOICE,
    type: HyperparameterDataType.TEXT,
    array: false,
  },
  {
    fieldName: 'discount_factor',
    hpType: HyperparameterParameterType.UNIFORM,
    type: HyperparameterDataType.NUMBER,
    array: false,
  },
  {
    fieldName: 'num_episodes',
    hpType: HyperparameterParameterType.QUNIFORM,
    type: HyperparameterDataType.NUMBER,
    array: false,
  },
  {
    fieldName: 'transfer_frequency',
    hpType: HyperparameterParameterType.CHOICE,
    type: HyperparameterDataType.NUMBER,
    array: false,
  },
  {
    fieldName: 'start_epsilon',
    hpType: HyperparameterParameterType.UNIFORM,
    type: HyperparameterDataType.NUMBER,
    array: false,
  },
  {
    fieldName: 'epsilon_decay',
    hpType: HyperparameterParameterType.UNIFORM,
    type: HyperparameterDataType.NUMBER,
    array: false,
  },
  {
    fieldName: 'epsilon_decay_type',
    hpType: HyperparameterParameterType.CHOICE,
    type: HyperparameterDataType.TEXT,
    array: false,
  },
  {
    fieldName: 'min_epsilon',
    hpType: HyperparameterParameterType.UNIFORM,
    type: HyperparameterDataType.NUMBER,
    array: false,
  },
  {
    fieldName: 'memory_size',
    hpType: HyperparameterParameterType.QUNIFORM,
    type: HyperparameterDataType.NUMBER,
    array: false,
  },
  {
    fieldName: 'replay_period',
    hpType: HyperparameterParameterType.QUNIFORM,
    type: HyperparameterDataType.NUMBER,
    array: false,
  },
  {
    fieldName: 'replay_batch_size',
    hpType: HyperparameterParameterType.CHOICE,
    type: HyperparameterDataType.NUMBER,
    array: false,
  },
  {
    fieldName: 'ema_beta',
    hpType: HyperparameterParameterType.UNIFORM,
    type: HyperparameterDataType.NUMBER,
    array: false,
  },
  {
    fieldName: 'soft_update',
    hpType: HyperparameterParameterType.CHOICE,
    type: HyperparameterDataType.BOOL,
    array: false,
  },
  {
    fieldName: 'per_epsilon',
    hpType: HyperparameterParameterType.UNIFORM,
    type: HyperparameterDataType.NUMBER,
    array: false,
  },
  {
    fieldName: 'per_alpha',
    hpType: HyperparameterParameterType.CHOICE,
    type: HyperparameterDataType.NUMBER,
    array: false,
  },
  {
    fieldName: 'per_beta',
    hpType: HyperparameterParameterType.CHOICE,
    type: HyperparameterDataType.NUMBER,
    array: false,
  },
  {
    fieldName: 'per_beta_increase',
    hpType: HyperparameterParameterType.UNIFORM,
    type: HyperparameterDataType.NUMBER,
    array: false,
  },
  {
    fieldName: 'dueling',
    hpType: HyperparameterParameterType.CHOICE,
    type: HyperparameterDataType.BOOL,
    array: false,
  },
];

const DefaultSearchSpace: ISearchSpaceFormProps[] = [
  {
    fieldName: 'conv_layers',
    options: [
      [],
      [[32, 4, [1, 1]]],
      [[64, 4, [1, 1]]],
      [[128, 4, [1, 1]]],
      [[256, 4, [1, 1]]],
      [[512, 4, [1, 1]]],
      [[1024, 4, [1, 1]]],
    ],
  },
  {
    fieldName: 'num_units_per_dense_layer',
    options: [
      [],
      [64],
      [128],
      [256],
      [512],
      [1024],
      [2048],
      [48, 24, 12],
      [96, 48, 24],
      [4084],
      [2048, 1024],
      [2048, 1024, 512],
    ],
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
    max: 0.0025,
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
    min: 0.85,
    max: 0.99,
  },
  {
    fieldName: 'num_episodes',
    min: 2000,
    max: 10000,
    q: 1,
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
    min: 64,
    max: 32768,
    q: 2,
  },
  {
    fieldName: 'replay_period',
    min: 1,
    max: 10,
    q: 1,
  },
  {
    fieldName: 'replay_batch_size',
    options: [1, 2, 4, 8, 16, 32, 64],
  },
  {
    fieldName: 'ema_beta',
    min: 0.95,
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
    options: [true, false],
  },
];

const DynamicForm: React.FC<DynamicFormProps> = ({ onSubmit, disabled }) => {
  const [formFields, setFormFields] =
    useState<IAddFormField[]>(DefaultFormProps);

  const form = useForm<any>({
    defaultValues: {},
  });

  useEffect(() => {
    formFields.forEach((field) => {
      handleFieldAdded(field);
    });
  }, []);

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'fields',
  });

  const handleFieldAdded = (data: IAddFormField) => {
    append(data.fieldName);
    setFormFields((prev) => [...prev, data]);
  };

  const handleFieldRemoved = (index: number) => {
    remove(index);
    setFormFields((prev) => prev.filter((_, i) => i !== index));
  };

  const renderField = (
    field: ControllerRenderProps<any, any>,
    index: number,
  ) => {
    switch (formFields[index].type) {
      case 'bool':
        return (
          <Checkbox checked={field.value} onCheckedChange={field.onChange} />
        );

      case 'text':
        return <Input {...field}></Input>;

      case 'number':
        return <Input type="number" {...field}></Input>;

      default:
        return null;
    }
  };

  return (
    <div>
      <Form {...form}>
        {fields.length === 0 && (
          <div className="px-3 border-dashed border-gray-300 border py-2 flex items-center justify-center">
            <p className="text-center">No fields added</p>
          </div>
        )}

        {fields.map((field, index) => {
          return (
            <FormField
              control={form.control}
              key={field.id}
              name={`fields[${index}]`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{formFields[index].fieldName}</FormLabel>
                  <FormControl>{renderField(field, index)}</FormControl>

                  <button onClick={() => handleFieldRemoved(index)}>
                    <X />
                  </button>
                </FormItem>
              )}
            />
          );
        })}
      </Form>

      <div className="my-4" />

      <AddFormFieldModal
        onSubmit={(data) => {
          console.log(data);
          handleFieldAdded(data);
        }}
      />
    </div>
  );
};

export default DynamicForm;
