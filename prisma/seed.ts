import { PrismaClient } from '@prisma/client'
import { hashPassword, encryptData } from '../src/lib/security'
import prisma from '../src/lib/prisma'

async function main() {
  console.log('--- Database Seeding Started ---')

  // 1. Initial Admin User
  // Password hash for 'admin' (Scrypt hex with salt 'ptts-salt-2024')
  const adminPasswordHash = hashPassword("admin"); 

  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {
      passwordHash: adminPasswordHash,
      role: 'admin',
      isActive: true,
    },
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
      update: {
        name: asset.name,
        type: asset.type,
        location: asset.location,
        powerKw: asset.powerKw,
      },
      create: asset,
    })
    console.log(`✅ Asset created: ${created.tagId} (${created.name})`)

    // 2.1 Generate 24 hours of dummy telemetry
    const points = [];
    const now = new Date();
    for (let h = 24; h >= 0; h--) {
      const ts = new Date(now.getTime() - h * 60 * 60 * 1000);
      points.push({
        assetId: created.id,
        timestamp: ts,
        temp: 45 + Math.random() * 15,
        vibOverall: 0.8 + Math.random() * 2.5,
        vibVelocity: 1.2 + Math.random() * 1.5,
        motorCurrent: created.tagId.startsWith('MTR') ? 20 + Math.random() * 10 : null,
        motorKw: created.tagId.startsWith('MTR') ? 15 + Math.random() * 5 : null,
      });
    }

    await prisma.telemetry.createMany({
      data: points
    });
    console.log(`   📊 Generated 24h telemetry for ${created.tagId}`)
  }

  // 3. Initial System Config
  await prisma.systemConfig.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      getKeys: {
        abb: encryptData("abb_default_key_placeholder"),
        ronds: encryptData("ronds_default_key_placeholder")
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
