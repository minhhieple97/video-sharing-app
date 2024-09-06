/* eslint-disable @typescript-eslint/no-unused-vars */
import { Test, TestingModule } from '@nestjs/testing';
import { VideoService } from './video.service';
import { ShareVideoDto } from './dto/share-video.dto';
import { JwtModule } from '@nestjs/jwt';

import { VideoModule } from './video.module';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from 'src/auth/auth.module';
import { VideoController } from './video.controller';
import { IAuthorizedRequest } from 'src/auth/interfaces';

describe('VideoController (unit)', () => {
  let videoController: VideoController;
  let videoService: VideoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [VideoModule, AuthModule, ConfigModule, JwtModule],
      controllers: [VideoController],
      providers: [
        {
          provide: VideoService,
          useValue: {
            shareVideo: jest.fn(),
            getVideos: jest.fn(),
          },
        },
      ],
    }).compile();

    videoController = module.get<VideoController>(VideoController);
    videoService = module.get<VideoService>(VideoService);
  });

  describe('shareVideo', () => {
    it('should return the result from videoService.shareVideo', async () => {
      const shareVideoDto: ShareVideoDto = {
        youtubeLink: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      };
      const userId = 1;
      const req = { user: { id: userId } } as IAuthorizedRequest;

      jest.spyOn(videoService, 'shareVideo').mockResolvedValue();

      const result = await videoController.shareVideo(shareVideoDto, req);

      expect(result).toBeUndefined();
    });
  });

  describe('getVideos', () => {
    it('should call videoService.getVideos with default parameters when not provided', async () => {
      const getVideosDto = {};
      const mockGetVideos = jest.fn().mockResolvedValue([]);
      videoService.getVideos = mockGetVideos;

      await videoController.getVideos(getVideosDto);

      expect(mockGetVideos).toHaveBeenCalledWith(0, 10);
    });

    it('should call videoService.getVideos with provided parameters', async () => {
      const getVideosDto = { skip: 5, limit: 10 };
      const mockGetVideos = jest.fn().mockResolvedValue([]);
      videoService.getVideos = mockGetVideos;

      await videoController.getVideos(getVideosDto);

      expect(mockGetVideos).toHaveBeenCalledWith(5, 10);
    });

    it('should return the result from videoService.getVideos', async () => {
      const mockVideos = [{ id: 1, title: 'Test Video' }];
      const mockGetVideos = jest.fn().mockResolvedValue(mockVideos);
      videoService.getVideos = mockGetVideos;

      const result = await videoController.getVideos({});

      expect(result).toEqual(mockVideos);
    });
  });
});
