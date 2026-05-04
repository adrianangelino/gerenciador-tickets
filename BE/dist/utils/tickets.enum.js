"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TicketAction = exports.TicketStatus = exports.TicketPriority = void 0;
var TicketPriority;
(function (TicketPriority) {
    TicketPriority["LOW"] = "LOW";
    TicketPriority["MEDIUM"] = "MEDIUM";
    TicketPriority["HIGH"] = "HIGH";
})(TicketPriority || (exports.TicketPriority = TicketPriority = {}));
var TicketStatus;
(function (TicketStatus) {
    TicketStatus["PENDING"] = "PENDING";
    TicketStatus["OPEN"] = "OPEN";
    TicketStatus["IN_PROGRESS"] = "IN_PROGRESS";
    TicketStatus["CLOSED"] = "CLOSED";
    TicketStatus["FAILED"] = "FAILED";
})(TicketStatus || (exports.TicketStatus = TicketStatus = {}));
var TicketAction;
(function (TicketAction) {
    TicketAction["CREATED"] = "CREATED";
    TicketAction["UPDATED"] = "UPDATED";
    TicketAction["STATUS_CHANGED"] = "STATUS_CHANGED";
    TicketAction["PRIORITY_CHANGED"] = "PRIORITY_CHANGED";
    TicketAction["PROCESSING_FAILED"] = "PROCESSING_FAILED";
    TicketAction["DELETED"] = "DELETED";
})(TicketAction || (exports.TicketAction = TicketAction = {}));
//# sourceMappingURL=tickets.enum.js.map