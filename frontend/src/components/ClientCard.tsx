import { Client, ClientStatus, formatStatus } from '../lib/client';
import { formatNeuronsPerLayer, round } from '../lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

interface ClientCardProps {
  client: Client;
}

const ClientCard: React.FC<ClientCardProps> = ({ client }) => {
  return (
    <Card className="w-96">
      <CardHeader>
        <CardTitle>{client.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <p>{client.ip}</p>
        <p>{formatStatus(client.status)}</p>

        {client.status === ClientStatus.Working && (
          <div>
            <h2>Current Params:</h2>
            <p>Epsilon: {round(client.currentTask.epsilon ?? 0, 4)}</p>
            <p>Learning Rate: {round(client.currentTask.epsilon ?? 0, 4)}</p>
            <p>Layers: {client.currentTask.layers ?? 0}</p>
            <p>
              NeuronsPerLayer:{' '}
              {formatNeuronsPerLayer(client.currentTask.neuronsPerLayer || [])}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ClientCard;
