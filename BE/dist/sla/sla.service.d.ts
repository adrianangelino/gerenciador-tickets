import { PrismaService } from '../prisma/prisma.service';
import { CreateSlaConfigDto } from './dto/sla-config.dto';
import { UpdateSlaConfigDto } from './dto/sla-config.dto';
import { TicketPriority } from '../utils/tickets.enum';
export declare class SlaService {
    private prisma;
    constructor(prisma: PrismaService);
    getAllSlaConfigs(): Promise<{
        id: number;
        priority: string;
        days: number;
    }[]>;
    getSlaConfig(priority: TicketPriority): Promise<{
        id: number;
        priority: string;
        days: number;
    } | null>;
    createSlaConfig(dto: CreateSlaConfigDto): Promise<{
        id: number;
        priority: string;
        days: number;
    }>;
    updateSlaConfig(priority: TicketPriority, dto: UpdateSlaConfigDto): Promise<{
        id: number;
        priority: string;
        days: number;
    }>;
    deleteSlaConfig(priority: TicketPriority): Promise<{
        id: number;
        priority: string;
        days: number;
    }>;
    getSlaDays(priority: TicketPriority): Promise<number>;
    seedDefaultSlaConfigs(): Promise<{
        message: string;
    }>;
}
