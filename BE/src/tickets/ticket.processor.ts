import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { TicketStatus, TicketAction } from '../utils/tickets.enum';

export interface TicketJobData {
  ticketId: number;
  priority: string;
}

@Processor('ticket-processing')
export class TicketProcessor extends WorkerHost {
  private readonly logger = new Logger(TicketProcessor.name);

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async process(job: Job<TicketJobData>): Promise<void> {
    const { ticketId, priority } = job.data;
    this.logger.log(
      `Processing ticket #${ticketId} (attempt ${job.attemptsMade + 1})`,
    );

    const ticket = await this.prisma.ticket.findUnique({
      where: { id: ticketId },
    });
    if (!ticket) {
      throw new Error(`Ticket #${ticketId} not found during processing`);
    }

    await this.prisma.ticket.update({
      where: { id: ticketId },
      data: { status: TicketStatus.OPEN },
    });

    await this.prisma.ticketHistory.create({
      data: {
        ticketId,
        action: TicketAction.STATUS_CHANGED,
        details: `Ticket ativado com prioridade ${priority}`,
      },
    });

    this.logger.log(`Ticket #${ticketId} is now OPEN`);
  }

  @OnWorkerEvent('failed')
  async onFailed(job: Job<TicketJobData>, error: Error): Promise<void> {
    const { ticketId } = job.data;
    const maxAttempts = job.opts.attempts ?? 1;
    const isLastAttempt = job.attemptsMade >= maxAttempts;

    this.logger.warn(
      `Ticket #${ticketId} attempt ${job.attemptsMade}/${maxAttempts} failed: ${error.message}`,
    );

    if (isLastAttempt) {
      this.logger.error(
        `Ticket #${ticketId} exhausted all retries — marking as FAILED`,
      );

      await this.prisma.ticket.update({
        where: { id: ticketId },
        data: { status: TicketStatus.FAILED },
      });

      await this.prisma.ticketHistory.create({
        data: {
          ticketId,
          action: TicketAction.PROCESSING_FAILED,
          details: `Falhou após ${job.attemptsMade} tentativas. Último erro: ${error.message}`,
        },
      });
    }
  }
}
