import { useEffect, useRef, useState } from 'react';
import { Client, ClientStatus } from '../lib/client';
import useWebSocket from 'react-use-websocket';
import { useToast } from '../components/ui/use-toast';
import { animals, colors, uniqueNamesGenerator } from 'unique-names-generator';

const generaetRandomName = () => {
  return uniqueNamesGenerator({
    dictionaries: [colors, animals],
  }).replace('_', ' ');
};

const useMasterWebSocket = () => {
  const [connected, setConnected] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const { toast } = useToast();

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
      }
      if (!data.id) {
        return;
      }

      switch (data.id) {
        case 'get-all-clients': {
          const clients = data.workers;
          setClients(
            clients.map((client: any) => ({
              id: client.worker_id,
              ip: client.ip,
              status: ClientStatus.Idle,
              name: generaetRandomName(),
            })),
          );
          break;
        }
        case 'client-connected': {
          const ip = data.ip;
          const workerId = data.worker_id;
          setClients((prev) => [
            ...prev,
            {
              id: workerId,
              ip,
              status: ClientStatus.Idle,
              name: generaetRandomName(),
            },
          ]);
          break;
        }
        case 'client-disconnected': {
          const workerId = data.worker_id;
          setClients((prev) => prev.filter((client) => client.id !== workerId));
          break;
        }
        case 'client-started-training': {
          const workerId = data.worker_id;
          setClients((prev) =>
            prev.map((client) =>
              client.id === workerId
                ? { ...client, status: ClientStatus.Working }
                : client,
            ),
          );
          break;
        }
        case 'client-finished-training': {
          const workerId = data.worker_id;
          setClients((prev) =>
            prev.map((client) =>
              client.id === workerId
                ? { ...client, status: ClientStatus.Idle }
                : client,
            ),
          );
        }
      }

      return false;
    },
  });

  return {
    clients,
    connected,
    sendJsonMessage,
  };
};

export default useMasterWebSocket;
