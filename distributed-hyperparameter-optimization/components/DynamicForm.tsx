import { ControllerRenderProps, useFieldArray, useForm } from 'react-hook-form';
import AddFormFieldModal, { IAddFormField } from './AddFormFieldModal';
import { Form, FormControl, FormField, FormItem, FormLabel } from './ui/form';
import { useCallback, useEffect, useState } from 'react';
import { Checkbox } from './ui/checkbox';
import { Input } from './ui/input';
import { X } from 'lucide-react';
import {
  ISearchSpaceChoice,
  ISearchSpaceQUniform,
  ISearchSpaceUniform,
  useStore,
} from '@/store';
import { observer } from 'mobx-react-lite';
import { applySnapshot, getSnapshot } from 'mobx-state-tree';
import { toast } from './ui/use-toast';
import { EHyperparameterDataType, EHyperparameterParameterType } from '@/types';
import { Button } from './ui/button';
import ChoiceSearchSpace from './Form/ChoiceSearchSpace';

interface DynamicFormProps {
  onSubmit: (data: any) => void;
  disabled?: boolean;
}

const DynamicForm: React.FC<DynamicFormProps> = observer(
  ({ onSubmit, disabled }) => {
    const store = useStore(null);
    const { hyperparameters, searchSpace } = store;

    const form = useForm<any>({
      defaultValues: {
        fields: [],
      },
    });

    const { fields, append, remove } = useFieldArray({
      control: form.control,
      name: 'fields',
    });

    useEffect(() => {
      append(hyperparameters.formFields);
    }, []);

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

    const handleFieldRemoved = (index: number) => {
      const field = hyperparameters.formFields.at(index);
      if (!field) {
        return;
      }
      store.removeHyperparameter(field.fieldName);
      remove(index);
    };

    const handleChoiceRemoved = (index: number, choiceIndex: number) => {
      store.removeHyperparameterChoice(index, choiceIndex);
    };
    const renderUniformSearchSpace = (
      field: ControllerRenderProps<any, any>,
      index: number,
    ) => {
      const options = searchSpace.options.at(index) as ISearchSpaceUniform;

      if (!options) {
        return <p>error rendering D</p>;
      }

      return (
        <FormItem>
          <FormLabel>
            {hyperparameters.formFields.at(index)?.fieldName}
          </FormLabel>
          <div>
            <p>min:</p>
            <Input
              // type="number"
              value={options.min}
              onChange={(e) => {
                options.setMin(e.target.valueAsNumber);
              }}
            />
            <p>max:</p>
            <Input
              type="number"
              value={options.max}
              onChange={(e) => {
                options.setMax(e.target.valueAsNumber);
              }}
            />
          </div>
          <Button
            variant="destructive"
            onClick={() => handleFieldRemoved(index)}
          >
            Remove Field
          </Button>
        </FormItem>
      );
    };

    const renderQUniformSearchSpace = (
      field: ControllerRenderProps<any, any>,
      index: number,
    ) => {
      const options = searchSpace.options.at(index) as ISearchSpaceQUniform;

      if (!options) {
        return <p>error rendering E</p>;
      }

      return (
        <FormItem>
          <FormLabel>
            {hyperparameters.formFields.at(index)?.fieldName}
          </FormLabel>
          <div>
            <p>min:</p>
            <Input
              type="number"
              value={options.min}
              onChange={(e) => {
                options.setMin(e.target.valueAsNumber);
              }}
            />
            <p>max:</p>
            <Input
              type="number"
              value={options.max}
              onChange={(e) => {
                options.setMax(e.target.valueAsNumber);
              }}
            />
            <p>q</p>
            <Input
              type="number"
              value={options.q}
              onChange={(e) => {
                options.setQ(e.target.valueAsNumber);
              }}
            />
          </div>
          <Button
            variant="destructive"
            onClick={() => handleFieldRemoved(index)}
          >
            Remove Field
          </Button>
        </FormItem>
      );
    };

    console.log('fields', fields);
    return (
      <div>
        <Form {...form}>
          {fields.length === 0 && (
            <div className="px-3 border-dashed border-gray-300 border py-2 flex items-center justify-center">
              <p className="text-center">No fields added</p>
            </div>
          )}

          {hyperparameters.formFields.map((field, index) => {
            if (!fields[index]) return <></>;

            return (
              <FormField
                control={form.control}
                key={fields[index].id}
                name={`fields[${index}]`}
                render={
                  ({ field }) => {
                    const associatedField =
                      hyperparameters.formFields.at(index);

                    if (!associatedField) {
                      console.log('no associated field for index', index);
                      return <></>;
                    }

                    switch (associatedField.hpType) {
                      case EHyperparameterParameterType.CHOICE:
                        return (
                          <ChoiceSearchSpace
                            field={field}
                            index={index}
                            type={EHyperparameterDataType.TEXT}
                          />
                        );
                      case EHyperparameterParameterType.UNIFORM:
                        return renderUniformSearchSpace(field, index);
                      case EHyperparameterParameterType.QUNIFORM:
                        return renderQUniformSearchSpace(field, index);
                    }

                    return <p>error rendering {field.name}</p>;
                  }
                  // (
                  //   <FormItem>
                  //     <FormLabel>
                  //       {hyperparameters.formFields.at(index)?.fieldName}
                  //     </FormLabel>
                  //     <FormControl>{renderField(field, index)}</FormControl>

                  //     <button onClick={() => handleFieldRemoved(index)}>
                  //       <X />
                  //     </button>
                  //   </FormItem>
                  // )
                }
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
