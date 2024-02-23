import { IChoice, ISearchSpaceChoice, useStore } from '@/store';
import { ControllerRenderProps } from 'react-hook-form';
import { FormItem, FormLabel } from '../ui/form';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { X } from 'lucide-react';
import { EHyperparameterDataType } from '@/types';
import { Checkbox } from '../ui/checkbox';
import { observer } from 'mobx-react-lite';

const determineDefaultChoiceValue = (type: EHyperparameterDataType) => {
  switch (type) {
    case EHyperparameterDataType.NUMBER:
      return 0;
    case EHyperparameterDataType.BOOL:
      return true;
    case EHyperparameterDataType.TEXT:
      return '';
  }
};

const InputNumberChoice = (props: { choice: IChoice }) => {
  return (
    <Input
      type="number"
      value={props.choice.value}
      onChange={(e) => {
        props.choice.setValue(e.target.valueAsNumber);
      }}
    />
  );
};

const InputStringChoice = (props: { choice: IChoice }) => {
  return (
    <Input
      type="text"
      value={props.choice.value}
      onChange={(e) => {
        props.choice.setValue(e.target.value);
      }}
    />
  );
};

const InputBoolChoice = (props: { choice: IChoice }) => {
  return (
    <Checkbox
      checked={props.choice.value}
      onCheckedChange={(e) => {
        props.choice.setValue(e === true ? true : false);
      }}
    />
  );
};

const ChoiceSearchSpace = observer(
  ({ index, type }: { index: number; type: EHyperparameterDataType }) => {
    const store = useStore(null);
    const { searchSpace, hyperparameters } = store;
    const options = searchSpace.options.at(index) as ISearchSpaceChoice;

    if (!options) {
      return <p>error rendering A</p>;
    }

    const handleFieldRemoved = (index: number) => {
      store.removeHyperparameterIndex(index);
    };

    const getDivStyle = () => {
      if (
        type === EHyperparameterDataType.NUMBER ||
        type === EHyperparameterDataType.TEXT
      ) {
        return 'flex space-x-2 my-1';
      } else {
        return 'flex justify-between my-1 space-y-0';
      }
    };

    const getInputElement = (index: number, choice: IChoice) => {
      switch (type) {
        case EHyperparameterDataType.NUMBER:
          return <InputNumberChoice choice={choice} />;
        case EHyperparameterDataType.TEXT:
          return <InputStringChoice choice={choice} />;
        case EHyperparameterDataType.BOOL:
          return <InputBoolChoice choice={choice} />;
      }
    };

    return (
      <FormItem>
        <FormLabel>{hyperparameters.formFields.at(index)?.fieldName}</FormLabel>
        <div>
          {options.choices.map((choice, i) => {
            return (
              <div key={i} className={getDivStyle()}>
                {getInputElement(i, choice)}
                <button
                  onClick={() => store.removeHyperparameterChoice(index, i)}
                >
                  <X size={16} />
                </button>
              </div>
            );
          })}
          <Button
            variant="secondary"
            onClick={() => options.addChoice(determineDefaultChoiceValue(type))}
          >
            Add choice
          </Button>
        </div>
        <Button variant="destructive" onClick={() => handleFieldRemoved(index)}>
          Remove Field
        </Button>
      </FormItem>
    );
  },
);

export default ChoiceSearchSpace;
