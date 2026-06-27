import { NextResponse } from "next/server"
import { requireSession } from "@/lib/auth/api-guard"
import { handleApiError } from "@/lib/errors/error-handler"
import { parseWith } from "@/lib/validations/parse"
import { TypingSchema } from "@/lib/validations/chat"
import { setTypingStatus } from "@/lib/chat/service"

export async function POST(req: Request) {
  try {
    const session = await requireSession()
    const body = parseWith(TypingSchema, await req.json())
    const result = await setTypingStatus(
      session.user.id,
      body.conversationId,
      body.isTyping,
      session.user.name ?? null
    )
    return NextResponse.json(result)
  } catch (error) {
    return handleApiError(error)
  }
}
