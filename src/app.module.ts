import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { VideoModule } from './video/video.module';
import { NotificationModule } from './notification/notification.module';
import { ConfigModule } from '@nestjs/config';
@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    AuthModule,
    VideoModule,
    NotificationModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
