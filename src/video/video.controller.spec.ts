/* eslint-disable @typescript-eslint/no-unused-vars */
import { Test, TestingModule } from '@nestjs/testing';
import { VideoService } from './video.service';
import { ShareVideoDto } from './dto/share-video.dto';
import * as argon2 from 'argon2';
import * as cookieParser from 'cookie-parser';
import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuthService } from 'src/auth/auth.service';
import { VideoModule } from './video.module';
import { ConfigModule } from '@nestjs/config';
import { User } from '@prisma/client';
import { JWT_COOKIE_NAME } from 'src/constants';
import { AuthModule } from 'src/auth/auth.module';
import { GetVideosDto } from './dto/get-videos.dto';

describe('VideoController (integration)', () => {
  let app: INestApplication;
  let videoService: VideoService;
  let prismaService: PrismaService;
  let authService: AuthService;
  let user: User;
  let token: string;
  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        VideoModule,
        AuthModule,
        ConfigModule.forRoot({
          envFilePath: '.env.test',
        }),
      ],
    }).compile();

    app = moduleFixture.createNestApplication();

    prismaService = moduleFixture.get<PrismaService>(PrismaService);
    authService = moduleFixture.get<AuthService>(AuthService);
    videoService = moduleFixture.get<VideoService>(VideoService);
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
      }),
    );
    app.use(cookieParser());
    await app.init();

    videoService = moduleFixture.get<VideoService>(VideoService);
    user = await prismaService.user.create({
      data: {
        email: 'existing@example.com',
        password: await argon2.hash('password123'),
      },
    });
    token = await authService.generateToken(user);
  });

  afterAll(async () => {
    await prismaService.video.deleteMany();
    await prismaService.user.deleteMany();
    await prismaService.$disconnect();
    await app.close();
  });

  describe('POST /videos/share', () => {
    it('should share a video successfully', async () => {
      const shareVideoDto: ShareVideoDto = {
        youtubeLink: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      };

      const response = await request(app.getHttpServer())
        .post('/videos/share')
        .set('Cookie', [`${JWT_COOKIE_NAME}=${token}`])
        .send(shareVideoDto)
        .expect(HttpStatus.CREATED);

      expect(response.body).toEqual({});
    });

    it('should return 401 for unauthenticated user', async () => {
      const invalidShareVideoDto: ShareVideoDto = {
        youtubeLink: 'not-a-valid-url',
      };

      await request(app.getHttpServer())
        .post('/videos/share')
        .send(invalidShareVideoDto)
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should return 400 for invalid video URL', async () => {
      const invalidShareVideoDto: ShareVideoDto = {
        youtubeLink: 'not-a-valid-url',
      };
      await request(app.getHttpServer())
        .post('/videos/share')
        .set('Cookie', [`${JWT_COOKIE_NAME}=${token}`])
        .send(invalidShareVideoDto)
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('should return 400 for non-YouTube URL', async () => {
      const invalidShareVideoDto: ShareVideoDto = {
        youtubeLink: 'https://vimeo.com/123456789',
      };

      await request(app.getHttpServer())
        .post('/videos/share')
        .set('Cookie', [`${JWT_COOKIE_NAME}=${token}`])
        .send(invalidShareVideoDto)
        .expect(HttpStatus.BAD_REQUEST);
    });
    afterAll(async () => {
      await prismaService.video.deleteMany();
    });
  });

  describe('GET /videos', () => {
    beforeEach(async () => {
      await prismaService.video.createMany({
        data: [
          {
            title: 'Video 1',
            youtubeId: 'dQw4w9WgXcQ',
            sharedBy: user.id,
          },
          {
            title: 'Video 2',
            youtubeId: 'dQw4w9WgsdQ',
            sharedBy: user.id,
          },
        ],
      });
    });
    it('should get videos with default pagination', async () => {
      const response = await request(app.getHttpServer())
        .get('/videos')
        .expect(HttpStatus.OK);
      expect(response.body).toHaveLength(2);
      expect(response.body[0]).toMatchObject({
        id: expect.any(Number),
        sharedAt: expect.any(String),
        sharedBy: user.id,
        title: 'Video 1',
        user: {
          email: user.email,
          id: user.id,
        },
        youtubeId: 'dQw4w9WgXcQ',
      });
      expect(response.body[1]).toMatchObject({
        id: expect.any(Number),
        sharedAt: expect.any(String),
        sharedBy: user.id,
        title: 'Video 2',
        user: {
          email: user.email,
          id: user.id,
        },
        youtubeId: 'dQw4w9WgsdQ',
      });
    });

    it('should not get videos with over the limit skip value', async () => {
      const getVideosDto: GetVideosDto = { skip: 5, take: 20 };

      const response = await request(app.getHttpServer())
        .get(`/videos?skip=${getVideosDto.skip}&take=${getVideosDto.take}`)
        .expect(HttpStatus.OK);
      expect(response.body).toHaveLength(0);
    });

    it('should get videos with over the limit take value', async () => {
      const getVideosDto: GetVideosDto = { skip: 0, take: 2 };

      const response = await request(app.getHttpServer())
        .get(`/videos?skip=${getVideosDto.skip}&take=${getVideosDto.take}`)
        .expect(HttpStatus.OK);
      expect(response.body).toHaveLength(2);
    });

    it('should handle negative skip value', async () => {
      const getVideosDto: GetVideosDto = { skip: -5, take: 10 };

      await request(app.getHttpServer())
        .get(`/videos?skip=${getVideosDto.skip}&take=${getVideosDto.take}`)
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('should handle negative take value', async () => {
      const getVideosDto: GetVideosDto = { skip: 0, take: -10 };

      await request(app.getHttpServer())
        .get(`/videos?skip=${getVideosDto.skip}&take=${getVideosDto.take}`)
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('should handle zero take value', async () => {
      const getVideosDto: GetVideosDto = { skip: 0, take: 0 };

      await request(app.getHttpServer())
        .get(`/videos?skip=${getVideosDto.skip}&take=${getVideosDto.take}`)
        .expect(HttpStatus.BAD_REQUEST);
    });

    afterEach(async () => {
      await prismaService.video.deleteMany();
    });
  });
});
