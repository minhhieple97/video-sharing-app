import { Controller, Post, Body, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Response } from 'express';
import { RegisterDto } from './dtos/register.dto';
import { JWT_COOKIE_NAME, MAX_AGE_JWT_COOKIE } from 'src/constants';

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
}
