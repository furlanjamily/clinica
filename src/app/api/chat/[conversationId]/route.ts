import { NextResponse } from "next/server"
import { requireSession } from "@/lib/auth/api-guard"
import { handleApiError } from "@/lib/errors/error-handler"
import { parseWith } from "@/lib/validations/parse"
import { UpdateConversationSchema } from "@/lib/validations/chat"
import {
  getConversation,
  getConversationAttachments,
  updateConversationParticipant,
} from "@/lib/chat/service"

type RouteContext = { params: Promise<{ conversationId: string }> }

export async function GET(req: Request, context: RouteContext) {
  try {
    const session = await requireSession()
    const { conversationId } = await context.params
    const id = Number(conversationId)
    const { searchParams } = new URL(req.url)

    if (searchParams.get("attachments") === "true") {
      const attachments = await getConversationAttachments(id, session.user.id)
      return NextResponse.json(attachments)
    }

    const conversation = await getConversation(session.user.id, id)
    return NextResponse.json(conversation)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function PATCH(req: Request, context: RouteContext) {
  try {
    const session = await requireSession()
    const { conversationId } = await context.params
    const body = parseWith(UpdateConversationSchema, {
      ...(await req.json()),
      conversationId: Number(conversationId),
    })

    const conversation = await updateConversationParticipant(
      session.user.id,
      body.conversationId,
      {
        isFavorite: body.isFavorite,
        isMuted: body.isMuted,
        isArchived: body.isArchived,
        category: body.category,
      }
    )
    return NextResponse.json(conversation)
  } catch (error) {
    return handleApiError(error)
  }
}
