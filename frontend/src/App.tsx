import { Button } from './components/ui/button';
import ClientCard from './components/ClientCard';
import { Toaster } from './components/ui/toaster';
import useMasterWebSocket from './hooks/useMasterWebsocket';
import { useEffect, useState } from 'react';
import HypForm, { formSchema } from './components/form';
import { z } from 'zod';
import { formatNeuronsPerLayer, round } from './lib/utils';

export interface HyperparameterData {
  layers: number;
  neuronsPerLayer: number[];
  epsilon: number;
  learningRate: number;
}

function App() {
  const [results, setResults] = useState<Record<string, number>>({});
  const [totalResults, setTotalResutls] = useState(0);
  const [bestResult, setBestResult] = useState<number>(0);
  const [bestParameters, setBestParameters] = useState<HyperparameterData>();

  const onRecieveResult = (data: any) => {
    const [loss, accuracy] = data.accuracy;
    const hyperparameters = data.hyperparameters;

    setResults((prev) => ({
      ...prev,
      [JSON.stringify(hyperparameters)]: accuracy,
    }));
    if (data.accuracy[1] > bestResult) {
      setBestResult(accuracy);
      setBestParameters(hyperparameters);
      setTotalResutls(totalResults + 1);
    }
    console.log(results);
  };

  const { clients, training, startTraining, connected, sendJsonMessage } =
    useMasterWebSocket({ onRecieveResults: onRecieveResult });

  const [parametersToTrain, setParametersToTrain] = useState<
    HyperparameterData[]
  >([]);

  const addParameters = (data: z.infer<typeof formSchema>) => {
    for (let i = data.epsilonMin; i <= data.epsilonMax; i += data.epsilonStep) {
      for (
        let j = data.learningRateMin;
        j <= data.learningRateMax;
        j += data.learningRateStep
      ) {
        setParametersToTrain((prev) => [
          ...prev,
          {
            layers: data.layers,
            neuronsPerLayer: data.neuronsPerLayer,
            epsilon: i,
            learningRate: j,
          },
        ]);
      }
    }
    console.log(parametersToTrain);
  };

  return (
    <div className="w-full h-full px-4 ">
      <Toaster />
      <h1 className="text-2xl underline">DISTRIBUTED HYPERPARAMETER TUNING</h1>
      <div>
        <Button
          variant="outline"
          onClick={() => {
            sendJsonMessage({ ID: 'ping' });
          }}
        >
          Ping
        </Button>
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

        <div className="my-4" />
        <h2 className="font-bold">Hyperparameter settings:</h2>
        <div>
          <div style={{ width: 500 }}>
            <HypForm onSubmit={addParameters} disabled={training} />
          </div>
        </div>
        <Button
          className="mt-4"
          variant="outline"
          disabled={training || !connected}
          onClick={() => {
            startTraining(parametersToTrain);
          }}
        >
          Start Training
        </Button>
      </div>
      <div className="flex">
        <div style={{ width: 400 }}>
          <h2 className="text-xl">Connected workers</h2>

          <div className="my-4" />
          <div className="flex space-x-2">
            {clients.map((client) => (
              <ClientCard key={client.id} client={client} />
            ))}
          </div>
        </div>
        <div>
          <div style={{ width: 400 }}>
            <h2 className=" text-xl">Progress</h2>

            <div className="my-4" />
            <div className="flex space-x-2">
              <div className="flex flex-col min-w-60">
                <span className="font-bold">Hyperparameters Remaining:</span>
                <span>{parametersToTrain.length - totalResults}</span>
              </div>
              <div className="flex flex-col min-w-36">
                <span className="font-bold">Best Accuracy:</span>
                <span>{round(bestResult, 3)}</span>
              </div>
              <div className="flex flex-col min-w-36">
                <span className="font-bold">Best Parameters:</span>
                <span>Epsilon: {round(bestParameters?.epsilon ?? 0, 4)}</span>
                <span>
                  Learning Rate: {round(bestParameters?.epsilon ?? 0, 4)}
                </span>
                <span>Layers: {bestParameters?.layers ?? 0}</span>
                <span>
                  NeuronsPerLayer:{' '}
                  {formatNeuronsPerLayer(bestParameters?.neuronsPerLayer || [])}
                </span>
              </div>
            </div>
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
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
