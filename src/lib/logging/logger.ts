import winston from 'winston'

const isProduction = process.env.NODE_ENV === 'production'

const transports: winston.transport[] = [
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }),
]

// File transports only in local dev (Vercel has a read-only filesystem)
if (!isProduction) {
  transports.push(new winston.transports.File({ filename: 'logs/error.log', level: 'error' }))
  transports.push(new winston.transports.File({ filename: 'logs/combined.log' }))
}

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'clinica-app' },
  transports,
})

export default logger