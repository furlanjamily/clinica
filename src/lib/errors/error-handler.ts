import { NextResponse } from 'next/server'
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

  return NextResponse.json(
    { message: 'Erro interno do servidor' },
    { status: 500 }
  )
}
