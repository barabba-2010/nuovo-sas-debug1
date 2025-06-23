import { PrismaClient } from '@prisma/client';
import bcryptjs from 'bcryptjs';

const prisma = new PrismaClient();

async function testLogin() {
  console.log('=== TEST LOGIN UTENTI ===\n');

  // Test 1: Admin senza codice azienda
  console.log('1. Test Admin (senza codice azienda):');
  const admin = await prisma.user.findUnique({
    where: { email: 'mazzini.francesco2003@gmail.com' }
  });
  if (admin) {
    console.log(`   ✓ Admin trovato: ${admin.email} (ruolo: ${admin.role})`);
    console.log('   → Può accedere SENZA codice azienda\n');
  } else {
    console.log('   ✗ Admin non trovato\n');
  }

  // Test 2: Manager con codice azienda
  console.log('2. Test Manager (con codice azienda):');
  const manager = await prisma.user.findUnique({
    where: { email: 'manager@techsolutions.it' },
    include: {
      organizationMemberships: {
        include: {
          organization: true
        }
      }
    }
  });
  if (manager) {
    console.log(`   ✓ Manager trovato: ${manager.email} (ruolo: ${manager.role})`);
    const org = manager.organizationMemberships[0]?.organization;
    if (org) {
      console.log(`   → Deve usare codice azienda: ${org.code}`);
      console.log(`   → Organizzazione: ${org.name}\n`);
    }
  } else {
    console.log('   ✗ Manager non trovato\n');
  }

  // Test 3: Employee con codice azienda
  console.log('3. Test Employee (con codice azienda):');
  const employees = await prisma.user.findMany({
    where: { role: 'EMPLOYEE' },
    include: {
      organizationMemberships: {
        include: {
          organization: true,
          team: true
        }
      }
    },
    take: 3
  });
  
  if (employees.length > 0) {
    employees.forEach(emp => {
      console.log(`   ✓ Employee: ${emp.email}`);
      const membership = emp.organizationMemberships[0];
      if (membership) {
        console.log(`     → Deve usare codice azienda: ${membership.organization.code}`);
        console.log(`     → Organizzazione: ${membership.organization.name}`);
        if (membership.team) {
          console.log(`     → Team: ${membership.team.name}`);
        } else {
          console.log(`     → Team: NON ASSEGNATO (dovrà sceglierlo dopo il login)`);
        }
      }
    });
  } else {
    console.log('   ✗ Nessun employee trovato');
    console.log('   → Gli employee si registrano con il codice azienda TECH01');
  }

  console.log('\n=== RIEPILOGO ACCESSO ===');
  console.log('• ADMIN: email + password (NO codice azienda)');
  console.log('• MANAGER: email + password + codice azienda');
  console.log('• EMPLOYEE: email + password + codice azienda');
  console.log('\nNOTA: Gli employee devono prima registrarsi con il codice azienda');
}

testLogin()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 