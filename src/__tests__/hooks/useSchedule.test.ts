import { filterSchedules } from '@/hooks/useSchedule'
import type { Atendimento } from '@/types/types'

const today = new Date().toISOString().split('T')[0]

const mockData: Atendimento[] = [
  {
    id: 1,
    data: today,
    horario: '10:00',
    paciente: { id: 1, nome: 'João Silva' },
    profissionalNome: 'Dr. Maria',
    status: 'Agendado',
  },
  {
    id: 2,
    data: today,
    horario: '11:00',
    paciente: { id: 2, nome: 'Ana Costa' },
    profissionalNome: 'Dr. Pedro',
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
    expect(result[0].paciente.nome).toBe('João Silva')
  })

  it('should filter by patient name', () => {
    const result = filterSchedules(mockData, new Date(today), 'lista', { paciente: 'ana' })
    expect(result).toHaveLength(1)
    expect(result[0].paciente.nome).toBe('Ana Costa')
  })
})