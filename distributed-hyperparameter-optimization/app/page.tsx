'use client';
import { Button } from '@/components/ui/button';
import ClientCard from '@/components/ClientCard';
import { Toaster } from '@/components/ui/toaster';
import useMasterWebSocket from '@/hooks/useMasterWebsocket';
import { useEffect, useState } from 'react';
import InitialPointsForm, { formSchema } from '@/components/InitialPointsForm';
import { z } from 'zod';
import { hashHyperparameterData, round } from '@/lib/utils';
import HyperparametersView from '@/components/HyperParamsView';
import { EmptyHyperparameterData, ResultsStatus } from '@/lib/client';
import { TypographyH1 } from '@/components/Typography/TypographyH1';
import { TypographySmall } from '@/components/Typography/TypographySmall';
import { TypographyLarge } from '@/components/Typography/TypographyLarge';
import { Badge } from '@/components/ui/badge';
import { TypographyH2 } from '@/components/Typography/TypographyH2';
import SearchSpaceForm from '@/components/SearchSpaceForm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ModeToggle } from '@/components/ModeToggle';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';
import { Github } from 'lucide-react';
import { useStore } from '@/store';
import { getSnapshot } from 'mobx-state-tree';

export interface HyperparameterData {
  layers: number;
  neuronsPerLayer: number[];
  epsilon: number;
  learningRate: number;
}

function App() {
  const store = useStore(null);

  const [results, setResults] = useState<Record<string, number>>({});
  const [totalResults, setTotalResults] = useState(0);
  const [bestResult, setBestResult] = useState<number>(0);
  const [bestParameters, setBestParameters] = useState<HyperparameterData>(
    EmptyHyperparameterData,
  );
  const [lastHyp, setLastHyp] = useState<string>('');

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
    }
    setTotalResults((prev) => prev + 1);

    if (hashHyperparameterData(hyperparameters) === lastHyp) {
      console.log('finished');
      sendJsonMessage({ ID: 'finished' });
      setTraining(false);
    }
  };

  const {
    clients,
    training,
    setTraining,
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

  const [initialPoint, setInitialPoint] = useState<HyperparameterData>(
    EmptyHyperparameterData,
  );

  const [searchSpace, setSearchSpace] = useState<any>({});

  const handleInitialPointSubmit = (data: z.infer<typeof formSchema>) => {
    setInitialPoint({
      layers: data.layers,
      neuronsPerLayer: data.neuronsPerLayer,
      epsilon: data.epsilonMax,
      learningRate: data.learningRateMax,
    });
  };

  const handleSearchSpaceSubmit = (data: any) => {
    setSearchSpace(data);
  };

  const clear = () => {
    setInitialPoint(EmptyHyperparameterData);
    setResults({});
    setTotalResults(0);
    setBestResult(0);
    setBestParameters(EmptyHyperparameterData);
  };

  console.log(initialPoint);
  console.log(resultsStatus);

  return (
    <div className="">
      {/* <div className="w-full bg-red-800 text-white text-center py-4">
        <TypographyH1>Distributed Hyperparameter Tuning</TypographyH1>
      </div> */}
      <div className="w-full h-full p-5 overflow-scroll ">
        <Toaster />
        <div className="max-w-7xl w-fit mx-auto">
          <div className="flex flex-row my-4 justify-between">
            <Card className="">
              <CardContent className="flex flex-row space-x-4 items-center p-6">
                <Button
                  variant="outline"
                  onClick={() => {
                    sendJsonMessage({ ID: 'ping' });
                  }}
                >
                  Ping
                </Button>
                <Separator orientation="vertical" className="h-16" />
                <div className="flex flex-col gap-2">
                  <Badge
                    variant={connected ? 'secondary' : 'destructive'}
                    className="w-min"
                  >
                    {connected ? 'Connected' : 'Disconnected'}
                  </Badge>
                  <TypographySmall>
                    Connected clients: {Object.keys(clients).length}
                  </TypographySmall>
                </div>
              </CardContent>
            </Card>
            <div className="flex flex-col md:flex-row gap-2">
              <Link
                href="https://github.com/ezraH442/mchacks-11/"
                target="_blank"
                rel="noreferrer"
              >
                <Button variant="outline" size="icon">
                  <Github />
                  <span className="sr-only">GitHub</span>
                </Button>
              </Link>
              <ModeToggle />
            </div>
          </div>
          <div className="flex flex-col space-y-4 md:flex-row md:space-x-4 md:space-y-0">
            <Card className="">
              <CardHeader>
                <CardTitle>Search Space</CardTitle>
              </CardHeader>
              <CardContent>
                <InitialPointsForm
                  onSubmit={handleInitialPointSubmit}
                  disabled={training}
                />
                {/* <Button
                  className='mt-4'
                  variant="default"
                  disabled={training}
                  onClick={() => {
                    clear();
                  }}
                >
                  Clear
                </Button> */}
              </CardContent>
            </Card>
            <Card className="">
              <CardHeader>
                <CardTitle>Initial point to evaluate</CardTitle>
              </CardHeader>
              <CardContent>
                <SearchSpaceForm
                  onSubmit={handleSearchSpaceSubmit}
                  disabled={training}
                />
                {/* <Button
                  className='mt-4'
                  variant="default"
                  disabled={training}
                  onClick={() => {
                    clear();
                  }}
                >
                  Clear
                </Button> */}
              </CardContent>
            </Card>
            <div className="">
              <Button
                className="mb-4"
                variant="outline"
                disabled={training || !connected}
                onClick={() => {
                  startTraining(initialPoint, searchSpace);
                }}
              >
                Start Training
              </Button>
              <div className="flex flex-col space-y-3 overflow-y-scroll">
                <Card className="">
                  <CardHeader>
                    <CardTitle>Connected Workers</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {Object.values(clients).map((client) => (
                      <ClientCard key={client.id} client={client} />
                    ))}
                    {/* Not sure if this will look good with the client cards in it */}
                  </CardContent>
                </Card>
                <Card className="">
                  <CardHeader>
                    <CardTitle>Progress</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p>
                      Trials Remaining: WIP (implement realtime feedback)
                      {/* Trials Remaining: WIP {initialPoint.length - totalResults} */}
                    </p>
                    <p>Best Loss: {round(bestResult, 3)}</p>
                    <p>Best Trial: </p>
                    {/* Implement! */}
                    <p>Trials</p>
                    {totalResults !== 0 ? (
                      <HyperparametersView hyperparameters={bestParameters} />
                    ) : (
                      <p>No results yet</p>
                    )}
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
                  </CardContent>
                </Card>
              </div>
            </div>
            {/* <div>
              <TypographyH2>Hyperparameters to train:</TypographyH2>
              <div
                className="border bg-gray-50 border-dashed rounded-md py-2 border-gray-200 items-center"
                style={{ width: 500 }}
              >
                <div className="overflow-y-scroll h-[688px]">
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
            </div> */}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
