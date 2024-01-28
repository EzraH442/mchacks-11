import { Client, ClientStatus, formatStatus } from '../lib/client';
import { formatNeuronsPerLayer, round } from '../lib/utils';
import HyperparametersView from './HyperparamsView';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

interface ClientCardProps {
  client: Client;
}

const ClientCard: React.FC<ClientCardProps> = ({ client }) => {
  return (
    <Card className="">
      <CardHeader>
        <CardTitle>{client.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <p>{client.ip}</p>
        <p>{formatStatus(client.status)}</p>

        {client.status === ClientStatus.Working && (
          <div>
            <h2>Current Params:</h2>
            <HyperparametersView hyperparameters={client.currentTask} />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ClientCard;
