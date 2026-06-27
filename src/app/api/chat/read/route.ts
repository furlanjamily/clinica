import { NextResponse } from "next/server"
import { requireSession } from "@/lib/auth/api-guard"
import { handleApiError } from "@/lib/errors/error-handler"
import { parseWith } from "@/lib/validations/parse"
import { MarkReadSchema } from "@/lib/validations/chat"
import { markMessagesAsRead } from "@/lib/chat/service"

export async function POST(req: Request) {
  try {
    const session = await requireSession()
    const body = parseWith(MarkReadSchema, await req.json())
    const result = await markMessagesAsRead(
      session.user.id,
      body.conversationId,
      body.messageIds
    )
    return NextResponse.json(result)
  } catch (error) {
    return handleApiError(error)
  }
}
