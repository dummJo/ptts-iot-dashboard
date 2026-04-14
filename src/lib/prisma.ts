import { PrismaClient } from '@prisma/client'

const prismaClientSingleton = () => {
  const client = new PrismaClient({
    log: ['error', 'warn'],
  });
  
  // Optional: Add a simple connect test
  client.$connect()
    .then(() => console.log('✅ Prisma connected to Neon PostgreSQL'))
    .catch((err) => console.error('❌ Prisma connection failed:', err.message));

  return client;
}

declare global {
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>
}

const prisma = globalThis.prisma ?? prismaClientSingleton()

export default prisma

if (process.env.NODE_ENV !== 'production') globalThis.prisma = prisma
