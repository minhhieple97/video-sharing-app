import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CommentPaginationDto,
  CreateCommentDto,
  UpdateCommentDto,
} from './dtos';

@Injectable()
export class CommentsService {
  constructor(private prisma: PrismaService) {}

  async create(createCommentDto: CreateCommentDto, userId: number) {
    const video = await this.prisma.video.findUnique({
      where: { id: createCommentDto.videoId },
    });
    if (!video) {
      throw new NotFoundException('Video not found');
    }
    return this.prisma.comment.create({
      data: {
        ...createCommentDto,
        userId,
      },
    });
  }

  async findByVideoId(
    videoId: number,
    { cursor, limit }: CommentPaginationDto,
  ) {
    const comments = await this.prisma.comment.findMany({
      where: {
        videoId,
        isDeleted: false,
        parentId: null,
      },
      skip: 0,
      take: limit + 1,
      ...(cursor && { cursor: { id: cursor } }),
      orderBy: {
        createdAt: 'asc',
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });

    let nextCursor: number | null = null;
    if (comments.length > limit) {
      const nextItem = comments.pop();
      nextCursor = nextItem.id;
    }

    return {
      comments,
      nextCursor,
    };
  }

  async update(id: number, updateCommentDto: UpdateCommentDto, userId: number) {
    const comment = await this.prisma.comment.findUnique({
      where: { id },
    });
    if (!comment) {
      throw new NotFoundException('Comment not found');
    }
    if (comment.userId !== userId) {
      throw new ForbiddenException(
        'You are not allowed to update this comment',
      );
    }
    return this.prisma.comment.update({
      where: { id },
      data: updateCommentDto,
    });
  }

  async delete(id: number, userId: number) {
    const comment = await this.prisma.comment.findUnique({
      where: { id },
    });
    if (!comment) {
      throw new NotFoundException('Comment not found');
    }
    if (comment.userId !== userId) {
      throw new ForbiddenException(
        'You are not allowed to delete this comment',
      );
    }
    await this.prisma.comment.update({
      where: { id },
      data: { isDeleted: true },
    });
    await this.markChildCommentsAsDeleted(id);
  }

  async getReplies(parentId: number, { cursor, limit }: CommentPaginationDto) {
    const parentComment = await this.prisma.comment.findUnique({
      where: { id: parentId },
    });

    if (!parentComment) {
      throw new NotFoundException(
        `Parent comment with ID ${parentId} not found`,
      );
    }
    const comments = await this.prisma.comment.findMany({
      where: {
        parentId,
        isDeleted: false,
      },
      take: limit + 1, // Take one extra to know if there are more
      skip: 0,
      ...(cursor && { cursor: { id: cursor } }),
      orderBy: {
        createdAt: 'asc',
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });

    let nextCursor: number | null = null;
    if (comments.length > limit) {
      const nextItem = comments.pop();
      nextCursor = nextItem.id;
    }

    return {
      comments,
      nextCursor,
    };
  }

  private async markChildCommentsAsDeleted(parentId: number) {
    const childComments = await this.prisma.comment.findMany({
      where: { parentId },
    });

    for (const comment of childComments) {
      await this.prisma.comment.update({
        where: { id: comment.id },
        data: { isDeleted: true },
      });
      await this.markChildCommentsAsDeleted(comment.id);
    }
  }
}
