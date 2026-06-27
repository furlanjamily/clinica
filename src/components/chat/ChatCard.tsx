import { cn } from "@/lib/utils"
import { Card } from "@/components/ui/card"

type Props = React.ComponentProps<"div"> & {
  scroll?: boolean
}

/** Card padrão ClinySOFT para colunas do chat. */
export function ChatCard({ className, scroll, children, ...props }: Props) {
  return (
    <Card
      className={cn(
        "flex min-h-0 min-w-0 flex-col overflow-hidden shadow-sm",
        className
      )}
      {...props}
    >
      {scroll ? (
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain [-webkit-overflow-scrolling:touch]">
          {children}
        </div>
      ) : (
        children
      )}
    </Card>
  )
}
