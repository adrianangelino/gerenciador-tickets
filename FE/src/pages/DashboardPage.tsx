import { useCallback, useEffect, useRef, useState } from 'react'
import type { AxiosError } from 'axios'
import {
  getAllTickets,
  createTicket,
  updateTicket,
  softDeleteTicket,
} from '../services/tickets.service'
import type {
  Ticket,
  CreateTicketPayload,
  UpdateTicketPayload,
} from '../services/tickets.service'

// ─── helpers ───────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<Ticket['status'], string> = {
  PENDING: 'Pendente',
  OPEN: 'Aberto',
  IN_PROGRESS: 'Em andamento',
  CONCLUDED: 'Concluído',
  CLOSED: 'Fechado',
  FAILED: 'Falhou',
}

const STATUS_COLORS: Record<Ticket['status'], string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  OPEN: 'bg-green-100 text-green-800',
  IN_PROGRESS: 'bg-blue-100 text-blue-800',
  CONCLUDED: 'bg-emerald-100 text-emerald-800',
  CLOSED: 'bg-gray-100 text-gray-700',
  FAILED: 'bg-red-100 text-red-700',
}

const STATUS_BORDER: Record<Ticket['status'], string> = {
  PENDING: 'border-yellow-400',
  OPEN: 'border-green-500',
  IN_PROGRESS: 'border-blue-500',
  CONCLUDED: 'border-emerald-500',
  CLOSED: 'border-gray-400',
  FAILED: 'border-red-500',
}

const PRIORITY_LABELS: Record<Ticket['priority'], string> = {
  HIGH: 'Alta',
  MEDIUM: 'Média',
  LOW: 'Baixa',
}

const PRIORITY_COLORS: Record<Ticket['priority'], string> = {
  HIGH: 'bg-red-100 text-red-700',
  MEDIUM: 'bg-yellow-100 text-yellow-800',
  LOW: 'bg-green-100 text-green-800',
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleString('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  })
}

function getAxiosMessage(err: unknown): string {
  const axiosErr = err as AxiosError<{ message?: string | string[] }>
  const msg = axiosErr.response?.data?.message ?? axiosErr.message ?? 'Erro desconhecido.'
  return Array.isArray(msg) ? msg.join(' ') : msg
}

// ─── Modal ─────────────────────────────────────────────────────────────────

interface TicketModalProps {
  ticket?: Ticket | null
  onClose: () => void
  onSaved: () => void
}

function TicketModal({ ticket, onClose, onSaved }: TicketModalProps) {
  const isEdit = !!ticket
  const [title, setTitle] = useState(ticket?.title ?? '')
  const [description, setDescription] = useState(ticket?.description ?? '')
  const [priority, setPriority] = useState<Ticket['priority']>(ticket?.priority ?? 'MEDIUM')
  const [status, setStatus] = useState<Ticket['status']>(ticket?.status ?? 'PENDING')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const overlayRef = useRef<HTMLDivElement>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!title.trim()) {
      setError('Título é obrigatório.')
      return
    }

    setSaving(true)
    try {
      if (isEdit && ticket) {
        const payload: UpdateTicketPayload = {
          title: title.trim(),
          description: description.trim() || undefined,
          priority,
          status,
        }
        await updateTicket(ticket.id, payload)
      } else {
        const payload: CreateTicketPayload = {
          title: title.trim(),
          description: description.trim() || undefined,
          priority,
        }
        await createTicket(payload)
      }
      onSaved()
      onClose()
    } catch (err) {
      setError(getAxiosMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose()
  }

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            {isEdit ? 'Editar Ticket' : 'Novo Ticket'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition p-1 rounded"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Título <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Descrição resumida do problema"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descrição
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Detalhes adicionais (opcional)"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Prioridade
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as Ticket['priority'])}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition bg-white"
              >
                <option value="HIGH">Alta</option>
                <option value="MEDIUM">Média</option>
                <option value="LOW">Baixa</option>
              </select>
            </div>

            {isEdit && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as Ticket['status'])}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition bg-white"
                >
                  <option value="PENDING">Pendente</option>
                  <option value="OPEN">Aberto</option>
                  <option value="IN_PROGRESS">Em andamento</option>
                  <option value="CONCLUDED">Concluído</option>
                  <option value="CLOSED">Fechado</option>
