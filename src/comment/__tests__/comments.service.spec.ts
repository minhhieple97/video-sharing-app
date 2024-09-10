import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../prisma/prisma.service';
import { Comment, User } from '@prisma/client';
import { CommentsService } from '../comments.service';

describe('CommentService', () => {
  let commentsService: CommentsService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    comment: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommentsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    commentsService = module.get<CommentsService>(CommentsService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const mockUser: User = {
    id: 1,
    email: 'test@example.com',
    password: 'password',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockComment: Comment & { user: User } = {
    id: 1,
    content: 'Test comment',
    createdAt: new Date(),
    updatedAt: new Date(),
    userId: 1,
    videoId: 1,
    parentId: null,
    isDeleted: false,
    user: mockUser,
  };

  describe('findByVideoId', () => {
    it('should return comments and nextCursor with default pagination', async () => {
      const mockComments = Array(5).fill({ ...mockComment, user: mockUser });
      mockPrismaService.comment.findMany.mockResolvedValue(mockComments);

      const result = await commentsService.findByVideoId(1, {
        cursor: 0,
        limit: 5,
      });

      expect(result.comments).toHaveLength(5);
      expect(result.nextCursor).toBeNull();
      expect(prismaService.comment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { videoId: 1, isDeleted: false, parentId: null },
          take: 6,
          orderBy: { createdAt: 'asc' },
        }),
      );
    });

    it('should return comments and nextCursor with custom pagination', async () => {
      const mockComments = new Array(8).fill({
        ...mockComment,
        user: mockUser,
      });
      mockPrismaService.comment.findMany.mockResolvedValue(
        structuredClone(mockComments),
      );

      const result = await commentsService.findByVideoId(1, {
        cursor: 5,
        limit: 7,
      });
      expect(result.comments).toHaveLength(7);
      expect(result.nextCursor).toBe(mockComments[7].id);
      expect(prismaService.comment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { videoId: 1, isDeleted: false, parentId: null },
          skip: 0,
          take: 8,
          cursor: { id: 5 },
          orderBy: { createdAt: 'asc' },
        }),
      );
    });

    it('should return empty array for non-existent videoId', async () => {
      mockPrismaService.comment.findMany.mockResolvedValue([]);

      const result = await commentsService.findByVideoId(999, {});

      expect(result.comments).toHaveLength(0);
      expect(result.nextCursor).toBeNull();
    });

    it('should not include deleted comments', async () => {
      const mockComments = [
        { ...mockComment, user: mockUser },
        { ...mockComment, id: 2, isDeleted: true, user: mockUser },
        { ...mockComment, id: 3, user: mockUser },
      ];
      mockPrismaService.comment.findMany.mockResolvedValue(
        mockComments.filter((c) => !c.isDeleted),
      );

      const result = await commentsService.findByVideoId(1, {});

      expect(result.comments).toHaveLength(2);
      expect(result.comments.some((c) => c.isDeleted)).toBeFalsy();
    });

    it('should not include comments with parentId', async () => {
      const mockComments = [
        { ...mockComment, user: mockUser },
        { ...mockComment, id: 2, parentId: 1, user: mockUser },
        { ...mockComment, id: 3, user: mockUser },
      ];
      mockPrismaService.comment.findMany.mockResolvedValue(
        mockComments.filter((c) => c.parentId === null),
      );

      const result = await commentsService.findByVideoId(1, {});

      expect(result.comments).toHaveLength(2);
      expect(result.comments.some((c) => c.parentId !== null)).toBeFalsy();
    });
  });
});
