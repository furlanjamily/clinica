/** Minutos antes do horário para disparar o lembrete. */
export const REMINDER_LEAD_MINUTES = 15

export const REMINDER_LEAD_MS = REMINDER_LEAD_MINUTES * 60 * 1000

/** Evita lembrete duplicado para o mesmo evento no mesmo dia. */
export const REMINDER_DEDUPE_WINDOW_MS = 24 * 60 * 60 * 1000

export const REMINDER_TASK_ACTION =  `não se esqueça! Sua próxima tarefa começa em ${REMINDER_LEAD_MINUTES} minutos`

export const REMINDER_APPOINTMENT_ACTION = "sua consulta começa em breve"