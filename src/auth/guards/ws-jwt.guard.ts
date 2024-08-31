import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Socket } from 'socket.io';

@Injectable()
export class WsJwtGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (context.getType() !== 'ws') {
      return true;
    }
    const socket = context.switchToWs().getClient();
    const { authorization } = socket.handshake.headers;
    Logger.log(authorization);
    return false;
  }
  static validateToken(client: Socket) {
    const { authorization } = client.handshake.headers;
    if (!authorization) {
      throw new Error('Authorization token is missing');
    }
    const token = authorization.split(' ')[1];
    // const payload = decode(token);
    return token;
  }
}
