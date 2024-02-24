import { useMemo } from 'react';
import {
  Instance,
  types,
  SnapshotIn,
  SnapshotOut,
  applySnapshot,
} from 'mobx-state-tree';
import {
  DefaultFormProps,
  DefaultInitialPoint,
  DefaultSearchSpace,
  EHyperparameterParameterType,
} from './types';
import { v4 } from 'uuid';
import {
  Hyperparameter,
  IHyperparameter,
  Options,
  QUniform,
  StagingArea,
  Uniform,
} from './models/StagingArea';
import { Training } from './models/Training';

let store: IStore | undefined;

const Store = types.model('Store', {
  stagingArea: StagingArea,
  training: Training,
});

export type IStore = Instance<typeof Store>;
export type IStoreSnapshotIn = SnapshotIn<typeof Store>;
export type IStoreSnapshotOut = SnapshotOut<typeof Store>;

const initializeSearchSpace = (
  index: number,
  fieldName: string,
  type: string,
) => {
  switch (type) {
    case EHyperparameterParameterType.CHOICE: {
      const optionMap: Record<string, { id: string; value: any }> = {};
      const selectedOptionValue = DefaultInitialPoint[fieldName]?.value;

      let selectedOptionKey;

      DefaultSearchSpace.at(index)?.options?.forEach((o) => {
        const id = v4();
        optionMap[id] = { id, value: o };
        if (o === selectedOptionValue) {
          selectedOptionKey = id;
        }
      });

      return Options.create({
        type: 'options',
        optionMap: optionMap,
        selectedValue: selectedOptionKey ?? Object.keys(optionMap)[0] ?? 'none',
      });
    }
    case EHyperparameterParameterType.UNIFORM: {
      const d = DefaultSearchSpace[index];
      const defaultValue = DefaultInitialPoint[fieldName];

      return Uniform.create({
        type: 'uniform',
        min: d.min!,
        max: d.max!,
        selectedValue: defaultValue,
      });
    }
    case EHyperparameterParameterType.QUNIFORM: {
      const d = DefaultSearchSpace[index];
      const defaultValue = DefaultInitialPoint[fieldName];

      return QUniform.create({
        type: 'quniform',
        min: d.min!,
        max: d.max!,
        q: d.q!,
        selectedValue: defaultValue,
      });
    }
  }
};

export function initializeStore(snapshot = null) {
  const _hps: Record<string, IHyperparameter> = {};

  Object.entries(DefaultFormProps).forEach(([fieldName, v], index) => {
    _hps[v.fieldName] = Hyperparameter.create({
      name: v.fieldName,
      parameterType: v.hpType,
      dataType: v.type,
      array: v.array,
      searchSpace: initializeSearchSpace(index, v.fieldName, v.hpType),
    });
  });

  const _store =
    store ??
    Store.create({
      stagingArea: {
        hyperparameters: _hps,
        training: {
          workers: {},
          batches: [],
          workerBatchMap: {},
          currentlyTraining: false,
        },
      },
    });

  // If your page has Next.js data fetching methods that use a Mobx store, it will
  // get hydrated here, check `pages/ssg.tsx` and `pages/ssr.tsx` for more details
  if (snapshot) {
    applySnapshot(_store, snapshot);
  }
  // For SSG and SSR always create a new store
  if (typeof window === 'undefined') return _store;
  // Create the store once in the client
  if (!store) store = _store;

  return store;
}

export function useStore(initialState: any) {
  const store = useMemo(() => initializeStore(initialState), [initialState]);
  return store;
}
