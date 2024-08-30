import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { JWT_COOKIE_NAME } from 'src/constants';
import { JwtTokenPayload } from '../interfaces';
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const token = request.cookies[JWT_COOKIE_NAME];

    if (!token) {
      throw new UnauthorizedException('No token provided');
    }
    try {
      const payload: JwtTokenPayload = this.jwtService.decode(token);
      if (!payload) {
        throw new UnauthorizedException('Invalid token');
      }
      request['user'] = payload;
      return true;
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
