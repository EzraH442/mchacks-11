'use client';
import React, { useEffect } from 'react';
import { Form, FormField, FormItem, FormLabel, FormMessage } from './ui/form';
import { useFieldArray, useForm } from 'react-hook-form';
import * as z from 'zod';
import { Input } from './ui/input';
import { Button } from './ui/button';

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
}

const HypForm: React.FC<HypFormProps> = ({ onSubmit }) => {
  const form = useForm<z.infer<typeof formSchema>>({
    defaultValues: {
      layers: 1,
      neuronsPerLayer: [128],
      epsilonMin: 0,
      epsilonMax: 1,
      epsilonStep: 0.1,
      learningRateMin: 0.001,
      learningRateMax: 0.01,
      learningRateStep: 0.001,
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
      <Form {...form}>
        <FormField
          control={form.control}
          name="layers"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Layers</FormLabel>
              <Input {...field} type="number" />
              <FormMessage />
            </FormItem>
          )}
        />
        {fields.map((field, i) => (
          <FormField
            key={field.id}
            control={form.control}
            name={`neuronsPerLayer.${i}`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Neurons in layer {i + 1}</FormLabel>
                <Input {...field} type="number" />
                <FormMessage />
              </FormItem>
            )}
          />
        ))}
        <FormField
          control={form.control}
          name="epsilonMin"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Epsilon min</FormLabel>
              <Input {...field} type="number" />
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="epsilonMax"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Epsilon max</FormLabel>
              <Input {...field} type="number" />
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="epsilonStep"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Epsilon step</FormLabel>
              <Input {...field} type="number" />
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="learningRateMin"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Learning rate min</FormLabel>
              <Input {...field} type="number" />
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="learningRateMax"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Learning rate max</FormLabel>
              <Input {...field} type="number" />
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="learningRateStep"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Learning rate step</FormLabel>
              <Input {...field} type="number" />
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="my-4" />
        <Button onClick={form.handleSubmit(onSubmit)}>Add Parameters</Button>
      </Form>
    </div>
  );
};

export default HypForm;
