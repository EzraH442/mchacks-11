import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { HyperparameterData } from '@/app/page';
import { EClientStatus } from '@/types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNeuronsPerLayer(neuronsPerLayer: number[]) {
  let ret = '';
  neuronsPerLayer.forEach((neurons, index) => {
    ret += neurons;
    if (index < neuronsPerLayer.length - 1) {
      ret += ',';
    }
  });

  return ret;
}

export function round(num: number, places: number = 2) {
  return Math.round(num * Math.pow(10, places)) / Math.pow(10, places);
}

export function hashHyperparameterData(data: HyperparameterData) {
  return (
    data.epsilon +
    '-' +
    data.learningRate +
    '-' +
    data.layers +
    '--' +
    data.neuronsPerLayer.join('-')
  );
}

export function formatStatus(status: EClientStatus) {
  switch (status) {
    case EClientStatus.IDLE:
      return 'Idle';
    case EClientStatus.WORKING:
      return 'Working';
    case EClientStatus.DISCONNECTED:
      return 'Disconnected';
  }
}

export const formatValues = (values: any) => {
  if (values === undefined) {
    return 'Select an option';
  }
  if (typeof values === 'boolean') {
    return values ? 'true' : 'false';
  }
  if (typeof values === 'object') {
    return JSON.stringify(values);
  }
  return values;
};
