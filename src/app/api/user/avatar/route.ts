import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireRole, requireSession } from "@/lib/auth/api-guard"
import { NotFoundError, ValidationError } from "@/lib/errors/custom-errors"
import { handleApiError } from "@/lib/errors/error-handler"
import { toSafeUser } from "@/lib/domain/user-dto"
import { saveAvatarUpload } from "@/lib/upload/avatar"
import { UserAvatarUploadSchema } from "@/lib/validations/user"
import { parseWith } from "@/lib/validations/parse"

const MANAGE_USERS_ROLES = ["SUPER_ADMIN", "ADMIN"] as const

export async function POST(req: Request) {
  try {
    const session = await requireSession()
    const formData = await req.formData()
    const file = formData.get("file")
    const userIdField = formData.get("userId")

    if (!(file instanceof File)) {
      throw new ValidationError("Arquivo não informado.")
    }

    const { userId: requestedUserId } = parseWith(UserAvatarUploadSchema, {
      userId: typeof userIdField === "string" && userIdField.trim() ? userIdField.trim() : undefined,
    })

    const targetUserId = requestedUserId ?? session.user.id

    if (targetUserId !== session.user.id) {
      await requireRole(...MANAGE_USERS_ROLES)
    }

    const existing = await db.user.findUnique({ where: { id: targetUserId } })
    if (!existing) throw new NotFoundError("Usuário não encontrado.")

    const upload = await saveAvatarUpload(file)
    const user = await db.user.update({
      where: { id: targetUserId },
      data: { image: upload.fileUrl },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        active: true,
        doctorId: true,
        image: true,
        doctor: { select: { name: true } },
      },
    })

    return NextResponse.json(
      { ...upload, user: toSafeUser(user) },
      { status: 201 }
    )
  } catch (error) {
    return handleApiError(error)
  }
}
