import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { YoutubeService } from './youtube.service';
import { NotFoundException } from '@nestjs/common';

jest.mock('googleapis', () => ({
  google: {
    youtube: jest.fn(() => ({
      videos: {
        list: jest.fn(),
      },
    })),
  },
}));

describe('YoutubeService', () => {
  let service: YoutubeService;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        YoutubeService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('mock-api-key'),
          },
        },
      ],
    }).compile();

    service = module.get<YoutubeService>(YoutubeService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getVideoInfo', () => {
    it('should return video info when video exists', async () => {
      const mockVideoData = {
        data: {
          items: [{ id: 'test-video-id', snippet: { title: 'Test Video' } }],
        },
      };
      jest
        .spyOn(service['youtube'].videos, 'list')
        .mockResolvedValue(mockVideoData as never);

      const result = await service.getVideoInfo('test-video-id');

      expect(result).toEqual(mockVideoData.data.items[0]);
      expect(service['youtube'].videos.list).toHaveBeenCalledWith({
        part: ['snippet'],
        id: ['test-video-id'],
      });
    });

    it('should throw NotFoundException when video is not found', async () => {
      jest
        .spyOn(service['youtube'].videos, 'list')
        .mockResolvedValue({ data: { items: [] } } as never);

      await expect(service.getVideoInfo('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException when API call fails', async () => {
      jest
        .spyOn(service['youtube'].videos, 'list')
        .mockRejectedValue(new Error('API Error') as never);

      await expect(service.getVideoInfo('test-video-id')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should handle videos with missing snippet information', async () => {
      const mockVideoData = {
        data: {
          items: [{ id: 'test-video-id' }],
        },
      };
      jest
        .spyOn(service['youtube'].videos, 'list')
        .mockResolvedValue(mockVideoData as never);

      const result = await service.getVideoInfo('test-video-id');

      expect(result).toEqual(mockVideoData.data.items[0]);
      expect(result.snippet).toBeUndefined();
    });

    it('should throw NotFoundException for empty video ID', async () => {
      await expect(service.getVideoInfo('')).rejects.toThrow(NotFoundException);
    });

    it('should handle API response with unexpected structure', async () => {
      const mockVideoData = { data: {} };
      jest
        .spyOn(service['youtube'].videos, 'list')
        .mockResolvedValue(mockVideoData as never);

      await expect(service.getVideoInfo('test-video-id')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should use correct API key from ConfigService', async () => {
      const mockVideoData = {
        data: {
          items: [{ id: 'test-video-id', snippet: { title: 'Test Video' } }],
        },
      };
      jest
        .spyOn(service['youtube'].videos, 'list')
        .mockResolvedValue(mockVideoData as never);

      await service.getVideoInfo('test-video-id');

      expect(service['youtube'].videos.list).toHaveBeenCalledWith(
        expect.objectContaining({
          key: 'mock-api-key',
        }),
      );
    });
  });
});
