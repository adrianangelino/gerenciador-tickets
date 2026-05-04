import api from './api'

export interface TicketHistory {
  id: number
  ticketId: number
  action: string
  timestamp: string
  details: string | null
}

export interface Ticket {
  id: number
  title: string
  description: string | null
  status: 'PENDING' | 'OPEN' | 'IN_PROGRESS' | 'CONCLUDED' | 'CLOSED' | 'FAILED'
  priority: 'HIGH' | 'MEDIUM' | 'LOW'
  slaDeadline: string | null
  createdAt: string
  updatedAt: string
  deleteAt: string | null
  history: TicketHistory[]
}

export interface GetAllTicketsParams {
  status?: string
  priority?: string
  title?: string
}

export interface CreateTicketPayload {
  title: string
  description?: string
  priority?: 'HIGH' | 'MEDIUM' | 'LOW'
}

export interface UpdateTicketPayload {
  title?: string
  description?: string
  status?: 'PENDING' | 'OPEN' | 'IN_PROGRESS' | 'CONCLUDED' | 'CLOSED' | 'FAILED'
  priority?: 'HIGH' | 'MEDIUM' | 'LOW'
}

export async function getAllTickets(params: GetAllTicketsParams = {}): Promise<Ticket[]> {
  const { data } = await api.get<Ticket[]>('/tickets/getAllTickets', { params })
  return data
}

export async function createTicket(payload: CreateTicketPayload): Promise<Ticket> {
  const { data } = await api.post<Ticket>('/tickets/createTicket', payload)
  return data
}

export async function updateTicket(id: number, payload: UpdateTicketPayload): Promise<Ticket> {
  const { data } = await api.patch<Ticket>(`/tickets/updateTicket/${id}`, payload)
  return data
}

export async function softDeleteTicket(id: number): Promise<void> {
  await api.delete(`/tickets/SoftDeleteById/${id}`)
}
