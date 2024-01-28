import { Client, formatStatus } from '../lib/client';
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
      </CardContent>
    </Card>
  );
};

export default ClientCard;
