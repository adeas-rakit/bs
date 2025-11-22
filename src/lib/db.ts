import { PrismaClient } from '../generated/prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';

import 'dotenv/config';

declare global {
  // allow global `var` declaraxtions
  var prisma: PrismaClient | undefined;
}

let prismaClient: PrismaClient;

if (process.env.JENIS_DB === 'mysql') {
  console.log('Using MySQL database');
  const adapter = new PrismaMariaDb({
    host: process.env.DATABASE_URL || 'localhost',
    port: 3306,
    connectionLimit: 5
  });
  prismaClient = new PrismaClient({
    adapter,
    log: ['query'],
  });
} else {
  console.log('Using SQLite database');
  const adapter = new PrismaBetterSqlite3({
    url: process.env.DATABASE_URL || 'file://prisma/db/custom.db'
  });
  prismaClient = new PrismaClient({
    adapter,
    log: ['query'],
  });
}

export const db = global.prisma || prismaClient;

global.prisma = db;
