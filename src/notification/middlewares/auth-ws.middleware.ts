import { JwtService } from '@nestjs/jwt';
import { IncomingHttpHeaders } from 'http';
import { Socket } from 'socket.io';
import { JwtTokenPayload } from 'src/auth/interfaces';
import { JWT_COOKIE_NAME } from 'src/constants';

type SocketMiddleware = (socket: Socket, next: (err?: Error) => void) => void;

export const AuthWsMiddleware = (jwtService: JwtService): SocketMiddleware => {
  return async (socket: Socket, next) => {
    try {
      const token = extractAccessToken(socket.handshake.headers);
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

export const extractAccessToken = (
  header: IncomingHttpHeaders,
): string | null => {
  const cookieString = header.cookie;
  if (!cookieString) {
    return null;
  }
  const cookies = cookieString.split(';').reduce((acc, cookie) => {
    const [key, value] = cookie.trim().split('=');
    acc[key] = value;
    return acc;
  }, {});
  return cookies[JWT_COOKIE_NAME] || null;
};
