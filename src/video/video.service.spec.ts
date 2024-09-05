/* eslint-disable @typescript-eslint/no-unused-vars */
import { Test, TestingModule } from '@nestjs/testing';
import { VideoService } from './video.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationGateway } from 'src/notification/notification.gateway';
import { YoutubeService } from 'src/youtube/youtube.service';
import { RedisService } from 'src/redis/redis.service';
import { BadRequestException } from '@nestjs/common';
import * as helper from '../helper';

jest.mock('../helper', () => ({
  checkValidYoutubeLink: jest.fn(),
  getYoutubeVideoId: jest.fn(),
}));

describe('VideoService', () => {
  let service: VideoService;
  let prismaService: PrismaService;
  let notificationGateway: NotificationGateway;
  let youtubeService: YoutubeService;
  let redisService: RedisService;

  const mockPrismaService = {
    video: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
  };

  const mockNotificationGateway = {
    sendVideoSharedNotification: jest.fn(),
  };

  const mockYoutubeService = {
    getVideoInfo: jest.fn(),
  };

  const mockRedisService = {
    getUserClients: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VideoService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: NotificationGateway, useValue: mockNotificationGateway },
        { provide: YoutubeService, useValue: mockYoutubeService },
        { provide: RedisService, useValue: mockRedisService },
      ],
    }).compile();

    service = module.get<VideoService>(VideoService);
    prismaService = module.get<PrismaService>(PrismaService);
    notificationGateway = module.get<NotificationGateway>(NotificationGateway);
    youtubeService = module.get<YoutubeService>(YoutubeService);
    redisService = module.get<RedisService>(RedisService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('shareVideo', () => {
    const mockShareVideoDto = {
      youtubeLink: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    };
    const mockUserId = 1;
    const mockYoutubeId = 'dQw4w9WgXcQ';

    it('should successfully share a video', async () => {
      (helper.checkValidYoutubeLink as jest.Mock).mockReturnValue(true);
      (helper.getYoutubeVideoId as jest.Mock).mockReturnValue(mockYoutubeId);
      mockYoutubeService.getVideoInfo.mockResolvedValue({
        snippet: { title: 'Test Video' },
      });
      mockPrismaService.video.create.mockResolvedValue({
        youtubeId: mockYoutubeId,
        user: { email: 'test@example.com' },
      });
      mockRedisService.getUserClients.mockResolvedValue(['client1', 'client2']);

      await service.shareVideo(mockShareVideoDto, mockUserId);

      expect(mockPrismaService.video.create).toHaveBeenCalled();
      expect(
        mockNotificationGateway.sendVideoSharedNotification,
      ).toHaveBeenCalled();
    });

    it('should throw BadRequestException for invalid YouTube link', async () => {
      (helper.checkValidYoutubeLink as jest.Mock).mockReturnValue(false);

      await expect(
        service.shareVideo(mockShareVideoDto, mockUserId),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when YouTube ID is not found', async () => {
      (helper.checkValidYoutubeLink as jest.Mock).mockReturnValue(true);
      (helper.getYoutubeVideoId as jest.Mock).mockReturnValue(null);

      await expect(
        service.shareVideo(
          { youtubeLink: 'https://www.youtube.com/watch?v=invalid' },
          1,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should handle YouTube API errors gracefully', async () => {
      (helper.checkValidYoutubeLink as jest.Mock).mockReturnValue(true);
      (helper.getYoutubeVideoId as jest.Mock).mockReturnValue('validId');
      mockYoutubeService.getVideoInfo.mockRejectedValue(
        new Error('YouTube API Error'),
      );

      await expect(
        service.shareVideo(
          { youtubeLink: 'https://www.youtube.com/watch?v=validId' },
          1,
        ),
      ).rejects.toThrow('YouTube API Error');
    });

    it('should not send notification if no other clients are connected', async () => {
      (helper.checkValidYoutubeLink as jest.Mock).mockReturnValue(true);
      (helper.getYoutubeVideoId as jest.Mock).mockReturnValue('validId');
      mockYoutubeService.getVideoInfo.mockResolvedValue({
        snippet: { title: 'Test Video' },
      });
      mockPrismaService.video.create.mockResolvedValue({
        youtubeId: 'validId',
        user: { email: 'test@example.com' },
      });
      mockRedisService.getUserClients.mockResolvedValue([]);

      await service.shareVideo(
        { youtubeLink: 'https://www.youtube.com/watch?v=validId' },
        1,
      );

      expect(
        mockNotificationGateway.sendVideoSharedNotification,
      ).not.toHaveBeenCalled();
    });
  });

  describe('getVideos', () => {
    it('should return videos', async () => {
      const mockVideos = [
        {
          id: 1,
          title: 'Video 1',
          user: { id: 1, email: 'user1@example.com' },
        },
        {
          id: 2,
          title: 'Video 2',
          user: { id: 2, email: 'user2@example.com' },
        },
      ];
      mockPrismaService.video.findMany.mockResolvedValue(mockVideos);

      const result = await service.getVideos(0, 10);

      expect(result).toEqual(mockVideos);
      expect(mockPrismaService.video.findMany).toHaveBeenCalledWith({
        skip: 0,
        take: 10,
        orderBy: { sharedAt: 'desc' },
        include: { user: { select: { id: true, email: true } } },
      });
    });
    it('should return an empty array when no videos are found', async () => {
      mockPrismaService.video.findMany.mockResolvedValue([]);

      const result = await service.getVideos(0, 10);

      expect(result).toEqual([]);
      expect(mockPrismaService.video.findMany).toHaveBeenCalled();
    });

    it('should handle pagination correctly', async () => {
      const mockVideos = [
        {
          id: 3,
          title: 'Video 3',
          user: { id: 3, email: 'user3@example.com' },
        },
        {
          id: 4,
          title: 'Video 4',
          user: { id: 4, email: 'user4@example.com' },
        },
      ];
      mockPrismaService.video.findMany.mockResolvedValue(mockVideos);
      const result = await service.getVideos(2, 2);
      expect(result).toEqual(mockVideos);
      expect(mockPrismaService.video.findMany).toHaveBeenCalledWith({
        skip: 2,
        take: 2,
        orderBy: { sharedAt: 'desc' },
        include: { user: { select: { id: true, email: true } } },
      });
    });
  });
});
