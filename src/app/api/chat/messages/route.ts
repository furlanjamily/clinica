import { NextResponse } from "next/server"
import { requireSession } from "@/lib/auth/api-guard"
import { handleApiError } from "@/lib/errors/error-handler"
import { parseWith } from "@/lib/validations/parse"
import {
  DeleteMessageSchema,
  EditMessageSchema,
  GetMessagesSchema,
  SendMessageSchema,
} from "@/lib/validations/chat"
import {
  deleteMessage,
  editMessage,
  getMessages,
  markMessageDelivered,
  sendMessage,
} from "@/lib/chat/service"

export async function GET(req: Request) {
  try {
    const session = await requireSession()
    const { searchParams } = new URL(req.url)
    const query = parseWith(GetMessagesSchema, {
      conversationId: Number(searchParams.get("conversationId")),
      cursor: searchParams.get("cursor")
        ? Number(searchParams.get("cursor"))
        : undefined,
      limit: searchParams.get("limit")
        ? Number(searchParams.get("limit"))
        : undefined,
      search: searchParams.get("search") ?? undefined,
    })

    const page = await getMessages(
      session.user.id,
      query.conversationId,
      query.cursor,
      query.limit ?? 30,
      query.search
    )
    return NextResponse.json(page)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(req: Request) {
  try {
    const session = await requireSession()
    const body = parseWith(SendMessageSchema, await req.json())
    const message = await sendMessage(
      session.user.id,
      body.conversationId,
      body.content,
      body.replyToId,
      body.attachments
    )

    return NextResponse.json(message, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await requireSession()
    const body = parseWith(EditMessageSchema, await req.json())
    const message = await editMessage(session.user.id, body.messageId, body.content)
    return NextResponse.json(message)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await requireSession()
    const body = parseWith(DeleteMessageSchema, await req.json())
    const result = await deleteMessage(session.user.id, body.messageId)
    return NextResponse.json(result)
  } catch (error) {
    return handleApiError(error)
  }
}

/** Confirma entrega de mensagem (marca como Delivered). */
export async function PUT(req: Request) {
  try {
    const session = await requireSession()
    const { messageId } = (await req.json()) as { messageId: number }
    if (!messageId) {
      return NextResponse.json({ message: "messageId obrigatório" }, { status: 400 })
    }
    await markMessageDelivered(messageId, session.user.id)
    return NextResponse.json({ success: true })
  } catch (error) {
    return handleApiError(error)
  }
}
