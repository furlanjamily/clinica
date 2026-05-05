import { X } from "lucide-react"
import { Button } from "./button"

type Props = {
  title: string
  onClose: () => void
}

export function ModalHeader({ title, onClose }: Props) {
  return (
    <div className="mb-4 flex items-start justify-between gap-3 sm:mb-5">
      <h2 className="min-w-0 flex-1 text-base font-semibold leading-snug text-primary sm:text-lg">
        {title}
      </h2>
      <Button variant="ghost" size="icon" className="shrink-0" onClick={onClose} aria-label="Fechar">
        <X size={18} />
      </Button>
    </div>
  )
}
