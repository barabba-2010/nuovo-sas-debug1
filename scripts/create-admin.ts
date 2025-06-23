import { PrismaClient } from '@prisma/client';
import bcryptjs from 'bcryptjs';

const prisma = new PrismaClient();

async function createAdmin() {
  console.log('Creazione utente ADMIN...');

  const email = 'mazzini.francesco2003@gmail.com';
  
  // Verifica se l'admin esiste già
  const existingAdmin = await prisma.user.findUnique({
    where: { email }
  });

  if (existingAdmin) {
    console.log('Admin già esistente:', existingAdmin.email);
    
    // Se esiste ma non è ADMIN, aggiorna il ruolo
    if (existingAdmin.role !== 'ADMIN') {
      const updated = await prisma.user.update({
        where: { email },
        data: { role: 'ADMIN' }
      });
      console.log('Ruolo aggiornato a ADMIN per:', updated.email);
    }
  } else {
    // Crea nuovo admin
    const hashedPassword = await bcryptjs.hash('admin123', 10);
    const admin = await prisma.user.create({
      data: {
        name: 'Francesco Mazzini',
        email,
        password: hashedPassword,
        role: 'ADMIN'
      }
    });
    console.log('Admin creato:', admin.email);
  }

  console.log('\n=== CREDENZIALI ADMIN ===');
  console.log('Email:', email);
  console.log('Password: admin123');
  console.log('Codice azienda: NON RICHIESTO (è admin)');
}

createAdmin()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 