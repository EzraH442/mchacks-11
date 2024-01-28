import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

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
