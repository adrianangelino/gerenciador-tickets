import { IsString, IsOptional, IsEnum } from 'class-validator';
import { TicketPriority, TicketStatus } from '../../utils/tickets.enum';

export class UpdateTicketDto {
  @IsOptional()
  @IsString({ message: 'Título deve ser um texto' })
  title?: string;

  @IsOptional()
  @IsString({ message: 'Descrição deve ser um texto' })
  description?: string;

  @IsOptional()
  @IsEnum(TicketPriority, { message: 'Prioridade inválida. Use: LOW, MEDIUM ou HIGH' })
  priority?: string;

  @IsOptional()
  @IsEnum(TicketStatus, { message: 'Status inválido. Use: PENDING, OPEN, IN_PROGRESS, CONCLUDED, CLOSED ou FAILED' })
  status?: string;
}
