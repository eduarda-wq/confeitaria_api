
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando o script de seed...');

  // Hash da senha do admin principal
  const salt = bcrypt.genSaltSync(12);
  const adminPassword = bcrypt.hashSync('SuperAdmin@2025', salt);

  // Cria ou atualiza o admin principal
  const admin = await prisma.admin.upsert({
    where: { email: 'adm@email.com' },
    update: {},
    create: {
      nome: 'Administrador Principal',
      email: 'adm@email.com',
      senha: adminPassword,
      nivel: 5,
    },
  });

  console.log('Admin principal criado/verificado:', admin);
  console.log('Script de seed concluído com sucesso!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });