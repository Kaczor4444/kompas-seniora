import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

// Eagerly connect so Turbopack doesn't hit "Engine is not yet connected" on first request
void prisma.$connect();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
