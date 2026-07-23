import { prisma } from './src/utils/prisma.js';

async function main() {
  const userCount = await prisma.user.count();
  const groupCount = await prisma.group.count();
  const expenseCount = await prisma.expense.count();
  const memberCount = await prisma.groupMember.count();

  console.log('=== POSTGRESQL DATABASE COUNTS ===');
  console.log(`Users: ${userCount}`);
  console.log(`Groups: ${groupCount}`);
  console.log(`Expenses: ${expenseCount}`);
  console.log(`GroupMembers: ${memberCount}`);

  const sampleGroups = await prisma.group.findMany({
    take: 5,
    include: { members: { include: { user: true } } }
  });
  console.log('=== SAMPLE GROUPS ===');
  console.log(JSON.stringify(sampleGroups, null, 2));
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());
