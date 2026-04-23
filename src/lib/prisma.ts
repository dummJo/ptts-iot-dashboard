import { PrismaNeon } from '@prisma/adapter-neon'
import { PrismaClient } from '@prisma/client'

const prismaClientSingleton = () => {
  const connectionString = process.env.DATABASE_URL || ''
  const adapter = new PrismaNeon({ connectionString })
  
  return new PrismaClient({
    adapter,
    log: ['error', 'warn']
  })
}

declare global {
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>
}

const prisma = globalThis.prisma ?? prismaClientSingleton()

export default prisma

if (process.env.NODE_ENV !== 'production') globalThis.prisma = prisma
