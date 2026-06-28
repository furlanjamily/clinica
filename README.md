# ClinySOFT

Sistema de gestão clínica para recepção, atendimento e administração. Cobre cadastro de pacientes e médicos, agenda, fluxo de atendimento com timer, prontuário eletrônico, dashboard analítico e módulo financeiro.

## Funcionalidades

| Módulo | Rota | Descrição |
|---|---|---|
| Dashboard | `/dashboard` | Visão geral com métricas, agenda do dia e indicadores |
| Agenda | `/schedule` | Agendamento, confirmação e gestão de consultas |
| Atendimentos | `/attendance` | Fila de atendimento com timer e transição de status |
| Pacientes | `/new-patient` | Cadastro e edição de pacientes |
| Médicos | `/doctors` | Cadastro de profissionais e especialidades |
| Prontuário | `/medical-record` | Registro clínico vinculado à consulta (PDF) |
| Financeiro | `/finance` | Receitas, despesas, repasses e configuração de taxas |
| Usuários | `/users` | Gestão de contas (ADMIN / SUPER_ADMIN) |
| Configurações | `/settings` | Preferências do usuário logado |

## Stack

- **Framework:** Next.js 15 (App Router) + React 19 + TypeScript
- **Banco:** PostgreSQL + Prisma 7
- **Auth:** NextAuth.js (JWT, credenciais)
- **UI:** Tailwind CSS, Radix UI, TanStack Table, Recharts
- **Dados no cliente:** TanStack React Query
- **Validação:** Zod
- **Testes:** Vitest + Testing Library + Supertest

## Pré-requisitos

- Node.js 20+
- PostgreSQL 14+
- npm

## Configuração

### 1. Instalar dependências

```bash
npm install
```

O script `postinstall` roda `prisma generate` automaticamente e gera o client em `src/generated/prisma`.

### 2. Variáveis de ambiente

Copie o exemplo e ajuste os valores:

```bash
cp .env.example .env
```

Variáveis obrigatórias:

| Variável | Descrição |
|---|---|
| `DATABASE_URL` | Connection string PostgreSQL (pooler / runtime) |
| `DIRECT_URL` | Connection string direta (migrations e seed) |
| `NEXTAUTH_SECRET` | Segredo para assinar tokens JWT |
| `NEXTAUTH_URL` | URL base da aplicação (ex.: `http://localhost:3000`) |

Consulte [`.env.example`](.env.example) para variáveis opcionais (fuso horário, demo de portfólio, cron, APIs externas da agenda).

### 3. Banco de dados

```bash
npx prisma migrate deploy   # ou: npx prisma migrate dev
npm run db:seed             # dados fictícios para desenvolvimento
```

Após o seed, use as credenciais de demo:

- **E-mail:** `demo@clinica.local`
- **Senha:** `demo123456` (ou `DEMO_LOGIN_PASSWORD` no `.env`)
- **Papel:** `SUPER_ADMIN` vinculado ao **Dr.Teste** (`doctorId`)

Demais médicos: `medico.2@clinicademo.local` em diante, senha `Medico123!`, papel `MEDICO`.

### 4. Desenvolvimento

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000).

## Scripts

| Comando | Descrição |
|---|---|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Build de produção |
| `npm run start` | Servidor de produção |
| `npm run lint` | ESLint |
| `npm test` | Vitest em modo watch |
| `npx vitest run` | Testes uma vez (CI) |
| `npx tsc --noEmit` | Checagem de tipos |
| `npm run db:seed` | Seed completo (pacientes, agenda, finanças) |
| `npm run db:consolidate-demo-admin` | Unifica SUPER_ADMIN em demo@clinica.local (banco existente) |
| `npm run db:seed-demo` | Apenas usuário demo@clinica.local + vínculo Dr.Teste |
| `npm run db:seed-finance` | Dados financeiros adicionais |
| `npm run db:seed-receita` | Receitas adicionais |

## Papéis de acesso

| Papel | Permissões |
|---|---|
| `SUPER_ADMIN` | Acesso total, incluindo gestão de usuários |
| `ADMIN` | Gestão de usuários; demais módulos administrativos |
| `MEDICO` | Agenda e atendimentos do próprio vínculo (`doctorId`) |

A lógica de permissão no cliente está em `src/hooks/useAuth.ts`. Rotas protegidas usam `requireSession()` / `requireRole()` no servidor.

## Estrutura do projeto

```
src/
├── app/
│   ├── (admin)/          # Páginas autenticadas (dashboard, agenda, finanças…)
│   ├── (auth)/           # Login e cadastro
│   └── api/              # Rotas REST (patient, schedule, finance…)
├── components/           # UI reutilizável (sem regra de negócio)
├── hooks/                # React Query + mutações
├── lib/                  # Regras de negócio, validações Zod, utilitários
├── types/                # Tipos compartilhados
└── generated/prisma/     # Client Prisma (gerado — não editar)
prisma/
├── schema.prisma         # Modelo de dados
├── migrations/           # Histórico de migrations
└── seed.ts               # Seed de desenvolvimento
```

## Testes

```bash
npx vitest run
```

- Unitários de `lib/` e schemas Zod: `src/__tests__/lib/`
- Integração de API: `src/__tests__/api/`
- Rotas protegidas devem ter cobertura 401 (`auth-protection.test.ts`)

## Contribuindo

Leia o [Guia de contribuição](CONTRIBUTING.md) para convenções de código, arquitetura em camadas e checklist antes do PR.
