import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { TicketsModule } from './tickets/tickets.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    BullModule.forRoot({
      connection: {
        host: 'localhost',
        port: 6379,
      },
    }),
    TicketsModule,
    PrismaModule,
  ],
})
export class AppModule { }