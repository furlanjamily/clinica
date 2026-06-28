import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireSession } from "@/lib/auth/api-guard"
import { handleApiError } from "@/lib/errors/error-handler"
import { parseWith } from "@/lib/validations/parse"
import { CreateUserTaskSchema } from "@/lib/validations/user-task"
import { dueAtFromDateTime, toUserTaskDTO } from "@/lib/user-task/mapper"

export async function GET() {
  try {
    const session = await requireSession()
    const tasks = await db.userTask.findMany({
      where: { userId: session.user.id, deletedAt: null },
      orderBy: [{ dueAt: "asc" }, { id: "asc" }],
    })

    return NextResponse.json({ tasks: tasks.map(toUserTaskDTO) })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(req: Request) {
  try {
    const session = await requireSession()
    const body = parseWith(CreateUserTaskSchema, await req.json())

    const task = await db.userTask.create({
      data: {
        title: body.title,
        description: body.description || null,
        dueAt: dueAtFromDateTime(body.date, body.time),
        priority: body.priority,
        status: body.status,
        userId: session.user.id,
      },
    })

    return NextResponse.json(toUserTaskDTO(task), { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}
