import { ReactNode } from "react"

type Props = {
  title: string
  children?: ReactNode // ações à direita (botões, etc.)
}

export function Header({ title, children }: Props) {
  return (
    <header className="mb-4 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
      <h1 className="min-w-0 text-xl font-semibold leading-tight text-primary sm:text-2xl md:text-[32px] md:leading-snug">
        {title}
      </h1>
      {children && (
        <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">{children}</div>
      )}
    </header>
  )
}
