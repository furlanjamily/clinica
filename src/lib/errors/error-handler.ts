import { NextResponse } from 'next/server'
import { Prisma } from '@/generated/prisma/client'
import logger from '@/lib/logging/logger'
import {
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
  NotFoundError,
} from './custom-errors'

/**
 * Converte erros lançados pelas rotas de API em respostas HTTP padronizadas.
 * Todas as respostas de erro seguem o formato `{ message, details? }`.
 */
export function handleApiError(error: unknown) {
  logger.error('API Error:', error)

  if (error instanceof ValidationError) {
    return NextResponse.json(
      { message: error.message, details: error.details },
      { status: 400 }
    )
  }

  if (error instanceof UnauthorizedError) {
    return NextResponse.json({ message: error.message }, { status: 401 })
  }

  if (error instanceof ForbiddenError) {
    return NextResponse.json({ message: error.message }, { status: 403 })
  }

  if (error instanceof NotFoundError) {
    return NextResponse.json({ message: error.message }, { status: 404 })
  }

  if (error instanceof ConflictError) {
    return NextResponse.json({ message: error.message }, { status: 409 })
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2003') {
      return NextResponse.json(
        { message: 'Usuário ou conversa inválida. Verifique se o banco foi migrado e o seed executado.' },
        { status: 400 }
      )
    }
    if (error.code === 'P2021') {
      return NextResponse.json(
        { message: 'Tabelas do chat não encontradas. Execute: npx prisma migrate deploy' },
        { status: 503 }
      )
    }
  }

  if (error instanceof Error && error.message.includes('DATABASE_URL is not set')) {
    return NextResponse.json(
      { message: 'DATABASE_URL não configurada no servidor.' },
      { status: 503 }
    )
  }

  return NextResponse.json(
    { message: 'Erro interno do servidor' },
    { status: 500 }
  )
}
