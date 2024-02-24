import { EClientStatus } from '@/types';
import { Instance, types } from 'mobx-state-tree';

export const Client = types.model('Client', {
  id: types.identifier,
  name: types.string,
  ip: types.string,
  status: types.enumeration('ClientStatus', Object.values(EClientStatus)),
  currentTask: types.frozen(),
});

export type IClient = Instance<typeof Client>;

export const WorkerMap = types.map(Client);
