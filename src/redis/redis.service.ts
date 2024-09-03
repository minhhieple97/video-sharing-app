import { Inject, Injectable } from '@nestjs/common';
import { RedisClient } from './redis.provider';

@Injectable()
export class RedisService {
  constructor(
    @Inject('REDIS_CLIENT')
    private readonly redis: RedisClient,
  ) {}

  async addUserClient(userId: number, clientId: string): Promise<void> {
    await this.redis.sadd(`user:${userId}:clients`, clientId);
  }

  async removeUserClient(userId: number, clientId: string): Promise<void> {
    await this.redis.srem(`user:${userId}:clients`, clientId);
  }

  async getUserClients(userId: number): Promise<string[]> {
    return this.redis.smembers(`user:${userId}:clients`);
  }

  async isUserOnline(userId: number): Promise<boolean> {
    const clientCount = await this.redis.scard(`user:${userId}:clients`);
    return clientCount > 0;
  }
}
