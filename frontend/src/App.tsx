import { Button } from './components/ui/button';
import ClientCard from './components/ClientCard';
import { Toaster } from './components/ui/toaster';
import useMasterWebSocket from './hooks/useMasterWebsocket';
import { useEffect, useState } from 'react';
import HypForm, { formSchema } from './components/form';
import { z } from 'zod';
import { hashHyperparameterData, round } from './lib/utils';
import HyperparametersView from './components/HyperparamsView';
import { EmptyHyperparameterData, ResultsStatus } from './lib/client';

export interface HyperparameterData {
  layers: number;
  neuronsPerLayer: number[];
  epsilon: number;
  learningRate: number;
}

function App() {
  const [results, setResults] = useState<Record<string, number>>({});
  const [totalResults, setTotalResults] = useState(0);
  const [bestResult, setBestResult] = useState<number>(0);
  const [bestParameters, setBestParameters] = useState<HyperparameterData>(
    EmptyHyperparameterData,
  );

  const onRecieveResult = (data: any) => {
    const [loss, accuracy] = data.accuracy;
    const hyperparameters = data.hyperparameters;

    setResults((prev) => ({
      ...prev,
      [hashHyperparameterData(hyperparameters)]: accuracy,
    }));
    if (data.accuracy[1] > bestResult) {
      setBestResult(accuracy);
      setBestParameters(hyperparameters);
      setTotalResults(totalResults + 1);
    }

    if (Object.keys(results).length === parametersToTrain.length) {
      console.log('finished');
      sendJsonMessage({ ID: 'finished' });
    }
  };

  const {
    clients,
    training,
    startTraining,
    connected,
    sendJsonMessage,
    resultsStatus,
  } = useMasterWebSocket({
    onRecieveResults: onRecieveResult,
    url:
      process.env.NODE_ENV === 'production'
        ? 'wss://mchacks11.ezrahuang.com/master-socket'
        : 'ws://localhost:8080/master',
  });

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
  };
  const clear = () => {
    setParametersToTrain([]);
    setResults({});
    setTotalResults(0);
    setBestResult(0);
    setBestParameters(EmptyHyperparameterData);
  }

  console.log(parametersToTrain);
  console.log(resultsStatus);

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
        <div className="flex space-x-4">
          <div
            style={{ width: 500 }}
            className="border bg-gray-50 border-dashed rounded-md px-3 py-2 border-gray-200"
          >
            <HypForm onSubmit={addParameters} disabled={training} />
            <Button
          className="mt-4 bg-red-500 text-white hover:bg-red-800"
          variant="outline"
          disabled={training}
          onClick={() => {
            clear();
          }}
        >
          Clear
        </Button>
          </div>
          <div
            className="border bg-gray-50 border-dashed rounded-md py-2 border-gray-200 items-center"
            style={{ width: 500 }}
          >
            <h2 className="font-bold text-center">Hyperparameters to train:</h2>
            <div className="overflow-y-scroll max-h-[600px]">
              <div className="flex flex-col px-1.5 py-1 rounded-md space-y-2">
                {parametersToTrain
                  .filter(
                    (params, i) =>
                      resultsStatus[hashHyperparameterData(params)] !==
                      ResultsStatus.Finished,
                  )
                  .map((params) => {
                    const status =
                      resultsStatus[hashHyperparameterData(params)];
                    return (
                      <div key={hashHyperparameterData(params)}>
                        <HyperparametersView
                          hyperparameters={params}
                          pending={status === ResultsStatus.Started}
                        />
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        </div>
        {training &&
                ( <img src="https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExeWo2cmMzd2R6MmZhbWlrM2Uzc3NnMHB1MmN4M3lxcDAzbjN3MnBpdSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/GeimqsH0TLDt4tScGw/giphy.gif" alt="bong cat" /> )}
        <Button
          className="mt-4 mb-4"
          variant="outline"
          disabled={training || !connected}
          onClick={() => {
            startTraining(parametersToTrain);
          }}
        >
          Start Training
        </Button>
      </div>
      <div className="flex space-x-3">
        <div
          style={{ width: 400 }}
          className="border bg-gray-50 border-dashed rounded-md px-3 py-2 border-gray-200"
        >
          <h2 className="text-xl">Connected workers</h2>

          <div className="my-4" />
          <div className="flex space-y-2 px-2 flex-col">
            {clients.map((client) => (
              <ClientCard key={client.id} client={client} />
            ))}
          </div>
        </div>
        <div>
          <div className="border bg-gray-50 border-dashed rounded-md px-3 py-2 border-gray-200">
            <h2 className=" text-xl">Progress</h2>

            <div className="my-4" />
            <div className="flex space-x-2">
              <div className="flex flex-col min-w-60">
                <span className="font-bold">Hyperparameters Remaining</span>
                <span>{parametersToTrain.length - totalResults}</span>
              </div>
              <div className="flex flex-col min-w-36">
                <span className="font-bold">Best Accuracy</span>
                <span>{round(bestResult, 3)}</span>
              </div>
              <div className="flex flex-col min-w-36">
                <span className="font-bold">Hyperparameters</span>

                {totalResults !== 0 ? (
                  <HyperparametersView hyperparameters={bestParameters} />
                ) : (
                  <span>No results yet</span>
                )}

                

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
