import { useCallback, useEffect, useState } from 'react'
import type { AxiosError } from 'axios'
import {
  getAllSlaConfigs,
  createSlaConfig,
  updateSlaConfig,
  deleteSlaConfig,
} from '../services/sla.service'
import type { SlaConfig } from '../services/sla.service'

type Priority = 'HIGH' | 'MEDIUM' | 'LOW'

const PRIORITIES: Priority[] = ['HIGH', 'MEDIUM', 'LOW']

const PRIORITY_LABELS: Record<Priority, string> = {
  HIGH: 'Alta',
  MEDIUM: 'Média',
  LOW: 'Baixa',
}

const PRIORITY_COLORS: Record<Priority, string> = {
  HIGH: 'text-red-600 bg-red-50',
  MEDIUM: 'text-yellow-700 bg-yellow-50',
  LOW: 'text-green-700 bg-green-50',
}

const PRIORITY_BADGE: Record<Priority, string> = {
  HIGH: 'bg-red-100 text-red-700',
  MEDIUM: 'bg-yellow-100 text-yellow-800',
  LOW: 'bg-green-100 text-green-800',
}

function getAxiosMessage(err: unknown): string {
  const axiosErr = err as AxiosError<{ message?: string | string[] }>
  const msg = axiosErr.response?.data?.message ?? (err as Error).message ?? 'Erro desconhecido.'
  return Array.isArray(msg) ? msg.join(' ') : msg
}

interface RowState {
  days: string
  saving: boolean
  deleting: boolean
  error: string | null
  success: boolean
}

