export const NOTIFICATION_TYPE = {
  REMINDER: "REMINDER",
  COMMENT: "COMMENT",
  STATUS_CHANGED: "STATUS_CHANGED",
} as const;

export type NotificationType =
  (typeof NOTIFICATION_TYPE)[keyof typeof NOTIFICATION_TYPE];

export const NOTIFICATION_TAB = {
  UNREAD: "unread",
  READ: "read",
  ARCHIVED: "archived",
} as const;

export type NotificationTab =
  (typeof NOTIFICATION_TAB)[keyof typeof NOTIFICATION_TAB];

export const DAY_LABEL = {
  TODAY: "Hoje",
  YESTERDAY: "Ontem",
  MONDAY: "Segunda",
} as const;

export type DayLabel = (typeof DAY_LABEL)[keyof typeof DAY_LABEL];

export const DAY_LABEL_ORDER: readonly DayLabel[] = [
  DAY_LABEL.TODAY,
  DAY_LABEL.YESTERDAY,
  DAY_LABEL.MONDAY,
];

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  subtitle?: string;
  avatar: string;
  unread: boolean;
  createdAt: string;
  dayLabel: DayLabel;
  archived: boolean;
  comment?: string;
  previousStatus?: string;
  currentStatus?: string;
}

export interface ParsedNotificationTitle {
  personName: string;
  action: string;
}

export interface NotificationDayGroup {
  dayLabel: DayLabel;
  notifications: Notification[];
}

const ACTION_SUFFIXES = [
  "enviou um lembrete",
  "comentou em uma tarefa",
  "alterou o status de uma tarefa",
  "mencionou você em um comentário",
  "respondeu ao seu lembrete",
  "atualizou o prazo de uma tarefa",
] as const;

export function parseNotificationTitle(
  title: string
): ParsedNotificationTitle {
  for (const suffix of ACTION_SUFFIXES) {
    if (title.endsWith(suffix)) {
      return {
        personName: title.slice(0, title.length - suffix.length).trim(),
        action: suffix,
      };
    }
  }

  const spaceIndex = title.indexOf(" ");
  if (spaceIndex === -1) {
    return { personName: title, action: "" };
  }

  return {
    personName: title.slice(0, spaceIndex),
    action: title.slice(spaceIndex + 1),
  };
}

export function filterNotificationsByTab(
  notifications: Notification[],
  tab: NotificationTab
): Notification[] {
  switch (tab) {
    case NOTIFICATION_TAB.UNREAD:
      return notifications.filter(
        (notification) => notification.unread && !notification.archived
      );
    case NOTIFICATION_TAB.READ:
      return notifications.filter(
        (notification) => !notification.unread && !notification.archived
      );
    case NOTIFICATION_TAB.ARCHIVED:
      return notifications.filter((notification) => notification.archived);
  }
}

export function groupNotificationsByDay(
  notifications: Notification[]
): NotificationDayGroup[] {
  return DAY_LABEL_ORDER.map((dayLabel) => ({
    dayLabel,
    notifications: notifications.filter(
      (notification) => notification.dayLabel === dayLabel
    ),
  })).filter((group) => group.notifications.length > 0);
}

export function formatTimeAgo(isoDate: string): string {
  const diffMs = Date.now() - new Date(isoDate).getTime();
  const minutes = Math.floor(diffMs / 60_000);

  if (minutes < 1) return "agora mesmo";
  if (minutes < 60) {
    return `${minutes} ${minutes === 1 ? "minuto" : "minutos"} atrás`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours} ${hours === 1 ? "hora" : "horas"} atrás`;
  }

  const days = Math.floor(hours / 24);
  return `${days} ${days === 1 ? "dia" : "dias"} atrás`;
}

export function markAllNotificationsAsRead(
  notifications: Notification[]
): Notification[] {
  return notifications.map((notification) =>
    notification.unread ? { ...notification, unread: false } : notification
  );
}
