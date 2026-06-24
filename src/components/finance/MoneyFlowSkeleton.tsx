const SKELETON_X_LABELS = 7

export function MoneyFlowLegendSkeleton() {
  return (
    <>
      {Array.from({ length: 3 }).map((_, index) => (
        <span key={index} className="flex items-center gap-2">
          <span className="h-2 w-2 shrink-0 rounded-full bg-gray-200 animate-pulse" />
          <span className="flex items-center gap-2">
            <span className="h-4 w-20 rounded bg-gray-200 animate-pulse" />
            <span className="h-4 w-16 rounded bg-gray-100 animate-pulse" />
          </span>
        </span>
      ))}
    </>
  )
}

export function MoneyFlowChartSkeleton() {
  return (
    <div className="relative flex min-h-[280px] w-full animate-pulse flex-col rounded-3xl bg-white px-4 pb-4 pt-6 shadow-sm sm:px-6 md:min-h-[340px] lg:min-h-[420px] xl:min-h-[500px]">
      <div className="flex min-h-0 flex-1">
        <div className="mr-2 flex w-12 shrink-0 flex-col justify-between pb-6 pt-1 sm:mr-4 sm:w-14">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-3 w-10 rounded bg-gray-200 sm:w-12" />
          ))}
        </div>

        <div className="relative min-w-0 flex-1">
          <div className="flex h-[calc(100%-28px)] flex-col justify-between py-1">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-px w-full bg-gray-100" />
            ))}
          </div>

          <svg
            viewBox="0 0 560 180"
            preserveAspectRatio="none"
            className="absolute inset-0 h-[calc(100%-28px)] w-full"
            aria-hidden
          >
            <path
              d="M14 140 C80 120, 140 100, 200 110 C260 120, 320 50, 380 30 C440 20, 500 80, 546 100"
              fill="none"
              stroke="#E5E7EB"
              strokeWidth="3"
              strokeLinecap="round"
            />
            <path
              d="M14 100 C80 95, 140 110, 200 105 C260 100, 320 85, 380 70 C440 55, 500 75, 546 90"
              fill="none"
              stroke="#F3F4F6"
              strokeWidth="3"
              strokeDasharray="8 8"
              strokeLinecap="round"
            />
            <path
              d="M14 70 C80 65, 140 80, 200 75 C260 70, 320 55, 380 45 C440 35, 500 50, 546 60"
              fill="none"
              stroke="#99F6E4"
              strokeWidth="3"
              strokeDasharray="4 6"
              strokeLinecap="round"
            />
          </svg>

          <div className="absolute left-1/2 top-[8%] h-16 w-28 -translate-x-1/2 rounded-2xl bg-gray-200" />

          <div className="absolute bottom-0 left-0 right-0 flex justify-between gap-1 px-1">
            {Array.from({ length: SKELETON_X_LABELS }).map((_, index) => (
              <div key={index} className="h-3 flex-1 max-w-[2.5rem] rounded bg-gray-200" />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
