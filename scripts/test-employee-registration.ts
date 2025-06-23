import { PrismaClient } from '@prisma/client';
import bcryptjs from 'bcryptjs';

const prisma = new PrismaClient();

async function testEmployeeRegistration() {
  try {
    console.log('Test registrazione dipendente...\n');

    // Verifica che esista un'organizzazione
    const organization = await prisma.organization.findFirst();
    
    if (!organization) {
      console.log('❌ Nessuna organizzazione trovata! Creane una prima.');
      return;
    }

    console.log('✅ Organizzazione trovata:');
    console.log(`   Nome: ${organization.name}`);
    console.log(`   Codice: ${organization.code}`);

    // Verifica i team disponibili
    const teams = await prisma.team.findMany({
      where: {
        organizationId: organization.id
      },
      include: {
        manager: true,
        _count: {
          select: {
            members: true
          }
        }
      }
    });

    console.log(`\n📋 Team disponibili (${teams.length}):`);
    teams.forEach(team => {
      console.log(`   - ${team.name}`);
      console.log(`     Manager: ${team.manager?.name || 'Nessuno'}`);
      console.log(`     Membri: ${team._count.members}`);
    });

    // Crea un dipendente di test
    const testEmail = `test.employee.${Date.now()}@test.com`;
    const hashedPassword = await bcryptjs.hash('password123', 10);

    console.log('\n🔄 Creazione dipendente di test...');
    const newEmployee = await prisma.user.create({
      data: {
        email: testEmail,
        name: 'Test Employee',
        password: hashedPassword,
        role: 'EMPLOYEE',
        organizationMemberships: {
          create: {
            organizationId: organization.id
          }
        }
      }
    });

    console.log('✅ Dipendente creato:');
    console.log(`   Email: ${newEmployee.email}`);
    console.log(`   Nome: ${newEmployee.name}`);
    console.log(`   Ruolo: ${newEmployee.role}`);

    // Verifica che il dipendente sia nell'organizzazione ma senza team
    const membership = await prisma.userOrganization.findFirst({
      where: {
        userId: newEmployee.id
      },
      include: {
        organization: true,
        team: true
      }
    });

    console.log('\n📊 Stato membership:');
    console.log(`   Organizzazione: ${membership?.organization.name}`);
    console.log(`   Team: ${membership?.team?.name || 'Nessuno (da assegnare)'}`);

    console.log('\n✅ Test completato!');
    console.log('\nPer testare il flusso completo:');
    console.log(`1. Vai su http://localhost:3000/auth/register`);
    console.log(`2. Usa il codice organizzazione: ${organization.code}`);
    console.log(`3. Dopo la registrazione, verrai reindirizzato alla selezione del team`);

  } catch (error) {
    console.error('❌ Errore:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testEmployeeRegistration(); 