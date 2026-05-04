import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

async function main() {
  const prisma = new PrismaClient();

  const email = process.env.ADMIN_EMAIL;
  const rawPassword = process.env.ADMIN_PASSWORD;

  if (!email || !rawPassword) {
    throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD must be set in .env');
  }

  const existing = await prisma.user.findUnique({ where: { email } });

  if (!existing) {
    const password = await bcrypt.hash(rawPassword, 10);
    await prisma.user.create({
      data: { name: 'Admin', email, password, role: 'ADMIN' },
    });
    console.log(`Admin user created: ${email}`);
  } else {
    console.log('Admin user already exists, skipping seed.');
  }

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
