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
import { JWT_COOKIE_NAME } from 'src/constants';
import { LoginDto } from './dtos/login.dto';
import { IAuthorizedRequest } from './interfaces';
import { JwtAuthGuard } from './guards/jwt.guard';
import { setJwtCookie } from 'src/helper';

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
    setJwtCookie(res, token);
    return res.json(user);
  }
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto, @Res() res: Response) {
    const { id, email, token } = await this.authService.login(loginDto);
    setJwtCookie(res, token);
    return res.json({ id, email });
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Res() res: Response) {
    res.clearCookie(JWT_COOKIE_NAME);
    return res.json({ message: 'User logged out successfully' });
  }

  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @Get('profile')
  async profile(@Req() request: IAuthorizedRequest) {
    return request.user;
  }
}
