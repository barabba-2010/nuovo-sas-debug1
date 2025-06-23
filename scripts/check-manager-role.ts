import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkManagerRole() {
  try {
    console.log('Verifica ruolo manager...\n');

    // Trova l'utente manager
    const manager = await prisma.user.findUnique({
      where: { email: 'manager@test.com' },
      include: {
        organizationMemberships: {
          include: {
            organization: true,
            team: true
          }
        },
        managedTeams: true
      }
    });

    if (!manager) {
      console.log('❌ Manager non trovato!');
      return;
    }

    console.log('✅ Manager trovato:');
    console.log('- ID:', manager.id);
    console.log('- Nome:', manager.name);
    console.log('- Email:', manager.email);
    console.log('- Ruolo:', manager.role);
    console.log('- Creato:', manager.createdAt);
    
    console.log('\n📋 Organizzazioni:');
    manager.organizationMemberships.forEach(membership => {
      console.log(`  - ${membership.organization.name} (${membership.organization.code})`);
      if (membership.team) {
        console.log(`    Team: ${membership.team.name}`);
      }
    });

    console.log('\n👥 Team gestiti:');
    if (manager.managedTeams.length > 0) {
      manager.managedTeams.forEach(team => {
        console.log(`  - ${team.name} (ID: ${team.id})`);
      });
    } else {
      console.log('  Nessun team gestito');
    }

    // Verifica anche altri utenti con ruolo MANAGER
    const allManagers = await prisma.user.findMany({
      where: { role: 'MANAGER' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true
      }
    });

    console.log('\n📊 Tutti i manager nel sistema:');
    allManagers.forEach(m => {
      console.log(`  - ${m.name} (${m.email}) - Ruolo: ${m.role}`);
    });

  } catch (error) {
    console.error('Errore:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkManagerRole(); 