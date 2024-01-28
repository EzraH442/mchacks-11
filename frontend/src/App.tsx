import { Button } from './components/ui/button';
import ClientCard from './components/ClientCard';
import { Toaster } from './components/ui/toaster';
import useMasterWebSocket from './hooks/useMasterWebsocket';
import { useEffect, useState } from 'react';

function App() {
  const [training, setTraining] = useState(false);
  const { clients, connected, sendJsonMessage } = useMasterWebSocket();

  return (
    <div className="w-full h-full px-4 ">
      <Toaster />
      <h1 className="text-2xl underline">DISTRIBUTED HYPERPARAMETER TUNING</h1>
      <div>
        <div className="flex space-x-4">
          <div className="flex flex-col">
            <span className="font-bold">Connection status:</span>

            <span
              className={`${
                connected
                  ? 'text-green-900 bg-green-300'
                  : 'bg-red-500 text-white'
              } px-2 py-1 rounded-lg text-center w-36`}
            >
              {connected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="font-bold">Connected clients:</span>
            <span>{clients.length}</span>
          </div>
        </div>
        <Button
          className="mt-4"
          variant="outline"
          disabled={training}
          onClick={() => {
            setTraining(true);
            sendJsonMessage({ ID: 'start-training' });
          }}
        >
          Start Training
        </Button>
      </div>
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
