"use client"

export function LastVisitDetailsSkeleton() {
  return (
    <div className="flex min-h-full flex-col">
      <div className="mb-5 shrink-0 rounded-2xl bg-gray-50 px-4 py-3">
        <div className="h-2.5 w-28 rounded bg-gray-200 animate-pulse" />
        <div className="mt-3 h-5 w-40 rounded bg-gray-200 animate-pulse" />
        <div className="mt-2 h-4 w-32 rounded bg-gray-100 animate-pulse" />
        <div className="mt-3 h-3 w-48 rounded bg-gray-100 animate-pulse" />
      </div>

      <div className="space-y-5 pb-1">
        {Array.from({ length: 3 }).map((_, i) => (
          <section key={i}>
            <div className="mb-2 h-2.5 w-24 rounded bg-gray-200 animate-pulse" />
            <div className="h-4 w-full max-w-[220px] rounded bg-gray-100 animate-pulse" />
            <div className="mt-1.5 h-4 w-32 rounded bg-gray-100 animate-pulse" />
          </section>
        ))}
      </div>
    </div>
  )
}
