"use client";

import { motion } from "framer-motion"
import { Bell, ChevronDown, LogOut, Menu, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSession, signOut } from "next-auth/react";
import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { AVATAR_PLACEHOLDER_URL } from "@/lib/constants";
import { useAdminShell } from "@/hooks/useAdminShell";
import { FiArrowLeft, FiArrowRight } from "react-icons/fi";
import { PeriodTab } from "@/data/dashboardMock";


type Props = {
  onMenuClick?: () => void
}

export function UserHeader({ onMenuClick }: Props) {
  const shell = useAdminShell()
  const [period, setPeriod] = useState<PeriodTab>("Today")
  const { data: session } = useSession();
  const displayName = session?.user?.username ?? session?.user?.name ?? "";
  const displayEmail = session?.user?.email ?? "";
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >

      <Card className="flex flex-col gap-4 rounded-[20px] border-0 bg-white p-4 shadow-[0_2px_16px_rgba(0,0,0,0.05)] sm:flex-row sm:items-center sm:justify-between sm:p-5">
       
      <div className="flex flex-1 items-center gap-3">
          {shell ? (
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden shrink-0 text-gray-500 hover:text-gray-900"
              onClick={() => shell.openMobileMenu()}
            >
              <Menu size={20} />
            </Button>
          ) : null}

          <div className="hidden items-center gap-1 sm:flex">
            <button
              type="button"
              aria-label="Voltar"
              className="flex h-9 w-9 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900"
            >
              <FiArrowLeft size={16} />
            </button>
            <button
              type="button"
              aria-label="Avançar"
              className="flex h-9 w-9 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900"
            >
              <FiArrowRight size={16} />
            </button>
          </div>

          <div className="relative flex-1 max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="search"
              placeholder="Search"
              className="h-10 w-full rounded-full border border-gray-200 bg-gray-50 pl-10 pr-4 text-sm text-gray-800 outline-none transition-colors placeholder:text-gray-400 focus:border-gray-300 focus:bg-white"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 sm:min-w-[240px]">
          <button
            type="button"
            aria-label="Notificações"
            className="relative flex h-10 w-10 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900"
          >
            <Bell size={20} />
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500" />
          </button>

          <div className="relative" ref={ref}>
            <button
              type="button"
              onClick={() => setOpen((prev) => !prev)}
              className="flex items-center gap-3 rounded-full py-1 pl-1 pr-3 transition-colors hover:bg-gray-50"
            >
              <Image
                src={AVATAR_PLACEHOLDER_URL}
                alt={displayName}
                width={40}
                height={40}
                className="h-10 w-10 rounded-full object-cover"
              />
              <div className="hidden text-left sm:block">
                <p className="text-sm font-semibold text-gray-900">{displayName}</p>
              </div>
              <ChevronDown size={16} className="text-gray-400" />
            </button>

            {open && (
              <div className="absolute right-0 top-full mt-2 z-50 w-40 rounded-xl border border-gray-200 bg-white shadow-md">
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
      </Card>
    </motion.div>
  );
}
