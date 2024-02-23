'use client';
import React, { useEffect } from 'react';
import { Form, FormField, FormItem, FormLabel, FormMessage } from './ui/form';
import { useFieldArray, useForm } from 'react-hook-form';
import * as z from 'zod';
import { Input } from './ui/input';
import { Button } from './ui/button';
import DynamicForm from './DynamicForm';

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

const SearchSpaceForm: React.FC<HypFormProps> = ({ onSubmit, disabled }) => {
  const form = useForm<z.infer<typeof formSchema>>({
    defaultValues: {
      layers: 1,
      neuronsPerLayer: [128],
      epsilonMin: 0.1,
      epsilonMax: 1,
      epsilonStep: 0.1,
      learningRateMin: 0.02,
      learningRateMax: 0.1,
      learningRateStep: 0.02,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    //@ts-ignore
    name: 'neuronsPerLayer',
  });

  const layers = form.watch('layers');
  useEffect(() => {
    if (layers) {
      if (layers > fields.length) {
        for (let i = fields.length; i < layers; i++) {
          append({ id: i, neuronsPerLayer: 128 });
        }
      } else if (layers < fields.length) {
        for (let i = fields.length; i > layers; i--) {
          remove(i - 1);
        }
      }
    }
  }, [append, fields.length, layers, remove]);

  return (
    <div>
      <DynamicForm onSubmit={onSubmit} disabled={disabled} />

      <div className="mt-6 mb-2 border border-gray-300"></div>
      <Button disabled={disabled} onClick={form.handleSubmit(onSubmit)}>
        Add Parameters
      </Button>
    </div>
  );
};

export default SearchSpaceForm;
