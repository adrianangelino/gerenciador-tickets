import { IsEnum, IsInt, Min } from 'class-validator';
import { TicketPriority } from '../../utils/tickets.enum';

export class CreateSlaConfigDto {
  @IsEnum(TicketPriority, { message: 'Prioridade inválida. Use: LOW, MEDIUM ou HIGH' })
  priority!: TicketPriority;

  @IsInt({ message: 'Dias deve ser um número inteiro' })
  @Min(1, { message: 'Dias deve ser no mínimo 1' })
  days!: number;
}

export class UpdateSlaConfigDto {
  @IsInt({ message: 'Dias deve ser um número inteiro' })
  @Min(1, { message: 'Dias deve ser no mínimo 1' })
  days!: number;
}
