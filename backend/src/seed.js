import bcrypt from 'bcryptjs';
import { prisma } from './utils/prisma.js';

async function seed() {
  console.log('🌱 Seeding database...');

  // Create demo user
  const hashedPassword = await bcrypt.hash('password123', 10);
  const user = await prisma.user.upsert({
    where: { email: 'alex@example.com' },
    update: {},
    create: {
      name: 'Alex Johnson',
      email: 'alex@example.com',
      password: hashedPassword,
      color: '#CCFF00',
    },
  });

  console.log('✅ Demo user seeded:', user.email);
}

seed()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
