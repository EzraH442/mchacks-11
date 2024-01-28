import { HyperparameterData } from '../App';

export enum ClientStatus {
  Idle,
  Working,
  Disconnected,
}

export interface Client {
  id: string;
  name: string;
  ip: string;
  status: ClientStatus;
  currentTask: HyperparameterData;
}

export function formatStatus(status: ClientStatus) {
  switch (status) {
    case ClientStatus.Idle:
      return 'Idle';
    case ClientStatus.Working:
      return 'Working';
    case ClientStatus.Disconnected:
      return 'Disconnected';
  }
}

export const EmptyHyperparameterData: HyperparameterData = {
  layers: 0,
  neuronsPerLayer: [],
  epsilon: 0,
  learningRate: 0,
};

export enum ResultsStatus {
  NotStarted,
  Started,
  Finished,
}
