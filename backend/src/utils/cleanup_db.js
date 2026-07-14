import { prisma } from '../config/db.js';

async function main() {
  const users = await prisma.user.findMany();
  console.log(`Checking ${users.length} users for leading/trailing whitespaces...`);
  
  let updateCount = 0;
  for (const user of users) {
    // Trim leading/trailing spaces and remove intermediate spaces to ensure valid username handles
    const trimmedUsername = user.username.trim().replace(/\s+/g, '_'); // Replace spaces with underscores
    const trimmedEmail = user.email.trim();
    
    if (trimmedUsername !== user.username || trimmedEmail !== user.email) {
      console.log(`Updating user ${user.id}:`);
      console.log(`  Username: '${user.username}' -> '${trimmedUsername}'`);
      console.log(`  Email: '${user.email}' -> '${trimmedEmail}'`);
      
      try {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            username: trimmedUsername,
            email: trimmedEmail,
          },
        });
        updateCount++;
      } catch (err) {
        console.error(`Failed to update user ${user.id}:`, err.message);
      }
    }
  }
  
  console.log(`Database cleanup finished. Updated ${updateCount} users.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
