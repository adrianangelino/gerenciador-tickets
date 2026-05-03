import { BadRequestException } from '@nestjs/common';
import { OnModuleDestroy } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { PrismaService } from '../prisma/prisma.service';

export class TicketsService implements OnModuleDestroy {
  constructor(
    private prisma: PrismaService,
    @InjectQueue('ticket-processing') private ticketQueue: Queue,
  ) { }

  async onModuleDestroy() {
    await this.prisma.$disconnect();
  }

  async createTicket(dto: CreateTicketDto) {
    const ticket = await this.prisma.ticket.create({
      data: dto,
    });

    await this.ticketQueue.add('enrich-ticket', { ticketId: ticket.id }, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
    });

    return ticket;
  }

  async getAllTickets() {
    const ticket = await this.prisma.ticket.findMany({
      include: { history: true },
    });

    return ticket;
  }

  async GetTicketByid(id: number) {
    return this.prisma.ticket.findUnique({
      where: { id },
      include: { history: true },
    });
  }


  async SoftDeleteById(id: number) {
    const ExistTicket = await this.prisma.ticket.findUnique({
      where: { id }
    })

    if (ExistTicket) {
      throw new BadRequestException("Ticket not found");
    }

    return await this.prisma.ticket.update({
      where: { id },
      data: { deleteAt: new Date() }
    })
  }

  private async addHistory(ticketId: number, action: string, details?: string): Promise<void> {
    await this.prisma.ticketHistory.create({
      data: {
        ticketId,
        action,
        details,
      },
    });
  }
}
