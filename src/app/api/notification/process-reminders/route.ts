import { NextResponse } from "next/server"
import { requireSession } from "@/lib/auth/api-guard"
import { handleApiError } from "@/lib/errors/error-handler"
import { processDueReminders } from "@/lib/notification/reminder-scheduler"

export async function POST() {
  try {
    const session = await requireSession()
    const result = await processDueReminders(session.user.id)
    return NextResponse.json({ success: true, ...result })
  } catch (error) {
    return handleApiError(error)
  }
}
