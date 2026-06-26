"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ModalOverlay } from "@/components/ui/modal-overlay";
import { cn } from "@/lib/utils";
import { MOCK_NOTIFICATIONS } from "./mock";
import { NotificationFooter } from "./NotificationFooter";
import { NotificationHeader } from "./NotificationHeader";
import { NotificationSection } from "./NotificationSection";
import { NotificationTabs } from "./NotificationTabs";
import {
  NOTIFICATION_TAB,
  filterNotificationsByTab,
  groupNotificationsByDay,
  markAllNotificationsAsRead,
  type Notification,
  type NotificationTab,
} from "./types";

interface NotificationPopoverProps {
  open: boolean;
  onClose: () => void;
}

export function NotificationPopover({ open, onClose }: NotificationPopoverProps) {
  const [activeTab, setActiveTab] = useState<NotificationTab>(
    NOTIFICATION_TAB.UNREAD
  );
  const [notifications, setNotifications] =
    useState<Notification[]>(MOCK_NOTIFICATIONS);

  const filteredNotifications = useMemo(
    () => filterNotificationsByTab(notifications, activeTab),
    [notifications, activeTab]
  );

  const groupedNotifications = useMemo(
    () => groupNotificationsByDay(filteredNotifications),
    [filteredNotifications]
  );

  const hasUnreadNotifications = useMemo(
    () =>
      notifications.some(
        (notification) => notification.unread && !notification.archived
      ),
    [notifications]
  );

  const handleMarkAllAsRead = useCallback(() => {
    setNotifications((current) => markAllNotificationsAsRead(current));
  }, []);

  useEffect(() => {
    if (!open) return;

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose, open]);

  if (!open) return null;

  return (
    <ModalOverlay>
      <div
        className="flex h-full w-full items-center justify-center"
        onClick={onClose}
        role="presentation"
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Painel de notificações"
          onClick={(event) => event.stopPropagation()}
          className={cn(
            "flex w-full max-w-[560px] flex-col overflow-hidden bg-white",
            "max-h-[min(760px,92dvh)] sm:max-h-[min(760px,90dvh)]",
            "rounded-[28px] border border-primary/10 shadow-[0_24px_80px_rgba(151,71,255,0.12)]",
            "max-sm:max-h-[92dvh] max-sm:rounded-2xl"
          )}
        >
          <NotificationHeader onClose={onClose} />
          <NotificationTabs activeTab={activeTab} onTabChange={setActiveTab} />

          <div
            id={`notification-panel-${activeTab}`}
            role="tabpanel"
            aria-labelledby={`notification-tab-${activeTab}`}
            className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-8 pb-6 [scrollbar-gutter:stable] [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {groupedNotifications.length > 0 ? (
              groupedNotifications.map((group) => (
                <NotificationSection
                  key={group.dayLabel}
                  dayLabel={group.dayLabel}
                  notifications={group.notifications}
                />
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <p className="text-sm text-gray-500">
                  Nenhuma notificação encontrada.
                </p>
              </div>
            )}
          </div>

          <NotificationFooter
            onMarkAllAsRead={handleMarkAllAsRead}
            disabled={!hasUnreadNotifications}
          />
        </div>
      </div>
    </ModalOverlay>
  );
}
