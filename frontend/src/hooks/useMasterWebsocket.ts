import { useContext, useState } from 'react';
import { Client, ClientStatus, EmptyHyperparameterData } from '../lib/client';
import useWebSocket from 'react-use-websocket';
import { useToast } from '../components/ui/use-toast';
import { animals, colors, uniqueNamesGenerator } from 'unique-names-generator';
import NameContext from './useNameContext';
import { HyperparameterData } from '../App';

interface IUserMasterWebSocket {
  onRecieveResults: (result: any) => void;
}

const useMasterWebSocket = (params: IUserMasterWebSocket) => {
  const { onRecieveResults } = params;

  const namesContext = useContext(NameContext);
  const [training, setTraining] = useState(false);
  const [connected, setConnected] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const { toast } = useToast();

  const generaetRandomName = (ip: string) => {
    if (!namesContext.names[ip]) {
      namesContext.names[ip] = uniqueNamesGenerator({
        dictionaries: [colors, animals],
      }).replace('_', ' ');
    }

    return namesContext.names[ip];
  };
  const { sendJsonMessage } = useWebSocket('ws://localhost:8080/master', {
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
              ip: worker.ip,
              status:
                worker.status == 0 ? ClientStatus.Idle : ClientStatus.Working,
              name: generaetRandomName(worker.ip),
            })),
          );
          break;
        }
        case 'client-connected': {
          const worker = data.worker;
          setClients((prev) => [
            ...prev,
            {
              id: worker.worker_id,
              ip: worker.ip,
              status:
                worker.status === 'idle'
                  ? ClientStatus.Idle
                  : ClientStatus.Working,
              currentTask: EmptyHyperparameterData,
              name: generaetRandomName(worker.ip),
            },
          ]);
          break;
        }
        case 'client-disconnected': {
          const workerId = data.worker.worker_id;
          setClients((prev) => prev.filter((client) => client.id !== workerId));
          break;
        }
        case 'client-started-training': {
          const workerId = data.worker_id;
          const hyperparameters = data.parameters;
          setClients((prev) =>
            prev.map((client) =>
              client.id === workerId
                ? {
                    ...client,
                    status: ClientStatus.Working,
                    currentTask: hyperparameters,
                  }
                : client,
            ),
          );
          break;
        }
        case 'client-finished-training': {
          const workerId = data.worker_id;
          const result = data.result;
          console.log('results', result);
          setClients((prev) =>
            prev.map((client) =>
              client.id === workerId
                ? { ...client, status: ClientStatus.Idle }
                : client,
            ),
          );
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

  const startTraining = (parameters: HyperparameterData[]) => {
    setTraining(true);
    sendJsonMessage({
      ID: 'start-training',
      parameters,
    });
  };

  return {
    training,
    clients,
    connected,
    startTraining,
    sendJsonMessage,
  };
};

export default useMasterWebSocket;
