import { z } from "zod"

export const UserTaskStatusSchema = z.enum(["pending", "in_progress", "completed"])
export const UserTaskPrioritySchema = z.enum(["low", "medium", "high"])

export const CreateUserTaskSchema = z.object({
  title: z.string().trim().min(1, "Título é obrigatório").max(200),
  description: z.string().trim().max(2000).optional().default(""),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida"),
  time: z.string().regex(/^\d{2}:\d{2}$/, "Horário inválido"),
  priority: UserTaskPrioritySchema.default("medium"),
  status: UserTaskStatusSchema.default("pending"),
})

export const UpdateUserTaskSchema = CreateUserTaskSchema.partial()

export type CreateUserTaskInput = z.infer<typeof CreateUserTaskSchema>
export type UpdateUserTaskInput = z.infer<typeof UpdateUserTaskSchema>
