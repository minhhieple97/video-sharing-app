import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { CommentsController } from '../comments.controller';
import { CommentsService } from '../comments.service';
import { CommentPaginationDto, CreateCommentDto } from '../dtos';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { JwtAuthGuard } from 'src/auth/guards/jwt.guard';
import { createMock } from '@golevelup/ts-jest';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

describe('CommentsController', () => {
  let controller: CommentsController;
  let service: CommentsService;
  let jwtService: JwtService;
  let jwtAuthGuard: JwtAuthGuard;

  const mockCommentsService = {
    findByVideoId: jest.fn(),
    create: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [JwtModule],
      controllers: [CommentsController],
      providers: [
        {
          provide: CommentsService,
          useValue: mockCommentsService,
        },
      ],
    }).compile();

    controller = module.get<CommentsController>(CommentsController);
    service = module.get<CommentsService>(CommentsService);
    jwtService = new JwtService({ secret: 'test' });
    jwtAuthGuard = new JwtAuthGuard(jwtService);
  });

  describe('findByVideoId', () => {
    it('should return comments for a valid video id', async () => {
      const mockResult = {
        comments: [{ id: 1, content: 'Test comment' }],
        nextCursor: null,
      };
      mockCommentsService.findByVideoId.mockResolvedValue(mockResult);

      const result = await controller.findByVideoId(1, {});

      expect(result).toEqual(mockResult);
      expect(service.findByVideoId).toHaveBeenCalledWith(1, {});
    });

    it('should use provided pagination parameters', async () => {
      const pagination: CommentPaginationDto = { cursor: 5, limit: 10 };
      const mockResult = {
        comments: [{ id: 6, content: 'Test comment' }],
        nextCursor: 7,
      };
      mockCommentsService.findByVideoId.mockResolvedValue(mockResult);

      const result = await controller.findByVideoId(1, pagination);

      expect(result).toEqual(mockResult);
      expect(service.findByVideoId).toHaveBeenCalledWith(1, pagination);
    });

    it('should pass through service errors', async () => {
      const error = new Error('Service error');
      mockCommentsService.findByVideoId.mockRejectedValue(error);

      await expect(controller.findByVideoId(1, {})).rejects.toThrow(error);
    });
  });
  describe('create', () => {
    it('should create a new comment when authenticated', async () => {
      const createCommentDto: CreateCommentDto = {
        content: 'Test comment',
        videoId: 1,
        parentId: null,
      };
      const userId = 1;
      const expectedResult = { id: 1, ...createCommentDto, userId };

      jest.spyOn(service, 'create').mockResolvedValue(expectedResult as any);

      const req = { user: { id: userId } };
      const guard = new JwtAuthGuard(jwtService);
      jest.spyOn(guard, 'canActivate').mockReturnValue(true);

      const result = await controller.create(createCommentDto, req as any);

      expect(service.create).toHaveBeenCalledWith(createCommentDto, userId);

      expect(result).toEqual(expectedResult);
    });

    it('should throw UnauthorizedException if no authorization header is present', () => {
      const context = createMock<ExecutionContext>({
        switchToHttp: () => ({
          getRequest: () => ({
            headers: {},
          }),
        }),
      });

      expect(() => jwtAuthGuard.canActivate(context)).toThrow(
        UnauthorizedException,
      );
    });
    it('should throw UnauthorizedException if token is invalid', () => {
      const context = createMock<ExecutionContext>({
        switchToHttp: () => ({
          getRequest: () => ({
            headers: {
              authorization: 'Bearer invalid.token.here',
            },
          }),
        }),
      });
      jest.spyOn(jwtService, 'decode').mockImplementation(() => {
        throw new Error('Invalid token');
      });

      expect(() => jwtAuthGuard.canActivate(context)).toThrow(
        UnauthorizedException,
      );
    });
    it('should throw UnauthorizedException if token format is invalid', () => {
      const context = createMock<ExecutionContext>({
        switchToHttp: () => ({
          getRequest: () => ({
            headers: {
              authorization: 'InvalidTokenFormat',
            },
          }),
        }),
      });

      expect(() => jwtAuthGuard.canActivate(context)).toThrow(
        UnauthorizedException,
      );
    });
  });
  it('should validate successfully with valid data', async () => {
    const dto = plainToInstance(CreateCommentDto, {
      content: 'This is a valid comment.',
      videoId: 1,
      parentId: 2,
    });

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should fail validation if content is empty', async () => {
    const dto = plainToInstance(CreateCommentDto, {
      content: '',
      videoId: 1,
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].constraints).toHaveProperty('isNotEmpty');
  });

  it('should fail validation if content is too long', async () => {
    const dto = plainToInstance(CreateCommentDto, {
      content: 'a'.repeat(513),
      videoId: 1,
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].constraints).toHaveProperty('maxLength');
  });

  it('should fail validation if videoId is not a number', async () => {
    const dto = plainToInstance(CreateCommentDto, {
      content: 'Valid content',
      videoId: 'not-a-number',
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].constraints).toHaveProperty('isNumber');
  });

  it('should fail validation if videoId is less than 1', async () => {
    const dto = plainToInstance(CreateCommentDto, {
      content: 'Valid content',
      videoId: 0,
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].constraints).toHaveProperty('min');
  });

  it('should pass validation if parentId is optional and not provided', async () => {
    const dto = plainToInstance(CreateCommentDto, {
      content: 'Valid content',
      videoId: 1,
    });

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should fail validation if parentId is provided but not a number', async () => {
    const dto = plainToInstance(CreateCommentDto, {
      content: 'Valid content',
      videoId: 1,
      parentId: 'not-a-number',
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].constraints).toHaveProperty('isNumber');
  });
});
