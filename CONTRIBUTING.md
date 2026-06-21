# Guia de contribuição — ClinySOFT

Convenções do projeto para manter o código consistente. Em caso de dúvida, siga o padrão dos módulos mais recentes (`src/app/api/patient`, `src/hooks/useFinance.ts`).

## Idioma

| Contexto | Idioma | Exemplo |
|---|---|---|
| Identificadores de código (variáveis, funções, tipos, arquivos) | **Inglês** | `getPatientName`, `useFinanceTransactions` |
| Textos de UI (labels, toasts, mensagens) | **Português (pt-BR)** | `"Transação registrada!"` |
| Mensagens de erro da API | **Português (pt-BR)** | `{ "message": "Sem permissão" }` |
| Comentários | **Português (pt-BR)** | só quando explicam intenção não óbvia |
| Valores persistidos no banco | **Não alterar** (contrato de dados) | `"Em Atendimento"`, `"Receita"` |

Valores de domínio persistidos (status de agendamento, tipos de transação) ficam centralizados em constantes — nunca use a string literal direto:

- `src/lib/schedule/status.ts` → `AppointmentStatus`, `STATUS_LABEL`, `STATUS_STYLE`
- `src/lib/finance/types.ts` → `TransactionType`

## Nomenclatura de arquivos

- Componentes React: `PascalCase.tsx` (`DataTable.tsx`, `TimerCell.tsx`)
- Hooks: `useNomeDoHook.ts` (`useFinance.ts`)
- Módulos de `lib/`: `kebab-case.ts` (`group-by-day.ts`, `format-duration.ts`)
- Rotas de API: estrutura do App Router (`app/api/<recurso>/route.ts`)

## Arquitetura em camadas

```
src/
├── app/api/        rotas HTTP: auth → validação → Prisma → resposta
├── hooks/          acesso a dados no cliente (React Query) + mutações com cache
├── lib/            regras de negócio puras, validações Zod, utilitários
├── components/     componentes de UI sem regra de negócio
└── types/          tipos compartilhados
```

Regra prática: componente não faz `fetch` direto — usa um hook. Lógica reaproveitável (cálculo, agrupamento, formatação) vive em `lib/` como função pura testável.

## Padrão de rota de API

Toda rota segue o mesmo esqueleto:

```ts
export async function POST(req: Request) {
  try {
    await requireSession()                                // ou requireRole("ADMIN", ...)
    const data = parseWith(CreateXSchema, await req.json()) // Zod, lança ValidationError
    const created = await db.x.create({ data })
    return NextResponse.json(created, { status: 201 })
  } catch (error) {
    return handleApiError(error)                          // resposta padronizada
  }
}
```

- **Autenticação:** `requireSession()` / `requireRole()` de `@/lib/auth/api-guard`. Rotas consumidas por integrações externas (agenda) usam `createApiGuard` (`@/lib/api/rate-limit`) com Bearer token + rate limit.
- **Validação:** schema Zod em `src/lib/validations/` + `parseWith()`. Schemas removem campos desconhecidos (proteção contra mass assignment).
- **Erros:** lance `ValidationError`, `NotFoundError`, `ConflictError`, `UnauthorizedError` ou `ForbiddenError` (`@/lib/errors/custom-errors`). O `handleApiError` converte para HTTP com formato único `{ message, details? }`.
- **Logs:** `logger` (Winston) no servidor. **Nunca** `console.*` em código de produção.

## Padrão de dados no cliente

- Listas e caches: **React Query** (`useQuery` / `useSuspenseQuery`) com query keys exportadas pelo hook (`SCHEDULE_QUERY_KEY`, `transactionsQueryKey(...)`).
- Mutações: sempre verificar `res.ok`; em erro, `toast.error` com a `message` da API; em update otimista, invalidar a query em caso de falha (ver `useAttendanceActions`).
- CRUD simples: reutilize `useCRUD<T>(endpoint)`.

## Testes

- Funções puras de `lib/` e schemas Zod: testes unitários em `src/__tests__/lib/`.
- Rotas de API: testes de integração em `src/__tests__/api/` (sobem o servidor Next via `setup.ts`). Toda rota protegida deve ter cobertura do caso 401 (`auth-protection.test.ts`).
- Rodar: `npm test` (watch) ou `npx vitest run`.

## Checklist antes do PR

1. `npx tsc --noEmit` sem erros
2. `npm run lint` sem novos avisos
3. `npx vitest run` verde
4. Sem `any`, `console.*` ou strings de status hardcoded em código novo
