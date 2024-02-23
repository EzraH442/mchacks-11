import { useFieldArray, useForm } from 'react-hook-form';
import AddFormFieldModal, { IAddFormField } from './AddFormFieldModal';
import { Form, FormField } from './ui/form';
import { useEffect } from 'react';
import { useStore } from '@/store';
import { observer } from 'mobx-react-lite';
import { applySnapshot, getSnapshot } from 'mobx-state-tree';
import { toast } from './ui/use-toast';
import { EHyperparameterParameterType } from '@/types';
import ChoiceSearchSpace from './Form/ChoiceSearchSpace';
import UniformSearchSpace from './Form/UniformSearchSpace';
import QUniformSearchSpace from './Form/QUniformSearchSpace';
import { Options, QUniform, Uniform } from '@/models/StagingArea';

interface DynamicFormProps {
  onSubmit: (data: any) => void;
  disabled?: boolean;
}

const DynamicForm: React.FC<DynamicFormProps> = observer(
  ({ onSubmit, disabled }) => {
    const { stagingArea } = useStore(null);

    const form = useForm<any>({
      defaultValues: {
        fields: [],
      },
    });

    const handleFieldAdded = (data: IAddFormField) => {
      const snapshot = getSnapshot(stagingArea);
      try {
        let searchSpace;
        switch (data.hpType) {
          case EHyperparameterParameterType.CHOICE:
            searchSpace = Options.create({
              type: 'options',
              optionMap: {},
              selectedValue: '',
            });
            break;

          case EHyperparameterParameterType.UNIFORM:
            searchSpace = Uniform.create({
              type: 'uniform',
              min: 0,
              max: 1,
              selectedValue: 0.01,
            });
            break;

          case EHyperparameterParameterType.QUNIFORM:
            searchSpace = QUniform.create({
              type: 'quniform',
              min: 0,
              max: 10,
              q: 5,
              selectedValue: 5,
            });
            break;
        }

        stagingArea.addHyperparameter({
          name: data.fieldName,
          dataType: data.type,
          parameterType: data.hpType,
          searchSpace: searchSpace,
        });
      } catch (e) {
        console.error(e);
        toast({
          title: 'error adding field:',
          description: JSON.stringify(e),
        });
        applySnapshot(stagingArea, snapshot);
      }
    };

    const keys = Array.from(stagingArea.hyperparameters.keys());
    return (
      <div>
        <Form {...form}>
          {keys.length === 0 && (
            <div className="px-3 border-dashed border-gray-300 border py-2 flex items-center justify-center">
              <p className="text-center">No fields added</p>
            </div>
          )}

          {keys.map((fieldName, index) => {
            return (
              <FormField
                control={form.control}
                key={fieldName}
                name={`fields[${index}]`}
                render={({ field }) => {
                  const param = stagingArea.hyperparameters.get(fieldName);

                  if (!param) return <></>;

                  switch (param?.parameterType) {
                    case EHyperparameterParameterType.CHOICE:
                      return (
                        <ChoiceSearchSpace
                          name={param.name}
                          type={param.dataType}
                          array={param.array}
                        />
                      );
                    case EHyperparameterParameterType.UNIFORM:
                      return <UniformSearchSpace name={fieldName} />;
                    case EHyperparameterParameterType.QUNIFORM:
                      return <QUniformSearchSpace name={fieldName} />;
                  }
                }}
              />
            );
          })}
        </Form>

        <div className="my-4" />

        <AddFormFieldModal
          onSubmit={(data) => {
            handleFieldAdded(data);
          }}
        />
      </div>
    );
  },
);

export default DynamicForm;
