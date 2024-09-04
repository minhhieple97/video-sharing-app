import {
  Controller,
  Post,
  Body,
  UseGuards,
  ValidationPipe,
  Req,
  HttpCode,
  HttpStatus,
  Get,
  Query,
} from '@nestjs/common';
import { VideoService } from './video.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt.guard';
import { ShareVideoDto } from './dto/share-video.dto';
import { IAuthorizedRequest } from 'src/auth/interfaces';
import { GetVideosDto } from './dto/get-videos.dto';

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
  @Get()
  async getVideos(@Query() getVideosDto: GetVideosDto) {
    const skipNumber = getVideosDto.skip || 0;
    const takeNumber = getVideosDto.take || 10;
    return this.videoService.getVideos(skipNumber, takeNumber);
  }
}
