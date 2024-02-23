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
  DefaultSearchSpace,
  EHyperparameterDataType,
  EHyperparameterParameterType,
  IAddFormField,
} from './types';

let store: IStore | undefined;

const HyperparameterParameterType = types.enumeration(
  'HyperparameterParameterType',
  Object.values(EHyperparameterParameterType),
);

const HyperparameterDataType = types.enumeration(
  'HyperparameterDataType',
  Object.values(EHyperparameterDataType),
);

export const AddFormField = types.model('AddFormField', {
  fieldName: types.string,
  hpType: HyperparameterParameterType,
  type: HyperparameterDataType,
  array: false,
});

export const SearchSpaceNumberChoice = types.model('SearchSpaceNumberChoice', {
  fieldName: types.string,
  choices: types.array(types.number),
});

export const SearchSpaceBoolChoice = types.model('SearchSpaceBoolChoice', {
  fieldName: types.string,
  choices: types.array(types.boolean),
});

export const SearchSpaceStringChoice = types.model('SearchSpaceStringChoice', {
  fieldName: types.string,
  choices: types.array(types.string),
});

export const SearchSpaceUniform = types.model('SearchSpaceUniform', {
  fieldName: types.string,
  min: types.number,
  max: types.number,
});

export const SearchSpaceQUniform = types.model('SearchSpaceQUniform', {
  fieldName: types.string,
  min: types.number,
  max: types.number,
  q: types.number,
});

export const SearchSpaceOption = types.union(
  SearchSpaceNumberChoice,
  SearchSpaceBoolChoice,
  SearchSpaceStringChoice,
  SearchSpaceUniform,
  SearchSpaceQUniform,
);

export const SearchSpace = types
  .model('SearchSpace', {
    options: types.array(SearchSpaceOption),
  })
  .actions((self) => ({
    addChoice: (choice: any) => {
      self.options.push(choice);
    },
    removeChoice: (name: string) => {
      const i = self.options.findIndex((f) => f.fieldName === name);

      if (i !== -1) self.options.splice(i, 1);
    },
  }));

export type ISearchSpace = Instance<typeof SearchSpace>;

export const Hyperparameters = types
  .model('Hyperparameters', {
    formFields: types.array(AddFormField),
  })
  .actions((self) => ({
    addFormField: (field: IAddFormField) => {
      self.formFields.push(field);
    },
    removeFormField: (fieldName: string) => {
      const i = self.formFields.findIndex((f) => f.fieldName === fieldName);

      if (i !== -1) self.formFields.splice(i, 1);
    },
  }));

export type IHyperparameters = Instance<typeof Hyperparameters>;

const Store = types
  .model('Store', {
    hyperparameters: Hyperparameters,
    searchSpace: SearchSpace,
  })
  .actions((self) => ({
    addHyperparameter: (field: IAddFormField) => {
      self.hyperparameters.addFormField(field);

      switch (field.hpType) {
        case EHyperparameterParameterType.CHOICE:
          self.searchSpace.addChoice({
            name: field.fieldName,
            choices: [0],
          });
          break;
        case EHyperparameterParameterType.UNIFORM:
          self.searchSpace.addChoice({
            name: field.fieldName,
            min: 0,
            max: 1,
          });
          break;
        case EHyperparameterParameterType.QUNIFORM:
          self.searchSpace.addChoice({
            name: field.fieldName,
            min: 0,
            max: 1,
            q: 0.01,
          });
          break;
      }
    },
    removeHyperparameter: (fieldName: string) => {
      self.hyperparameters.removeFormField(fieldName);
      self.searchSpace.removeChoice(fieldName);
    },
  }));

export type IStore = Instance<typeof Store>;
export type IStoreSnapshotIn = SnapshotIn<typeof Store>;
export type IStoreSnapshotOut = SnapshotOut<typeof Store>;

export function initializeStore(snapshot = null) {
  const _store =
    store ??
    Store.create({
      hyperparameters: {
        formFields: DefaultFormProps,
      },
      searchSpace: {
        options: DefaultSearchSpace.map((s, i) => {
          if (DefaultFormProps[i].array) return null; // TODO model array fields

          switch (DefaultFormProps[i].hpType) {
            case EHyperparameterParameterType.CHOICE:
              console.log('creating choice', s.fieldName, s.options);
              return {
                fieldName: s.fieldName,
                choices: s.options,
              };
            case EHyperparameterParameterType.UNIFORM:
              console.log('creating uniform', s.fieldName, s.min, s.max);
              return {
                fieldName: s.fieldName,
                min: s.min,
                max: s.max,
              };
            case EHyperparameterParameterType.QUNIFORM:
              return SearchSpaceOption.create({
                fieldName: s.fieldName,
                min: s.min,
                max: s.max,
                q: s.q,
              });

            default:
              console.error('Invalid hpType');
              return null;
          }
        }).filter((s): s is never => s !== null),
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
