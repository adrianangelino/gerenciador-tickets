"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TicketsModule = void 0;
const common_1 = require("@nestjs/common");
const bullmq_1 = require("@nestjs/bullmq");
const tickets_service_1 = require("./tickets.service");
const tickets_controller_1 = require("./tickets.controller");
const ticket_processor_1 = require("./ticket.processor");
const sla_module_1 = require("../sla/sla.module");
const prisma_module_1 = require("../prisma/prisma.module");
let TicketsModule = class TicketsModule {
};
exports.TicketsModule = TicketsModule;
exports.TicketsModule = TicketsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            prisma_module_1.PrismaModule,
            sla_module_1.SlaModule,
            bullmq_1.BullModule.registerQueue({
                name: 'ticket-processing',
            }),
        ],
        controllers: [tickets_controller_1.TicketsController],
        providers: [tickets_service_1.TicketsService, ticket_processor_1.TicketProcessor],
    })
], TicketsModule);
//# sourceMappingURL=tickets.module.js.map