import { checkValidYoutubeLink } from './../helper/index';
import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ShareVideoDto } from './dto/share-video.dto';
import { getYoutubeVideoId } from 'src/helper';
import { NotificationGateway } from 'src/notification/notification.gateway';
import { YoutubeService } from 'src/youtube/youtube.service';
import { RedisService } from 'src/redis/redis.service';

@Injectable()
export class VideoService {
  constructor(
    private prisma: PrismaService,
    private notificationGateway: NotificationGateway,
    private youtubeService: YoutubeService,
    private redisService: RedisService,
  ) {}

  async shareVideo(shareVideoDto: ShareVideoDto, userId: number) {
    const { youtubeLink } = shareVideoDto;
    const youtubeId = getYoutubeVideoId(youtubeLink);
    const isValidYoutubeLink = checkValidYoutubeLink(youtubeLink);
    if (!isValidYoutubeLink || !youtubeId) {
      throw new BadRequestException('Invalid YouTube link');
    }
    const videoDetails = await this.youtubeService.getVideoInfo(youtubeId);
    const video = await this.prisma.video.create({
      data: {
        sharedBy: userId,
        youtubeId,
        title: videoDetails.snippet.title,
      },
      include: {
        user: {
          select: {
            email: true,
          },
        },
      },
    });
    const clients = await this.redisService.getUserClients(userId);
    const clientSet = new Set(clients);
    this.notificationGateway.sendVideoSharedNotification(
      {
        youtubeId: video.youtubeId,
        email: video.user.email,
        title: videoDetails.snippet.title,
      },
      clientSet,
    );
  }
  async getVideos(skip: number, limit: number) {
    const videos = await this.prisma.video.findMany({
      skip,
      take: limit,
      orderBy: {
        sharedAt: 'desc',
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });
    return videos;
  }
}
