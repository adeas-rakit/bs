import { PrismaClient } from '@prisma/client';

declare global {
  // allow global `var` declarations
  var prisma: PrismaClient | undefined;
}

export const db = 
  global.prisma ||
  new PrismaClient({
    log: ['query'],
  });

global.prisma = db;
