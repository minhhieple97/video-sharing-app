import { Socket } from 'socket.io';
import { JwtTokenPayload } from 'src/auth/interfaces';

export interface SharedVideoNotification {
  youtubeId: string;
  email: string;
  title: string;
}

export interface SocketAuth extends Socket {
  user: JwtTokenPayload;
}
