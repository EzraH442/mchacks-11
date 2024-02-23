'use client';
import React, { useEffect } from 'react';
import { Form, FormField, FormItem, FormLabel, FormMessage } from './ui/form';
import { ControllerRenderProps, useFieldArray, useForm } from 'react-hook-form';
import * as z from 'zod';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { useStore } from '@/store';
import { observer } from 'mobx-react-lite';
import {
  Select,
  SelectItem,
  SelectContent,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { getSnapshot } from 'mobx-state-tree';
import { IOptions, IQUniform, IUniform } from '@/models/StagingArea';

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
    const { stagingArea } = useStore(null);

    const form = useForm<any>({
      defaultValues: {
        x: [],
      },
    });

    const { fields, append, remove } = useFieldArray({
      control: form.control,
      name: 'x',
    });

    const keys = Array.from(stagingArea.hyperparameters.keys());

    const formatValues = (values: any) => {
      if (values === undefined) {
        return 'Select an option';
      }
      if (typeof values === 'boolean') {
        return values ? 'true' : 'false';
      }
      if (typeof values === 'object') {
        return JSON.stringify(values);
      }
      return values;
    };

    const renderOptionPoint = (parameterName: string) => {
      const ss = stagingArea.hyperparameters.get(parameterName)
        ?.searchSpace as IOptions;
      return (
        <FormItem>
          <FormLabel>{parameterName}</FormLabel>
          <Select
            value={ss.selectedValue ?? ''}
            onValueChange={(v) => ss.setSelectedValue(v)}
          >
            <SelectTrigger>
              {formatValues(ss.optionMap.get(ss.selectedValue)?.value)}
            </SelectTrigger>
            <SelectContent>
              {Array.from(ss.optionMap.entries()).map(([k, v]) => {
                return (
                  <SelectItem key={k} value={v.id}>
                    {formatValues(v.value)}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </FormItem>
      );
    };

    const renderNumberPoint = (parameterName: string) => {
      const ss = stagingArea.hyperparameters.get(parameterName)
        ?.searchSpace as IUniform;

      return (
        <FormItem>
          <FormLabel>{parameterName}</FormLabel>
          <Input
            type="number"
            defaultValue={ss?.selectedValue}
            onChange={(e) => ss?.setUniformValue(e.target.valueAsNumber)}
          />
        </FormItem>
      );
    };

    return (
      <div>
        <Form {...form}>
          {keys.map((name, index) => {
            return (
              <FormField
                key={name}
                control={form.control}
                name={`x[${index}]`}
                render={({ field }) => {
                  const entry = stagingArea.hyperparameters.get(name);

                  switch (entry?.parameterType) {
                    case 'choice':
                      return renderOptionPoint(name);
                    case 'uniform':
                      return renderNumberPoint(name);
                    case 'quniform':
                      return renderNumberPoint(name);
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
