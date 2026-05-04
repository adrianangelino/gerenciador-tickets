import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  NotFoundException,
  UseGuards,
} from '@nestjs/common';
import { SlaConfig } from '@prisma/client';
import { SlaService } from './sla.service';
import { CreateSlaConfigDto } from './dto/sla-config.dto';
import { UpdateSlaConfigDto } from './dto/sla-config.dto';
import { TicketPriority } from '../utils/tickets.enum';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('sla')
export class SlaController {
  constructor(private readonly slaService: SlaService) {}

  @Get('configs')
  async getAllSlaConfigs(): Promise<SlaConfig[]> {
    return this.slaService.getAllSlaConfigs();
  }

  @Get('config/:priority')
  async getSlaConfig(
    @Param('priority') priority: TicketPriority,
  ): Promise<SlaConfig> {
    const config = await this.slaService.getSlaConfig(priority);
    if (!config) {
      throw new NotFoundException(
        `Configuração de SLA para prioridade ${priority} não encontrada`,
      );
    }
    return config;
  }

  @Post('config')
  async createSlaConfig(@Body() dto: CreateSlaConfigDto): Promise<SlaConfig> {
    return this.slaService.createSlaConfig(dto);
  }

  @Patch('config/:priority')
  async updateSlaConfig(
    @Param('priority') priority: TicketPriority,
    @Body() dto: UpdateSlaConfigDto,
  ): Promise<SlaConfig> {
    return this.slaService.updateSlaConfig(priority, dto);
  }

  @Delete('config/:priority')
  async deleteSlaConfig(
    @Param('priority') priority: TicketPriority,
  ): Promise<SlaConfig> {
    return this.slaService.deleteSlaConfig(priority);
  }
}
