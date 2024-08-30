import { checkValidYoutubeLink } from './../helper/index';
import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ShareVideoDto } from './dto/share-video.dto';
import { getYoutubeVideoId } from 'src/helper';
import { NotificationGateway } from 'src/notification/notification.gateway';

@Injectable()
export class VideoService {
  constructor(
    private prisma: PrismaService,
    private notificationGateway: NotificationGateway,
  ) {}

  async shareVideo(shareVideoDto: ShareVideoDto, userId: number) {
    const { youtubeLink } = shareVideoDto;
    const youtubeId = getYoutubeVideoId(youtubeLink);
    const isValidYoutubeLink = checkValidYoutubeLink(youtubeLink);
    if (!isValidYoutubeLink || !youtubeId) {
      throw new BadRequestException('Invalid YouTube link');
    }
    const video = await this.prisma.video.create({
      data: {
        sharedBy: userId,
        youtubeId,
      },
    });

    this.notificationGateway.sendNotification({
      message: 'New video shared',
    });

    return video;
  }
}
