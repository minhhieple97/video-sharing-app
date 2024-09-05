import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import {
  ConflictException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import * as argon2 from 'argon2';

jest.mock('argon2');

describe('AuthService', () => {
  let authService: AuthService;
  let prismaService: PrismaService;
  let jwtService: JwtService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn(),
              create: jest.fn(),
              findFirst: jest.fn(),
            },
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
          },
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    prismaService = module.get<PrismaService>(PrismaService);
    jwtService = module.get<JwtService>(JwtService);
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const email = 'test@example.com';
      const password = 'password123';
      const hashedPassword = 'hashedPassword123';
      const mockUser = { id: 1, email, password: hashedPassword };

      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(null);
      (argon2.hash as jest.Mock).mockResolvedValue(hashedPassword);
      (prismaService.user.create as jest.Mock).mockResolvedValue(mockUser);

      const result = await authService.register(email, password);

      expect(result).toEqual({ id: mockUser.id, email: mockUser.email });
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email },
      });
      expect(argon2.hash).toHaveBeenCalledWith(password);
      expect(prismaService.user.create).toHaveBeenCalledWith({
        data: { email, password: hashedPassword },
      });
    });

    it('should throw ConflictException if email is already registered', async () => {
      const email = 'existing@example.com';
      const password = 'password123';

      (prismaService.user.findUnique as jest.Mock).mockResolvedValue({
        id: 1,
        email,
      });

      await expect(authService.register(email, password)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should throw an error if password hashing fails', async () => {
      const email = 'test@example.com';
      const password = 'password123';

      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(null);
      (argon2.hash as jest.Mock).mockRejectedValue(new Error('Hashing failed'));

      await expect(authService.register(email, password)).rejects.toThrow(
        'Hashing failed',
      );
    });

    it('should throw an error if user creation fails', async () => {
      const email = 'test@example.com';
      const password = 'password123';
      const hashedPassword = 'hashedPassword123';

      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(null);
      (argon2.hash as jest.Mock).mockResolvedValue(hashedPassword);
      (prismaService.user.create as jest.Mock).mockRejectedValue(
        new Error('Database error'),
      );

      await expect(authService.register(email, password)).rejects.toThrow(
        'Database error',
      );
    });
  });

  describe('generateToken', () => {
    it('should generate a token for a user', async () => {
      const user = { id: 1, email: 'test@example.com' };
      const mockToken = 'mockToken123';

      (jwtService.sign as jest.Mock).mockReturnValue(mockToken);

      const result = await authService.generateToken(user);

      expect(result).toBe(mockToken);
      expect(jwtService.sign).toHaveBeenCalledWith({
        email: user.email,
        id: user.id,
      });
    });

    it('should throw an error if token generation fails', async () => {
      const user = { id: 1, email: 'test@example.com' };

      (jwtService.sign as jest.Mock).mockImplementation(() => {
        throw new Error('Token generation failed');
      });

      await expect(authService.generateToken(user)).rejects.toThrow(
        'Token generation failed',
      );
    });
  });

  describe('validateUser', () => {
    it('should validate a user with correct credentials', async () => {
      const email = 'test@example.com';
      const password = 'password123';
      const mockUser = { id: 1, email, password: 'hashedPassword123' };

      (prismaService.user.findFirst as jest.Mock).mockResolvedValue(mockUser);
      (argon2.verify as jest.Mock).mockResolvedValue(true);

      const result = await authService.validateUser(email, password);

      expect(result).toEqual(mockUser);
      expect(prismaService.user.findFirst).toHaveBeenCalledWith({
        where: { email },
      });
      expect(argon2.verify).toHaveBeenCalledWith(mockUser.password, password);
    });

    it('should throw NotFoundException if user is not found', async () => {
      const email = 'nonexistent@example.com';
      const password = 'password123';

      (prismaService.user.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(authService.validateUser(email, password)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw UnauthorizedException if password does not match', async () => {
      const email = 'test@example.com';
      const password = 'wrongpassword';
      const mockUser = { id: 1, email, password: 'hashedPassword123' };

      (prismaService.user.findFirst as jest.Mock).mockResolvedValue(mockUser);
      (argon2.verify as jest.Mock).mockResolvedValue(false);

      await expect(authService.validateUser(email, password)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw an error if password verification fails', async () => {
      const email = 'test@example.com';
      const password = 'password123';
      const mockUser = { id: 1, email, password: 'hashedPassword123' };

      (prismaService.user.findFirst as jest.Mock).mockResolvedValue(mockUser);
      (argon2.verify as jest.Mock).mockRejectedValue(
        new Error('Verification failed'),
      );

      await expect(authService.validateUser(email, password)).rejects.toThrow(
        'Verification failed',
      );
    });
  });

  describe('login', () => {
    it('should login a user and return user data with token', async () => {
      const loginDto = { email: 'test@example.com', password: 'password123' };
      const mockUser = {
        id: 1,
        email: loginDto.email,
        password: 'hashedPassword123',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const mockToken = 'mockToken123';

      jest.spyOn(authService, 'validateUser').mockResolvedValue(mockUser);
      jest.spyOn(authService, 'generateToken').mockResolvedValue(mockToken);

      const result = await authService.login(loginDto);

      expect(result).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        token: mockToken,
      });
      expect(authService.validateUser).toHaveBeenCalledWith(
        loginDto.email,
        loginDto.password,
      );
      expect(authService.generateToken).toHaveBeenCalledWith({
        id: mockUser.id,
        email: mockUser.email,
      });
    });

    it('should throw UnauthorizedException if validateUser throws', async () => {
      const loginDto = { email: 'test@example.com', password: 'wrongpassword' };

      jest
        .spyOn(authService, 'validateUser')
        .mockRejectedValue(new UnauthorizedException('Invalid credentials'));

      await expect(authService.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw an error if generateToken fails', async () => {
      const loginDto = { email: 'test@example.com', password: 'password123' };
      const mockUser = {
        id: 1,
        email: loginDto.email,
        password: 'hashedPassword123',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      jest.spyOn(authService, 'validateUser').mockResolvedValue(mockUser);
      jest
        .spyOn(authService, 'generateToken')
        .mockRejectedValue(new Error('Token generation failed'));

      await expect(authService.login(loginDto)).rejects.toThrow(
        'Token generation failed',
      );
    });
  });
});
