'use client';
import { Button } from '@/components/ui/button';
import ClientCard from '@/components/ClientCard';
import { Toaster } from '@/components/ui/toaster';
import useMasterWebSocket from '@/hooks/useMasterWebsocket';
import InitialPointsForm from '@/components/InitialPointForm';
import { z } from 'zod';
import HyperparametersView from '@/components/HyperParamsView';
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
import * as g from '@/auto-generated';

function App() {
  const { training } = useStore(null);

  const { connected, sendJsonMessage } = useMasterWebSocket({
    url:
      process.env.NODE_ENV === 'production'
        ? 'wss://mchacks11.ezrahuang.com/master-socket'
        : 'ws://localhost:8080/master',
  });

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
                    const message: g.PingResponse = { id: g.PingResponseID };
                    sendJsonMessage(message);
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
                    Connected clients: {training.workers.size}
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
                <SearchSpaceForm
                  onSubmit={() => {}}
                  disabled={training.currentlyTraining}
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
                <InitialPointsForm
                  onSubmit={() => {}}
                  disabled={training.currentlyTraining}
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
                disabled={training.currentlyTraining || !connected}
                onClick={() => {
                  // startTraining(initialPoint, searchSpace);
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
                    {Array.from(training.workers.entries()).map(([k, v]) => (
                      <ClientCard key={k} client={v} />
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
                    {training.hasBestBatch() && (
                      <div>
                        <p>{`Best Loss: ${training.getBestBatch()!.loss}`}</p>
                        <p>Best Trial: </p>
                        <p>
                          <HyperparametersView
                            batchId={training.bestBatchId!}
                          />
                        </p>
                      </div>
                    )}
                    {/* Implement! */}
                    <p>Trials</p>
                    {training.batches.size !== 0 ? (
                      <div>
                        {Array.from(training.batches.entries()).map(
                          ([k, v]) => (
                            <div key={k}>
                              <p>{`Trial ${k}`}</p>
                              <HyperparametersView batchId={k} />
                            </div>
                          ),
                        )}
                      </div>
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
