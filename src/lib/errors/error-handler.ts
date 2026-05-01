import { NextResponse } from 'next/server'
import logger from '@/lib/logging/logger'
import { ValidationError, ConflictError, NotFoundError, DatabaseError } from './custom-errors'

export function handleApiError(error: unknown) {
  logger.error('API Error:', error)

  if (error instanceof ValidationError) {
    return NextResponse.json(
      { message: error.message, details: error.details },
      { status: 400 }
    )
  }

  if (error instanceof ConflictError) {
    return NextResponse.json(
      { message: error.message },
      { status: 409 }
    )
  }

  if (error instanceof NotFoundError) {
    return NextResponse.json(
      { message: error.message },
      { status: 404 }
    )
  }

  if (error instanceof DatabaseError) {
    return NextResponse.json(
      { message: 'Erro interno do servidor' },
      { status: 500 }
    )
  }

  // Generic error
  return NextResponse.json(
    { message: 'Erro interno do servidor' },
    { status: 500 }
  )
}