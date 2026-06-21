"use client"

import { SideBar } from "@/components/side-bar"
import { UserHeader } from "@/components/ui/user-header"
import { AdminShellContext } from "@/hooks/useAdminShell"
import { cn } from "@/lib/utils"
import { usePathname } from "next/navigation"
import { useState } from "react"

export function AdminShell({ children }: { children: React.ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const pathname = usePathname()
  const isDashboard = pathname === "/dashboard"

  return (
    <AdminShellContext.Provider value={{ openMobileMenu: () => setDrawerOpen(true) }}>
      <div className="clean-dashboard-gradient flex h-dvh min-h-0 w-full gap-3 overflow-hidden p-3 sm:gap-4 sm:p-4">
        <SideBar drawerOpen={drawerOpen} onDrawerClose={() => setDrawerOpen(false)} />
        <main
          className={cn(
            "relative flex min-w-0 flex-1 flex-col overflow-hidden",
            isDashboard ? "gap-0" : "gap-3 sm:gap-4"
          )}
        >
          {!isDashboard ? <UserHeader onMenuClick={() => setDrawerOpen(true)} /> : null}
          <div
            className={cn(
              "flex-1 min-h-0 min-w-0 overflow-y-auto overflow-x-auto",
              isDashboard
                ? "p-0"
                : "px-1 pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))]"
            )}
          >
            {children}
          </div>
        </main>
      </div>
    </AdminShellContext.Provider>
  )
}
