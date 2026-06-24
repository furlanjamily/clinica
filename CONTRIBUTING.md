# Guia de contribuição — ClinySOFT

Convenções do projeto para manter o código consistente e pronto para produção. Em caso de dúvida, siga o padrão dos módulos de referência:

| Camada | Referência |
|---|---|
| API | `src/app/api/patient/route.ts`, `src/app/api/finance/transactions/route.ts` |
| Hooks | `src/hooks/useFinance.ts`, `src/hooks/useScheduleQuery.ts`, `src/hooks/useAttendanceActions.ts` |
| Domínio | `src/lib/schedule/service.ts`, `src/lib/domain/patient-dto.ts` |

## Idioma

| Contexto | Idioma | Exemplo |
|---|---|---|
| Identificadores de código (variáveis, funções, tipos, arquivos) | **Inglês** | `getPatientName`, `useFinanceTransactions` |
| Textos de UI (labels, toasts, mensagens) | **Português (pt-BR)** | `"Transação registrada!"` |
| Mensagens de erro da API | **Português (pt-BR)** | `{ "message": "Sem permissão" }` |
| Comentários | **Português (pt-BR)** | apenas quando explicam intenção não óbvia |
| Valores persistidos no banco | **Não alterar** (contrato de dados) | `"Em Atendimento"`, `"Receita"` |

Valores de domínio persistidos ficam centralizados em constantes — **nunca** use a string literal direto no código:

- `src/lib/schedule/status.ts` → `AppointmentStatus`, `STATUS_LABEL`, `STATUS_STYLE`
- `src/lib/finance/types.ts` → `TransactionType`
- `src/types/auth.ts` → `USER_ROLES`, `UserRoleType`

## Nomenclatura de arquivos

- Componentes React: `PascalCase.tsx` (`DataTable.tsx`, `TimerCell.tsx`)
- Hooks: `useNomeDoHook.ts` (`useFinance.ts`)
- Módulos de `lib/`: `kebab-case.ts` (`group-by-day.ts`, `format-duration.ts`)
- Rotas de API: estrutura do App Router (`app/api/<recurso>/route.ts`)

## TypeScript e Clean Code

- **Sem `any`:** tipagem estrita; infira tipos onde for seguro; use generics quando aumentar reutilização.
- **Sem código morto:** remova variáveis, imports e ramificações não utilizados.
- **Logs no servidor:** use `logger` (Winston) de `@/lib/logging/logger`. **Nunca** `console.*` em código de produção.
- **Erros no servidor:** lance erros tipados de `@/lib/errors/custom-errors` (ou deixe `parseWith` lançar `ValidationError`); capture com `handleApiError(error)`.

## Política de comentários

- **Remova** comentários óbvios ou redundantes (ex.: `// inicializa o estado`, `// faz o fetch`, `// conversão para número`).
- **Mantenha** apenas comentários que explicam regra de negócio complexa, decisão de arquitetura não óbvia ou corner case específico do sistema.
- Comentários mantidos devem estar em **português (pt-BR)**.

## Arquitetura em camadas

```
src/
├── app/api/        rotas HTTP: auth → validação → Prisma → resposta
├── hooks/          acesso a dados no cliente (React Query) + mutações com cache
├── lib/            regras de negócio puras, validações Zod, utilitários
├── components/     componentes de UI sem regra de negócio
└── types/          tipos compartilhados
```

Regra prática: componente **não** faz `fetch` direto — usa um hook. Lógica reaproveitável (cálculo, agrupamento, formatação) vive em `lib/` como função pura testável.

### Módulos principais em `lib/`

| Pasta / arquivo | Responsabilidade |
|---|---|
| `lib/auth/` | Guards de sessão (`api-guard`), escopo por médico |
| `lib/validations/` | Schemas Zod + `parseWith()` |
| `lib/errors/` | Erros tipados + `handleApiError` |
| `lib/schedule/` | Status, slots, conflitos, serviço de agendamento |
| `lib/finance/` | Tipos, categorias, resumos, DTOs |
| `lib/domain/` | Mapeamento Prisma ↔ API (patient, doctor) |
| `lib/api/rate-limit.ts` | Guard Bearer + rate limit para integrações |

