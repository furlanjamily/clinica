"use client";

import { Bell, ChevronDown, LogOut, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSession, signOut } from "next-auth/react";
import { useState, useRef, useEffect } from "react";
import Image from "next/image";

type Props = {
  onMenuClick?: () => void
}

export function UserHeader({ onMenuClick }: Props) {
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
    <div className="flex w-full items-center justify-between gap-2 px-3 sm:px-4 md:px-7">
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden text-gray-500 hover:text-[#9747FF] transition-colors"
        onClick={onMenuClick}
      >
        <Menu size={22} />
      </Button>

      <div className="flex items-center gap-[11px] ml-auto">
        <Button variant="ghost" size="icon" className="text-gray-500 hover:text-[#9747FF] transition-colors">
          <Bell size={24} />
        </Button>

        <div className="relative" ref={ref}>
          <Button
            variant="outline"
            onClick={() => setOpen((prev) => !prev)}
            className="flex items-center bg-white border border-gray-200 text-[#9747FF] rounded-sm px-[12px] py-1 shadow-sm hover:bg-gray-50 transition-all"
          >
            <Image
              src="https://github.com/shadcn.png"
              alt="Avatar"
              width={24}
              height={24}
              className="w-6 h-6 rounded-[7px] object-cover"
            />
            <span className="max-w-[7rem] truncate pl-2 text-left text-[10px] font-bold sm:max-w-[10rem] md:max-w-none">
              {displayName}
            </span>
            <ChevronDown className="ml-4" size={16} />
          </Button>

          {open && (
            <div className="absolute right-0 top-10 bg-white border border-gray-200 rounded-md shadow-md w-40 z-50">
              <div className="px-3 py-2 border-b">
                <p className="text-xs font-semibold text-gray-700 truncate">{displayName}</p>
                <p className="text-[10px] text-gray-400 truncate">{displayEmail}</p>
              </div>
              <Button
                variant="ghost-danger"
                onClick={() => signOut({ callbackUrl: "/portfolio-auto" })}
                className="w-full px-3 py-2 justify-start"
              >
                <LogOut size={13} />
                Sair
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
