import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireSession } from "@/lib/auth/api-guard"
import { NotFoundError } from "@/lib/errors/custom-errors"
import { handleApiError } from "@/lib/errors/error-handler"
import { parseWith } from "@/lib/validations/parse"
import { UpdateUserTaskSchema } from "@/lib/validations/user-task"
import { dueAtFromDateTime, toUserTaskDTO } from "@/lib/user-task/mapper"

type RouteContext = { params: Promise<{ taskId: string }> }

async function getOwnedTask(taskId: number, userId: string) {
  const task = await db.userTask.findFirst({
    where: { id: taskId, userId, deletedAt: null },
  })
  if (!task) throw new NotFoundError("Tarefa não encontrada.")
  return task
}

export async function PATCH(req: Request, context: RouteContext) {
  try {
    const session = await requireSession()
    const { taskId } = await context.params
    const id = Number(taskId)
    if (!Number.isInteger(id) || id <= 0) {
      throw new NotFoundError("Tarefa não encontrada.")
    }

    await getOwnedTask(id, session.user.id)
    const body = parseWith(UpdateUserTaskSchema, await req.json())

    const task = await db.userTask.update({
      where: { id },
      data: {
        ...(body.title !== undefined ? { title: body.title } : {}),
        ...(body.description !== undefined
          ? { description: body.description || null }
          : {}),
        ...(body.priority !== undefined ? { priority: body.priority } : {}),
        ...(body.status !== undefined ? { status: body.status } : {}),
        ...(body.date && body.time
          ? { dueAt: dueAtFromDateTime(body.date, body.time) }
          : {}),
      },
    })

    return NextResponse.json(toUserTaskDTO(task))
  } catch (error) {
    return handleApiError(error)
  }
}

export async function DELETE(_req: Request, context: RouteContext) {
  try {
    const session = await requireSession()
    const { taskId } = await context.params
    const id = Number(taskId)
    if (!Number.isInteger(id) || id <= 0) {
      throw new NotFoundError("Tarefa não encontrada.")
    }

    await getOwnedTask(id, session.user.id)
    await db.userTask.update({
      where: { id },
      data: { deletedAt: new Date() },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return handleApiError(error)
  }
}
