import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { TicketsService } from './tickets.service';
import { TicketsController } from './tickets.controller';
import { TicketProcessor } from './ticket.processor';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    BullModule.registerQueue({
      name: 'ticket-processing',
    }),
  ],
  controllers: [TicketsController],
  providers: [TicketsService, TicketProcessor],
})
export class TicketsModule { }
