import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkAndUpdateAdmin() {
  try {
    // Trova tutti gli utenti
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true
      }
    });

    console.log('\n=== UTENTI NEL DATABASE ===');
    users.forEach(user => {
      console.log(`\nID: ${user.id}`);
      console.log(`Email: ${user.email}`);
      console.log(`Nome: ${user.name || 'N/A'}`);
      console.log(`Ruolo: ${user.role}`);
    });

    // Chiedi quale utente rendere admin
    if (users.length > 0) {
      console.log('\n=== AGGIORNAMENTO RUOLO ADMIN ===');
      console.log('Per aggiornare un utente ad ADMIN, esegui:');
      console.log(`npx ts-node scripts/update-admin.ts <email>`);
    }

  } catch (error) {
    console.error('Errore:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAndUpdateAdmin(); 