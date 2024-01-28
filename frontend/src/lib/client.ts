export enum ClientStatus {
  Idle,
  Working,
  Disconnected,
}

export interface Client {
  id: string;
  ip: string;
  status: ClientStatus;
}

export function formatStatus(status: ClientStatus) {
  switch (status) {
    case ClientStatus.Idle:
      return 'Idle';
    case ClientStatus.Working:
      return 'Working';
    case ClientStatus.Disconnected:
      return 'Disconnected';
  }
}
