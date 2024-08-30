/* eslint-disable @typescript-eslint/no-unused-vars */

import { Injectable, Logger, UseGuards } from '@nestjs/common';
import {
  OnGatewayConnection,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Notification, ServerToClientEvents } from './interfaces';
import { AuthWsMiddleware } from './middlewares/auth-ws.middleware';
import { JwtService } from '@nestjs/jwt';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  transports: ['websocket'],
})
@Injectable()
export class NotificationGateway implements OnGatewayConnection {
  @WebSocketServer()
  io: Server<any, ServerToClientEvents>;
  constructor(private readonly jwtService: JwtService) {}

  afterInit(client: Socket) {
    Logger.log('Initialized notification gateway');
    client.use(AuthWsMiddleware(this.jwtService) as any);
  }

  handleConnection(client: Socket, ...args: any[]) {
    const { sockets } = this.io.sockets;
    Logger.log(`Client id: ${client.id} connected`);
    Logger.log(`Number of connected clients: ${sockets.size}`);
  }

  handleDisconnect(client: any) {
    Logger.log(`Cliend id:${client.id} disconnected`);
  }

  sendNotification(notification: Notification) {
    this.io.emit('sendNotification', notification);
  }
}
