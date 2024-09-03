import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { google, youtube_v3 } from 'googleapis';

@Injectable()
export class YoutubeService {
  private youtube: youtube_v3.Youtube;

  constructor(private configService: ConfigService) {
    this.youtube = google.youtube({
      version: 'v3',
      auth: this.configService.get<string>('YOUTUBE_API_KEY'),
    });
  }

  async getVideoInfo(videoId: string): Promise<youtube_v3.Schema$Video> {
    try {
      const response = await this.youtube.videos.list({
        part: ['snippet'],
        id: [videoId],
      });

      if (response.data.items && response.data.items.length > 0) {
        return response.data.items[0];
      } else {
        throw new Error('Video not found');
      }
    } catch (error) {
      throw new NotFoundException(error.message);
    }
  }
}
