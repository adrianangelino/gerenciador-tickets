import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { SlaConfig } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSlaConfigDto } from './dto/sla-config.dto';
import { UpdateSlaConfigDto } from './dto/sla-config.dto';
import { TicketPriority } from '../utils/tickets.enum';

@Injectable()
export class SlaService {
  constructor(private prisma: PrismaService) {}

  async getAllSlaConfigs(): Promise<SlaConfig[]> {
    return this.prisma.slaConfig.findMany();
  }

  async getSlaConfig(priority: TicketPriority): Promise<SlaConfig | null> {
    return this.prisma.slaConfig.findUnique({ where: { priority } });
  }

  async createSlaConfig(dto: CreateSlaConfigDto): Promise<SlaConfig> {
    const existing = await this.getSlaConfig(dto.priority);
    if (existing) {
      throw new ConflictException(
        `Configuração de SLA para prioridade ${dto.priority} já existe. Use PATCH para atualizar.`,
      );
    }
    return this.prisma.slaConfig.create({ data: dto });
  }

  async updateSlaConfig(
    priority: TicketPriority,
    dto: UpdateSlaConfigDto,
  ): Promise<SlaConfig> {
    const existing = await this.getSlaConfig(priority);
    if (!existing) {
      throw new NotFoundException(
        `Configuração de SLA para prioridade ${priority} não encontrada`,
      );
    }
    return this.prisma.slaConfig.update({ where: { priority }, data: dto });
  }

  async deleteSlaConfig(priority: TicketPriority): Promise<SlaConfig> {
    const existing = await this.getSlaConfig(priority);
    if (!existing) {
      throw new NotFoundException(
        `Configuração de SLA para prioridade ${priority} não encontrada`,
      );
    }
    return this.prisma.slaConfig.delete({ where: { priority } });
  }

  async getSlaDays(priority: TicketPriority): Promise<number> {
    const config = await this.getSlaConfig(priority);
    return config?.days ?? 3;
  }
}
