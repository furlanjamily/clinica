import { cn } from "@/lib/utils"

type Props = React.ComponentProps<"div">

export function Card({ className, ...props }: Props) {
  return (
    <div
      className={cn("rounded-3xl border border-gray-200 bg-white", className)}
      {...props}
    />
  )
}
