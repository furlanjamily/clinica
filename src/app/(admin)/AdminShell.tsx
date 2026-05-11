"use client"

import { SideBar } from "@/components/side-bar"
import { UserHeader } from "@/components/ui/user-header"
import { useState } from "react"

export function AdminShell({ children }: { children: React.ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState(false)

  return (
    <div className="flex h-dvh min-h-0 w-full bg-[#E3E3E3] overflow-hidden">
      <SideBar drawerOpen={drawerOpen} onDrawerClose={() => setDrawerOpen(false)} />
      <main className="flex-1 bg-white shadow-sm overflow-hidden relative flex flex-col min-w-0">
        <header className="sticky top-0 z-10 w-full flex items-center pt-4 md:pt-6 pb-2 bg-white/80 backdrop-blur-md">
          <UserHeader onMenuClick={() => setDrawerOpen(true)} />
        </header>
        <div className="flex-1 min-h-0 min-w-0 overflow-y-auto overflow-x-auto px-3 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] sm:px-6 sm:pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] md:px-12 md:pb-[calc(3rem+env(safe-area-inset-bottom,0px))]">
          {children}
        </div>
      </main>
    </div>
  )
}
