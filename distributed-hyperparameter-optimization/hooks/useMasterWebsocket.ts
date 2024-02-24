import { useState } from 'react';
import useWebSocket from 'react-use-websocket';
import { useToast } from '../components/ui/use-toast';
import { EHyperparameterParameterType } from '@/types';
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
        }

        case g.ClientFinishedTrainingMessageID: {
          training.finishTrainingBatch(data as g.ClientFinishedTrainingMessage);
        }

        case g.TrainingCompletedMessageID: {
          training.setFinishedTraining();
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
          ss = {};

          Array.from((v.searchSpace as IOptions).optionMap.values()).map(
            ({ id, value }) => {
              ss[id] = value;
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
          break;
        }

        case EHyperparameterParameterType.QUNIFORM: {
          const _ss = v.searchSpace as IQUniform;
          ss = {
            min: _ss.min,
            max: _ss.max,
            q: _ss.q,
          };
          break;
        }
      }

      search_space[k] = ss;
      initial_params[k] = v.searchSpace.selectedValue;
    });

    const message: g.InitiateTrainingResponse = {
      id: g.InitiateTrainingResponseID,
      search_space: searchSpace,
      initial_params: initialParameters,
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
    // resultsStatus,
  };
};

export default useMasterWebSocket;
