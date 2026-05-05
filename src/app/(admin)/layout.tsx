import { AdminShell } from "./AdminShell"

/** Evita pré-render estático no build (fetch sem origem / sem sessão). */
export const dynamic = "force-dynamic"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AdminShell>
      {children}
    </AdminShell>
  )
}
