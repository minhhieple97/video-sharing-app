import {
  Controller,
  Post,
  Body,
  Res,
  Get,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { Response } from 'express';
import { RegisterDto } from './dtos/register.dto';
import { JWT_COOKIE_NAME, MAX_AGE_JWT_COOKIE } from 'src/constants';
import { LoginDto } from './dtos/login.dto';
import { IAuthorizedRequest } from './interfaces';
import { JwtAuthGuard } from './guards/jwt.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  async register(@Body() userData: RegisterDto, @Res() res: Response) {
    const user = await this.authService.register(
      userData.email,
      userData.password,
    );
    const token = await this.authService.generateToken(user);
    res.cookie(JWT_COOKIE_NAME, token, {
      httpOnly: true,
      maxAge: MAX_AGE_JWT_COOKIE,
    });
    return res.json({ message: 'User registered successfully' });
  }
  @Post('login')
  async login(@Body() loginDto: LoginDto, @Res() res: Response) {
    const { id, email, token } = await this.authService.login(loginDto);
    res.cookie(JWT_COOKIE_NAME, token, {
      httpOnly: true,
      maxAge: MAX_AGE_JWT_COOKIE,
    });
    return res.json({ id, email, token });
  }
  @Post('logout')
  async logout(@Res() res: Response) {
    res.clearCookie(JWT_COOKIE_NAME);
    return res.json({ message: 'User logged out successfully' });
  }
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async profile(@Req() request: IAuthorizedRequest) {
    return request.user;
  }
}
