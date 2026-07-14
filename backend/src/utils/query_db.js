import { prisma } from '../config/db.js';

async function main() {
  const users = await prisma.user.findMany({
    take: 5
  });
  console.log("Users in DB:", users);
}

main().catch(console.error).finally(() => prisma.$disconnect());
