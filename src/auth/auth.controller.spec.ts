import { Test, TestingModule } from '@nestjs/testing';
import { HttpException, HttpStatus } from '@nestjs/common';

import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { RegisterDto } from './dtos/register.dto';
import { LoginDto } from './dtos/login.dto';
import { IAuthorizedRequest } from './interfaces';
import { JwtAuthGuard } from './guards/jwt.guard';

jest.mock('./guards/jwt.guard');

describe('AuthController (unit)', () => {
  let authController: AuthController;
  let authService: AuthService;
  let jwtAuthGuard: JwtAuthGuard;

  const mockAuthService = {
    register: jest.fn(),
    generateToken: jest.fn(),
    login: jest.fn(),
  };

  const mockResponse = {
    json: jest.fn().mockReturnThis(),
    status: jest.fn().mockReturnThis(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
        {
          provide: JwtAuthGuard,
          useValue: {
            canActivate: jest.fn(),
          },
        },
      ],
    }).compile();

    authController = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
    jwtAuthGuard = module.get<JwtAuthGuard>(JwtAuthGuard);
  });
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(authController).toBeDefined();
  });

  describe('register', () => {
    const registerDto: RegisterDto = {
      email: 'test@example.com',
      password: 'password123',
    };
    it('should register a new user and return user with token', async () => {
      const registerDto: RegisterDto = {
        email: 'test@example.com',
        password: 'password123',
      };
      const mockUser = { id: '1', email: registerDto.email };
      const mockToken = 'mock.jwt.token';

      mockAuthService.register.mockResolvedValue(mockUser);
      mockAuthService.generateToken.mockResolvedValue(mockToken);

      await authController.register(registerDto, mockResponse as any);

      expect(authService.register).toHaveBeenCalledWith(
        registerDto.email,
        registerDto.password,
      );
      expect(authService.generateToken).toHaveBeenCalledWith(mockUser);
      expect(mockResponse.json).toHaveBeenCalledWith({
        ...mockUser,
        token: mockToken,
      });
    });
    it('should throw an exception if registration fails', async () => {
      mockAuthService.register.mockRejectedValue(
        new Error('Registration failed'),
      );

      await expect(
        authController.register(registerDto, mockResponse as any),
      ).rejects.toThrow('Registration failed');
    });

    it('should handle duplicate email error', async () => {
      mockAuthService.register.mockRejectedValue(
        new HttpException('Email already exists', HttpStatus.CONFLICT),
      );

      await expect(
        authController.register(registerDto, mockResponse as any),
      ).rejects.toThrow(HttpException);
      await expect(
        authController.register(registerDto, mockResponse as any),
      ).rejects.toHaveProperty('status', HttpStatus.CONFLICT);
    });
  });

  describe('login', () => {
    const loginDto: LoginDto = {
      email: 'test@example.com',
      password: 'password123',
    };
    it('should login a user and return user info with token', async () => {
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'password123',
      };
      const mockLoginResponse = {
        id: '1',
        email: loginDto.email,
        token: 'mock.jwt.token',
      };

      mockAuthService.login.mockResolvedValue(mockLoginResponse);

      await authController.login(loginDto, mockResponse as any);

      expect(authService.login).toHaveBeenCalledWith(loginDto);
      expect(mockResponse.json).toHaveBeenCalledWith(mockLoginResponse);
    });
    it('should throw an exception if login fails', async () => {
      mockAuthService.login.mockRejectedValue(
        new HttpException('Invalid credentials', HttpStatus.UNAUTHORIZED),
      );

      await expect(
        authController.login(loginDto, mockResponse as any),
      ).rejects.toThrow(HttpException);
      await expect(
        authController.login(loginDto, mockResponse as any),
      ).rejects.toHaveProperty('status', HttpStatus.UNAUTHORIZED);
    });

    it('should handle non-existent user error', async () => {
      mockAuthService.login.mockRejectedValue(
        new HttpException('User not found', HttpStatus.NOT_FOUND),
      );

      await expect(
        authController.login(loginDto, mockResponse as any),
      ).rejects.toThrow(HttpException);
      await expect(
        authController.login(loginDto, mockResponse as any),
      ).rejects.toHaveProperty('status', HttpStatus.NOT_FOUND);
    });
  });

  describe('profile', () => {
    it('should return user profile when authenticated', async () => {
      const mockUser = { id: '1', email: 'test@example.com' };
      const mockRequest = { user: mockUser } as unknown as IAuthorizedRequest;

      const result = await authController.profile(mockRequest as any);

      expect(result).toEqual(mockUser);
    });

    it('should return HttpStatus.OK when successful', async () => {
      const mockUser = { id: '1', email: 'test@example.com' };
      const mockRequest = { user: mockUser } as unknown as IAuthorizedRequest;

      (jwtAuthGuard.canActivate as jest.Mock).mockReturnValue(true);

      const result = await authController.profile(mockRequest);

      expect(result).toEqual(mockUser);
      // Check if the @HttpCode decorator is applied correctly
      const metadata = Reflect.getMetadata(
        '__httpCode__',
        AuthController.prototype.profile,
      );
      expect(metadata).toBe(HttpStatus.OK);
    });
  });
});
