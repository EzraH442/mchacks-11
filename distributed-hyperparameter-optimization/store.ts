import { useMemo } from 'react';
import {
  Instance,
  types,
  SnapshotIn,
  SnapshotOut,
  applySnapshot,
  getParent,
} from 'mobx-state-tree';
import {
  DefaultFormProps,
  DefaultInitialPoint,
  DefaultSearchSpace,
  EHyperparameterDataType,
  EHyperparameterParameterType,
  IAddFormField,
} from './types';
import { v4 } from 'uuid';

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

export const Choice = types
  .model('Choice', {
    key: types.string,
    value: types.frozen(),
  })
  .actions((self) => ({
    setValue(value: any) {
      self.value = value;
    },
  }));

export type IChoice = Instance<typeof Choice>;

export const SearchSpaceChoice = types
  .model('SearchSpaceNumberChoice', {
    fieldName: types.string,
    choices: types.array(Choice),
  })
  .actions((self) => ({
    addChoice: (choice: any) => {
      self.choices.push({
        key: v4(),
        value: choice,
      });
    },
    removeIndex: (index: number) => {
      if (index < self.choices.length) self.choices.splice(index, 1);
    },
    removeChoice: (choiceKey: any) => {
      const i = self.choices.findIndex((f) => f.key === choiceKey);

      if (i !== -1) self.choices.splice(i, 1);
    },
    updateChoice: (index: number, choice: any) => {
      if (index < self.choices.length) self.choices[index].value = choice;
    },
  }));

export type ISearchSpaceChoice = Instance<typeof SearchSpaceChoice>;

export const SearchSpaceUniform = types
  .model('SearchSpaceUniform', {
    fieldName: types.string,
    min: types.number,
    max: types.number,
  })
  .actions((self) => ({
    setMin: (min: number) => {
      self.min = min;
    },
    setMax: (max: number) => {
      self.max = max;
    },
  }));

export type ISearchSpaceUniform = Instance<typeof SearchSpaceUniform>;

export const SearchSpaceQUniform = types
  .model('SearchSpaceQUniform', {
    fieldName: types.string,
    min: types.number,
    max: types.number,
    q: types.number,
  })
  .actions((self) => ({
    setMin: (min: number) => {
      self.min = min;
    },
    setMax: (max: number) => {
      self.max = max;
    },
    setQ: (q: number) => {
      self.q = q;
    },
  }));

export type ISearchSpaceQUniform = Instance<typeof SearchSpaceQUniform>;

export const SearchSpaceOption = types.union(
  SearchSpaceChoice,
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
    removeIndex: (index: number) => {
      if (index < self.options.length) self.options.splice(index, 1);
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
    removeIndex: (index: number) => {
      if (index < self.formFields.length) self.formFields.splice(index, 1);
    },
    removeFormField: (fieldName: string) => {
      const i = self.formFields.findIndex((f) => f.fieldName === fieldName);

      if (i !== -1) self.formFields.splice(i, 1);
    },
  }));

export type IHyperparameters = Instance<typeof Hyperparameters>;

export const InitialPointField = types.model('InitialPoint', {
  fieldName: types.string,
  value: types.frozen(),
});

export type IInitialPointField = Instance<typeof InitialPointField>;

export const InitialPoint = types
  .model('InitialPoint', {
    choices: types.array(InitialPointField),
  })
  .actions((self) => ({
    push: (field: IInitialPointField) => {
      self.choices.push(field);
    },
    remove: (fieldName: string) => {
      const removeIndex = self.choices.findIndex(
        (f) => f.fieldName === fieldName,
      );

      if (removeIndex !== -1) self.choices.splice(removeIndex, 1);
    },
    removeIndex: (index: number) => {
      if (index < self.choices.length) self.choices.splice(index, 1);
    },
    set: (fieldName: string, value: any) => {
      const i = self.choices.findIndex((f) => f.fieldName === fieldName);

      if (i !== -1) self.choices[i].value = value;
    },
    setIndex: (index: number, value: any) => {
      if (index < self.choices.length) self.choices[index].value = value;
    },
  }));

