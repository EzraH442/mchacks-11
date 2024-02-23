import { useFieldArray, useForm } from 'react-hook-form';
import AddFormFieldModal, { IAddFormField } from './AddFormFieldModal';
import { Form, FormField } from './ui/form';
import { useEffect } from 'react';
import { useStore } from '@/store';
import { observer } from 'mobx-react-lite';
import { applySnapshot, getSnapshot } from 'mobx-state-tree';
import { toast } from './ui/use-toast';
import { EHyperparameterDataType, EHyperparameterParameterType } from '@/types';
import ChoiceSearchSpace from './Form/ChoiceSearchSpace';
import UniformSearchSpace from './Form/UniformSearchSpace';
import QUniformSearchSpace from './Form/QUniformSearchSpace';

interface DynamicFormProps {
  onSubmit: (data: any) => void;
  disabled?: boolean;
}

const DynamicForm: React.FC<DynamicFormProps> = observer(
  ({ onSubmit, disabled }) => {
    const store = useStore(null);
    const { hyperparameters } = store;

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
                render={({ field }) => {
                  const associatedField = hyperparameters.formFields.at(index);

                  if (!associatedField) {
                    console.log('no associated field for index', index);
                    return <></>;
                  }

                  switch (associatedField.hpType) {
                    case EHyperparameterParameterType.CHOICE:
                      return (
                        <ChoiceSearchSpace
                          index={index}
                          type={associatedField.type}
                          array={associatedField.array}
                        />
                      );
                    case EHyperparameterParameterType.UNIFORM:
                      return <UniformSearchSpace index={index} />;
                    case EHyperparameterParameterType.QUNIFORM:
                      return <QUniformSearchSpace index={index} />;
                  }
                }}
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
