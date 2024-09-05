import { JwtService } from '@nestjs/jwt';
import { Socket } from 'socket.io';
import { JwtTokenPayload } from 'src/auth/interfaces';

type SocketMiddleware = (socket: Socket, next: (err?: Error) => void) => void;

export const AuthWsMiddleware = (jwtService: JwtService): SocketMiddleware => {
  return async (socket: Socket, next) => {
    try {
      const token = extractAccessToken(socket.handshake);
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

export const extractAccessToken = (handshake: any): string | null => {
  const authHeader = handshake['auth'];
  if (!authHeader || !authHeader.token) {
    return null;
  }
  const jwtToken = authHeader.token;
  const [bearer, token] = jwtToken.split(' ');
  return bearer === 'Bearer' && token ? token : null;
};
