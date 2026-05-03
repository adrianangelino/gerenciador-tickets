export const TICKET_STATUS = {
    OPEN: 'OPEN',
    IN_PROGRESS: 'IN_PROGRESS',
    CLOSED: 'CLOSED',
} as const;

export const TICKET_PRIORITY = {
    LOW: 'LOW',
    MEDIUM: 'MEDIUM',
    HIGH: 'HIGH',
} as const;

export const TICKET_ACTIONS = {
    CREATED: 'CREATED',
    UPDATED: 'UPDATED',
    STATUS_CHANGED: 'STATUS_CHANGED',
    PRIORITY_CHANGED: 'PRIORITY_CHANGED',
} as const;