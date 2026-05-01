import { gerarHorarios } from '@/lib/schedule/slots'

describe('gerarHorarios', () => {
  it('should generate morning slots', () => {
    const slots = gerarHorarios('Manhã')
    expect(slots).toEqual([
      '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00'
    ])
  })

  it('should generate afternoon slots', () => {
    const slots = gerarHorarios('Tarde')
    expect(slots).toEqual([
      '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30'
    ])
  })

  it('should generate full day slots by default', () => {
    const slots = gerarHorarios()
    expect(slots.length).toBe(19) // Manhã + Tarde
    expect(slots[0]).toBe('08:00')
    expect(slots[slots.length - 1]).toBe('17:30')
  })

  it('should return empty array for Sunday', () => {
    // 2025-02-09 is a Sunday
    const slots = gerarHorarios(undefined, '2025-02-09')
    expect(slots).toEqual([])
  })

  it('should limit Saturday to morning only (until 12:00)', () => {
    // 2025-02-08 is a Saturday
    const slots = gerarHorarios(undefined, '2025-02-08')
    expect(slots).toEqual([
      '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00'
    ])
  })

  it('should limit Saturday to morning only for afternoon shift', () => {
    // 2025-02-08 is a Saturday
    const slots = gerarHorarios('Tarde', '2025-02-08')
    expect(slots).toEqual([]) // No afternoon slots on Saturday
  })
})