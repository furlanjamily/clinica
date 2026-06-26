"use client"

import { SideBar } from "@/components/side-bar"
import { UserHeader } from "@/components/ui/user-header"
import { AdminShellContext } from "@/hooks/useAdminShell"
import { cn } from "@/lib/utils"
import {
  adminShellMainScrollClass,
  adminShellPageClass,
  adminShellScrollContentClass,
} from "@/lib/layout/filter-table-layout"
import { usePathname } from "next/navigation"
import { useState } from "react"

export function AdminShell({ children }: { children: React.ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const pathname = usePathname()
  const isDashboard = pathname === "/dashboard"
  const isFinance = pathname === "/finance"
  const showUserHeader = !isDashboard && !isFinance

  return (
    <AdminShellContext.Provider value={{ openMobileMenu: () => setDrawerOpen(true) }}>
      <div className="clean-dashboard-gradient flex h-dvh min-h-0 w-full gap-3 overflow-hidden p-3 sm:gap-4 sm:p-4">
        <SideBar drawerOpen={drawerOpen} onDrawerClose={() => setDrawerOpen(false)} />
        <main className="relative flex min-w-0 flex-1 flex-col overflow-hidden">
          <div
            className={cn(
              "@container/main flex min-h-0 min-w-0 flex-1 flex-col [container-type:size]",
              adminShellMainScrollClass,
              isDashboard || isFinance
                ? "p-0"
                : "px-2.5 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] sm:px-3 [scrollbar-gutter:stable]"
            )}
          >
            <div className={cn(adminShellScrollContentClass, !showUserHeader && "gap-0")}>
              {showUserHeader ? <UserHeader /> : null}
              <div className={adminShellPageClass}>{children}</div>
            </div>
          </div>
        </main>
      </div>
    </AdminShellContext.Provider>
  )
}
