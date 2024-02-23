import { EHyperparameterDataType, EHyperparameterParameterType } from '@/types';
import {
  Instance,
  SnapshotIn,
  SnapshotOrInstance,
  types,
} from 'mobx-state-tree';

const HyperparameterParameterType = types.enumeration(
  'HyperparameterParameterType',
  Object.values(EHyperparameterParameterType),
);

const HyperparameterDataType = types.enumeration(
  'HyperparameterDataType',
  Object.values(EHyperparameterDataType),
);

export const Option = types
  .model('Option', {
    id: types.identifier,
    value: types.union(
      types.number,
      types.string,
      types.boolean,
      types.frozen(), // fallback type
    ),
  })
  .actions((self) => ({
    setValue(value: any) {
      self.value = value;
    },
  }));

export type IOption = Instance<typeof Option>;

export const Options = types
  .model('Options', {
    type: types.literal('options'),
    optionMap: types.map(Option),
    selectedValue: types.string,
  })
  .actions((self) => ({
    setSelectedValue(key: string) {
      self.selectedValue = key;
    },
    addOption(key: string, value: any) {
      self.optionMap.set(key, { id: key, value });
    },
    removeOption(key: string) {
      self.optionMap.delete(key);
    },
  }));

export type IOptions = Instance<typeof Options>;

export const Uniform = types
  .model('Uniform', {
    type: types.literal('uniform'),
    min: types.number,
    max: types.number,
    selectedValue: types.number,
  })
  .actions((self) => ({
    setUniformValue(value: number) {
      self.selectedValue = value;
    },
    setMin(value: number) {
      self.min = value;
    },
    setMax(value: number) {
      self.max = value;
    },
  }));

export type IUniform = Instance<typeof Uniform>;

export const QUniform = types
  .model('QUniform', {
    type: types.literal('quniform'),
    min: types.number,
    max: types.number,
    q: types.number,
    selectedValue: types.number,
  })
  .actions((self) => ({
    setQUniformValue(value: number) {
      self.selectedValue = value;
    },
    setMin(value: number) {
      self.min = value;
    },
    setMax(value: number) {
      self.max = value;
    },
    setQ(value: number) {
      self.q = value;
    },
  }));

export type IQUniform = Instance<typeof QUniform>;

export const Hyperparameter = types.model('Hyperparameter', {
  name: types.identifier,
  parameterType: HyperparameterParameterType,
  dataType: HyperparameterDataType,
  array: false,
  searchSpace: types.union(Uniform, Options, QUniform),
});

export type IHyperparameter = Instance<typeof Hyperparameter>;

export const StagingArea = types
  .model('StagingArea', {
    hyperparameters: types.map(Hyperparameter),
  })
  .actions((self) => ({
    addHyperparameter(hyperparameter: SnapshotIn<typeof Hyperparameter>) {
      self.hyperparameters.put(hyperparameter);
    },
    removeHyperparameter(name: string) {
      self.hyperparameters.delete(name);
    },
  }));

export type IStagingArea = Instance<typeof StagingArea>;
