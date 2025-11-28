import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Checking RLS status...');

  try {
    // 1. Check if RLS is enabled for tables
    const tables = [
      'tenant',
      'auth_account',
      'business',
      'user_owner',
      'user_business',
      'user_role',
      'role',
      'category',
      'product',
      'product_variant',
      'order',
      'order_item',
      'payment',
      'mp_config',
    ];

    console.log('\n--- RLS Enabled Status ---');
    for (const table of tables) {
      const result = await prisma.$queryRaw`
        SELECT relname, relrowsecurity 
        FROM pg_class 
        WHERE oid = ${table}::regclass;
      `;
      const isEnabled = (result as any)[0]?.relrowsecurity;
      console.log(`Table '${table}': ${isEnabled ? 'ENABLED' : 'DISABLED'}`);
    }

    // 2. List all policies
    console.log('\n--- Existing Policies ---');
    const policies = await prisma.$queryRaw`
      SELECT schemaname, tablename, policyname, cmd, roles, qual, with_check
      FROM pg_policies
      WHERE schemaname = 'public'
      ORDER BY tablename, policyname;
    `;

    if (Array.isArray(policies) && policies.length > 0) {
      // console.table(policies);
      console.log(`Found ${policies.length} policies.`);
    } else {
      console.log('No policies found.');
    }
  } catch (error) {
    console.error('Error checking RLS:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
