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
import { formatValues } from '@/lib/utils';

interface HypFormProps {
  onSubmit: (data: any) => void;
  disabled?: boolean;
}

const OptionPoint: React.FC<{
  hyperparameterName: string;
  optionId: string;
}> = observer(({ hyperparameterName, optionId }) => {
  const { stagingArea } = useStore(null);
  const ss = stagingArea.hyperparameters.get(hyperparameterName)
    ?.searchSpace as IOptions;
  return (
    <FormItem>
      <FormLabel>{hyperparameterName}</FormLabel>
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
});

const NumberPoint: React.FC<{
  hyperparameterName: string;
}> = observer(({ hyperparameterName }) => {
  const { stagingArea } = useStore(null);
  const ss = stagingArea.hyperparameters.get(hyperparameterName)
    ?.searchSpace as IQUniform;

  return (
    <FormItem>
      <FormLabel>{hyperparameterName}</FormLabel>
      <Input
        type="number"
        defaultValue={ss?.selectedValue}
        onChange={(e) => ss?.setQUniformValue(e.target.valueAsNumber)}
      />
    </FormItem>
  );
});

const InitialPointsForm: React.FC<HypFormProps> = observer(
  ({ onSubmit, disabled }) => {
    const { stagingArea } = useStore(null);

    const form = useForm<any>({
      defaultValues: {
        x: [],
      },
    });

    const keys = Array.from(stagingArea.hyperparameters.keys());

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
                      return (
                        <OptionPoint
                          hyperparameterName={name}
                          optionId={name}
                        />
                      );
                    case 'uniform':
                      return <NumberPoint hyperparameterName={name} />;
                    case 'quniform':
                      return <NumberPoint hyperparameterName={name} />;
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
