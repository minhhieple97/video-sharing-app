import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { RedisIoAdapter } from './redis/redis-io.adapter';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const clientUrl = configService.get('CLIENT_URL');
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
    }),
  );
  app.setGlobalPrefix('api/v1');
  app.enableCors({
    origin: clientUrl,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH', 'HEAD'],
    credentials: true,
  });
  const redisIoAdapter = new RedisIoAdapter(app);
  await redisIoAdapter.connectToRedis();
  app.useWebSocketAdapter(redisIoAdapter);
  await app.listen(configService.get('PORT') || 3000);
}
bootstrap();
