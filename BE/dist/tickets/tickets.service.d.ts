import { OnModuleDestroy } from '@nestjs/common';
import { Queue } from 'bullmq';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { PrismaService } from '../prisma/prisma.service';
import { SlaService } from '../sla/sla.service';
export declare class TicketsService implements OnModuleDestroy {
    private prisma;
    private slaService;
    private queue;
    constructor(prisma: PrismaService, slaService: SlaService, queue: Queue);
    private calculateSLADeadline;
    onModuleDestroy(): Promise<void>;
    createTicket(dto: CreateTicketDto): Promise<{
        id: number;
        title: string;
        description: string | null;
        status: string;
        priority: string;
        slaDeadline: Date | null;
        createdAt: Date;
        updatedAt: Date;
        deleteAt: Date | null;
    }>;
    getAllTickets(filters?: {
        status?: string;
        priority?: string;
        title?: string;
    }): Promise<({
        history: {
            id: number;
            ticketId: number;
            action: string;
            timestamp: Date;
            details: string | null;
        }[];
    } & {
        id: number;
        title: string;
        description: string | null;
        status: string;
        priority: string;
        slaDeadline: Date | null;
        createdAt: Date;
        updatedAt: Date;
        deleteAt: Date | null;
    })[]>;
    GetTicketByid(id: number): Promise<({
        history: {
            id: number;
            ticketId: number;
            action: string;
            timestamp: Date;
            details: string | null;
        }[];
    } & {
        id: number;
        title: string;
        description: string | null;
        status: string;
        priority: string;
        slaDeadline: Date | null;
        createdAt: Date;
        updatedAt: Date;
        deleteAt: Date | null;
    }) | null>;
    updateTicket(id: number, dto: UpdateTicketDto): Promise<{
        history: {
            id: number;
            ticketId: number;
            action: string;
            timestamp: Date;
            details: string | null;
        }[];
    } & {
        id: number;
        title: string;
        description: string | null;
        status: string;
        priority: string;
        slaDeadline: Date | null;
        createdAt: Date;
        updatedAt: Date;
        deleteAt: Date | null;
    }>;
    SoftDeleteById(id: number): Promise<{
        id: number;
        title: string;
        description: string | null;
        status: string;
        priority: string;
        slaDeadline: Date | null;
        createdAt: Date;
        updatedAt: Date;
        deleteAt: Date | null;
    }>;
    private addHistory;
}
