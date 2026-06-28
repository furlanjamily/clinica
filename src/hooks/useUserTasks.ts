"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { absoluteUrl } from "@/lib/absolute-url"
import type { UserTaskDTO } from "@/lib/user-task/mapper"
import type { CreateUserTaskInput, UpdateUserTaskInput } from "@/lib/validations/user-task"
import { readErrorMessage } from "./notification-api"

export const USER_TASKS_QUERY_KEY = ["user-tasks"] as const

async function fetchUserTasks(): Promise<UserTaskDTO[]> {
  const res = await fetch(absoluteUrl("/api/tasks"))
  if (!res.ok) {
    throw new Error(await readErrorMessage(res, "Erro ao buscar tarefas"))
  }
  const body = (await res.json()) as { tasks: UserTaskDTO[] }
  return body.tasks
}

async function createUserTaskApi(input: CreateUserTaskInput): Promise<UserTaskDTO> {
  const res = await fetch(absoluteUrl("/api/tasks"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  })
  if (!res.ok) {
    throw new Error(await readErrorMessage(res, "Erro ao criar tarefa"))
  }
  return res.json()
}

async function updateUserTaskApi(
  taskId: number,
  input: UpdateUserTaskInput
): Promise<UserTaskDTO> {
  const res = await fetch(absoluteUrl(`/api/tasks/${taskId}`), {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  })
  if (!res.ok) {
    throw new Error(await readErrorMessage(res, "Erro ao atualizar tarefa"))
  }
  return res.json()
}

async function deleteUserTaskApi(taskId: number): Promise<void> {
  const res = await fetch(absoluteUrl(`/api/tasks/${taskId}`), {
    method: "DELETE",
  })
  if (!res.ok) {
    throw new Error(await readErrorMessage(res, "Erro ao excluir tarefa"))
  }
}

export function useUserTasks(enabled = true) {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: USER_TASKS_QUERY_KEY,
    queryFn: fetchUserTasks,
    enabled,
  })

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: USER_TASKS_QUERY_KEY })

  const createMutation = useMutation({
    mutationFn: createUserTaskApi,
    onSuccess: invalidate,
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateUserTaskInput }) =>
      updateUserTaskApi(id, data),
    onSuccess: invalidate,
  })

  const deleteMutation = useMutation({
    mutationFn: deleteUserTaskApi,
    onSuccess: invalidate,
  })

  return {
    tasks: query.data ?? [],
    isLoading: query.isLoading,
    createTask: createMutation.mutateAsync,
    updateTask: updateMutation.mutateAsync,
    deleteTask: deleteMutation.mutateAsync,
  }
}
