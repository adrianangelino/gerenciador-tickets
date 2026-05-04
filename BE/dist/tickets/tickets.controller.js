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
exports.TicketsController = void 0;
const common_1 = require("@nestjs/common");
const tickets_service_1 = require("./tickets.service");
const create_ticket_dto_1 = require("./dto/create-ticket.dto");
const update_ticket_dto_1 = require("./dto/update-ticket.dto");
let TicketsController = class TicketsController {
    ticketsService;
    constructor(ticketsService) {
        this.ticketsService = ticketsService;
    }
    async create(createTicketDto) {
        return await this.ticketsService.createTicket(createTicketDto);
    }
    async getAllTickets(status, priority, title) {
        return await this.ticketsService.getAllTickets({ status, priority, title });
    }
    async GetTicketByid(id) {
        return await this.ticketsService.GetTicketByid(+id);
    }
    async updateTicket(id, updateTicketDto) {
        return await this.ticketsService.updateTicket(+id, updateTicketDto);
    }
    async SoftDeleteById(id) {
        return await this.ticketsService.SoftDeleteById(+id);
    }
};
exports.TicketsController = TicketsController;
__decorate([
    (0, common_1.Post)('createTicket'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_ticket_dto_1.CreateTicketDto]),
    __metadata("design:returntype", Promise)
], TicketsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)('getAllTickets/'),
    __param(0, (0, common_1.Query)('status')),
    __param(1, (0, common_1.Query)('priority')),
    __param(2, (0, common_1.Query)('title')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], TicketsController.prototype, "getAllTickets", null);
__decorate([
    (0, common_1.Get)('GetTicketByid/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TicketsController.prototype, "GetTicketByid", null);
__decorate([
    (0, common_1.Patch)('updateTicket/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_ticket_dto_1.UpdateTicketDto]),
    __metadata("design:returntype", Promise)
], TicketsController.prototype, "updateTicket", null);
__decorate([
    (0, common_1.Delete)('SoftDeleteById/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TicketsController.prototype, "SoftDeleteById", null);
exports.TicketsController = TicketsController = __decorate([
    (0, common_1.Controller)('tickets/'),
    __metadata("design:paramtypes", [tickets_service_1.TicketsService])
], TicketsController);
//# sourceMappingURL=tickets.controller.js.map