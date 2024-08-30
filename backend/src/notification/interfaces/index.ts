export interface Notification {
  message: string;
}
export interface ServerToClientEvents {
  sendNotification: (notification: Notification) => void;
}
