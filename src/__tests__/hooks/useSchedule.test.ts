import { filterSchedules } from '@/hooks/useSchedule'
import type { Appointment } from '@/types/types'

const today = new Date().toISOString().split('T')[0]

const mockData: Appointment[] = [
  {
    id: 1,
    date: today,
    slotTime: '10:00',
    patient: { id: 1, name: 'João Silva' },
    professionalName: 'Dr. Maria',
    status: 'Agendado',
  },
  {
    id: 2,
    date: today,
    slotTime: '11:00',
    patient: { id: 2, name: 'Ana Costa' },
    professionalName: 'Dr. Pedro',
    status: 'Concluido',
  },
]

describe('filterSchedules', () => {
  it('should filter data by date in day view', () => {
    const result = filterSchedules(mockData, new Date(today), 'lista', {})
    expect(result).toHaveLength(2)
  })

  it('should filter by status', () => {
    const result = filterSchedules(mockData, new Date(today), 'lista', { status: 'Agendado' })
    expect(result).toHaveLength(1)
    expect(result[0].patient.name).toBe('João Silva')
  })

  it('should filter by patient name', () => {
    const result = filterSchedules(mockData, new Date(today), 'lista', { patient: 'ana' })
    expect(result).toHaveLength(1)
    expect(result[0].patient.name).toBe('Ana Costa')
  })
})
