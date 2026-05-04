import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { TicketsService } from './tickets.service';
import { TicketsController } from './tickets.controller';
import { TicketProcessor } from './ticket.processor';
import { SlaModule } from '../sla/sla.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    SlaModule,
    BullModule.registerQueue({
      name: 'ticket-processing',
    }),
  ],
  controllers: [TicketsController],
  providers: [TicketsService, TicketProcessor],
})
export class TicketsModule {}
