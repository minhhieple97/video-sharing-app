import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BullQueueModule } from './bullqueue/bullqueue.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [PrismaModule, BullQueueModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
