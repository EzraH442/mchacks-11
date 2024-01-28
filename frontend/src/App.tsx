import React from 'react';
import { useState } from 'react';
import useWebSocket from 'react-use-websocket';
import { Button } from './components/ui/button';
import { Client, ClientStatus } from './lib/client';
import ClientCard from './components/ClientCard';
import { animals, colors, uniqueNamesGenerator } from 'unique-names-generator';
import { Toaster } from './components/ui/toaster';
import { useToast } from './components/ui/use-toast';

function App() {
  // Create WebSocket connection.
  const { toast } = useToast();
  const { sendJsonMessage } = useWebSocket('ws://localhost:8080/master', {
    onOpen: (event) => {
      console.log('Connection opened');
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
        case 'client-connected': {
          const ip = data.ip;
          const workerId = data.worker_id;
          const randomName = uniqueNamesGenerator({
            dictionaries: [colors, animals],
          }); // big_red_donkey
          setClients((prev) => [
            ...prev,
            { id: workerId, ip, status: ClientStatus.Idle, name: randomName },
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
              client.id === data.client.id
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
              client.id === data.client.id
                ? { ...client, status: ClientStatus.Idle }
                : client,
            ),
          );
        }
      }
    },
  });

  const [clients, setClients] = useState<Client[]>([]);

  return (
    <div className="w-full h-full px-4 ">
      <Toaster />
      <h1 className="text-2xl underline">DISTRIBUTED HYPERPARAMETER TUNING</h1>
      <div>
        <h2 className="text-xl">Connected workers</h2>

        <div className="my-4" />
        <div className="flex space-x-2">
          {clients.map((client) => (
            <ClientCard key={client.id} client={client} />
          ))}
        </div>

        <h2 className=" text-xl">Progress</h2>
        {/* <table class="box" style="display: flex; flex-direction: row; width:20vw" >
          <!-- epoch number-->
          <tr>
              <td>Epoch:</td>
              <td id="epochnumber">1</td>
          </tr>
          <!-- best accuracy so far-->
          <tr>
              <td>Best Accuracy:</td>
              <td id="bestaccuracy"></td>
          </tr>
      </table> */}
        <Button
          variant="outline"
          onClick={() => {
            sendJsonMessage({ ID: 'ping' });
          }}
        >
          Ping
        </Button>
      </div>
    </div>
  );
}

export default App;