export default function SlaConfigPage() {
  const [configs, setConfigs] = useState<SlaConfig[]>([])
  const [loading, setLoading] = useState(true)
  const [globalError, setGlobalError] = useState<string | null>(null)

  const [rowState, setRowState] = useState<Record<Priority, RowState>>({
    HIGH: { days: '', saving: false, deleting: false, error: null, success: false },
    MEDIUM: { days: '', saving: false, deleting: false, error: null, success: false },
    LOW: { days: '', saving: false, deleting: false, error: null, success: false },
  })

  const fetchConfigs = useCallback(async () => {
    setLoading(true)
    setGlobalError(null)
    try {
      const data = await getAllSlaConfigs()
      setConfigs(data)
      // Initialize row days from fetched data
      setRowState((prev) => {
        const next = { ...prev }
        for (const p of PRIORITIES) {
          const existing = data.find((c) => c.priority === p)
          next[p] = { ...next[p], days: existing ? String(existing.days) : '' }
        }
        return next
      })
    } catch (err) {
      setGlobalError(getAxiosMessage(err))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchConfigs()
  }, [fetchConfigs])

  const setRow = (priority: Priority, patch: Partial<RowState>) => {
    setRowState((prev) => ({
      ...prev,
      [priority]: { ...prev[priority], ...patch },
    }))
  }

  const handleSave = async (priority: Priority) => {
    const { days } = rowState[priority]
    const parsedDays = parseInt(days, 10)

    if (!days.trim() || isNaN(parsedDays) || parsedDays <= 0) {
      setRow(priority, { error: 'Informe um número de dias válido (> 0).' })
      return
    }

    setRow(priority, { saving: true, error: null, success: false })
    try {
      const existing = configs.find((c) => c.priority === priority)
      if (existing) {
        const updated = await updateSlaConfig(priority, parsedDays)
        setConfigs((prev) =>
          prev.map((c) => (c.priority === priority ? updated : c)),
        )
      } else {
        const created = await createSlaConfig(priority, parsedDays)
        setConfigs((prev) => [...prev, created])
      }
      setRow(priority, { saving: false, success: true })
      setTimeout(() => setRow(priority, { success: false }), 2000)
    } catch (err) {
      setRow(priority, { saving: false, error: getAxiosMessage(err) })
    }
  }

  const handleDelete = async (priority: Priority) => {
    const existing = configs.find((c) => c.priority === priority)
    if (!existing) return
    if (!window.confirm(`Remover configuração SLA para prioridade ${PRIORITY_LABELS[priority]}?`)) return

    setRow(priority, { deleting: true, error: null, success: false })
    try {
      await deleteSlaConfig(priority)
      setConfigs((prev) => prev.filter((c) => c.priority !== priority))
      setRow(priority, { days: '', deleting: false })
    } catch (err) {
      setRow(priority, { deleting: false, error: getAxiosMessage(err) })
    }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">Configuração de SLA</h1>
        <p className="text-sm text-gray-500 mt-1">
          Defina o prazo em dias para cada nível de prioridade. O deadline é calculado a partir da criação do ticket.
        </p>
      </div>

      {/* Global Error */}
      {globalError && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
          <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm-1-9v4a1 1 0 102 0V9a1 1 0 10-2 0zm0-4a1 1 0 112 0 1 1 0 01-2 0z" clipRule="evenodd" />
          </svg>
          {globalError}
        </div>
      )}

      {/* Table Card */}
      <div className="bg-white rounded-2xl shadow-md overflow-hidden">
        {loading ? (
          <div className="divide-y divide-gray-100">
            {PRIORITIES.map((p) => (
              <div key={p} className="px-6 py-5 flex items-center gap-4 animate-pulse">
                <div className="h-6 w-16 bg-gray-200 rounded-full" />
                <div className="flex-1 h-9 bg-gray-100 rounded-lg" />
                <div className="h-9 w-20 bg-gray-200 rounded-lg" />
              </div>
            ))}
          </div>
        ) : (
          <>
            <div className="px-6 py-3 bg-gray-50 border-b border-gray-100">
              <div className="grid grid-cols-12 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                <span className="col-span-3">Prioridade</span>
                <span className="col-span-5">Prazo (dias)</span>
                <span className="col-span-4 text-right">Ações</span>
              </div>
            </div>

            <div className="divide-y divide-gray-100">
              {PRIORITIES.map((priority) => {
                const existing = configs.find((c) => c.priority === priority)
                const row = rowState[priority]
                const isNew = !existing

                return (
                  <div
                    key={priority}
                    className={`px-6 py-4 ${PRIORITY_COLORS[priority]} transition-colors`}
                  >
                    <div className="grid grid-cols-12 items-center gap-4">
                      {/* Priority Badge */}
                      <div className="col-span-3">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${PRIORITY_BADGE[priority]}`}
                        >
                          {priority === 'HIGH' && (
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M5.293 7.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L6.707 7.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                          {priority === 'MEDIUM' && (
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                            </svg>
                          )}
                          {priority === 'LOW' && (
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M14.707 12.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                          {PRIORITY_LABELS[priority]}
                        </span>
                      </div>

                      {/* Days Input */}
                      <div className="col-span-5">
                        <div className="relative">
                          <input
                            type="number"
                            min={1}
                            value={row.days}
                            onChange={(e) =>
                              setRow(priority, { days: e.target.value, error: null, success: false })
                            }
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSave(priority)
                            }}
                            placeholder={isNew ? 'Não configurado' : ''}
                            className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">
                            dias
                          </span>
                        </div>
                        {row.error && (
                          <p className="text-xs text-red-600 mt-1">{row.error}</p>
                        )}
                        {row.success && (
                          <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            Salvo com sucesso!
                          </p>
                        )}
                        {isNew && (
                          <p className="text-xs text-gray-400 mt-1">Configuração não criada ainda</p>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="col-span-4 flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleSave(priority)}
                          disabled={row.saving || row.deleting}
                          className={[
                            'inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition disabled:opacity-60 disabled:cursor-not-allowed',
                            isNew
                              ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                              : 'bg-white border border-indigo-300 text-indigo-700 hover:bg-indigo-50',
                          ].join(' ')}
                        >
                          {row.saving ? (
                            <svg className="animate-spin h-3.5 w-3.5" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                          ) : (
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                          {row.saving ? 'Salvando' : isNew ? 'Criar' : 'Salvar'}
                        </button>

                        {!isNew && (
                          <button
                            onClick={() => handleDelete(priority)}
                            disabled={row.saving || row.deleting}
                            title="Remover configuração"
                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-white border border-red-200 text-red-600 hover:bg-red-50 transition disabled:opacity-60 disabled:cursor-not-allowed"
                          >
                            {row.deleting ? (
                              <svg className="animate-spin h-3.5 w-3.5" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                              </svg>
                            ) : (
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            )}
                            {row.deleting ? 'Removendo' : 'Remover'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>

      {/* Info */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-50 border border-blue-100 text-blue-700 text-sm">
        <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>
          O SLA define o prazo máximo para resolução de um ticket. Tickets com SLA vencido aparecem destacados no Dashboard.
        </span>
      </div>
    </div>
  )
}
