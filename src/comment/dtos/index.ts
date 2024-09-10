import { Type } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateCommentDto {
  @IsNotEmpty()
  @IsString()
  @MinLength(1)
  @MaxLength(512)
  content: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  videoId: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  parentId?: number;
}

export class UpdateCommentDto {
  @IsString()
  @MaxLength(512)
  @MinLength(1)
  content: string;
}

export class CommentPaginationDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  cursor?: number = 0;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(10)
  limit?: number = 5;
}

export class VideoIdDto {
  @IsInt()
  @Min(1)
  @Type(() => Number)
  id: number;
}
