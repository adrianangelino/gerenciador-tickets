import { TicketsService } from './tickets.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
export declare class TicketsController {
    private readonly ticketsService;
    constructor(ticketsService: TicketsService);
    create(createTicketDto: CreateTicketDto): Promise<{
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
    getAllTickets(status?: string, priority?: string, title?: string): Promise<({
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
    GetTicketByid(id: string): Promise<({
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
    updateTicket(id: string, updateTicketDto: UpdateTicketDto): Promise<{
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
    SoftDeleteById(id: string): Promise<{
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
}
