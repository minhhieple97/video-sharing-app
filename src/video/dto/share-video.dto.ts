import { IsNotEmpty, IsUrl } from 'class-validator';

export class ShareVideoDto {
  @IsNotEmpty()
  @IsUrl()
  youtubeLink: string;
}
