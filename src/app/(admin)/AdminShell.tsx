"use client"

import { SideBar } from "@/components/side-bar"
import { UserHeader } from "@/components/ui/user-header"
import { useState } from "react"

export function AdminShell({ children }: { children: React.ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState(false)

  return (
    <div className="clean-dashboard-gradient flex h-dvh min-h-0 w-full gap-3 overflow-hidden p-3 sm:gap-4 sm:p-4">
      <SideBar drawerOpen={drawerOpen} onDrawerClose={() => setDrawerOpen(false)} />
      <main className="relative flex min-w-0 flex-1 flex-col gap-3 overflow-hidden sm:gap-4">
        <UserHeader onMenuClick={() => setDrawerOpen(true)} />
        <div className="flex-1 min-h-0 min-w-0 overflow-y-auto overflow-x-auto px-1 pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))]">
          {children}
        </div>
      </main>
    </div>
  )
}
