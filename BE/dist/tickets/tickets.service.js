"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TicketsService = void 0;
const common_1 = require("@nestjs/common");
const bullmq_1 = require("@nestjs/bullmq");
const bullmq_2 = require("bullmq");
const prisma_service_1 = require("../prisma/prisma.service");
const sla_service_1 = require("../sla/sla.service");
const tickets_enum_1 = require("../utils/tickets.enum");
let TicketsService = class TicketsService {
    prisma;
    slaService;
    queue;
    constructor(prisma, slaService, queue) {
        this.prisma = prisma;
        this.slaService = slaService;
        this.queue = queue;
    }
    async calculateSLADeadline(priority) {
        const days = await this.slaService.getSlaDays(priority);
        const now = new Date();
        return new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    }
    async onModuleDestroy() {
        await this.prisma.$disconnect();
    }
    async createTicket(dto) {
        const priority = dto.priority || tickets_enum_1.TicketPriority.MEDIUM;
        const slaDeadline = await this.calculateSLADeadline(priority);
        const ticket = await this.prisma.ticket.create({
            data: {
                ...dto,
                priority,
                slaDeadline,
                status: tickets_enum_1.TicketStatus.PENDING,
            },
        });
        await this.addHistory(ticket.id, tickets_enum_1.TicketAction.CREATED, `Ticket created with priority ${priority}, queued for processing`);
        await this.queue.add('process-ticket', { ticketId: ticket.id, title: ticket.title, priority }, {
            attempts: 3,
            backoff: { type: 'exponential', delay: 2000 },
            removeOnComplete: true,
            removeOnFail: false,
        });
        return ticket;
    }
    async getAllTickets(filters) {
        const where = {};
        if (filters?.status)
            where.status = filters.status;
        if (filters?.priority)
            where.priority = filters.priority;
        if (filters?.title)
            where.title = { contains: filters.title };
        const tickets = await this.prisma.ticket.findMany({
            where,
            include: { history: true },
        });
        return tickets;
    }
    async GetTicketByid(id) {
        return this.prisma.ticket.findUnique({
            where: { id },
            include: { history: true },
        });
    }
    async updateTicket(id, dto) {
        const existingTicket = await this.prisma.ticket.findUnique({ where: { id } });
        if (!existingTicket) {
            throw new common_1.BadRequestException('Ticket not found');
        }
        const updateData = { ...dto };
        if (dto.priority && dto.priority !== existingTicket.priority) {
            updateData.slaDeadline = await this.calculateSLADeadline(dto.priority);
            await this.addHistory(id, tickets_enum_1.TicketAction.PRIORITY_CHANGED, `Priority changed from ${existingTicket.priority} to ${dto.priority}`);
        }
        if (dto.status && dto.status !== existingTicket.status) {
            await this.addHistory(id, tickets_enum_1.TicketAction.STATUS_CHANGED, `Status changed from ${existingTicket.status} to ${dto.status}`);
        }
        if (Object.keys(updateData).length > 0) {
            updateData.updatedAt = new Date();
            await this.addHistory(id, tickets_enum_1.TicketAction.UPDATED, 'Ticket updated');
        }
        return this.prisma.ticket.update({
            where: { id },
            data: updateData,
            include: { history: true },
        });
    }
    async SoftDeleteById(id) {
        const ExistTicket = await this.prisma.ticket.findUnique({
            where: { id }
        });
        if (!ExistTicket) {
            throw new common_1.BadRequestException("Ticket not found");
        }
        await this.addHistory(id, tickets_enum_1.TicketAction.DELETED, 'Ticket soft deleted');
        return await this.prisma.ticket.update({
            where: { id },
            data: { deleteAt: new Date() }
        });
    }
    async addHistory(ticketId, action, details) {
        await this.prisma.ticketHistory.create({
            data: {
                ticketId,
                action,
                details,
            },
        });
    }
};
exports.TicketsService = TicketsService;
exports.TicketsService = TicketsService = __decorate([
    (0, common_1.Injectable)(),
    __param(2, (0, bullmq_1.InjectQueue)('ticket-processing')),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        sla_service_1.SlaService,
        bullmq_2.Queue])
], TicketsService);
//# sourceMappingURL=tickets.service.js.map