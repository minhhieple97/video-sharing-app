import { Module } from '@nestjs/common';
import { VideoController } from './video.controller';
import { VideoService } from './video.service';
import { PrismaModule } from '../prisma/prisma.module';
import { JwtService } from '@nestjs/jwt';
import { NotificationModule } from 'src/notification/notification.module';
import { YoutubeModule } from 'src/youtube/youtube.module';

@Module({
  imports: [PrismaModule, NotificationModule, YoutubeModule],
  controllers: [VideoController],
  providers: [VideoService, JwtService],
})
export class VideoModule {}