<option value="FAILED">Falhou</option>
                </select>
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 border border-gray-300 text-gray-700 font-medium rounded-lg text-sm hover:bg-gray-50 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg text-sm transition disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {saving && (
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              )}
              {saving ? 'Salvando...' : isEdit ? 'Salvar alterações' : 'Criar ticket'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── History Modal ──────────────────────────────────────────────────────────

interface HistoryModalProps {
  ticket: Ticket
  onClose: () => void
}

function HistoryModal({ ticket, onClose }: HistoryModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null)
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose()
  }

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-lg font-semibold text-gray-900">
            Histórico — {ticket.title}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition p-1 rounded"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="overflow-y-auto flex-1 px-6 py-4">
          {ticket.history.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-6">Sem histórico disponível.</p>
          ) : (
            <ol className="relative border-l border-gray-200 space-y-4">
              {[...ticket.history]
                .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                .map((h) => (
                  <li key={h.id} className="ml-4">
                    <div className="absolute -left-1.5 w-3 h-3 bg-indigo-500 rounded-full border-2 border-white" />
                    <p className="text-xs text-gray-400">{formatDate(h.timestamp)}</p>
                    <p className="text-sm font-medium text-gray-800">{h.action}</p>
                    {h.details && (
                      <p className="text-xs text-gray-500 mt-0.5">{h.details}</p>
                    )}
                  </li>
                ))}
            </ol>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Delete Confirm ─────────────────────────────────────────────────────────

interface DeleteConfirmProps {
  ticket: Ticket
  onConfirm: () => void
  onCancel: () => void
  deleting: boolean
}

function DeleteConfirm({ ticket, onConfirm, onCancel, deleting }: DeleteConfirmProps) {
  const overlayRef = useRef<HTMLDivElement>(null)
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onCancel()
  }

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center">
        <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
          <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </div>
        <h3 className="text-base font-semibold text-gray-900 mb-1">Excluir ticket?</h3>
        <p className="text-sm text-gray-500 mb-6">
          "<span className="font-medium">{ticket.title}</span>" será arquivado e não aparecerá mais na lista.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2 px-4 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50 transition"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={deleting}
            className="flex-1 py-2 px-4 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm transition disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {deleting && (
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            )}
            {deleting ? 'Excluindo...' : 'Excluir'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Ticket Card ────────────────────────────────────────────────────────────

interface TicketCardProps {
  ticket: Ticket
  onEdit: (t: Ticket) => void
  onDelete: (t: Ticket) => void
  onHistory: (t: Ticket) => void
}

function TicketCard({ ticket, onEdit, onDelete, onHistory }: TicketCardProps) {
  const isOverdue =
    ticket.slaDeadline &&
    new Date(ticket.slaDeadline) < new Date() &&
    ticket.status !== 'CONCLUDED' &&
    ticket.status !== 'CLOSED'

  return (
    <div
      className={[
        'bg-white rounded-xl shadow-md border-l-4 p-5 flex flex-col gap-3 transition hover:shadow-lg',
        STATUS_BORDER[ticket.status],
      ].join(' ')}
    >
      {/* Title row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 text-sm leading-tight truncate">
            {ticket.title}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">#{ticket.id}</p>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span
            className={`text-xs font-medium px-2 py-0.5 rounded-full ${PRIORITY_COLORS[ticket.priority]}`}
          >
            {PRIORITY_LABELS[ticket.priority]}
          </span>
          <span
            className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[ticket.status]}`}
          >
            {STATUS_LABELS[ticket.status]}
          </span>
        </div>
      </div>

      {/* Description */}
      {ticket.description && (
        <p className="text-sm text-gray-600 line-clamp-2">{ticket.description}</p>
      )}

      {/* SLA Deadline */}
      {ticket.slaDeadline && (
        <div
          className={`flex items-center gap-1.5 text-xs ${isOverdue ? 'text-red-600 font-medium' : 'text-gray-500'}`}
        >
          <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {isOverdue ? 'SLA vencido: ' : 'SLA: '}
          {formatDate(ticket.slaDeadline)}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-1 border-t border-gray-100">
        <span className="text-xs text-gray-400">
          Criado em {formatDate(ticket.createdAt)}
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onHistory(ticket)}
            title="Ver histórico"
            className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
          <button
            onClick={() => onEdit(ticket)}
            title="Editar ticket"
            className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            onClick={() => onDelete(ticket)}
            title="Excluir ticket"
            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Dashboard Page ─────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filters
  const [filterStatus, setFilterStatus] = useState('')
  const [filterPriority, setFilterPriority] = useState('')
  const [filterTitle, setFilterTitle] = useState('')

  // Modals
  const [createOpen, setCreateOpen] = useState(false)
  const [editTicket, setEditTicket] = useState<Ticket | null>(null)
  const [historyTicket, setHistoryTicket] = useState<Ticket | null>(null)
  const [deleteTicket, setDeleteTicket] = useState<Ticket | null>(null)
  const [deleting, setDeleting] = useState(false)

  const fetchTickets = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params: Record<string, string> = {}
      if (filterStatus) params.status = filterStatus
      if (filterPriority) params.priority = filterPriority
      if (filterTitle) params.title = filterTitle
      const data = await getAllTickets(params)
      setTickets(data)
    } catch (err) {
      setError(getAxiosMessage(err))
    } finally {
      setLoading(false)
    }
  }, [filterStatus, filterPriority, filterTitle])

  useEffect(() => {
    fetchTickets()
  }, [fetchTickets])

  const handleDelete = async () => {
    if (!deleteTicket) return
    setDeleting(true)
    try {
      await softDeleteTicket(deleteTicket.id)
      setDeleteTicket(null)
      fetchTickets()
    } catch (err) {
      setError(getAxiosMessage(err))
      setDeleteTicket(null)
    } finally {
      setDeleting(false)
    }
  }

  const visibleTickets = tickets.filter((t) => !t.deleteAt)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500">
            {loading ? 'Carregando...' : `${visibleTickets.length} ticket${visibleTickets.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <button
          onClick={() => setCreateOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Novo Ticket
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4 flex flex-wrap gap-3">
        <div className="flex-1 min-w-[160px]">
          <input
            type="text"
            placeholder="Buscar por título..."
            value={filterTitle}
            onChange={(e) => setFilterTitle(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
        >
          <option value="">Todos os status</option>
          <option value="PENDING">Pendente</option>
          <option value="OPEN">Aberto</option>
          <option value="IN_PROGRESS">Em andamento</option>
          <option value="CONCLUDED">Concluído</option>
          <option value="CLOSED">Fechado</option>
          <option value="FAILED">Falhou</option>
        </select>
        <select
          value={filterPriority}
          onChange={(e) => setFilterPriority(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
        >
          <option value="">Todas as prioridades</option>
          <option value="HIGH">Alta</option>
          <option value="MEDIUM">Média</option>
          <option value="LOW">Baixa</option>
        </select>
        {(filterStatus || filterPriority || filterTitle) && (
          <button
            onClick={() => {
              setFilterStatus('')
              setFilterPriority('')
              setFilterTitle('')
            }}
            className="px-3 py-2 text-sm text-gray-500 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
          >
            Limpar filtros
          </button>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
          <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm-1-9v4a1 1 0 102 0V9a1 1 0 10-2 0zm0-4a1 1 0 112 0 1 1 0 01-2 0z" clipRule="evenodd" />
          </svg>
          {error}
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl shadow-md border-l-4 border-gray-200 p-5 animate-pulse space-y-3">
              <div className="h-4 bg-gray-200 rounded w-3/4" />
              <div className="h-3 bg-gray-100 rounded w-1/2" />
              <div className="h-3 bg-gray-100 rounded w-full" />
              <div className="h-3 bg-gray-100 rounded w-4/5" />
            </div>
          ))}
        </div>
      )}

      {/* Ticket Grid */}
      {!loading && visibleTickets.length === 0 && (
        <div className="text-center py-16">
          <svg className="mx-auto w-12 h-12 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p className="text-gray-500 text-sm">Nenhum ticket encontrado.</p>
          <button
            onClick={() => setCreateOpen(true)}
            className="mt-3 text-indigo-600 hover:text-indigo-800 text-sm font-medium"
          >
            Criar o primeiro ticket
          </button>
        </div>
      )}

      {!loading && visibleTickets.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {visibleTickets.map((ticket) => (
            <TicketCard
              key={ticket.id}
              ticket={ticket}
              onEdit={setEditTicket}
              onDelete={setDeleteTicket}
              onHistory={setHistoryTicket}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      {createOpen && (
        <TicketModal
          onClose={() => setCreateOpen(false)}
          onSaved={fetchTickets}
        />
      )}
      {editTicket && (
        <TicketModal
          ticket={editTicket}
          onClose={() => setEditTicket(null)}
          onSaved={fetchTickets}
        />
      )}
      {historyTicket && (
        <HistoryModal
          ticket={historyTicket}
          onClose={() => setHistoryTicket(null)}
        />
      )}
      {deleteTicket && (
        <DeleteConfirm
          ticket={deleteTicket}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTicket(null)}
          deleting={deleting}
        />
      )}
    </div>
  )
}
