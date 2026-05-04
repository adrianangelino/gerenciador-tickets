import { SlaService } from './sla.service';
import { CreateSlaConfigDto } from './dto/sla-config.dto';
import { UpdateSlaConfigDto } from './dto/sla-config.dto';
import { TicketPriority } from '../utils/tickets.enum';
export declare class SlaController {
    private readonly slaService;
    constructor(slaService: SlaService);
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
    createSlaConfig(createSlaConfigDto: CreateSlaConfigDto): Promise<{
        id: number;
        priority: string;
        days: number;
    }>;
    updateSlaConfig(priority: TicketPriority, updateSlaConfigDto: UpdateSlaConfigDto): Promise<{
        id: number;
        priority: string;
        days: number;
    }>;
    deleteSlaConfig(priority: TicketPriority): Promise<{
        id: number;
        priority: string;
        days: number;
    }>;
    seedDefaultSlaConfigs(): Promise<{
        message: string;
    }>;
}
