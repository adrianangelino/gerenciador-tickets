import api from './api'

export interface SlaConfig {
  id: number
  priority: string
  days: number
}

export async function getAllSlaConfigs(): Promise<SlaConfig[]> {
  const { data } = await api.get<SlaConfig[]>('/sla/configs')
  return data
}

export async function createSlaConfig(
  priority: 'HIGH' | 'MEDIUM' | 'LOW',
  days: number,
): Promise<SlaConfig> {
  const { data } = await api.post<SlaConfig>('/sla/config', { priority, days })
  return data
}

export async function updateSlaConfig(
  priority: 'HIGH' | 'MEDIUM' | 'LOW',
  days: number,
): Promise<SlaConfig> {
  const { data } = await api.patch<SlaConfig>(`/sla/config/${priority}`, { days })
  return data
}

export async function deleteSlaConfig(
  priority: 'HIGH' | 'MEDIUM' | 'LOW',
): Promise<void> {
  await api.delete(`/sla/config/${priority}`)
}
