import { cn } from "@/lib/utils"

type ModalOverlayProps = React.PropsWithChildren<{
  className?: string
}>

export function ModalOverlay({ children, className }: ModalOverlayProps) {
  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 backdrop-blur-sm sm:items-center sm:p-4",
        className
      )}
    >
      {children}
    </div>
  )
}
