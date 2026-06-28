"use client"

import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { ModalHeader } from "@/components/ui/ModalHeader"
import { ModalOverlay, ModalPanel } from "@/components/ui/modal-overlay"
import { Button } from "@/components/ui/button"
import { Input, FormSelect } from "@/components/ui/Input"
import type { ClinicTask, TaskFormData } from "./types"

type EditTaskModalProps = {
  task: ClinicTask | null
  onClose: () => void
  onSave: (id: number, data: TaskFormData) => void | Promise<void>
}

export function EditTaskModal({ task, onClose, onSave }: EditTaskModalProps) {
  const { register, handleSubmit, reset } = useForm<TaskFormData>()

  useEffect(() => {
    if (task) {
      reset({
        title: task.title,
        description: task.description ?? "",
        date: task.date,
        time: task.time,
        priority: task.priority,
        status: task.status,
        source: task.source,
      })
    }
  }, [task, reset])

  if (!task) return null

  return (
    <ModalOverlay>
      <ModalPanel>
        <ModalHeader title="Editar tarefa" onClose={onClose} />
        <form
          onSubmit={handleSubmit(async (data) => {
            if (task.automatic) return
            await onSave(task.id, data)
            onClose()
          })}
          className="flex flex-col gap-4"
        >
          <Input label="Título" {...register("title", { required: true })} />
          <Input label="Descrição" {...register("description")} />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Input label="Data" {...register("date", { required: true })} />
            <Input label="Hora" {...register("time", { required: true })} />
          </div>
          <FormSelect label="Prioridade" {...register("priority")}>
            <option value="low">Baixa</option>
            <option value="medium">Média</option>
            <option value="high">Alta</option>
          </FormSelect>
          <FormSelect label="Status" {...register("status")}>
            <option value="pending">Pendente</option>
            <option value="in_progress">Em andamento</option>
            <option value="completed">Concluída</option>
          </FormSelect>
          <FormSelect
            label="Origem"
            {...register("source")}
            disabled={task.automatic}
          >
            <option value="manual">Manual</option>
            <option value="TimelineAgenda">TimelineAgenda</option>
          </FormSelect>
          {task.automatic && (
            <p className="text-xs text-gray-500">
              Tarefas da TimelineAgenda são sincronizadas automaticamente.
            </p>
          )}
          <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:justify-end sm:gap-3">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit">Salvar alterações</Button>
          </div>
        </form>
      </ModalPanel>
    </ModalOverlay>
  )
}
