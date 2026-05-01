"use client";

import {
  IconCalendarWeek,
  IconCurrencyDollar,
  IconDashboard,
  IconPlus,
  IconSettings,
  IconUserPlus,
  IconStethoscope,
  IconUsers,
  IconReportMedical,
} from "@tabler/icons-react";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Logo from "../../public/logo.svg";
import { LinkSideBar } from "./link-side-bar";
import { Button } from "./ui/button";
import { useAuth } from "@/hooks/useAuth";
import type { Atendimento } from "@/types/types";
import { ScheduleFormModal } from "@/components/schedule/ScheduleFormModal";

interface LinkItem {
  icon: React.ReactNode;
  name: string;
  href: string;
}

type Props = {
  onCreate?: (item: Atendimento) => void
  drawerOpen?: boolean
  onDrawerClose?: () => void
};

function SideBarContent({ onCreate }: Props) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { canViewSchedule, isSuperAdmin } = useAuth()

  const links: LinkItem[] = [
    { name: "Dashboard", href: "/dashboard", icon: <IconDashboard size={24} /> },
    ...(canViewSchedule ? [
      { name: "Agenda", href: "/schedule", icon: <IconCalendarWeek size={24} /> },
      { name: "Atendimentos", href: "/attendance", icon: <IconStethoscope size={24} /> },
      { name: "Pacientes", href: "/new-patient", icon: <IconUserPlus size={24} /> },
      { name: "Médicos", href: "/doctors", icon: <IconReportMedical size={24} /> },
      { name: "Financeiro", href: "/finance", icon: <IconCurrencyDollar size={24} /> },
    ] : [
      { name: "Agenda", href: "/schedule", icon: <IconCalendarWeek size={24} /> },
    ]),
    ...(isSuperAdmin ? [
      { name: "Usuários", href: "/users", icon: <IconUsers size={24} /> },
    ] : []),
  ];

  return (
    <>
      <div className="flex flex-col w-full h-full items-center py-10 md:py-24 border-r-[0.5px] bg-white rounded-l-2xl gap-8 md:gap-12">
        <div className="flex flex-col items-center gap-6 md:gap-8">
          <Image className="max-w-[100px] md:max-w-[139px]" src={Logo} alt="Logo" />
          <Button onClick={() => setOpen(true)}>
            <IconPlus size={16} />
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
      {/* Mobile: drawer overlay */}
      {drawerOpen && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          <div className="w-[216px] h-full relative">
            <SideBarContent {...props} />
          </div>
          <div className="flex-1 bg-black/40" onClick={onDrawerClose} />
        </div>
      )}

      {/* Desktop: sidebar fixa */}
      <div className="hidden md:flex w-[216px] h-full flex-shrink-0">
        <SideBarContent {...props} />
      </div>
    </>
  );
}
