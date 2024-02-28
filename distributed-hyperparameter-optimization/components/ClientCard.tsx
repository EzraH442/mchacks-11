import { formatStatus } from '@/lib/utils';
import HyperparametersView from './HyperParamsView';
import { TypographyH3 } from './Typography/TypographyH3';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { EClientStatus } from '@/types';
import { IClient } from '@/models/Client';
import { observer } from 'mobx-react-lite';
import { useStore } from '@/store';

interface ClientCardProps {
  clientId: string;
}

const ClientCard: React.FC<ClientCardProps> = observer(({ clientId }) => {
  const { training } = useStore(null);
  const client = training.workers.get(clientId);

  const getComponent = () => {
    if (!client) return <div>Client not found</div>;
    return (
      <>
        <CardHeader>
          <CardTitle>{client.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <p>{client.ip}</p>
          <p>{formatStatus(client.status)}</p>

          {client.status === EClientStatus.WORKING && (
            <div>
              <TypographyH3>Current Params:</TypographyH3>
              <HyperparametersView
                batchId={training.workerBatchMap.get(client.id)?.batchId!}
              />
            </div>
          )}
        </CardContent>
      </>
    );
  };

  return <Card className="">{getComponent()}</Card>;
});

export default ClientCard;
