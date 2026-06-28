import { useCallback, useRef } from "react";
import { cn } from "@/lib/utils";
import {
  NOTIFICATION_TAB,
  type NotificationTab,
} from "@/lib/notification/constants";

interface NotificationTabsProps {
  activeTab: NotificationTab;
  onTabChange: (tab: NotificationTab) => void;
}

const TAB_ITEMS: ReadonlyArray<{ id: NotificationTab; label: string }> = [
  { id: NOTIFICATION_TAB.UNREAD, label: "Não lidas" },
  { id: NOTIFICATION_TAB.READ, label: "Lidas" },
  { id: NOTIFICATION_TAB.ARCHIVED, label: "Arquivadas" },
];

export function NotificationTabs({
  activeTab,
  onTabChange,
}: NotificationTabsProps) {
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const focusTab = useCallback((index: number) => {
    tabRefs.current[index]?.focus();
  }, []);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
      let nextIndex = index;

      switch (event.key) {
        case "ArrowRight":
          nextIndex = (index + 1) % TAB_ITEMS.length;
          break;
        case "ArrowLeft":
          nextIndex = (index - 1 + TAB_ITEMS.length) % TAB_ITEMS.length;
          break;
        case "Home":
          nextIndex = 0;
          break;
        case "End":
          nextIndex = TAB_ITEMS.length - 1;
          break;
        default:
          return;
      }

      event.preventDefault();
      onTabChange(TAB_ITEMS[nextIndex].id);
      focusTab(nextIndex);
    },
    [focusTab, onTabChange]
  );

  return (
    <div className="shrink-0 px-6 pb-6">
      <div
        role="tablist"
        aria-label="Filtrar notificações"
        className="flex h-12 items-center rounded-full bg-primary/[0.06] p-1"
      >
        {TAB_ITEMS.map((tab, index) => {
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              ref={(element) => {
                tabRefs.current[index] = element;
              }}
              type="button"
              role="tab"
              id={`notification-tab-${tab.id}`}
              aria-selected={isActive}
              aria-controls={`notification-panel-${tab.id}`}
              tabIndex={isActive ? 0 : -1}
              onClick={() => onTabChange(tab.id)}
              onKeyDown={(event) => handleKeyDown(event, index)}
              className={cn(
                "flex h-full flex-1 items-center justify-center rounded-full px-3 text-sm font-medium transition-all duration-200",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white",
                isActive
                  ? "bg-primary text-white shadow-sm shadow-primary/20"
                  : "text-gray-500 hover:text-primary"
              )}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
