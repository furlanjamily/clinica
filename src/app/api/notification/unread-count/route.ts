import { NextResponse } from "next/server"
import { requireSession } from "@/lib/auth/api-guard"
import { handleApiError } from "@/lib/errors/error-handler"
import { getUnreadCount } from "@/lib/notification/service"

export async function GET() {
  try {
    const session = await requireSession()
    const result = await getUnreadCount(session.user.id)
    return NextResponse.json(result)
  } catch (error) {
    return handleApiError(error)
  }
}
