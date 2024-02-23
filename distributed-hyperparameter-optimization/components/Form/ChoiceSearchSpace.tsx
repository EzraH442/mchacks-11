import { IChoice, ISearchSpaceChoice, useStore } from '@/store';
import { ControllerRenderProps } from 'react-hook-form';
import { FormItem, FormLabel } from '../ui/form';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { X } from 'lucide-react';
import { EHyperparameterDataType } from '@/types';
import { Checkbox } from '../ui/checkbox';
import { observer } from 'mobx-react-lite';
import React from 'react';

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

interface IInputChoiceProps {
  choice: IChoice;
}

const InputNumberChoice: React.FC<IInputChoiceProps> = ({ choice }) => {
  return (
    <Input
      type="number"
      step="any"
      defaultValue={choice.value}
      onChange={(e) => {
        choice.setValue(e.target.valueAsNumber);
      }}
    />
  );
};

const InputStringChoice: React.FC<IInputChoiceProps> = ({ choice }) => {
  return (
    <Input
      type="text"
      defaultValue={choice.value}
      onChange={(e) => {
        console.log('shit', e.target.value);
        choice.setValue(e.target.value);
      }}
    />
  );
};

const InputBoolChoice: React.FC<IInputChoiceProps> = ({ choice }) => {
  return (
    <Checkbox
      defaultChecked={choice.value}
      onCheckedChange={(e) => {
        choice.setValue(e === true ? true : false);
      }}
    />
  );
};

interface IChoiceSearchSpaceProps {
  index: number;
  type: EHyperparameterDataType;
  array?: boolean;
}

const ChoiceSearchSpace: React.FC<IChoiceSearchSpaceProps> = observer(
  ({ index, type, array }) => {
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
          return <InputNumberChoice choice={choice} key={choice.key} />;
        case EHyperparameterDataType.TEXT:
          return <InputStringChoice choice={choice} key={choice.key} />;
        case EHyperparameterDataType.BOOL:
          return <InputBoolChoice choice={choice} key={choice.key} />;
      }
    };

    return (
      <FormItem>
        <FormLabel>{hyperparameters.formFields.at(index)?.fieldName}</FormLabel>
        <div>
          {options.choices.map((choice, i) => {
            return (
              <div key={choice.key} className={getDivStyle()}>
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