O client Prisma é gerado em `src/generated/prisma` (não commitar — ver `.gitignore`).

## Papéis e permissões

Papéis definidos em `src/types/auth.ts`: `SUPER_ADMIN`, `ADMIN`, `MEDICO`.

- **Cliente:** `useAuth()` expõe `canManageUsers`, `canViewSchedule`, etc.
- **Servidor:** `requireRole("ADMIN", "SUPER_ADMIN")` em rotas sensíveis.
- **Médico:** filtragem por `doctorId` da sessão em agenda/atendimento (`lib/auth/appointment-scope.ts`).

## Padrão de rota de API

Toda rota segue o mesmo esqueleto:

```ts
export async function POST(req: Request) {
  try {
    await requireSession()                                    // ou requireRole("ADMIN", ...)
    const data = parseWith(CreateXSchema, await req.json()) // Zod → ValidationError
    const created = await db.x.create({ data })
    return NextResponse.json(created, { status: 201 })
  } catch (error) {
    return handleApiError(error)                            // { message, details? }
  }
}
```

- **Autenticação:** `requireSession()` / `requireRole()` de `@/lib/auth/api-guard`. Integrações externas (agenda) usam `createApiGuard` (`@/lib/api/rate-limit`) com Bearer token + rate limit (`SCHEDULE_API_SECRET`, etc.).
- **Validação:** schema Zod em `src/lib/validations/` + `parseWith()`. Schemas removem campos desconhecidos (proteção contra mass assignment).
- **Erros:** `ValidationError`, `NotFoundError`, `ConflictError`, `UnauthorizedError`, `ForbiddenError` (`@/lib/errors/custom-errors`). Resposta padronizada via `handleApiError` (`@/lib/errors/error-handler`).

### Rotas existentes

| Recurso | Caminho |
|---|---|
| Pacientes | `/api/patient` |
| Médicos | `/api/doctor` |
| Agenda | `/api/schedule`, `/api/schedule/availability`, `/api/schedule/options` |
| Prontuário | `/api/medical-record` |
| Finanças | `/api/finance/transactions`, `/api/finance/config`, `/api/finance/monthly-summary` |
| Dashboard | `/api/dashboard/overview` |
| Usuários | `/api/user` |
| Auth | `/api/auth/[...nextauth]` |
| Cron | `/api/cron/cancel-unconfirmed` |

## Padrão de dados no cliente

- **Listas e caches:** React Query (`useQuery` / `useSuspenseQuery`) com query keys exportadas pelo hook (`SCHEDULE_QUERY_KEY`, `transactionsQueryKey(...)`).
- **Mutações:** verificar `res.ok`; em erro, `toast.error` com a `message` da API; em update otimista, reverter cache em caso de falha (ver `useAttendanceActions`).
- **CRUD simples:** reutilize `useCRUD<T>(endpoint)`.

## Variáveis de ambiente

Documentação completa em [`.env.example`](.env.example). Mínimo para desenvolvimento local:

- `DATABASE_URL`, `DIRECT_URL`
- `NEXTAUTH_SECRET`, `NEXTAUTH_URL`

## Testes

- Funções puras de `lib/` e schemas Zod: testes unitários em `src/__tests__/lib/`.
- Rotas de API: testes de integração em `src/__tests__/api/` (sobem o servidor Next via `setup.ts`). Toda rota protegida deve ter cobertura do caso 401 (`auth-protection.test.ts`).
- Rodar: `npm test` (watch) ou `npx vitest run`.

## Checklist antes do PR

1. `npx tsc --noEmit` sem erros
2. `npm run lint` sem novos avisos
3. `npx vitest run` verde
4. Sem `any`, `console.*` ou strings de status/tipo hardcoded em código novo
5. Comentários apenas onde agregam contexto de negócio ou arquitetura
