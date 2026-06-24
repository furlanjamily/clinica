// @vitest-environment node
import type { Server } from 'node:http'
import supertest from 'supertest'
import { startServer } from '../setup'

let request: ReturnType<typeof supertest>
let server: Server

beforeAll(async () => {
  const { server: s, port } = await startServer()
  server = s
  request = supertest(`http://localhost:${port}`)
}, 60000)

afterAll(async () => {
  if (server) {
    await new Promise<void>((resolve, reject) => {
      server.close((err: Error | null | undefined) => {
        if (err) reject(err)
        else resolve()
      })
    })
  }
}, 60000)

describe('API /api/schedule', () => {
  it('should return list of schedules on GET', async () => {
    const response = await request.get('/api/schedule')
    expect(response.status).toBe(200)
    expect(response.body).toHaveProperty('appointments')
    expect(response.body).toHaveProperty('doctors')
    expect(response.body).toHaveProperty('patients')
    expect(Array.isArray(response.body.appointments)).toBe(true)
  }, 90000)

  it.skip('should create a new schedule on POST', async () => {
    const newSchedule = {
      date: '2026-04-20',
      slotTime: '10:00',
      patient: 'Teste Paciente',
      professional: 'Dr. Teste',
    }
    const response = await request.post('/api/schedule').send(newSchedule)
    expect(response.status).toBe(200)
  }, 10000)
})