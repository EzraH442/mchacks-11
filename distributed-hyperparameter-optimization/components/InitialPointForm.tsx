'use client';
import React, { useEffect } from 'react';
import { Form, FormField, FormItem, FormLabel, FormMessage } from './ui/form';
import { useFieldArray, useForm } from 'react-hook-form';
import * as z from 'zod';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { useStore } from '@/store';
import { observer } from 'mobx-react-lite';

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
    const { hyperparameters, searchSpace } = store;

    const form = useForm<any>({
      defaultValues: {},
    });

    const { fields, append, remove } = useFieldArray({
      control: form.control,
      name: 'x',
    });

    useEffect(() => {
      append(hyperparameters.formFields);
    }, [hyperparameters.formFields, append]);

    return (
      <div>
        <Form {...form}>
          <div>fom</div>
        </Form>
      </div>
    );
  },
);

export default InitialPointsForm;
