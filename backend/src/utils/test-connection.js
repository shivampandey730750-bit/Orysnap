import { PrismaClient } from '@prisma/client';

const regions = ['ap-south-1', 'ap-southeast-1', 'us-east-1'];
const password = 'Shivampandey8005';
const projectRef = 'gcgzscyyhtjjmqjqfndz';

async function testConnection() {
  for (const region of regions) {
    // Set the username to postgres.projectRef as required by Supavisor
    const url = `postgresql://postgres.${projectRef}:${password}@aws-0-${region}.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1`;
    console.log(`Testing connection for region ${region}...`);
    
    const prisma = new PrismaClient({
      datasources: {
        db: {
          url: url,
        },
      },
    });

    try {
      await prisma.$connect();
      // Try a simple query
      const result = await prisma.$queryRaw`SELECT 1 as result`;
      console.log(`[ SUCCESS ] Connected successfully using region: ${region}`);
      console.log(`Your working connection URL is:`);
      console.log(`postgresql://postgres.${projectRef}:${password}@aws-0-${region}.pooler.supabase.com:6543/postgres?pgbouncer=true`);
      await prisma.$disconnect();
      return;
    } catch (err) {
      console.log(`[ FAILED ] Region ${region} failed:`, err.message);
    } finally {
      await prisma.$disconnect();
    }
  }
  console.log('All tested regions failed. Please double-check your database password.');
}

testConnection();
