import { TicketPriority } from '../utils/tickets.enum';
export declare class CreateSlaConfigDto {
    priority: TicketPriority;
    days: number;
}
export declare class UpdateSlaConfigDto {
    days: number;
}
