import { WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
export interface TicketJobData {
    ticketId: number;
    title: string;
    priority: string;
}
export declare class TicketProcessor extends WorkerHost {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    process(job: Job<TicketJobData>): Promise<void>;
    onFailed(job: Job<TicketJobData>, error: Error): Promise<void>;
    private fetchExternalEnrichment;
}
