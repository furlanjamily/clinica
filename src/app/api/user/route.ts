import { db } from "@/lib/db"
import { hashSync } from "bcrypt"
import { NextResponse } from "next/server"
import * as z from "zod"
import { requireRole } from "@/lib/auth/api-guard"
import { ConflictError } from "@/lib/errors/custom-errors"
import { handleApiError } from "@/lib/errors/error-handler"
import { parseWith } from "@/lib/validations/parse"
import { USER_ROLES } from "@/types/auth"

const PASSWORD_HASH_ROUNDS = 10

const CreateUserSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(USER_ROLES).default("ADMIN"),
})

const UpdateUserSchema = z.object({
  id: z.string().min(1),
  role: z.enum(USER_ROLES),
})

const DeleteUserSchema = z.object({
  id: z.string().min(1),
})

export async function GET() {
  try {
    await requireRole("SUPER_ADMIN")
    const users = await db.user.findMany({
      select: { id: true, name: true, email: true, role: true },
      orderBy: { name: "asc" },
    })
    return NextResponse.json(users)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(req: Request) {
  try {
    await requireRole("SUPER_ADMIN")
    const { email, name, password, role } = parseWith(CreateUserSchema, await req.json())

    const existingEmail = await db.user.findUnique({ where: { email } })
    if (existingEmail) throw new ConflictError("Email já cadastrado")

    const hashedPassword = hashSync(password, PASSWORD_HASH_ROUNDS)
    const user = await db.user.create({
      data: { name, email, password: hashedPassword, role },
    })
    const { password: _password, ...safeUser } = user

    return NextResponse.json(safeUser, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function PATCH(req: Request) {
  try {
    await requireRole("SUPER_ADMIN")
    const { id, role } = parseWith(UpdateUserSchema, await req.json())
    const user = await db.user.update({ where: { id }, data: { role } })
    return NextResponse.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function DELETE(req: Request) {
  try {
    await requireRole("SUPER_ADMIN")
    const { id } = parseWith(DeleteUserSchema, await req.json())
    await db.user.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    return handleApiError(error)
  }
}
