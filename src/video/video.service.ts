import { checkValidYoutubeLink } from './../helper/index';
import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ShareVideoDto } from './dto/share-video.dto';
import { getYoutubeVideoId } from 'src/helper';
import { NotificationGateway } from 'src/notification/notification.gateway';
import { YoutubeService } from 'src/youtube/youtube.service';

@Injectable()
export class VideoService {
  constructor(
    private prisma: PrismaService,
    private notificationGateway: NotificationGateway,
    private youtubeService: YoutubeService,
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
      },
    });

    Logger.log(videoDetails);

    this.notificationGateway.sendNotification({
      youtubeId: video.youtubeId,
      username: 'hieple',
      title: videoDetails.snippet.title,
    });

    return video;
  }
}
