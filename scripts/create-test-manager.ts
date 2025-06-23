import { PrismaClient } from '@prisma/client';
import bcryptjs from 'bcryptjs';

const prisma = new PrismaClient();

async function createTestManager() {
  try {
    console.log('Creazione manager di test...');

    // Prima verifica se esiste già un'organizzazione
    let organization = await prisma.organization.findFirst();
    
    if (!organization) {
      // Crea un'organizzazione di test
      organization = await prisma.organization.create({
        data: {
          name: 'Test Organization',
          code: 'TEST001'
        }
      });
      console.log('Organizzazione creata:', organization.name);
    } else {
      console.log('Organizzazione esistente:', organization.name);
    }

    // Verifica se esiste già il manager
    const existingManager = await prisma.user.findUnique({
      where: { email: 'manager@test.com' }
    });

    if (existingManager) {
      console.log('Manager già esistente:', existingManager.email);
      
      // Aggiorna il ruolo se necessario
      if (existingManager.role !== 'MANAGER') {
        await prisma.user.update({
          where: { id: existingManager.id },
          data: { role: 'MANAGER' }
        });
        console.log('Ruolo aggiornato a MANAGER');
      }
    } else {
      // Crea il manager
      const hashedPassword = await bcryptjs.hash('password123', 10);
      
      const manager = await prisma.user.create({
        data: {
          email: 'manager@test.com',
          name: 'Test Manager',
          password: hashedPassword,
          role: 'MANAGER',
          organizationMemberships: {
            create: {
              organizationId: organization.id
            }
          }
        }
      });
      
      console.log('Manager creato:', manager.email);
    }

    // Crea o trova un team
    let team = await prisma.team.findFirst({
      where: { organizationId: organization.id }
    });

    if (!team) {
      const manager = await prisma.user.findUnique({
        where: { email: 'manager@test.com' }
      });

      team = await prisma.team.create({
        data: {
          name: 'Test Team',
          organizationId: organization.id,
          managerId: manager!.id
        }
      });
      console.log('Team creato:', team.name);
    } else {
      // Assegna il manager al team se non ha già un manager
      if (!team.managerId) {
        const manager = await prisma.user.findUnique({
          where: { email: 'manager@test.com' }
        });

        await prisma.team.update({
          where: { id: team.id },
          data: { managerId: manager!.id }
        });
        console.log('Manager assegnato al team');
      }
    }

    // Crea anche un utente normale per il test
    const existingEmployee = await prisma.user.findUnique({
      where: { email: 'employee@test.com' }
    });

    if (!existingEmployee) {
      const hashedPassword = await bcryptjs.hash('password123', 10);
      
      await prisma.user.create({
        data: {
          email: 'employee@test.com',
          name: 'Test Employee',
          password: hashedPassword,
          role: 'EMPLOYEE',
          organizationMemberships: {
            create: {
              organizationId: organization.id,
              teamId: team.id
            }
          }
        }
      });
      
      console.log('Employee creato: employee@test.com');
    }

    console.log('\n✅ Setup completato!');
    console.log('\nCredenziali di test:');
    console.log('Manager: manager@test.com / password123');
    console.log('Employee: employee@test.com / password123');
    console.log('Codice organizzazione:', organization.code);

  } catch (error) {
    console.error('Errore:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestManager(); 