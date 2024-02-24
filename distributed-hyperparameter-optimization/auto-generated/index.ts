// Code generated by tygo. DO NOT EDIT.

//////////
// source: master_messages.go

export const ClientConnectedMessageID = "client-connected";
export const ClientDisconnectedMessageID = "client-disconnected";
export const AllClientsMessageID = "get-all-clients";
export const ClientFinishedTrainingMessageID = "client-finished-training";
export const ClientStartedTrainingMessageID = "client-started-training";
export const TrainingCompletedMessageID = "training-completed";
export interface Message {
  id: string;
}
export interface TextMessage {
  id: string;
  message: string;
}
export interface Worker {
  worker_id: string /* uuid */;
  ip: string;
  name: string;
  status: string;
}
export interface ClientConnectionStatusMessage {
  id: string;
  worker: Worker;
}
export interface ClientStartedTrainingMessage {
  id: string;
  worker_id: string;
  parameters_id: string;
  parameters: any;
  time_started: number /* int64 */;
}
export interface ClientFinishedTrainingMessage {
  id: string;
  worker_id: string;
  parameters_id: string;
  loss: number /* float64 */;
  time_finished: number /* int64 */;
}
export interface GetAllClientsMessage {
  id: string;
  workers: Worker[];
}
export const InitiateTrainingResponseID = "initiate-training";
export const StartTrainingResponseID = "start-training";
export const PauseTrainingResponseID = "pause-training";
export interface InitiateTrainingResponse {
  id: string;
  initial_params: any;
  search_space: any;
}
export interface StartTrainingResponse {
  id: string;
}
export interface PauseTrainingResponse {
  id: string;
}
