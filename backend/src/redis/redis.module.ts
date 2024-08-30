import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { redisProvider } from './redis.provider';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [redisProvider],
  exports: [],
})
export class RedisModule {}
