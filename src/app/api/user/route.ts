import { db } from "@/lib/db"
import { hashSync } from "bcrypt"
import { NextResponse } from "next/server"
import * as z from "zod"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { ValidationError } from "@/lib/errors/custom-errors"
import { handleApiError } from "@/lib/errors/error-handler"

const userSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(["SUPER_ADMIN", "ADMIN", "MEDICO"]).default("ADMIN"),
})

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (session?.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ message: "Sem permissão" }, { status: 403 })
    }
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
    const session = await getServerSession(authOptions)
    if (session?.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ message: "Sem permissão" }, { status: 403 })
    }

    const body = await req.json()
    const parsed = userSchema.safeParse(body)

    if (!parsed.success) {
      throw new ValidationError("Dados inválidos", parsed.error.format())
    }

    const { email, name, password, role } = parsed.data

    const existingEmail = await db.user.findUnique({ where: { email } })
    if (existingEmail) return NextResponse.json({ message: "Email já cadastrado" }, { status: 409 })

    const hashedPassword = hashSync(password, 10)
    const user = await db.user.create({ data: { name, email, password: hashedPassword, role } })
    const { password: _, ...rest } = user

    return NextResponse.json(rest, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (session?.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ message: "Sem permissão" }, { status: 403 })
    }
    const { id, role } = await req.json()
    const user = await db.user.update({ where: { id }, data: { role } })
    return NextResponse.json({ id: user.id, name: user.name, email: user.email, role: user.role })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (session?.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ message: "Sem permissão" }, { status: 403 })
    }
    const { id } = await req.json()
    await db.user.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    return handleApiError(error)
  }
}
