import {
  Injectable,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { User } from '@prisma/client';
import * as argon2 from 'argon2';
import { LoginDto } from './dtos/login.dto';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService, private jwtService: JwtService) {}

  async register(email: string, password: string) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });
    if (existingUser) {
      throw new ConflictException('Email already registered');
    }
    const hashedPassword = await argon2.hash(password);
    const user = await this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
      },
    });
    return { id: user.id, email: user.email };
  }

  async generateToken(user: { id: number; email: string }) {
    const payload = { email: user.email, id: user.id };
    return this.jwtService.sign(payload);
  }
  async validateUser(email: string, password: string) {
    const user: User = await this.prisma.user.findFirst({
      where: { email },
    });
    if (!user) {
      throw new BadRequestException('User not found');
    }
    const isMatch: boolean = await argon2.verify(user.password, password);
    if (!isMatch) {
      throw new BadRequestException('Password does not match');
    }
    return user;
  }
  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;
    const user = await this.validateUser(email, password);
    const token = await this.generateToken({ id: user.id, email: user.email });
    return {
      id: user.id,
      email: user.email,
      token,
    };
  }
}
