export function ThreeDotsMenu() {
  return (
    <button
      type="button"
      aria-label="Menu"
      className="flex flex-col items-center justify-center gap-[3px] p-1"
    >
      <span className="h-[3px] w-[3px] rounded-full bg-finance-muted" />
      <span className="h-[3px] w-[3px] rounded-full bg-finance-muted" />
      <span className="h-[3px] w-[3px] rounded-full bg-finance-muted" />
    </button>
  )
}
