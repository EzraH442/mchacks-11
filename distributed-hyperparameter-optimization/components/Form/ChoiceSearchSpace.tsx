import { useStore } from '@/store';
import { ControllerRenderProps } from 'react-hook-form';
import { FormItem, FormLabel } from '../ui/form';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Plus, X } from 'lucide-react';
import { EHyperparameterDataType } from '@/types';
import { Checkbox } from '../ui/checkbox';
import { observer } from 'mobx-react-lite';
import React from 'react';
import { Hyperparameter, IOption, IOptions } from '@/models/StagingArea';
import { v4 } from 'uuid';
import { Separator } from '../ui/separator';

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
  option: IOption;
}

const InputNumberChoice: React.FC<IInputChoiceProps> = observer(
  ({ option }) => {
    return (
      <Input
        type="number"
        step="any"
        defaultValue={option.value}
        onChange={(e) => {
          option.setValue(e.target.valueAsNumber);
        }}
      />
    );
  },
);

const InputStringChoice: React.FC<IInputChoiceProps> = observer(
  ({ option }) => {
    return (
      <Input
        type="text"
        defaultValue={option.value}
        onChange={(e) => {
          option.setValue(e.target.value);
        }}
      />
    );
  },
);

const InputBoolChoice: React.FC<IInputChoiceProps> = observer(({ option }) => {
  return (
    <Checkbox
      defaultChecked={option.value}
      onCheckedChange={(e) => {
        option.setValue(e === true ? true : false);
      }}
    />
  );
});

interface IChoiceSearchSpaceProps {
  name: string;
  type: EHyperparameterDataType;
  array?: boolean;
}

const ChoiceSearchSpace: React.FC<IChoiceSearchSpaceProps> = observer(
  ({ name, type }) => {
    const { stagingArea } = useStore(null);
    const hp = stagingArea.hyperparameters.get(name);
    const ss = hp?.searchSpace as IOptions;

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

    const getInputElement = (option: IOption) => {
      switch (type) {
        case EHyperparameterDataType.NUMBER:
          return <InputNumberChoice option={option} />;
        case EHyperparameterDataType.TEXT:
          return <InputStringChoice option={option} />;
        case EHyperparameterDataType.BOOL:
          return <InputBoolChoice option={option} />;
      }
    };

    const keys = Array.from(ss.optionMap.keys());

    return (
      <FormItem>
        <FormLabel>{hp?.name}</FormLabel>
        <div>
          {keys.map((id, i) => {
            const option = ss.optionMap.get(id);
            if (!option) {
              console.error('option not found', id);
              return <></>;
            }
            return (
              <div key={id} className={getDivStyle()}>
                {getInputElement(option)}
                <button onClick={() => ss.removeOption(id)}>
                  <X size={16} />
                </button>
              </div>
            );
          })}
          <Button
            variant="outline"
            onClick={() =>
              ss.addOption(v4(), determineDefaultChoiceValue(type))
            }
          >
            <Plus size={16} /> Add option
          </Button>
        </div>
        <Separator orientation="horizontal" />
        <Button
          variant="destructive"
          onClick={() => stagingArea.removeHyperparameter(name)}
        >
          Remove Field
        </Button>
      </FormItem>
    );
  },
);

export default ChoiceSearchSpace;
