/* eslint-disable @typescript-eslint/no-unused-vars */

import { Injectable, Logger } from '@nestjs/common';
import {
  OnGatewayConnection,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { SocketAuth, SharedVideoNotification } from './interfaces';
import { AuthWsMiddleware } from './middlewares/auth-ws.middleware';
import { JwtService } from '@nestjs/jwt';
import { RedisService } from 'src/redis/redis.service';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  transports: ['websocket', 'polling'],
})
@Injectable()
export class NotificationGateway implements OnGatewayConnection {
  @WebSocketServer()
  io: Server;
  constructor(
    private readonly jwtService: JwtService,
    private readonly redisService: RedisService,
  ) {}

  afterInit(client: Socket) {
    Logger.log('Initialized notification gateway');
    client.use(AuthWsMiddleware(this.jwtService) as any);
  }

  async handleConnection(client: SocketAuth, ...args: any[]) {
    await this.redisService.addUserClient(client.user.id, client.id);
    Logger.log(`Client id: ${client.id} connected`);
  }

  async handleDisconnect(client: SocketAuth) {
    await this.redisService.removeUserClient(client.user.id, client.id);
    Logger.log(`Cliend id:${client.id} disconnected`);
  }

  sendVideoSharedNotification(
    sharedVideoNotification: SharedVideoNotification,
    clientSet: Set<string>,
  ) {
    this.io.sockets.sockets.forEach((socket) => {
      if (!clientSet.has(socket.id)) {
        this.sendVideoSharedNotificationToClient(
          sharedVideoNotification,
          socket.id,
        );
      }
    });
  }
  sendVideoSharedNotificationToClient(
    sharedVideoNotification: SharedVideoNotification,
    clientId: string,
  ) {
    this.io.sockets.sockets
      .get(clientId)
      .emit('share_video', sharedVideoNotification);
  }
}
