import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('--- Database Seeding Started ---')

  // 1. Initial Admin User
  // Password hash for 'admin_ptts_2024' (Placeholder hash for demonstration)
  // In a real app, use bcrypt to hash the password.
  const adminPasswordHash = "admin_ptts_2024_hashed"; 

  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      passwordHash: adminPasswordHash,
      role: 'admin',
      isActive: true,
    },
  })
  console.log('✅ Admin user created:', admin.username)

  // 2. Initial Assets
  const assets = [
    { tagId: 'MTR-001', name: 'Main Conveyor Motor', type: 'ABB SMARTSENSOR', location: 'Line A - Sector 4', powerKw: 45.0, foundationType: 'rigid' },
    { tagId: 'PUMP-04', name: 'Cooling Water Pump', type: 'ABB SMARTSENSOR', location: 'Utility Basement', powerKw: 22.5, foundationType: 'flexible' },
    { tagId: 'COMP-12', name: 'Air Compressor Unit', type: 'RONDS', location: 'Aisle 2', powerKw: 75.0, foundationType: 'rigid' },
  ]

  for (const asset of assets) {
    const created = await prisma.asset.upsert({
      where: { tagId: asset.tagId },
      update: {},
      create: asset,
    })
    console.log(`✅ Asset created: ${created.tagId} (${created.name})`)
  }

  // 3. Initial System Config
  await prisma.systemConfig.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      getKeys: {
        abb: "abb_default_key_placeholder",
        ronds: "ronds_default_key_placeholder"
      },
      settings: {
        theme: "dark",
        refreshRate: 30000
      }
    }
  })
  console.log('✅ System configuration initialized')

  console.log('--- Database Seeding Complete ---')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
