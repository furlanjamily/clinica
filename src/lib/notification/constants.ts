export const NOTIFICATION_TYPE = {
  REMINDER: "REMINDER",
  STATUS_CHANGED: "STATUS_CHANGED",
  APPOINTMENT: "APPOINTMENT",
  FINANCE: "FINANCE",
  PATIENT: "PATIENT",
  SYSTEM: "SYSTEM",
  MESSAGE: "MESSAGE",
} as const

export type NotificationType =
  (typeof NOTIFICATION_TYPE)[keyof typeof NOTIFICATION_TYPE]

export const NOTIFICATION_ENTITY_TYPE = {
  APPOINTMENT: "Appointment",
  PATIENT: "Patient",
  TRANSACTION: "Transaction",
  TASK: "Task",
  SYSTEM: "System",
} as const

export type NotificationEntityType =
  (typeof NOTIFICATION_ENTITY_TYPE)[keyof typeof NOTIFICATION_ENTITY_TYPE]

export const NOTIFICATION_TAB = {
  UNREAD: "unread",
  READ: "read",
  ARCHIVED: "archived",
} as const

export type NotificationTab =
  (typeof NOTIFICATION_TAB)[keyof typeof NOTIFICATION_TAB]

export const NOTIFICATION_ACTION_LABEL: Record<NotificationType, string> = {
  [NOTIFICATION_TYPE.REMINDER]: "lembrete próximo do horário",
  [NOTIFICATION_TYPE.STATUS_CHANGED]: "alterou o status de uma tarefa",
  [NOTIFICATION_TYPE.APPOINTMENT]: "atualizou um agendamento",
  [NOTIFICATION_TYPE.FINANCE]: "registrou uma movimentação financeira",
  [NOTIFICATION_TYPE.PATIENT]: "atualizou um paciente",
  [NOTIFICATION_TYPE.SYSTEM]: "enviou uma notificação do sistema",
  [NOTIFICATION_TYPE.MESSAGE]: "enviou uma mensagem",
}

export const NOTIFICATION_DEFAULT_LIMIT = 20

export const NOTIFICATION_MAX_LIMIT = 50

/** Reservado para integração futura com Socket.IO */
export const NOTIFICATION_SOCKET_EVENT = {
  CREATED: "notification.created",
} as const
