import { useState } from 'react';
import {
  Client,
  ClientStatus,
  EmptyHyperparameterData,
  ResultsStatus,
} from '../lib/client';
import useWebSocket from 'react-use-websocket';
import { useToast } from '../components/ui/use-toast';
import { HyperparameterData } from '@/app/page';
import { hashHyperparameterData } from '../lib/utils';

interface IUserMasterWebSocket {
  url: string;
  onRecieveResults: (result: any) => void;
}

const useMasterWebSocket = (params: IUserMasterWebSocket) => {
  const { onRecieveResults, url } = params;

  const [training, setTraining] = useState(false);
  const [connected, setConnected] = useState(false);
  const [clients, setClients] = useState<Record<string, Client>>({});
  const [resultsStatus, setResultsStatus] = useState<
    Record<string, ResultsStatus>
  >({});

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
      const data = JSON.parse(event.data);

      if (data.message === 'ping') {
        toast({
          description: 'Pong!',
        });
        return;
      }

      if (!data.id) {
        return;
      }

      switch (data.id) {
        case 'get-all-clients': {
          const workers = data.workers;
          setClients(
            workers.map((worker: any) => ({
              id: worker.worker_id,
              name: worker.name,
              ip: worker.ip,
              status:
                worker.status === '0'
                  ? ClientStatus.Idle
                  : ClientStatus.Working,
            })),
          );
          break;
        }

        case 'client-connected': {
          const worker = data.worker;
          const newClients = {
            ...clients,
            [worker.worker_id]: {
              id: worker.worker_id,
              ip: worker.ip,
              status:
                worker.status === '0'
                  ? ClientStatus.Idle
                  : ClientStatus.Working,
              currentTask: EmptyHyperparameterData,
              name: worker.name,
            },
          };
          setClients(newClients);
          break;
        }

        case 'client-disconnected': {
          const workerId = data.worker.worker_id;
          const newClients = { ...clients };
          delete newClients[workerId];
          setClients(newClients);
          break;
        }

        case 'client-started-training': {
          const workerId = data.worker_id;
          const hyperparameters = data.parameters as HyperparameterData;

          setResultsStatus((prev) => ({
            ...prev,
            [hashHyperparameterData(hyperparameters)]: ResultsStatus.Started,
          }));

          const newClients = {
            ...clients,
            workerId: {
              ...clients[workerId],
              status: ClientStatus.Working,
              currentTask: hyperparameters,
            },
          };
          setClients(newClients);
          break;
        }
        case 'client-finished-training': {
          const workerId = data.worker_id;
          const result = data.result;

          const newClients = { ...clients };
          newClients[workerId] = {
            ...newClients[workerId],
            status: ClientStatus.Idle,
          };

          setResultsStatus((prev) => ({
            ...prev,
            [hashHyperparameterData(result.hyperparameters)]:
              ResultsStatus.Finished,
          }));

          onRecieveResults(result);

          break;
        }
        case 'genetic-algorithm-status-update': {
          const status = data.status;
          console.log('status', status);
          break;
        }
        case 'training-finished': {
          setTraining(false);
          break;
        }
      }

      return false;
    },
  });

  const startTraining = (
    initialParameters: HyperparameterData,
    searchSpace: any,
  ) => {
    setTraining(true);
    sendJsonMessage({
      ID: 'start-training',
      params: initialParameters,
      search_space: searchSpace,
    });
  };

  return {
    training,
    setTraining,
    clients,
    connected,
    startTraining,
    sendJsonMessage,
    resultsStatus,
  };
};

export default useMasterWebSocket;
