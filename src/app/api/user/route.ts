import { db } from "@/lib/db"
import { hashSync } from "bcrypt"
import { NextResponse } from "next/server"
import { requireRole } from "@/lib/auth/api-guard"
import { ConflictError, ForbiddenError } from "@/lib/errors/custom-errors"
import { handleApiError } from "@/lib/errors/error-handler"
import { toSafeUser } from "@/lib/domain/user-dto"
import { parseWith } from "@/lib/validations/parse"
import {
  CreateUserSchema,
  DeleteUserSchema,
  UpdateUserSchema,
} from "@/lib/validations/user"

const PASSWORD_HASH_ROUNDS = 10
const MANAGE_USERS_ROLES = ["SUPER_ADMIN", "ADMIN"] as const

const userSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  active: true,
  doctorId: true,
  image: true,
  doctor: { select: { name: true } },
} as const

export async function GET() {
  try {
    await requireRole(...MANAGE_USERS_ROLES)
    const users = await db.user.findMany({
      select: userSelect,
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
    const { email, name, password, role, image } = parseWith(CreateUserSchema, await req.json())

    const existingEmail = await db.user.findUnique({ where: { email } })
    if (existingEmail) throw new ConflictError("Email já cadastrado")

    const hashedPassword = hashSync(password, PASSWORD_HASH_ROUNDS)
    const user = await db.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
        ...(image !== undefined ? { image } : {}),
      },
      select: userSelect,
    })

    return NextResponse.json(toSafeUser(user), { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await requireRole(...MANAGE_USERS_ROLES)
    const { id, role, password, active, image } = parseWith(UpdateUserSchema, await req.json())

    if (role == null && password == null && active == null && image === undefined) {
      throw new ConflictError("Informe a permissão, a nova senha, a foto ou o status.")
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
        ...(image !== undefined ? { image } : {}),
      },
      select: userSelect,
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
