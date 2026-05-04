import { Injectable, NotFoundException, OnModuleDestroy } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Prisma, Ticket } from '@prisma/client';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { PrismaService } from '../prisma/prisma.service';
import { SlaService } from '../sla/sla.service';
import {
  TicketPriority,
  TicketAction,
  TicketStatus,
} from '../utils/tickets.enum';

type TicketWithHistory = Prisma.TicketGetPayload<{
  include: { history: true };
}>;

@Injectable()
export class TicketsService implements OnModuleDestroy {
  constructor(
    private prisma: PrismaService,
    private slaService: SlaService,
    @InjectQueue('ticket-processing') private queue: Queue,
  ) {}

  async onModuleDestroy(): Promise<void> {
    await this.prisma.$disconnect();
  }

  private async calculateSLADeadline(priority: string): Promise<Date> {
    const days = await this.slaService.getSlaDays(priority as TicketPriority);
    const now = new Date();
    return new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
  }

  async createTicket(dto: CreateTicketDto): Promise<Ticket> {
    const priority = dto.priority || TicketPriority.MEDIUM;
    const slaDeadline = await this.calculateSLADeadline(priority);

    const ticket = await this.prisma.ticket.create({
      data: { ...dto, priority, slaDeadline, status: TicketStatus.PENDING },
    });

    await this.addHistory(
      ticket.id,
      TicketAction.CREATED,
      `Ticket criado com prioridade ${priority}, aguardando processamento`,
    );

    await this.queue.add(
      'process-ticket',
      { ticketId: ticket.id, priority },
      {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: true,
        removeOnFail: false,
      },
    );

    return ticket;
  }

  async getAllTickets(filters?: {
    status?: string;
    priority?: string;
    title?: string;
  }): Promise<TicketWithHistory[]> {
    const where: Prisma.TicketWhereInput = {};
    if (filters?.status) {
      where.status = filters.status;
    }
    if (filters?.priority) {
      where.priority = filters.priority;
    }
    if (filters?.title) {
      where.title = { contains: filters.title };
    }

    return this.prisma.ticket.findMany({ where, include: { history: true } });
  }

  async GetTicketByid(id: number): Promise<TicketWithHistory> {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id },
      include: { history: true },
    });

    if (!ticket) {
      throw new NotFoundException(`Ticket #${id} não encontrado`);
    }

    return ticket;
  }

  async updateTicket(
    id: number,
    dto: UpdateTicketDto,
  ): Promise<TicketWithHistory> {
    const existingTicket = await this.prisma.ticket.findUnique({
      where: { id },
    });
    if (!existingTicket) {
      throw new NotFoundException(`Ticket #${id} não encontrado`);
    }

    const updateData: Prisma.TicketUpdateInput = { ...dto };

    if (dto.priority && dto.priority !== existingTicket.priority) {
      updateData.slaDeadline = await this.calculateSLADeadline(dto.priority);
      await this.addHistory(
        id,
        TicketAction.PRIORITY_CHANGED,
        `Prioridade alterada de ${existingTicket.priority} para ${dto.priority}`,
      );
    }

    if (dto.status && dto.status !== existingTicket.status) {
      await this.addHistory(
        id,
        TicketAction.STATUS_CHANGED,
        `Status alterado de ${existingTicket.status} para ${dto.status}`,
      );
    }

    updateData.updatedAt = new Date();
    await this.addHistory(id, TicketAction.UPDATED, 'Ticket atualizado');

    return this.prisma.ticket.update({
      where: { id },
      data: updateData,
      include: { history: true },
    });
  }

  async SoftDeleteById(id: number): Promise<Ticket> {
    const ticket = await this.prisma.ticket.findUnique({ where: { id } });

    if (!ticket) {
      throw new NotFoundException(`Ticket #${id} não encontrado`);
    }

    await this.addHistory(id, TicketAction.DELETED, 'Ticket removido');

    return this.prisma.ticket.update({
      where: { id },
      data: { deleteAt: new Date() },
    });
  }

  private async addHistory(
    ticketId: number,
    action: string,
    details?: string,
  ): Promise<void> {
    await this.prisma.ticketHistory.create({
      data: { ticketId, action, details },
    });
  }
}
