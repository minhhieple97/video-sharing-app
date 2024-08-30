import { Module } from '@nestjs/common';
import { BullQueueModule } from './bullqueue/bullqueue.module';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [PrismaModule, BullQueueModule, AuthModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
