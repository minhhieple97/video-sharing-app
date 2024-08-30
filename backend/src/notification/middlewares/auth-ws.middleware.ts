import { JwtService } from '@nestjs/jwt';
import { Socket } from 'socket.io';
import { JwtTokenPayload } from 'src/auth/interfaces';

type SocketMiddleware = (socket: Socket, next: (err?: Error) => void) => void;

export const AuthWsMiddleware = (jwtService: JwtService): SocketMiddleware => {
  return async (socket: Socket, next) => {
    try {
      const token = socket.handshake?.headers?.authorization;
      if (!token) {
        throw new Error('Authorization token is missing');
      }

      let payload: JwtTokenPayload | null = null;

      try {
        payload = await jwtService.decode(token);
      } catch (error) {
        throw new Error('Authorization token is invalid');
      }

      if (!payload) {
        throw new Error('Unauthorized');
      }

      socket = Object.assign(socket, {
        user: payload,
      });
      next();
    } catch (error) {
      next(new Error('Unauthorized'));
    }
  };
};
