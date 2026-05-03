export class CreateTicketDto {
    title!: string;
    description?: string;
    priority?: string;
    slaDeadline?: string;
}
