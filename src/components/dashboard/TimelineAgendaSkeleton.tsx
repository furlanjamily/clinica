"use client"

export function TimelineAgendaSkeleton() {
  return (
    <div className="relative">
      <div className="pointer-events-none absolute left-[52px] top-0 bottom-0 w-px bg-gray-200" />
      <div className="space-y-1">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="relative">
            <div className="flex gap-3">
              <div className="mt-3 h-3 w-10 shrink-0 rounded bg-gray-200 animate-pulse" />
              <div className="flex-1 pb-3">
                <div className="rounded-2xl border border-gray-100 bg-white p-3.5 shadow-sm">
                  <div className="flex gap-3">
                    <div className="h-8 w-8 shrink-0 rounded-full bg-gray-100 animate-pulse" />
                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="h-4 w-32 rounded bg-gray-200 animate-pulse" />
                        <div className="h-5 w-16 shrink-0 rounded-full bg-gray-100 animate-pulse" />
                      </div>
                      <div className="h-3 w-24 rounded bg-gray-100 animate-pulse" />
                      <div className="h-3 w-20 rounded bg-gray-100 animate-pulse" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
