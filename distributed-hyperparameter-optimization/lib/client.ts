import { HyperparameterData } from '@/app/page';
import { EClientStatus } from '@/types';

export interface Client {
  id: string;
  name: string;
  ip: string;
  status: EClientStatus;
  currentTask: HyperparameterData;
}

export const EmptyHyperparameterData: HyperparameterData = {
  layers: 0,
  neuronsPerLayer: [],
  epsilon: 0,
  learningRate: 0,
};
