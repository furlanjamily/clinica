import Link from "next/link"

export default async function ConfirmacaoPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const sp = await searchParams
  const ok = sp.ok === "1"
  const id = typeof sp.id === "string" ? sp.id : undefined
  const action = typeof sp.action === "string" ? sp.action : undefined
  const actionLabel = action === "cancel" ? "cancelada" : "confirmada"

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-xl flex-col items-center justify-center px-6 py-10 text-center">
      <div className={`w-full rounded-2xl border p-6 ${ok ? "border-emerald-200 bg-emerald-50" : "border-red-200 bg-red-50"}`}>
        <h1 className="text-xl font-semibold text-gray-900">
          {ok ? (action === "cancel" ? "Consulta cancelada" : "Consulta confirmada") : "Não foi possível concluir"}
        </h1>
        <p className="mt-2 text-sm text-gray-700">
          {ok
            ? `Sua consulta foi ${actionLabel}${id ? ` (agendamento #${id})` : ""}.`
            : "O link pode ter expirado, já ter sido utilizado, ou o agendamento não pode mais ser alterado."}
        </p>
        <div className="mt-5">
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800"
          >
            Voltar
          </Link>
        </div>
      </div>
    </div>
  )
}

