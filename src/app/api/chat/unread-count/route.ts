import { NextResponse } from "next/server"
import { requireSession } from "@/lib/auth/api-guard"
import { handleApiError } from "@/lib/errors/error-handler"
import { getTotalUnreadCount } from "@/lib/chat/service"

export async function GET() {
  try {
    const session = await requireSession()
    const result = await getTotalUnreadCount(session.user.id)
    return NextResponse.json(result)
  } catch (error) {
    return handleApiError(error)
  }
}
