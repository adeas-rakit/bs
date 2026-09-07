import { PrismaClient } from '@prisma/client'
import 'dotenv/config'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'

declare global {
  var prisma: PrismaClient | undefined
}

const connectionString = process.env.DATABASE_URL || 'file:./prisma/db/custom.db'

let prismaClient: PrismaClient

const adapter = new PrismaBetterSqlite3({ url: connectionString })
prismaClient = new PrismaClient({ adapter })

export const db = global.prisma || prismaClient

if (process.env.NODE_ENV !== 'production') {
  global.prisma = db
}