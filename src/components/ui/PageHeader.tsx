import { ReactNode } from "react"

type Props = {
  title: string
  children?: ReactNode // ações à direita (botões, etc.)
}

export function Header({ title, children }: Props) {
  return (
    <header className="flex items-center justify-between mb-6">
      <h1 className="text-2xl md:text-[32px] text-primary">{title}</h1>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </header>
  )
}
