import { formatNeuronsPerLayer, formatStatus, round } from '@/lib/utils';
import HyperparametersView from './HyperParamsView';
import { TypographyH3 } from './Typography/TypographyH3';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { EClientStatus } from '@/types';
import { IClient } from '@/models/Client';

interface ClientCardProps {
  client: IClient;
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

        {client.status === EClientStatus.WORKING && (
          <div>
            <TypographyH3>Current Params:</TypographyH3>
            <HyperparametersView hyperparameters={client.currentTask} />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ClientCard;
