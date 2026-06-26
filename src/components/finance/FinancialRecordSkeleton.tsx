export function FinancialRecordSkeleton() {
  return (
    <div className="-mx-6 overflow-x-auto overscroll-x-contain px-6 pb-1 [scrollbar-width:thin] lg:mx-0 lg:px-0">
      <div className="grid w-max min-w-full grid-cols-3 gap-6 lg:w-full lg:grid-cols-[repeat(3,minmax(300px,1fr))]">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="relative flex h-[130px] min-w-[300px] animate-pulse flex-col justify-between rounded-[20px] bg-gray-100 p-5"
          >
            <div className="flex items-start justify-between">
              <div className="h-4 w-28 rounded bg-gray-200" />
              <div className="h-5 w-5 rounded-full bg-gray-200" />
            </div>

            <div className="absolute right-5 top-1/2 h-12 w-24 -translate-y-1/2 rounded-lg bg-gray-200" />

            <div className="mt-auto flex flex-col gap-1">
              <div className="h-8 w-36 rounded bg-gray-200" />
              <div className="h-4 w-12 rounded bg-gray-200" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
