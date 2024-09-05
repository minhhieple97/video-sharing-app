import {
  Controller,
  Post,
  Body,
  Res,
  Get,
  Req,
  UseGuards,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { Response } from 'express';
import { RegisterDto } from './dtos/register.dto';
import { LoginDto } from './dtos/login.dto';
import { IAuthorizedRequest } from './interfaces';
import { JwtAuthGuard } from './guards/jwt.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() userData: RegisterDto, @Res() res: Response) {
    const user = await this.authService.register(
      userData.email,
      userData.password,
    );
    const token = await this.authService.generateToken(user);
    return res.json({ ...user, token });
  }
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto, @Res() res: Response) {
    const { id, email, token } = await this.authService.login(loginDto);
    return res.json({ id, email, token });
  }

  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @Get('profile')
  async profile(@Req() request: IAuthorizedRequest) {
    return request.user;
  }
}
