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
exports.SlaController = void 0;
const common_1 = require("@nestjs/common");
const sla_service_1 = require("./sla.service");
const sla_config_dto_1 = require("./dto/sla-config.dto");
const sla_config_dto_2 = require("./dto/sla-config.dto");
const tickets_enum_1 = require("../utils/tickets.enum");
let SlaController = class SlaController {
    slaService;
    constructor(slaService) {
        this.slaService = slaService;
    }
    async getAllSlaConfigs() {
        return await this.slaService.getAllSlaConfigs();
    }
    async getSlaConfig(priority) {
        return await this.slaService.getSlaConfig(priority);
    }
    async createSlaConfig(createSlaConfigDto) {
        return await this.slaService.createSlaConfig(createSlaConfigDto);
    }
    async updateSlaConfig(priority, updateSlaConfigDto) {
        return await this.slaService.updateSlaConfig(priority, updateSlaConfigDto);
    }
    async deleteSlaConfig(priority) {
        return await this.slaService.deleteSlaConfig(priority);
    }
    async seedDefaultSlaConfigs() {
        return await this.slaService.seedDefaultSlaConfigs();
    }
};
exports.SlaController = SlaController;
__decorate([
    (0, common_1.Get)('configs'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SlaController.prototype, "getAllSlaConfigs", null);
__decorate([
    (0, common_1.Get)('config/:priority'),
    __param(0, (0, common_1.Param)('priority')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SlaController.prototype, "getSlaConfig", null);
__decorate([
    (0, common_1.Post)('config'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [sla_config_dto_1.CreateSlaConfigDto]),
    __metadata("design:returntype", Promise)
], SlaController.prototype, "createSlaConfig", null);
__decorate([
    (0, common_1.Patch)('config/:priority'),
    __param(0, (0, common_1.Param)('priority')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, sla_config_dto_2.UpdateSlaConfigDto]),
    __metadata("design:returntype", Promise)
], SlaController.prototype, "updateSlaConfig", null);
__decorate([
    (0, common_1.Delete)('config/:priority'),
    __param(0, (0, common_1.Param)('priority')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SlaController.prototype, "deleteSlaConfig", null);
__decorate([
    (0, common_1.Post)('seed'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SlaController.prototype, "seedDefaultSlaConfigs", null);
exports.SlaController = SlaController = __decorate([
    (0, common_1.Controller)('sla'),
    __metadata("design:paramtypes", [sla_service_1.SlaService])
], SlaController);
//# sourceMappingURL=sla.controller.js.map