import { useState } from 'react';
import useWebSocket from 'react-use-websocket';
import { useToast } from '../components/ui/use-toast';
import { EClientStatus, EHyperparameterParameterType } from '@/types';
import { useStore } from '@/store';
import * as g from '@/auto-generated';
import { IOptions, IQUniform, IUniform } from '@/models/StagingArea';

interface IUserMasterWebSocket {
  url: string;
}

const useMasterWebSocket = (params: IUserMasterWebSocket) => {
  const { url } = params;

  const [connected, setConnected] = useState(false);

  const store = useStore(null);
  const { training } = store;
  const { toast } = useToast();

  const { sendJsonMessage } = useWebSocket(url, {
    share: true,
    shouldReconnect: () => true,
    onOpen: (event) => {
      console.log('Connection opened');
      setConnected(true);
      sendJsonMessage({ id: 'get-all-clients' });
    },
    onClose: (event) => {
      console.log('Connection closed');
      setConnected(false);
    },

    onMessage: (event) => {
      console.log('recieved event: ', event);
      const data = JSON.parse(event.data) as g.Message;

      if (!data.id) {
        return;
      }

      switch (data.id) {
        case g.PongMessageId: {
          toast({ title: 'Pong!' });
          break;
        }

        case g.AllClientsMessageID: {
          const d: g.GetAllClientsMessage = data as g.GetAllClientsMessage;

          training.addWorkers(d.workers);
          break;
        }

        case g.ClientConnectedMessageID: {
          const d: g.ClientConnectionStatusMessage =
            data as g.ClientConnectionStatusMessage;

          training.addWorker(d.worker);
          break;
        }

        case g.ClientDisconnectedMessageID: {
          const d: g.ClientConnectionStatusMessage =
            data as g.ClientConnectionStatusMessage;

          training.removeWorker(d.worker.worker_id);
          break;
        }

        case g.ClientStartedTrainingMessageID: {
          training.addTrainingBatch(data as g.ClientStartedTrainingMessage);
          break;
        }

        case g.ClientReadyToTrainMessageID: {
          const d: g.ClientReadyToTrainMessage =
            data as g.ClientReadyToTrainMessage;
          training.updateWorkerStatus(d.worker_id, EClientStatus.IDLE);
          break;
        }

        case g.ClientNotReadyToTrainMessageID: {
          const d: g.ClientReadyToTrainMessage =
            data as g.ClientReadyToTrainMessage;
          training.updateWorkerStatus(d.worker_id, EClientStatus.NOT_READY);
          break;
        }

        case g.ClientFinishedTrainingMessageID: {
          training.finishTrainingBatch(data as g.ClientFinishedTrainingMessage);
          break;
        }

        case g.TrainingCompletedMessageID: {
          training.setFinishedTraining();
          break;
        }
      }

      return false;
    },
  });

  const sendInitialParametersMessage = () => {
    const initialParameters = store.stagingArea.hyperparameters;
    const searchSpace = store.stagingArea.hyperparameters;

    const search_space: Record<string, any> = {};
    const initial_params: Record<string, any> = {};

    Array.from(searchSpace.entries()).forEach(([k, v]) => {
      let ss: any;

      switch (v.parameterType) {
        case EHyperparameterParameterType.CHOICE: {
          ss = [];

          Array.from((v.searchSpace as IOptions).optionMap.values()).map(
            ({ id, value }, i) => {
              ss.push(value);

              if (v.searchSpace.selectedValue === id) {
                initial_params[v.name] = i;
              }
            },
          );

          break;
        }

        case EHyperparameterParameterType.UNIFORM: {
          const _ss = v.searchSpace as IUniform;
          ss = {
            min: _ss.min,
            max: _ss.max,
          };
          initial_params[v.name] = v.searchSpace.selectedValue;
          break;
        }

        case EHyperparameterParameterType.QUNIFORM: {
          const _ss = v.searchSpace as IQUniform;
          ss = {
            min: _ss.min,
            max: _ss.max,
            q: _ss.q,
          };
          initial_params[v.name] = v.searchSpace.selectedValue;
          break;
        }
      }

      search_space[v.name] = ss;
    });

    const message: g.InitiateTrainingResponse = {
      id: g.InitiateTrainingResponseID,
      search_space: search_space,
      initial_params: initial_params,
    };

    sendJsonMessage(message);
  };

  const sendStartTrainingMessage = () => {
    const message: g.StartTrainingResponse = {
      id: g.StartTrainingResponseID,
    };

    sendJsonMessage(message);
  };

  const sendPauseTrainingMessage = () => {
    const message: g.PauseTrainingResponse = {
      id: g.PauseTrainingResponseID,
    };

    sendJsonMessage(message);
  };

  return {
    training,
    // setTraining,
    // clients,
    connected,
    sendJsonMessage,
    sendInitialParametersMessage,
    // resultsStatus,
  };
};

export default useMasterWebSocket;
