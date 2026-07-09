"use client"

import { cn } from "@/lib/utils"

const shellClassName = cn(
  "flex h-full w-full flex-col items-center gap-8 overflow-y-auto overscroll-y-contain bg-white py-9 [-webkit-overflow-scrolling:touch] touch-pan-y md:gap-12",
  "md:rounded-3xl md:border md:border-gray-200"
)

function NavLinkSkeleton({ labelWidth = "w-24" }: { labelWidth?: string }) {
  return (
    <div className="flex w-full items-center gap-4 border-l-2 border-transparent pl-7">
      <div className="h-6 w-6 shrink-0 rounded-md bg-gray-200 animate-pulse" />
      <div className={cn("h-3.5 rounded bg-gray-200 animate-pulse", labelWidth)} />
    </div>
  )
}

export function SideBarSkeleton() {
  return (
    <div className={shellClassName} aria-busy="true" aria-label="Carregando menu">
      <div className="flex flex-col items-center gap-6 md:gap-8">
        <div className="h-[27px] w-[100px] rounded-md bg-gray-200 animate-pulse md:w-[139px]" />
        <div className="h-10 w-10 rounded-full bg-gray-200 animate-pulse md:h-11 md:w-44 md:rounded-full" />
      </div>

      <div className="w-full space-y-4">
        <div className="pl-6">
          <div className="h-2.5 w-10 rounded bg-gray-100 animate-pulse" />
        </div>
        <ul className="flex w-full flex-col gap-5">
          {Array.from({ length: 7 }).map((_, index) => (
            <li key={index}>
              <NavLinkSkeleton labelWidth={index % 2 === 0 ? "w-24" : "w-28"} />
            </li>
          ))}
        </ul>
      </div>

    </div>
  )
}
