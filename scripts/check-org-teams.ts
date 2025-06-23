import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkOrgTeams() {
  console.log('=== VERIFICA ORGANIZZAZIONE E TEAM ===\n');

  // Trova l'organizzazione TECH01
  const org = await prisma.organization.findUnique({
    where: { code: 'TECH01' },
    include: {
      teams: {
        include: {
          manager: true,
          members: {
            include: {
              user: true
            }
          }
        }
      },
      members: {
        include: {
          user: true,
          team: true
        }
      }
    }
  });

  if (!org) {
    console.log('❌ Organizzazione TECH01 non trovata!');
    return;
  }

  console.log(`✓ Organizzazione: ${org.name} (${org.code})`);
  console.log(`  ID: ${org.id}`);
  console.log(`  Team: ${org.teams.length}`);
  console.log(`  Membri: ${org.members.length}\n`);

  console.log('TEAM:');
  if (org.teams.length === 0) {
    console.log('  ❌ Nessun team trovato!');
  } else {
    org.teams.forEach(team => {
      console.log(`  • ${team.name}`);
      console.log(`    ID: ${team.id}`);
      console.log(`    Manager: ${team.manager ? `${team.manager.name} (${team.manager.email})` : 'Nessuno'}`);
      console.log(`    Membri: ${team.members.length}`);
    });
  }

  console.log('\nMEMBRI ORGANIZZAZIONE:');
  if (org.members.length === 0) {
    console.log('  ❌ Nessun membro trovato!');
  } else {
    org.members.forEach(member => {
      console.log(`  • ${member.user.name} (${member.user.email})`);
      console.log(`    Ruolo: ${member.user.role}`);
      console.log(`    Team: ${member.team ? member.team.name : 'NON ASSEGNATO'}`);
    });
  }

  // Verifica l'ultimo utente registrato
  console.log('\n=== ULTIMO UTENTE REGISTRATO ===');
  const lastUser = await prisma.user.findFirst({
    where: { email: 'ramona.stabile@gmail.com' },
    include: {
      organizationMemberships: {
        include: {
          organization: true,
          team: true
        }
      }
    }
  });

  if (lastUser) {
    console.log(`✓ Utente trovato: ${lastUser.name} (${lastUser.email})`);
    console.log(`  Ruolo: ${lastUser.role}`);
    if (lastUser.organizationMemberships.length > 0) {
      const membership = lastUser.organizationMemberships[0];
      console.log(`  Organizzazione: ${membership.organization.name} (${membership.organization.code})`);
      console.log(`  Team: ${membership.team ? membership.team.name : 'NON ASSEGNATO'}`);
    } else {
      console.log('  ❌ Non associato a nessuna organizzazione!');
    }
  } else {
    console.log('❌ Utente ramona.stabile@gmail.com non trovato!');
  }
}

checkOrgTeams()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 