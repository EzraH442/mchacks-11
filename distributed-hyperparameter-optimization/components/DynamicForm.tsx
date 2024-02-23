import { ControllerRenderProps, useFieldArray, useForm } from 'react-hook-form';
import AddFormFieldModal, { IAddFormField } from './AddFormFieldModal';
import { Form, FormControl, FormField, FormItem, FormLabel } from './ui/form';
import { useCallback, useEffect, useState } from 'react';
import { Checkbox } from './ui/checkbox';
import { Input } from './ui/input';
import { X } from 'lucide-react';
import { useStore } from '@/store';
import { observer } from 'mobx-react-lite';
import { applySnapshot, getSnapshot } from 'mobx-state-tree';
import { toast } from './ui/use-toast';
import { EHyperparameterDataType } from '@/types';

interface DynamicFormProps {
  onSubmit: (data: any) => void;
  disabled?: boolean;
}

const DynamicForm: React.FC<DynamicFormProps> = observer(
  ({ onSubmit, disabled }) => {
    const store = useStore(null);
    console.log('store', getSnapshot(store));
    const { hyperparameters, searchSpace } = store;

    const form = useForm<any>({
      defaultValues: {},
    });

    const { fields, append, remove } = useFieldArray({
      control: form.control,
      name: 'fields',
    });

    const handleFieldAdded = (data: IAddFormField) => {
      const snapshot = getSnapshot(store);
      try {
        store.addHyperparameter(data);
        append(data);
      } catch (e) {
        console.error(e);
        toast({
          title: 'error adding field:',
          description: JSON.stringify(e),
        });
        applySnapshot(store, snapshot);
        remove(fields.length - 1);
      }
    };

    useEffect(() => {
      append(hyperparameters.formFields);
    }, [hyperparameters.formFields, append]);

    const handleFieldRemoved = (index: number) => {
      remove(index);
    };

    const renderField = (
      field: ControllerRenderProps<any, any>,
      index: number,
    ) => {
      const type = hyperparameters.formFields.at(index)?.type;
      if (!type) {
        return null;
      }

      switch (type) {
        case EHyperparameterDataType.BOOL:
          return (
            <Checkbox checked={field.value} onCheckedChange={field.onChange} />
          );

        case EHyperparameterDataType.TEXT:
          return <Input {...field}></Input>;

        case EHyperparameterDataType.NUMBER:
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
                    <FormLabel>
                      {hyperparameters.formFields.at(index)?.fieldName}
                    </FormLabel>
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
  },
);

export default DynamicForm;
