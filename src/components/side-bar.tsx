"use client";

import {
  IconCalendarWeek,
  IconCurrencyDollar,
  IconPlus,
  IconSettings,
  IconUserPlus,
  IconStethoscope,
  IconUsers,
  IconReportMedical,
} from "@tabler/icons-react";
import { CirclePlus, LayoutDashboard, MessageCircle } from "lucide-react";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LinkSideBar } from "./link-side-bar";
import { Button } from "./ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useChatSync } from "@/hooks/useChatSync";
import { cn } from "@/lib/utils";
import type { Appointment } from "@/types/types";
import { ScheduleFormModal } from "@/components/schedule/ScheduleFormModal";

interface LinkItem {
  icon: React.ReactNode;
  name: string;
  href: string;
  badge?: number;
}

type Props = {
  onCreate?: (item: Appointment) => void
  drawerOpen?: boolean
  onDrawerClose?: () => void
};

function SideBarContent({ onCreate }: Props) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { canViewSchedule, canManageUsers } = useAuth()
  const { unreadCount: chatUnreadCount } = useChatSync()

  const links: LinkItem[] = [
    { name: "Dashboard", href: "/dashboard", icon: <LayoutDashboard size={24} /> },
    ...(canViewSchedule ? [
      { name: "Agenda", href: "/schedule", icon: <IconCalendarWeek size={24} /> },
      { name: "Atendimentos", href: "/attendance", icon: <IconStethoscope size={24} /> },
      { name: "Pacientes", href: "/new-patient", icon: <IconUserPlus size={24} /> },
      { name: "Médicos", href: "/doctors", icon: <IconReportMedical size={24} /> },
      { name: "Financeiro", href: "/finance", icon: <IconCurrencyDollar size={24} /> },
    ] : [
      { name: "Agenda", href: "/schedule", icon: <IconCalendarWeek size={24} /> },
      { name: "Atendimentos", href: "/attendance", icon: <IconStethoscope size={24} /> },
    ]),
    ...(canManageUsers ? [
      { name: "Usuários", href: "/users", icon: <IconUsers size={24} /> },
    ] : []),
    { name: "Chat", href: "/chat", icon: <MessageCircle size={24} />, badge: chatUnreadCount },
  ];

  return (
    <>
      <div
        className={cn(
          "flex h-full w-full flex-col items-center gap-8 overflow-y-auto overscroll-y-contain bg-white py-9 [-webkit-overflow-scrolling:touch] touch-pan-y md:gap-12",
          "md:rounded-3xl md:border md:border-gray-200"
        )}
      >
        <div className="flex flex-col items-center gap-6 md:gap-8">
          <Image
            className="max-w-[100px] md:max-w-[139px]"
            src="/logo.svg"
            alt="Logo"
            width={140}
            height={27}
            priority
            unoptimized
          />
          <Button onClick={() => setOpen(true)}>
            <CirclePlus size={16} />
            <span className="hidden md:inline">Novo Agendamento</span>
          </Button>
        </div>

        <div className="w-full space-y-4">
          <span className="pl-6 text-[10px] font-bold text-accent">Menu</span>
          <LinkSideBar links={links} pageActive={pathname} />
        </div>

        <div className="w-full px-3">
          <div className="flex h-0.5 w-full bg-accent-foreground/50" />
        </div>

        <div className="flex w-full h-full items-end">
          <Link
            href="/settings"
            className={`flex text-xs font-bold border-l-2 items-center pl-7 gap-4 transition-all
              ${pathname === "/settings"
                ? "text-primary border-primary"
                : "text-accent border-transparent hover:text-primary/50"
              }`}
          >
            <IconSettings size={24} />
            <span className="hidden md:inline">Configurações</span>
          </Link>
        </div>
      </div>

      {open && (
        <ScheduleFormModal
          mode="create"
          onClose={() => setOpen(false)}
          onSuccess={(newItem) => {
            if (onCreate) onCreate(newItem)
            else window.location.reload()
            setOpen(false)
          }}
        />
      )}
    </>
  );
}

export function SideBar({ drawerOpen, onDrawerClose, ...props }: Props) {
  return (
    <>
      {drawerOpen && (
        <div className="fixed inset-0 z-[90] flex md:hidden">
          <div className="flex h-dvh w-[min(280px,85vw)] flex-shrink-0 flex-col bg-white">
            <SideBarContent {...props} />
          </div>
          <div
            className="flex-1 bg-black/40 backdrop-blur-sm"
            onClick={onDrawerClose}
            aria-hidden
          />
        </div>
      )}

      <div className="hidden md:flex w-[216px] h-full flex-shrink-0">
        <SideBarContent {...props} />
      </div>
    </>
  );
}
