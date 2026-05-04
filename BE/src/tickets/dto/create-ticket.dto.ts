import { IsString, IsOptional, IsEnum } from 'class-validator';
import { TicketPriority } from '../../utils/tickets.enum';

export class CreateTicketDto {
  @IsString({ message: 'Título é obrigatório' })
  title: string;

  @IsOptional()
  @IsString({ message: 'Descrição deve ser um texto' })
  description?: string;

  @IsOptional()
  @IsEnum(TicketPriority, { message: 'Prioridade inválida. Use: LOW, MEDIUM ou HIGH' })
  priority?: string;
}
