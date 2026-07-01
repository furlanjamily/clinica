"use client"

import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { ModalHeader } from "@/components/ui/ModalHeader"
import { ModalOverlay, ModalPanel } from "@/components/ui/modal-overlay"
import { Button } from "@/components/ui/button"
import { Input, FormSelect } from "@/components/ui/Input"
import { TaskFormDateTime } from "./TaskFormDateTime"
import type { ClinicTask, TaskFormData } from "./types"

type EditTaskModalProps = {
  task: ClinicTask | null
  onClose: () => void
  onSave: (id: number, data: TaskFormData) => void | Promise<void>
}

export function EditTaskModal({ task, onClose, onSave }: EditTaskModalProps) {
  const { register, handleSubmit, reset, setValue, watch } = useForm<TaskFormData>()

  const date = watch("date")
  const time = watch("time")

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
    <ModalOverlay onClose={onClose}>
      <ModalPanel>
        <ModalHeader title="Editar tarefa" onClose={onClose} />
        <form
          onSubmit={handleSubmit(async (data) => {
            if (!data.date || !data.time) {
              toast.error("Selecione data e horário")
              return
            }
            await onSave(task.id, data)
            onClose()
          })}
          className="flex flex-col gap-4"
        >
          <Input label="Título" {...register("title", { required: true })} />
          <Input label="Descrição" {...register("description")} />

          <TaskFormDateTime
            date={date ?? task.date}
            time={time ?? task.time}
            onDateChange={(value) => setValue("date", value, { shouldValidate: true })}
            onTimeChange={(value) => setValue("time", value, { shouldValidate: true })}
          />

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
