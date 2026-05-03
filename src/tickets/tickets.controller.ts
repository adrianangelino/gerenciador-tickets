import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { TicketsService } from './tickets.service';
import { CreateTicketDto } from './dto/create-ticket.dto';

@Controller('tickets/')
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) { }

  @Post('createTicket')
  async create(@Body() createTicketDto: CreateTicketDto) {
    return await this.ticketsService.createTicket(createTicketDto);
  }

  @Get('getAllTickets/')
  async getAllTickets() {
    return await this.ticketsService.getAllTickets();
  }

  @Get('GetTicketByid/:id')
  async GetTicketByid(@Param('id') id: string) {
    return await this.ticketsService.GetTicketByid(+id);
  }

  @Delete('SoftDeleteById/:id')
  async SoftDeleteById(@Param('id') id: string) {
    return await this.ticketsService.SoftDeleteById(+id);
  }
}
