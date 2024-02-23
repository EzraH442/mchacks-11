import { ControllerRenderProps, useFieldArray, useForm } from 'react-hook-form';
import AddFormFieldModal, { IAddFormField } from './AddFormFieldModal';
import { Form, FormControl, FormField, FormItem, FormLabel } from './ui/form';
import { useCallback, useEffect, useState } from 'react';
import { Checkbox } from './ui/checkbox';
import { Input } from './ui/input';
import { X } from 'lucide-react';
import {
  ISearchSpaceBoolChoice,
  ISearchSpaceNumberChoice,
  ISearchSpaceQUniform,
  ISearchSpaceStringChoice,
  ISearchSpaceUniform,
  useStore,
} from '@/store';
import { observer } from 'mobx-react-lite';
import { applySnapshot, getSnapshot } from 'mobx-state-tree';
import { toast } from './ui/use-toast';
import { EHyperparameterDataType, EHyperparameterParameterType } from '@/types';
import { Button } from './ui/button';

interface DynamicFormProps {
  onSubmit: (data: any) => void;
  disabled?: boolean;
}

const DynamicForm: React.FC<DynamicFormProps> = observer(
  ({ onSubmit, disabled }) => {
    const store = useStore(null);
    const { hyperparameters, searchSpace } = store;

    const form = useForm<any>({
      defaultValues: {},
    });

    const { fields, append, remove } = useFieldArray({
      control: form.control,
      name: 'fields',
    });

    useEffect(() => {
      append(hyperparameters.formFields);
    }, [hyperparameters.formFields, append]);

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

    const renderNumberChoiceSearchSpace = (
      field: ControllerRenderProps<any, any>,
      index: number,
    ) => {
      const options = searchSpace.options.at(index) as ISearchSpaceNumberChoice;

      if (!options) {
        return <p>error rendering A</p>;
      }

      return (
        <FormItem>
          <FormLabel>
            {hyperparameters.formFields.at(index)?.fieldName}
          </FormLabel>
          <div>
            {...options.choices.map((choice, i) => {
              return (
                <div key={i} className="flex space-x-2 my-1">
                  <Input
                    type="number"
                    value={choice}
                    onChange={(e) => {
                      options.updateChoice(i, e.target.valueAsNumber);
                    }}
                  />
                  <button onClick={() => options.removeIndex(i)}>
                    <X size={16} />
                  </button>
                </div>
              );
            })}
            <Button variant="secondary" onClick={() => options.addChoice(0)}>
              Add choice
            </Button>
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

    const renderStringChoiceSearchSpace = (
      field: ControllerRenderProps<any, any>,
      index: number,
    ) => {
      const options = searchSpace.options.at(index) as ISearchSpaceStringChoice;

      if (!options) {
        return <p>error rendering B</p>;
      }

      return (
        <FormItem>
          <FormLabel>
            {hyperparameters.formFields.at(index)?.fieldName}
          </FormLabel>
          <div>
            {options.choices.map((choice, i) => {
              return (
                <div key={i} className="flex space-x-2 my-1">
                  <Input
                    value={choice}
                    onChange={(e) => {
                      options.updateChoice(i, e.target.value);
                    }}
                  />
                  <button onClick={() => options.removeIndex(i)}>
                    <X size={16} />
                  </button>
                </div>
              );
            })}
            <Button variant="secondary" onClick={() => options.addChoice('')}>
              Add choice
            </Button>
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

    const renderBooleanChoiceSearchSpace = (
      field: ControllerRenderProps<any, any>,
      index: number,
    ) => {
      const options = searchSpace.options.at(index) as ISearchSpaceBoolChoice;

      if (!options) {
        return <p>error rendering C</p>;
      }

      return (
        <FormItem>
          <FormLabel>
            {hyperparameters.formFields.at(index)?.fieldName}
          </FormLabel>
          <div>
            {options.choices.map((choice, i) => {
              return (
                <div key={i} className="flex justify-between my-1 space-y-0">
                  <Checkbox
                    checked={choice}
                    onCheckedChange={(e) => {
                      options.updateChoice(i, e === true ? true : false);
                    }}
                  />
                  <button onClick={() => options.removeIndex(i)}>
                    <X size={16} />
                  </button>
                </div>
              );
            })}
            <Button
              variant="secondary"
              onClick={() => options.addChoice(false)}
            >
              Add choice
            </Button>
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
                        if (
                          associatedField.type === EHyperparameterDataType.TEXT
                        ) {
                          return renderStringChoiceSearchSpace(field, index);
                        } else if (
                          associatedField.type ===
                          EHyperparameterDataType.NUMBER
                        ) {
                          return renderNumberChoiceSearchSpace(field, index);
                        } else if (
                          associatedField.type === EHyperparameterDataType.BOOL
                        ) {
                          return renderBooleanChoiceSearchSpace(field, index);
                        }
                        break;
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
