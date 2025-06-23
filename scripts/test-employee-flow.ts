import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testEmployeeFlow() {
  console.log('=== TEST FLUSSO DIPENDENTE ===\n');

  // 1. Verifica l'utente Ramona
  const user = await prisma.user.findUnique({
    where: { email: 'ramona.stabile@gmail.com' },
    include: {
      organizationMemberships: {
        include: {
          organization: {
            include: {
              teams: {
                include: {
                  manager: true
                }
              }
            }
          },
          team: true
        }
      }
    }
  });

  if (!user) {
    console.log('❌ Utente non trovato!');
    return;
  }

  console.log('1. UTENTE:');
  console.log(`   Nome: ${user.name}`);
  console.log(`   Email: ${user.email}`);
  console.log(`   Ruolo: ${user.role}`);
  console.log(`   ID: ${user.id}\n`);

  if (user.organizationMemberships.length === 0) {
    console.log('❌ Utente non associato a nessuna organizzazione!');
    return;
  }

  const membership = user.organizationMemberships[0];
  const org = membership.organization;

  console.log('2. ORGANIZZAZIONE:');
  console.log(`   Nome: ${org.name}`);
  console.log(`   Codice: ${org.code}`);
  console.log(`   ID: ${org.id}\n`);

  console.log('3. TEAM ASSEGNATO:');
  if (membership.team) {
    console.log(`   ✓ ${membership.team.name}`);
  } else {
    console.log(`   ❌ Nessun team assegnato\n`);
    
    console.log('4. TEAM DISPONIBILI NELL\'ORGANIZZAZIONE:');
    if (org.teams.length === 0) {
      console.log('   ❌ Nessun team disponibile!');
    } else {
      org.teams.forEach(team => {
        console.log(`   • ${team.name}`);
        console.log(`     ID: ${team.id}`);
        console.log(`     Manager: ${team.manager ? `${team.manager.name} (${team.manager.email})` : 'Nessuno'}`);
      });
    }
  }

  console.log('\n=== ISTRUZIONI PER IL DIPENDENTE ===');
  console.log('1. Accedi con:');
  console.log(`   Email: ${user.email}`);
  console.log('   Password: [la password che hai scelto]');
  console.log(`   Codice azienda: ${org.code}`);
  
  if (!membership.team) {
    console.log('\n2. Dopo il login, verrai reindirizzato alla selezione del team');
    console.log('   Potrai scegliere tra:');
    org.teams.forEach(team => {
      console.log(`   • ${team.name}`);
    });
  } else {
    console.log('\n2. Hai già un team assegnato, verrai reindirizzato alla dashboard');
  }
}

testEmployeeFlow()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 