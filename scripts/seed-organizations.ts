import { PrismaClient } from '@prisma/client';
import bcryptjs from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Creazione organizzazioni di esempio...');

  // Verifica se l'organizzazione esiste già
  let org1 = await prisma.organization.findUnique({
    where: { code: 'TECH01' }
  });

  if (!org1) {
    // Crea un'organizzazione di esempio
    org1 = await prisma.organization.create({
      data: {
        name: 'Tech Solutions Srl',
        code: 'TECH01'
      }
    });
    console.log('Organizzazione creata:', org1);
  } else {
    console.log('Organizzazione già esistente:', org1);
  }

  // Verifica se i team esistono già
  const existingTeams = await prisma.team.findMany({
    where: { organizationId: org1.id }
  });

  let team1, team2;

  if (existingTeams.length === 0) {
    // Crea alcuni team
    team1 = await prisma.team.create({
      data: {
        name: 'Team Sviluppo',
        organizationId: org1.id
      }
    });

    team2 = await prisma.team.create({
      data: {
        name: 'Team Marketing',
        organizationId: org1.id
      }
    });

    console.log('Team creati:', { team1, team2 });
  } else {
    console.log('Team già esistenti:', existingTeams);
    team1 = existingTeams.find(t => t.name === 'Team Sviluppo');
    team2 = existingTeams.find(t => t.name === 'Team Marketing');
  }

  // Verifica se il manager esiste già
  let manager = await prisma.user.findUnique({
    where: { email: 'manager@techsolutions.it' }
  });

  if (!manager) {
    // Crea un manager di esempio
    const hashedPassword = await bcryptjs.hash('manager123', 10);
    manager = await prisma.user.create({
      data: {
        name: 'Mario Rossi',
        email: 'manager@techsolutions.it',
        password: hashedPassword,
        role: 'MANAGER',
        organizationMemberships: {
          create: {
            organizationId: org1.id
          }
        }
      }
    });
    console.log('Manager creato:', { id: manager.id, email: manager.email });

    // Assegna il manager al team1
    if (team1) {
      await prisma.team.update({
        where: { id: team1.id },
        data: { managerId: manager.id }
      });
      console.log('Manager assegnato al Team Sviluppo');
    }
  } else {
    console.log('Manager già esistente:', { id: manager.id, email: manager.email });
  }

  console.log('\n=== RIEPILOGO ===');
  console.log('Organizzazione: Tech Solutions Srl');
  console.log('Codice azienda: TECH01');
  console.log('Manager: manager@techsolutions.it (password: manager123)');
  console.log('Team: Team Sviluppo (con manager), Team Marketing (senza manager)');
  console.log('\nGli employee possono registrarsi usando il codice: TECH01');
  console.log('Il manager può accedere con email + password + codice azienda TECH01');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 