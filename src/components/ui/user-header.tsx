"use client";

import { motion } from "framer-motion"
import { Bell, ChevronDown, LogOut, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSession, signOut } from "next-auth/react";
import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { AVATAR_PLACEHOLDER_URL } from "@/lib/constants";
import { useAdminShell } from "@/hooks/useAdminShell";
import { HeaderWeatherWidget } from "@/components/ui/header-weather-widget";
import { HeaderQuickActions } from "@/components/ui/header-quick-actions";
import { cn } from "@/lib/utils";
import { UserHeaderSkeleton } from "@/components/ui/UserHeaderSkeleton";
import { NotificationPopover } from "@/components/notification/NotificationPopover";

function UserAccountMenu({
  className,
  onOpenChange,
  onNotificationOpenChange,
}: {
  className?: string
  onOpenChange?: (open: boolean) => void
  onNotificationOpenChange?: (open: boolean) => void
}) {
  const { data: session } = useSession()
  const displayName = session?.user?.username ?? session?.user?.name ?? "";
  const displayEmail = session?.user?.email ?? "";
  const [open, setOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  function updateOpen(next: boolean) {
    setOpen(next)
    onOpenChange?.(next)
  }

  function updateNotificationsOpen(next: boolean) {
    setNotificationsOpen(next)
    onNotificationOpenChange?.(next)
  }

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        updateOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className={cn("relative flex shrink-0 items-center gap-1.5 sm:gap-3", (open || notificationsOpen) && "z-[70]", className)}>
      <div className="relative">
        <button
          type="button"
          aria-label="Notificações"
          aria-expanded={notificationsOpen}
          aria-haspopup="dialog"
          onClick={() => updateNotificationsOpen(!notificationsOpen)}
          className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 sm:h-10 sm:w-10"
        >
          <Bell size={18} className="sm:h-5 sm:w-5" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500 sm:right-2 sm:top-2" />
        </button>

        <NotificationPopover
          open={notificationsOpen}
          onClose={() => updateNotificationsOpen(false)}
        />
      </div>

      <div
        className="relative shrink-0 rounded-full border border-gray-200/90 bg-white px-1.5 py-1 shadow-[0_2px_10px_rgba(15,23,42,0.06)] transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/25 hover:bg-primary/[0.04] hover:shadow-[0_6px_18px_rgba(151,71,255,0.14)] active:translate-y-0 sm:px-2 sm:py-1"
        ref={ref}
      >
        <button
          type="button"
          aria-expanded={open}
          aria-haspopup="menu"
          onClick={() => updateOpen(!open)}
          className="flex max-w-[9.5rem] items-center gap-1.5 rounded-full min-[400px]:max-w-[11rem] min-[480px]:max-w-[13rem] sm:max-w-none sm:gap-2 lg:gap-3"
        >
          <Image
            src={AVATAR_PLACEHOLDER_URL}
            alt={displayName}
            width={40}
            height={40}
            className="h-9 w-9 shrink-0 rounded-full object-cover sm:h-10 sm:w-10"
          />
          <div className="hidden min-w-0 text-left min-[400px]:block">
            <p className="truncate text-sm font-semibold text-gray-900">{displayName}</p>
          </div>
          <span
            className={cn(
              "flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-100 transition-transform duration-200 sm:h-7 sm:w-7",
              open && "rotate-180"
            )}
          >
            <ChevronDown size={14} className="text-gray-500" />
          </span>
        </button>

        {open && (
          <div className="absolute right-0 top-full z-[70] mt-2 w-44 rounded-xl border border-gray-200 bg-white shadow-lg">
            <div className="border-b px-3 py-2">
              <p className="truncate text-xs font-semibold text-gray-700">{displayName}</p>
              <p className="truncate text-[10px] text-gray-400">{displayEmail}</p>
            </div>
            <Button
              variant="ghost-danger"
              onClick={() => signOut({ callbackUrl: "/portfolio-auto" })}
              className="w-full justify-start px-3 py-2"
            >
              <LogOut size={13} />
              Sair
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export function UserHeader() {
  const shell = useAdminShell()
  const { status } = useSession()
  const [accountMenuOpen, setAccountMenuOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)

  if (status === "loading") {
    return <UserHeaderSkeleton showMobileMenu={Boolean(shell)} />
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={cn("relative min-w-0 shrink-0", (accountMenuOpen || notificationsOpen) ? "z-[70]" : "z-50")}
    >
      <Card className="relative isolate min-w-0 overflow-visible rounded-[20px] border-0 bg-transparent p-3 sm:p-4 lg:p-5">
        <div className="flex min-w-0 flex-col gap-3 sm:gap-4 lg:grid lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] lg:items-center lg:gap-6">
          <div className="relative z-30 flex min-w-0 items-center justify-between gap-2 lg:z-auto lg:justify-start lg:gap-3">
            <div className="min-w-0 flex-1 overflow-hidden pr-2">
              <HeaderWeatherWidget />
            </div>

            <UserAccountMenu className="lg:hidden" onOpenChange={setAccountMenuOpen} onNotificationOpenChange={setNotificationsOpen} />
          </div>

          <div className="relative z-0 flex min-w-0 justify-center lg:justify-self-center">
            <div className="flex max-w-full min-w-0 items-center justify-center gap-2 sm:gap-2.5">
              {shell ? (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 shrink-0 text-gray-500 hover:text-gray-900 md:hidden sm:h-10 sm:w-10"
                  onClick={() => shell.openMobileMenu()}
                >
                  <Menu size={18} className="sm:h-5 sm:w-5" />
                </Button>
              ) : null}
              <HeaderQuickActions className="min-w-0 max-w-full" />
            </div>
          </div>

          <div className="relative z-50 hidden min-w-0 shrink-0 items-center justify-end gap-3 lg:flex">
            <UserAccountMenu onOpenChange={setAccountMenuOpen} onNotificationOpenChange={setNotificationsOpen} />
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
