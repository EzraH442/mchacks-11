import { EClientStatus, EResultsStatus } from '@/types';
import { Instance, types } from 'mobx-state-tree';
import { WorkerMap } from './Client';
import * as g from '@/auto-generated';

const ResultsStatus = types.enumeration(
  'ResultsStatus',
  Object.values(EResultsStatus),
);

const HyperparameterSetEntry = types.model('HyperparameterSetEntry', {
  name: types.identifier,
  value: types.union(types.number, types.string, types.boolean, types.frozen()),
});

export type IHyperparameterSetEntry = Instance<typeof HyperparameterSetEntry>;

export const TrainingBatch = types
  .model('TrainingBatch', {
    id: types.identifier,
    hyperparameterSet: types.map(HyperparameterSetEntry),
    status: ResultsStatus,
    timeStarted: types.Date,
    timeFinished: types.maybe(types.Date),
    loss: types.maybe(types.number),
  })
  .actions((self) => ({
    setStatus(status: EResultsStatus) {
      self.status = status;
    },
    setTimeFinished(time: number) {
      self.timeFinished = new Date(time);
    },
    setLoss(loss: number) {
      self.loss = loss;
    },
  }));

export type ITrainingBatch = Instance<typeof TrainingBatch>;

const WorkerBatchMapEntry = types.model('WorkerBatchMapEntry', {
  id: types.identifier,
  workerId: types.string,
  batchId: types.string,
});

export const Training = types
  .model('Training', {
    workers: WorkerMap,
    batches: types.map(TrainingBatch),
    workerBatchMap: types.map(WorkerBatchMapEntry),
    currentlyTraining: types.boolean,
    bestBatchId: types.maybe(types.string),
  })
  .views((self) => ({
    hasBestBatch() {
      return !!self.bestBatchId && !!self.batches.get(self.bestBatchId);
    },

    getBestBatch() {
      return self.batches.get(self.bestBatchId!);
    },
  }))
  .actions((self) => ({
    addWorker(worker: g.Worker) {
      self.workers.set(worker.worker_id, {
        id: worker.worker_id,
        name: worker.name,
        ip: worker.ip,
        status: EClientStatus.IDLE,
        currentTask: {},
      });
    },
    addWorkers(workers: g.Worker[]) {
      workers.forEach((worker) => {
        self.workers.set(worker.worker_id, {
          id: worker.worker_id,
          name: worker.name,
          ip: worker.ip,
          status: EClientStatus.IDLE,
          currentTask: {},
        });
      });
    },
    removeWorker(workerId: string) {
      self.workers.delete(workerId);
    },
    addTrainingBatch(m: g.ClientStartedTrainingMessage) {
      self.batches.set(m.parameters_id, {
        id: m.parameters_id,
        hyperparameterSet: m.parameters,
        status: EResultsStatus.IN_PROGRESS,
        timeStarted: m.time_started,
      });
      const id = `${m.parameters_id}-${m.worker_id}`;
      self.workerBatchMap.set(id, {
        id,
        workerId: m.worker_id,
        batchId: m.parameters_id,
      });
    },
    finishTrainingBatch(m: g.ClientFinishedTrainingMessage) {
      const id = `${m.parameters_id}-${m.worker_id}`;
      self.workerBatchMap.delete(id);
      const batch = self.batches.get(m.parameters_id);
      if (batch) {
        batch.setTimeFinished(m.time_finished);
        batch.setLoss(m.loss);
        batch.setStatus(EResultsStatus.FINISHED);
      }

      if (
        !!self.bestBatchId &&
        self.batches.get(self.bestBatchId)!.loss! > m.loss
      ) {
        self.bestBatchId = m.parameters_id;
      }
    },
    setFinishedTraining() {
      self.currentlyTraining = false;
    },
  }));

export type ITraining = Instance<typeof Training>;
