'use client';
import React, { useEffect } from 'react';
import { Form, FormField, FormItem, FormLabel, FormMessage } from './ui/form';
import { ControllerRenderProps, useFieldArray, useForm } from 'react-hook-form';
import * as z from 'zod';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { IChoice, ISearchSpaceChoice, useStore } from '@/store';
import { observer } from 'mobx-react-lite';
import {
  Select,
  SelectItem,
  SelectContent,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { getSnapshot } from 'mobx-state-tree';

export const formSchema = z.object({
  layers: z.number({
    required_error: 'Layers is required',
  }),
  neuronsPerLayer: z.array(
    z.number({
      required_error: 'Neurons per layer is required',
    }),
  ),
  epsilonMin: z
    .number({ required_error: 'Epsilon min is required' })
    .min(0, 'Epsilon min must be between 0 and 1')
    .max(1, 'Epsilon min must be between 0 and 1'),
  epsilonMax: z
    .number({
      required_error: 'Epsilon max is required',
    })
    .min(0, 'Epsilon max must be between 0 and 1')
    .max(1, 'Epsilon max must be between 0 and 1'),
  epsilonStep: z.number({
    required_error: 'Epsilon step is required',
  }),
  learningRateMin: z
    .number({
      required_error: 'Learning rate min is required',
    })
    .min(0, 'Learning rate must be between 0 and 1')
    .max(1, 'Learning rate must be between 0 and 1'),
  learningRateMax: z
    .number()
    .min(0)
    .max(1, 'Learning rate must be between 0 and 1'),
  learningRateStep: z.number({
    required_error: 'Learning rate step is required',
  }),
});

interface HypFormProps {
  onSubmit: (data: z.infer<typeof formSchema>) => void;
  disabled?: boolean;
}

const InitialPointsForm: React.FC<HypFormProps> = observer(
  ({ onSubmit, disabled }) => {
    const store = useStore(null);
    const { hyperparameters, searchSpace, initialPoint } = store;
    console.log(getSnapshot(store));

    const form = useForm<any>({
      defaultValues: {
        x: initialPoint.choices.map((choice, index) => {
          if (hyperparameters.formFields.at(index)?.hpType === 'choice') {
            return choice.value.key;
          } else {
            return choice.value;
          }
        }),
      },
    });

    const { fields, append, remove } = useFieldArray({
      control: form.control,
      name: 'x',
    });

    useEffect(() => {
      append(hyperparameters.formFields);
    }, []);

    const renderOptionPoint = (
      field: ControllerRenderProps<any, any>,
      index: number,
    ) => {
      const associatedField = hyperparameters.formFields.at(index);
      const options = searchSpace.options.at(index) as ISearchSpaceChoice;

      if (!associatedField || options?.choices === undefined) {
        console.log('no associated field for index', index);
        return <></>;
      }

      return (
        <FormItem>
          <FormLabel>{associatedField.fieldName}</FormLabel>
          <Select onValueChange={field.onChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select an option"></SelectValue>
            </SelectTrigger>
            <SelectContent>
              {...options.choices?.map((option: IChoice, index) => {
                return (
                  <SelectItem key={index} value={option.key}>
                    {option.value}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </FormItem>
      );
    };

    const renderNumberPoint = (
      field: ControllerRenderProps<any, any>,
      index: number,
    ) => {
      const associatedField = hyperparameters.formFields.at(index);

      if (!associatedField) {
        console.log('no associated field for index', index);
        return <></>;
      }

      return (
        <FormItem>
          <FormLabel>{associatedField.fieldName}</FormLabel>
          <Input type="number" {...field} />
        </FormItem>
      );
    };

    return (
      <div>
        <Form {...form}>
          {hyperparameters.formFields.map((field, index) => {
            if (!fields[index]) {
              return <></>;
            }

            return (
              <FormField
                key={fields[index].id}
                control={form.control}
                name={`x[${index}]`}
                render={({ field }) => {
                  const associatedField = hyperparameters.formFields.at(index);

                  if (!associatedField) {
                    console.log('no associated field for index', index);
                    return <></>;
                  }

                  switch (associatedField.hpType) {
                    case 'choice':
                      return renderOptionPoint(field, index);
                    case 'uniform':
                      return renderNumberPoint(field, index);
                    case 'quniform':
                      return renderNumberPoint(field, index);
                    default:
                      return <></>;
                  }
                }}
              />
            );
          })}
        </Form>
      </div>
    );
  },
);

export default InitialPointsForm;
