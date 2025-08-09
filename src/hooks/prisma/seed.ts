import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash('Gblxd91@', 10);

  const user = await prisma.user.upsert({
    where: { email: 'gabbriel_gbl2@hotmail.com' },
    update: {
      hashedPassword: password,
    },
    create: {
      email: 'gabbriel_gbl2@hotmail.com',
      name: 'Gabriel Marques',
      hashedPassword: password,
      image: 'https://picsum.photos/id/64/4326/2884',
    },
  });

  console.log('✅ Usuário base criado/atualizado:', user);
}

main()
  .catch((e) => {
    console.error('Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
