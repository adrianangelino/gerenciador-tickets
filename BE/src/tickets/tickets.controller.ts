import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Prisma, Ticket } from '@prisma/client';
import { TicketsService } from './tickets.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

type TicketWithHistory = Prisma.TicketGetPayload<{
  include: { history: true };
}>;

@UseGuards(JwtAuthGuard)
@Controller('tickets/')
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Post('createTicket')
  async create(@Body() createTicketDto: CreateTicketDto): Promise<Ticket> {
    return this.ticketsService.createTicket(createTicketDto);
  }

  @Get('getAllTickets/')
  async getAllTickets(
    @Query('status') status?: string,
    @Query('priority') priority?: string,
    @Query('title') title?: string,
  ): Promise<TicketWithHistory[]> {
    return this.ticketsService.getAllTickets({ status, priority, title });
  }

  @Get('GetTicketByid/:id')
  async GetTicketByid(@Param('id') id: string): Promise<TicketWithHistory> {
    return this.ticketsService.GetTicketByid(+id);
  }

  @Patch('updateTicket/:id')
  async updateTicket(
    @Param('id') id: string,
    @Body() updateTicketDto: UpdateTicketDto,
  ): Promise<TicketWithHistory> {
    return this.ticketsService.updateTicket(+id, updateTicketDto);
  }

  @Delete('SoftDeleteById/:id')
  async SoftDeleteById(@Param('id') id: string): Promise<Ticket> {
    return this.ticketsService.SoftDeleteById(+id);
  }
}
