import { useState } from 'react';
import { EmptyHyperparameterData } from '../lib/client';
import useWebSocket from 'react-use-websocket';
import { useToast } from '../components/ui/use-toast';
import { HyperparameterData } from '@/app/page';
import { hashHyperparameterData } from '../lib/utils';
import { EClientStatus, EResultsStatus } from '@/types';
import { useStore } from '@/store';
import * as g from '@/auto-generated';

interface IUserMasterWebSocket {
  url: string;
  onRecieveResults: (result: any) => void;
}

const useMasterWebSocket = (params: IUserMasterWebSocket) => {
  const { onRecieveResults, url } = params;

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

  const startTraining = (
    initialParameters: HyperparameterData,
    searchSpace: any,
  ) => {
    // setTraining(true);
    // sendJsonMessage({
    //   ID: 'start-training',
    //   params: initialParameters,
    //   search_space: searchSpace,
    // });
  };

  return {
    training,
    // setTraining,
    // clients,
    connected,
    startTraining,
    sendJsonMessage,
    // resultsStatus,
  };
};

export default useMasterWebSocket;
