import { NextResponse } from "next/server"
import { requireSession } from "@/lib/auth/api-guard"
import { handleApiError } from "@/lib/errors/error-handler"
import { markNotificationsAsRead } from "@/lib/notification/service"
import { parseWith } from "@/lib/validations/parse"
import { MarkNotificationsReadSchema } from "@/lib/validations/notification"

export async function PATCH(req: Request) {
  try {
    const session = await requireSession()
    const body = parseWith(MarkNotificationsReadSchema, await req.json())
    const result = await markNotificationsAsRead(session.user.id, body.notificationIds)
    return NextResponse.json(result)
  } catch (error) {
    return handleApiError(error)
  }
}
