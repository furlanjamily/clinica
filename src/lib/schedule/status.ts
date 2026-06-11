/**
 * Fonte única de verdade para os status de agendamento.
 * Os valores correspondem aos persistidos no banco — não alterar sem migração.
 */
export const AppointmentStatus = {
  Scheduled: "Agendado",
  AwaitingConfirmation: "AguardandoConfirmacao",
  Confirmed: "Confirmado",
  CheckIn: "RegistrarChegada",
  AwaitingPayment: "AguardandoPagamento",
  Paid: "Pago",
  InProgress: "Em Atendimento",
  Completed: "Concluido",
  Cancelled: "Cancelado",
  Rescheduled: "Reagendado",
} as const

export type AppointmentStatusValue =
  (typeof AppointmentStatus)[keyof typeof AppointmentStatus]

export const STATUS_LABEL: Record<string, string> = {
  [AppointmentStatus.Scheduled]: "Agendado",
  [AppointmentStatus.AwaitingConfirmation]: "Aguardando Confirmação",
  [AppointmentStatus.Confirmed]: "Confirmado",
  [AppointmentStatus.CheckIn]: "Registrar chegada",
  [AppointmentStatus.AwaitingPayment]: "Aguardando Pagamento",
  [AppointmentStatus.Paid]: "Pago",
  [AppointmentStatus.InProgress]: "Em Atendimento",
  [AppointmentStatus.Completed]: "Concluído",
  [AppointmentStatus.Cancelled]: "Cancelado",
  [AppointmentStatus.Rescheduled]: "Reagendado",
}

export const STATUS_STYLE: Record<string, string> = {
  [AppointmentStatus.Scheduled]: "bg-yellow-100 text-yellow-700",
  [AppointmentStatus.AwaitingConfirmation]: "bg-orange-100 text-orange-700",
  [AppointmentStatus.Confirmed]: "bg-green-100 text-green-700",
  [AppointmentStatus.CheckIn]: "bg-blue-100 text-blue-700",
  [AppointmentStatus.AwaitingPayment]: "bg-pink-100 text-pink-700",
  [AppointmentStatus.Paid]: "bg-teal-100 text-teal-700",
  [AppointmentStatus.InProgress]: "bg-purple-100 text-purple-700",
  [AppointmentStatus.Completed]: "bg-gray-200 text-gray-600",
  [AppointmentStatus.Cancelled]: "bg-red-100 text-red-700",
  [AppointmentStatus.Rescheduled]: "bg-blue-100 text-blue-700",
}
