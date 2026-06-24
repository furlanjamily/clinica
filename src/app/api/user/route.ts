import { db } from "@/lib/db"
import { hashSync } from "bcrypt"
import { NextResponse } from "next/server"
import * as z from "zod"
import { requireRole } from "@/lib/auth/api-guard"
import { ConflictError, ForbiddenError } from "@/lib/errors/custom-errors"
import { handleApiError } from "@/lib/errors/error-handler"
import { parseWith } from "@/lib/validations/parse"
import { USER_ROLES } from "@/types/auth"

const PASSWORD_HASH_ROUNDS = 10
const MANAGE_USERS_ROLES = ["SUPER_ADMIN", "ADMIN"] as const

const CreateUserSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(USER_ROLES).default("ADMIN"),
})

const UpdateUserSchema = z.object({
  id: z.string().min(1),
  role: z.enum(USER_ROLES).optional(),
  password: z.string().min(8).optional(),
  active: z.boolean().optional(),
})

const DeleteUserSchema = z.object({
  id: z.string().min(1),
})

function toSafeUser(user: {
  id: string
  name: string | null
  email: string
  role: string | null
  active: boolean
  doctorId: number | null
  doctor?: { name: string } | null
}) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    active: user.active,
    doctorId: user.doctorId,
    doctorName: user.doctor?.name ?? null,
  }
}

export async function GET() {
  try {
    await requireRole(...MANAGE_USERS_ROLES)
    const users = await db.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        active: true,
        doctorId: true,
        doctor: { select: { name: true } },
      },
      orderBy: { name: "asc" },
    })
    return NextResponse.json(users.map(toSafeUser))
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(req: Request) {
  try {
    await requireRole(...MANAGE_USERS_ROLES)
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
    const session = await requireRole(...MANAGE_USERS_ROLES)
    const { id, role, password, active } = parseWith(UpdateUserSchema, await req.json())

    if (role == null && password == null && active == null) {
      throw new ConflictError("Informe a permissão, a nova senha ou o status.")
    }

    if (active != null && session.user.role !== "SUPER_ADMIN") {
      throw new ForbiddenError("Somente Super Admin pode ativar ou desativar usuários.")
    }

    if (active === false && id === session.user.id) {
      throw new ConflictError("Você não pode desativar sua própria conta.")
    }

    const user = await db.user.update({
      where: { id },
      data: {
        ...(role != null ? { role } : {}),
        ...(password != null ? { password: hashSync(password, PASSWORD_HASH_ROUNDS) } : {}),
        ...(active != null ? { active } : {}),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        active: true,
        doctorId: true,
        doctor: { select: { name: true } },
      },
    })

    return NextResponse.json(toSafeUser(user))
  } catch (error) {
    return handleApiError(error)
  }
}

export async function DELETE(req: Request) {
  try {
    await requireRole(...MANAGE_USERS_ROLES)
    const { id } = parseWith(DeleteUserSchema, await req.json())
    await db.user.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    return handleApiError(error)
  }
}