export type IInitialPoint = Instance<typeof InitialPoint>;

const Store = types
  .model('Store', {
    hyperparameters: Hyperparameters,
    searchSpace: SearchSpace,
    initialPoint: InitialPoint,
  })
  .actions((self) => ({
    addHyperparameter: (field: IAddFormField) => {
      self.hyperparameters.addFormField(field);

      switch (field.hpType) {
        case EHyperparameterParameterType.CHOICE:
          self.searchSpace.addChoice({
            fieldName: field.fieldName,
            choices: [0],
          });
          self.initialPoint.push({
            fieldName: field.fieldName,
            value: 0,
          });
          break;
        case EHyperparameterParameterType.UNIFORM:
          self.searchSpace.addChoice({
            fieldName: field.fieldName,
            min: 0,
            max: 1,
          });
          self.initialPoint.push({
            fieldName: field.fieldName,
            value: 0.5,
          });
          break;
        case EHyperparameterParameterType.QUNIFORM:
          self.searchSpace.addChoice({
            fieldName: field.fieldName,
            min: 0,
            max: 10,
            q: 1,
          });
          self.initialPoint.push({
            fieldName: field.fieldName,
            value: 5,
          });
          break;
      }
    },
    removeHyperparameter: (fieldName: string) => {
      self.hyperparameters.removeFormField(fieldName);
      self.searchSpace.removeChoice(fieldName);
      self.initialPoint.remove(fieldName);
    },
    removeHyperparameterIndex: (i: number) => {
      if (i < self.hyperparameters.formFields.length) {
        self.hyperparameters.removeIndex(i);
        self.searchSpace.removeIndex(i);
        self.initialPoint.removeIndex(i);
      }
    },
    removeHyperparameterChoice: (i: number, choiceIndex: number) => {
      if (i < self.searchSpace.options.length) {
        const choice = self.searchSpace.options.at(i) as ISearchSpaceChoice;
        const selectedValue = self.initialPoint.choices.at(i);

        if (
          selectedValue &&
          selectedValue.value === choice.choices.at(choiceIndex)?.key
        ) {
          selectedValue.value = choice.choices.at(0)?.key ?? 'null';
        }

        choice.removeIndex(choiceIndex);
      }
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
          if (DefaultFormProps[i].array) {
            if (
              DefaultFormProps[i].hpType !== EHyperparameterParameterType.CHOICE
            ) {
              console.error('Invalid array hpType');
              return null;
            }

            console.log('creating array choice', s.fieldName, s.options);
            return {
              fieldName: s.fieldName,
              choices: s.options?.map((o) => {
                return {
                  key: v4(),
                  value: o,
                };
              }),
            };
          }

          console.log('type', DefaultFormProps[i].hpType, s.fieldName);
          switch (DefaultFormProps[i].hpType) {
            case EHyperparameterParameterType.CHOICE:
              return {
                fieldName: s.fieldName,
                choices: s.options?.map((o) => {
                  return {
                    key: v4(),
                    value: o,
                  };
                }),
              };
            case EHyperparameterParameterType.UNIFORM:
              return SearchSpaceUniform.create({
                fieldName: s.fieldName,
                min: s.min!,
                max: s.max!,
              });
            case EHyperparameterParameterType.QUNIFORM:
              return SearchSpaceQUniform.create({
                fieldName: s.fieldName,
                min: s.min!,
                max: s.max!,
                q: s.q!,
              });

            default:
              console.error('Invalid hpType');
              return null;
          }
        }).filter((s): s is never => s !== null),
      },
      initialPoint: {
        choices: Object.entries(DefaultInitialPoint).map(([k, v]) => {
          return {
            fieldName: k,
            value: {
              key: v4(),
              value: v,
            },
          };
        }),
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
