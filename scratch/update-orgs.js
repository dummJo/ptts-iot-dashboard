const { PrismaClient } = require('@prisma/client');
require('dotenv').config({ path: '.env.local' });

const prisma = new PrismaClient();

async function main() {
  const result = await prisma.asset.updateMany({
    data: {
      organizationId: 'demo-mode',
      organizationName: 'Live Demo'
    }
  });
  console.log(`Updated ${result.count} assets to Live Demo.`);
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
