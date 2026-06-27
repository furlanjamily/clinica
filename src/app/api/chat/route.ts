import { NextResponse } from "next/server"
import { requireSession } from "@/lib/auth/api-guard"
import { handleApiError } from "@/lib/errors/error-handler"
import { parseWith } from "@/lib/validations/parse"
import {
  CreateConversationSchema,
  ConversationSearchSchema,
} from "@/lib/validations/chat"
import {
  createConversation,
  listAvailableUsers,
  listConversations,
} from "@/lib/chat/service"

export async function GET(req: Request) {
  try {
    const session = await requireSession()
    const { searchParams } = new URL(req.url)

    if (searchParams.get("action") === "users") {
      const users = await listAvailableUsers(session.user.id)
      return NextResponse.json(users)
    }

    const { q, archived } = parseWith(ConversationSearchSchema, {
      q: searchParams.get("q") ?? undefined,
      archived: searchParams.get("archived") === "true" ? true : undefined,
    })

    const result = await listConversations(session.user.id, q, archived ?? false)
    return NextResponse.json(result)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(req: Request) {
  try {
    const session = await requireSession()
    const body = parseWith(CreateConversationSchema, await req.json())
    const conversation = await createConversation(
      session.user.id,
      body.participantIds,
      body.title,
      body.type ?? "Direct"
    )
    return NextResponse.json(conversation, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}
