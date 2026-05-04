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
var TicketProcessor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TicketProcessor = void 0;
const bullmq_1 = require("@nestjs/bullmq");
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const tickets_enum_1 = require("../utils/tickets.enum");
let TicketProcessor = TicketProcessor_1 = class TicketProcessor extends bullmq_1.WorkerHost {
    prisma;
    logger = new common_1.Logger(TicketProcessor_1.name);
    constructor(prisma) {
        super();
        this.prisma = prisma;
    }
    async process(job) {
        const { ticketId, title, priority } = job.data;
        this.logger.log(`Processing ticket #${ticketId} (attempt ${job.attemptsMade + 1})`);
        const enrichedDescription = await this.fetchExternalEnrichment(ticketId, title);
        await this.prisma.ticket.update({
            where: { id: ticketId },
            data: {
                status: tickets_enum_1.TicketStatus.OPEN,
                description: enrichedDescription,
            },
        });
        await this.prisma.ticketHistory.create({
            data: {
                ticketId,
                action: tickets_enum_1.TicketAction.STATUS_CHANGED,
                details: `Ticket processed and enriched via external API (priority: ${priority})`,
            },
        });
        this.logger.log(`Ticket #${ticketId} processed successfully`);
    }
    async onFailed(job, error) {
        const { ticketId } = job.data;
        this.logger.error(`Ticket #${ticketId} failed after ${job.attemptsMade} attempts: ${error.message}`);
        await this.prisma.ticket.update({
            where: { id: ticketId },
            data: { status: tickets_enum_1.TicketStatus.FAILED },
        });
        await this.prisma.ticketHistory.create({
            data: {
                ticketId,
                action: tickets_enum_1.TicketAction.PROCESSING_FAILED,
                details: `Failed after ${job.attemptsMade} attempts. Last error: ${error.message}`,
            },
        });
    }
    async fetchExternalEnrichment(ticketId, title) {
        const postId = (ticketId % 100) || 1;
        const response = await fetch(`https://jsonplaceholder.typicode.com/posts/${postId}`);
        if (!response.ok) {
            throw new Error(`External API returned ${response.status}`);
        }
        const post = await response.json();
        return `${post.body} — enriched from external API for "${title}"`;
    }
};
exports.TicketProcessor = TicketProcessor;
exports.TicketProcessor = TicketProcessor = TicketProcessor_1 = __decorate([
    (0, bullmq_1.Processor)('ticket-processing'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], TicketProcessor);
//# sourceMappingURL=ticket.processor.js.map