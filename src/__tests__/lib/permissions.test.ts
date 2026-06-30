// @vitest-environment node
import {
  canCreateAppointment,
  canManageClinic,
  canManageUsers,
  canViewAgenda,
  canViewAttendance,
  canViewDashboard,
  getDefaultRouteForRole,
  isRouteForbiddenForRole,
} from "@/lib/auth/permissions"
import { UserRole } from "@/types/auth"

describe("permissions", () => {
  describe("Admin (recepcionista)", () => {
    const role = UserRole.Admin

    it("não acessa dashboard, agenda nem atendimentos", () => {
      expect(canViewDashboard(role)).toBe(false)
      expect(canViewAgenda(role)).toBe(false)
      expect(canViewAttendance(role)).toBe(false)
      expect(canCreateAppointment(role)).toBe(false)
    })

    it("gerencia clínica e usuários", () => {
      expect(canManageClinic(role)).toBe(true)
      expect(canManageUsers(role)).toBe(true)
    })

    it("redireciona para financeiro após login", () => {
      expect(getDefaultRouteForRole(role)).toBe("/finance")
    })

    it("bloqueia rotas restritas", () => {
      expect(isRouteForbiddenForRole("/dashboard", role)).toBe(true)
      expect(isRouteForbiddenForRole("/schedule", role)).toBe(true)
      expect(isRouteForbiddenForRole("/attendance", role)).toBe(true)
      expect(isRouteForbiddenForRole("/new-patient", role)).toBe(false)
    })
  })

  describe("Super Admin", () => {
    const role = UserRole.SuperAdmin

    it("tem acesso completo", () => {
      expect(canViewDashboard(role)).toBe(true)
      expect(canViewAgenda(role)).toBe(true)
      expect(canViewAttendance(role)).toBe(true)
      expect(canManageClinic(role)).toBe(true)
      expect(canCreateAppointment(role)).toBe(true)
    })

    it("não bloqueia nenhuma rota", () => {
      expect(isRouteForbiddenForRole("/dashboard", role)).toBe(false)
    })
  })

  describe("Médico", () => {
    const role = UserRole.Medico

    it("acessa dashboard, agenda e atendimentos", () => {
      expect(canViewDashboard(role)).toBe(true)
      expect(canViewAgenda(role)).toBe(true)
      expect(canViewAttendance(role)).toBe(true)
      expect(canCreateAppointment(role)).toBe(true)
    })

    it("não gerencia clínica nem usuários", () => {
      expect(canManageClinic(role)).toBe(false)
      expect(canManageUsers(role)).toBe(false)
    })
  })
})
