"use client"

import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { ModalHeader } from "@/components/ui/ModalHeader"
import { ModalOverlay, ModalPanel } from "@/components/ui/modal-overlay"
import { Button } from "@/components/ui/button"
import { Input, FormSelect } from "@/components/ui/Input"
import type { TaskFormData } from "./types"

const defaultValues: TaskFormData = {
  title: "",
  description: "",
  date: "",
  time: "",
  priority: "medium",
  status: "pending",
  source: "manual",
}

type CreateTaskModalProps = {
  open: boolean
  onClose: () => void
  onSave: (data: TaskFormData) => void | Promise<void>
}

export function CreateTaskModal({ open, onClose, onSave }: CreateTaskModalProps) {
  const { register, handleSubmit, reset } = useForm<TaskFormData>({ defaultValues })

  useEffect(() => {
    if (open) reset(defaultValues)
  }, [open, reset])

  if (!open) return null

  return (
    <ModalOverlay>
      <ModalPanel>
        <ModalHeader title="Nova tarefa" onClose={onClose} />
        <form
          onSubmit={handleSubmit(async (data) => {
            await onSave({ ...data, source: "manual" })
            onClose()
          })}
          className="flex flex-col gap-4"
        >
          <Input label="Título" {...register("title", { required: true })} placeholder="Nome da tarefa" />
          <Input label="Descrição" {...register("description")} placeholder="Descrição opcional" />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Input label="Data" {...register("date", { required: true })} placeholder="2026-06-27" />
            <Input label="Hora" {...register("time", { required: true })} placeholder="08:30" />
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
          <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:justify-end sm:gap-3">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit">Salvar</Button>
          </div>
        </form>
      </ModalPanel>
    </ModalOverlay>
  )
}
