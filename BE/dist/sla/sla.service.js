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
Object.defineProperty(exports, "__esModule", { value: true });
exports.SlaService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const tickets_enum_1 = require("../utils/tickets.enum");
let SlaService = class SlaService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getAllSlaConfigs() {
        return this.prisma.slaConfig.findMany();
    }
    async getSlaConfig(priority) {
        return this.prisma.slaConfig.findUnique({
            where: { priority },
        });
    }
    async createSlaConfig(dto) {
        return this.prisma.slaConfig.create({
            data: dto,
        });
    }
    async updateSlaConfig(priority, dto) {
        return this.prisma.slaConfig.update({
            where: { priority },
            data: dto,
        });
    }
    async deleteSlaConfig(priority) {
        return this.prisma.slaConfig.delete({
            where: { priority },
        });
    }
    async getSlaDays(priority) {
        const config = await this.getSlaConfig(priority);
        return config?.days || 3;
    }
    async seedDefaultSlaConfigs() {
        const configs = [
            { priority: tickets_enum_1.TicketPriority.LOW, days: 7 },
            { priority: tickets_enum_1.TicketPriority.MEDIUM, days: 3 },
            { priority: tickets_enum_1.TicketPriority.HIGH, days: 1 },
        ];
        for (const config of configs) {
            await this.prisma.slaConfig.upsert({
                where: { priority: config.priority },
                update: { days: config.days },
                create: config,
            });
        }
        return { message: 'SLA configs seeded successfully' };
    }
};
exports.SlaService = SlaService;
exports.SlaService = SlaService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SlaService);
//# sourceMappingURL=sla.service.js.map