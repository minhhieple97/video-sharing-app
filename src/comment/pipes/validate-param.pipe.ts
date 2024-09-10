import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';

@Injectable()
export class PositiveNumberValidationPipe implements PipeTransform {
  async transform(value: any) {
    console.log({ value });
    if (!(value > 0)) {
      throw new BadRequestException('id is positive number');
    }
    return value;
  }
}
