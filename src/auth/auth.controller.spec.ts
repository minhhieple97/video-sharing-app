import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { ConfigModule } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { AuthModule } from './auth.module';
import * as argon2 from 'argon2';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';

describe('AuthController (Integration)', () => {
  let app: INestApplication;
  let prismaService: PrismaService;
  let authService: AuthService;
  let jwtService: JwtService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        AuthModule,
        ConfigModule.forRoot({
          envFilePath: '.env.test',
        }),
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    prismaService = moduleFixture.get<PrismaService>(PrismaService);
    authService = moduleFixture.get<AuthService>(AuthService);
    jwtService = moduleFixture.get<JwtService>(JwtService);
  });

  afterAll(async () => {
    await prismaService.video.deleteMany();
    await prismaService.user.deleteMany();
    await prismaService.$disconnect();
    await app.close();
  });

  describe('/auth/register (POST)', () => {
    it('should register a new user', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'test@example.com',
          password: await argon2.hash('password123'),
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.email).toBe('test@example.com');
      expect(response.body.token).toBeDefined();
      const decodedToken = jwtService.decode(response.body.token);
      expect(decodedToken).toHaveProperty('id');
      expect(decodedToken).toHaveProperty('email');
      expect(decodedToken).toHaveProperty('iat');
    });

    it('should return 400 for invalid input', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({ email: 'invalid-email', password: '123' })
        .expect(400);
    });
  });

  describe('/auth/login (POST)', () => {
    it('should login an existing user', async () => {
      const user = {
        email: 'existing@example.com',
        password: 'password123',
      };
      await prismaService.user.create({
        data: {
          email: user.email,
          password: await argon2.hash(user.password),
        },
      });
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send(user)
        .expect(200);

      expect(response.body).toHaveProperty('id');
      expect(response.body.email).toBe(user.email);
      expect(response.body.token).toBeDefined();

      const decodedToken = jwtService.decode(response.body.token);
      expect(decodedToken).toHaveProperty('id');
      expect(decodedToken).toHaveProperty('email');
      expect(decodedToken).toHaveProperty('iat');
    });

    it('should return 401 for invalid credentials', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'existing@example.com', password: 'wrongpassword' })
        .expect(401);
    });
  });

  describe('/auth/profile (GET)', () => {
    it('should return user profile if authenticated', async () => {
      const userExample = {
        id: 1,
        email: 'test@example.com',
      };
      const token = await authService.generateToken(userExample);
      const response = await request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toMatchObject({
        id: userExample.id,
        email: userExample.email,
      });

      expect(response.body.iat).toBeDefined();
      expect(typeof response.body.iat).toBe('number');

      const now = Math.floor(Date.now() / 1000);
      expect(response.body.iat).toBeGreaterThan(now - 60);
      expect(response.body.iat).toBeLessThanOrEqual(now);

      const fullPayload = response.body;
      expect(fullPayload).toEqual(
        expect.objectContaining({
          id: expect.any(Number),
          email: expect.any(String),
          iat: expect.any(Number),
        }),
      );
    });

    it('should return 401 if not authenticated', async () => {
      await request(app.getHttpServer()).get('/auth/profile').expect(401);
    });
  });
});
