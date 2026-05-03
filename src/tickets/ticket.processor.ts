import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Job } from 'bullmq';
import { ModuleRef } from '@nestjs/core';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
@Processor('ticket-processing')
export class TicketProcessor extends WorkerHost implements OnModuleInit {
    private readonly logger = new Logger(TicketProcessor.name);
    private prisma: PrismaService;

    constructor(private readonly moduleRef: ModuleRef) {
        super();
    }

    onModuleInit() {
        this.prisma = this.moduleRef.get(PrismaService, { strict: false });
    }

    async process(job: Job<any>): Promise<any> {
        this.logger.log(`Processing job ${job.id} of type ${job.name}`);

        switch (job.name) {
            case 'enrich-ticket':
                return this.enrichTicket(job.data.ticketId);
            default:
                throw new Error(`Unknown job type: ${job.name}`);
        }
    }

    private async enrichTicket(ticketId: number): Promise<void> {
        try {
            const response = await fetch('https://jsonplaceholder.typicode.com/posts/1');

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            await this.prisma.ticket.update({
                where: { id: ticketId },
                data: {
                    description: `${data.body} - Enriched from API`,
                },
            });

            this.logger.log(`Ticket ${ticketId} enriched successfully`);
        } catch (error) {
            this.logger.error(
                `Failed to enrich ticket ${ticketId}: ${(error as Error).message}`,
            );
            throw error;
        }
    }

    @OnWorkerEvent('completed')
    onCompleted(job: Job) {
        this.logger.log(`Job ${job.id} completed`);
    }

    @OnWorkerEvent('failed')
    onFailed(job: Job) {
        this.logger.error(`Job ${job.id} failed with reason: ${job.failedReason}`);
    }
}