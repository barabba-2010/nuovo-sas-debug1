import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateUserToAdmin() {
  const email = process.argv[2];
  
  if (!email) {
    console.error('Uso: npx ts-node scripts/update-admin.ts <email>');
    process.exit(1);
  }

  try {
    // Trova l'utente
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      console.error(`Utente con email ${email} non trovato`);
      process.exit(1);
    }

    // Aggiorna il ruolo
    const updatedUser = await prisma.user.update({
      where: { email },
      data: { role: 'ADMIN' }
    });

    console.log(`\n✅ Utente aggiornato con successo!`);
    console.log(`Email: ${updatedUser.email}`);
    console.log(`Nome: ${updatedUser.name || 'N/A'}`);
    console.log(`Ruolo: ${updatedUser.role}`);

  } catch (error) {
    console.error('Errore durante l\'aggiornamento:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateUserToAdmin(); 