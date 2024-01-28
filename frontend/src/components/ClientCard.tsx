import { Client, formatStatus } from '../lib/client';

interface ClientCardProps {
  client: Client;
}

const ClientCard: React.FC<ClientCardProps> = ({ client }) => {
  return (
    <div>
      <p>{client.ip}</p>
      <p>{formatStatus(client.status)}</p>
    </div>
  );
};

export default ClientCard;
