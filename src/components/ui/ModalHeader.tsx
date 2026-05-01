import { X } from "lucide-react"
import { Button } from "./button"

type Props = {
  title: string
  onClose: () => void
}

export function ModalHeader({ title, onClose }: Props) {
  return (
    <div className="flex items-center justify-between mb-5">
      <h2 className="text-lg font-semibold text-primary">{title}</h2>
      <Button variant="ghost" size="icon" onClick={onClose}>
        <X size={18} />
      </Button>
    </div>
  )
}
