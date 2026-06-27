import { NextResponse } from "next/server"
import { requireSession } from "@/lib/auth/api-guard"
import { handleApiError } from "@/lib/errors/error-handler"
import { saveChatUpload } from "@/lib/chat/upload"

export async function POST(req: Request) {
  try {
    await requireSession()
    const formData = await req.formData()
    const file = formData.get("file")

    if (!(file instanceof File)) {
      return NextResponse.json({ message: "Arquivo não informado" }, { status: 400 })
    }

    const result = await saveChatUpload(file)
    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}
