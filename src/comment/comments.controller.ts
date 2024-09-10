import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
  Query,
} from '@nestjs/common';
import { CommentsService } from './comments.service';
import {
  CommentPaginationDto,
  CreateCommentDto,
  UpdateCommentDto,
} from './dtos';
import { JwtAuthGuard } from 'src/auth/guards/jwt.guard';
import { IAuthorizedRequest } from 'src/auth/interfaces';
import { PositiveNumberValidationPipe } from './pipes/validate-param.pipe';

@Controller('comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(
    @Body() createCommentDto: CreateCommentDto,
    @Req() req: IAuthorizedRequest,
  ) {
    const user = req.user;
    return this.commentsService.create(createCommentDto, user.id);
  }

  @Get('video/:id')
  findByVideoId(
    @Param('id', PositiveNumberValidationPipe) id: number,
    @Query() pagination: CommentPaginationDto,
  ) {
    return this.commentsService.findByVideoId(id, pagination);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(
    @Param('id') id: string,
    @Body() updateCommentDto: UpdateCommentDto,
    @Req() req: IAuthorizedRequest,
  ) {
    const user = req.user;
    return this.commentsService.update(+id, updateCommentDto, user.id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  delete(@Param('id') id: string, @Req() req: IAuthorizedRequest) {
    const user = req.user;
    return this.commentsService.delete(+id, user.id);
  }

  @Get(':parentId/replies')
  getReplies(
    @Param('parentId') parentId: string,
    @Query() paginationDto: CommentPaginationDto,
  ) {
    return this.commentsService.getReplies(+parentId, paginationDto);
  }
}
