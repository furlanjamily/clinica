import { describe, expect, it } from "vitest"
import { AppointmentStatus } from "@/lib/schedule/status"
import { buildDashboardStatusBreakdown } from "@/lib/dashboard/agenda-status"

describe("buildDashboardStatusBreakdown", () => {
  it("uses the same buckets as the timeline filters", () => {
    const breakdown = buildDashboardStatusBreakdown([
      { status: AppointmentStatus.Completed, _count: 4 },
      { status: AppointmentStatus.Paid, _count: 2 },
      { status: AppointmentStatus.CheckIn, _count: 1 },
      { status: AppointmentStatus.AwaitingPayment, _count: 1 },
      { status: AppointmentStatus.Confirmed, _count: 3 },
      { status: AppointmentStatus.Cancelled, _count: 5 },
      { status: AppointmentStatus.Rescheduled, _count: 2 },
    ])

    expect(breakdown.counts).toEqual({
      completed: 4,
      inProgress: 4,
      pending: 3,
    })
    expect(breakdown.totalProgress).toBe(36)
  })
})
