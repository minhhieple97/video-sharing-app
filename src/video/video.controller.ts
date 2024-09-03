import {
  Controller,
  Post,
  Body,
  UseGuards,
  ValidationPipe,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { VideoService } from './video.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt.guard';
import { ShareVideoDto } from './dto/share-video.dto';
import { IAuthorizedRequest } from 'src/auth/interfaces';

@Controller('videos')
export class VideoController {
  constructor(private readonly videoService: VideoService) {}

  @UseGuards(JwtAuthGuard)
  @Post('share')
  @HttpCode(HttpStatus.CREATED)
  async shareVideo(
    @Body(ValidationPipe) shareVideoDto: ShareVideoDto,
    @Req() req: IAuthorizedRequest,
  ) {
    const user = req.user;
    return this.videoService.shareVideo(shareVideoDto, user.id);
  }
}
