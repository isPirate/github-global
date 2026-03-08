import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function hasStaleTranslationTaskUserId(client: PrismaClient | undefined) {
  const translationTaskFields = (client as any)?._runtimeDataModel?.models?.TranslationTask?.fields

  return Array.isArray(translationTaskFields) &&
    translationTaskFields.some((field: { name?: string }) => field?.name === 'userId')
}

const existingPrisma = hasStaleTranslationTaskUserId(globalForPrisma.prisma)
  ? undefined
  : globalForPrisma.prisma

export const prisma = existingPrisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
