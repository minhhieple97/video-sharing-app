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
import { JWT_COOKIE_NAME, MAX_AGE_JWT_COOKIE } from 'src/constants';
import { LoginDto } from './dtos/login.dto';
import { IAuthorizedRequest } from './interfaces';
import { JwtAuthGuard } from './guards/jwt.guard';
import { ConfigService } from '@nestjs/config';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private configService: ConfigService,
  ) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() userData: RegisterDto, @Res() res: Response) {
    const user = await this.authService.register(
      userData.email,
      userData.password,
    );
    const token = await this.authService.generateToken(user);
    res.cookie(JWT_COOKIE_NAME, token, {
      domain: this.configService.get('DOMAIN'),
      path: '/',
      httpOnly: true,
      maxAge: MAX_AGE_JWT_COOKIE,
      secure: true,
      sameSite: 'none',
    });
    return res.json({ ...user, token });
  }
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto, @Res() res: Response) {
    const { id, email, token } = await this.authService.login(loginDto);
    res.cookie(JWT_COOKIE_NAME, token, {
      domain: this.configService.get('DOMAIN'),
      path: '/',
      httpOnly: true,
      maxAge: MAX_AGE_JWT_COOKIE,
      secure: true,
      sameSite: 'none',
    });
    return res.json({ id, email, token });
  }

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
