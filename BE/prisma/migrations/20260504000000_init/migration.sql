CREATE TABLE "Ticket" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "slaDeadline" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deleteAt" TIMESTAMP(3),
    CONSTRAINT "Ticket_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TicketHistory" (
    "id" SERIAL NOT NULL,
    "ticketId" INTEGER NOT NULL,
    "action" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "details" TEXT,
    CONSTRAINT "TicketHistory_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SlaConfig" (
    "id" SERIAL NOT NULL,
    "priority" TEXT NOT NULL,
    "days" INTEGER NOT NULL,
    CONSTRAINT "SlaConfig_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SlaConfig_priority_key" ON "SlaConfig"("priority");

ALTER TABLE "TicketHistory" ADD CONSTRAINT "TicketHistory_ticketId_fkey"
    FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE CASCADE ON UPDATE CASCADE;
