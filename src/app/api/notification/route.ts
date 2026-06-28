import { NextResponse } from "next/server"
import { requireSession } from "@/lib/auth/api-guard"
import { handleApiError } from "@/lib/errors/error-handler"
import { listNotifications } from "@/lib/notification/service"
import { parseWith } from "@/lib/validations/parse"
import { ListNotificationsSchema } from "@/lib/validations/notification"

export async function GET(req: Request) {
  try {
    const session = await requireSession()
    const { searchParams } = new URL(req.url)

    const query = parseWith(ListNotificationsSchema, {
      tab: searchParams.get("tab") ?? undefined,
      cursor: searchParams.get("cursor") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
    })

    const page = await listNotifications(
      session.user.id,
      query.tab,
      query.cursor,
      query.limit
    )

    return NextResponse.json(page)
  } catch (error) {
    return handleApiError(error)
  }
}
