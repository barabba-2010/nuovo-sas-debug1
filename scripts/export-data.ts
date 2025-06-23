import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function exportData() {
  try {
    console.log('\n=== ESPORTAZIONE DATI DATABASE ===\n');
    
    const exportDir = path.join(process.cwd(), 'database-export');
    if (!fs.existsSync(exportDir)) {
      fs.mkdirSync(exportDir);
    }
    
    // 1. Esporta utenti (senza password)
    console.log('1. Esportazione utenti...');
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        _count: {
          select: {
            reports: true
          }
        }
      }
    });
    
    fs.writeFileSync(
      path.join(exportDir, 'users.json'),
      JSON.stringify(users, null, 2)
    );
    console.log(`✅ Esportati ${users.length} utenti`);
    
    // 2. Esporta report
    console.log('\n2. Esportazione report...');
    const reports = await prisma.report.findMany({
      select: {
        id: true,
        title: true,
        createdAt: true,
        metadata: true,
        user: {
          select: {
            email: true,
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    // Processa i report per renderli più leggibili
    const processedReports = reports.map(report => {
      const metadata = JSON.parse(report.metadata || '{}');
      return {
        id: report.id,
        title: report.title,
        user: `${report.user.name} (${report.user.email})`,
        createdAt: report.createdAt.toISOString(),
        testType: metadata.testType,
        completedAt: metadata.completedAt,
        summary: metadata.testType === 'sas' ? {
          scopo: metadata.scopo,
          antiscopo: metadata.antiscopo,
          balance: metadata.balance,
          topFactors: metadata.topFactors
        } : {
          topDomains: metadata.topDomains
        }
      };
    });
    
    fs.writeFileSync(
      path.join(exportDir, 'reports.json'),
      JSON.stringify(processedReports, null, 2)
    );
    console.log(`✅ Esportati ${reports.length} report`);
    
    // 3. Crea un riepilogo
    console.log('\n3. Creazione riepilogo...');
    const summary = {
      exportDate: new Date().toISOString(),
      database: 'Supabase PostgreSQL',
      statistics: {
        totalUsers: users.length,
        adminUsers: users.filter(u => u.role === 'ADMIN').length,
        totalReports: reports.length,
        reportsByType: {
          sas: reports.filter(r => JSON.parse(r.metadata || '{}').testType === 'sas').length,
          pid5: reports.filter(r => JSON.parse(r.metadata || '{}').testType === 'pid5').length
        },
        mostActiveUsers: users
          .sort((a, b) => b._count.reports - a._count.reports)
          .slice(0, 5)
          .map(u => ({
            email: u.email,
            name: u.name,
            reportCount: u._count.reports
          }))
      }
    };
    
    fs.writeFileSync(
      path.join(exportDir, 'summary.json'),
      JSON.stringify(summary, null, 2)
    );
    console.log('✅ Riepilogo creato');
    
    console.log(`\n✅ Esportazione completata!`);
    console.log(`📁 I file sono stati salvati in: ${exportDir}`);
    console.log('\nFile creati:');
    console.log('- users.json: Lista degli utenti');
    console.log('- reports.json: Lista dei report');
    console.log('- summary.json: Riepilogo statistiche');
    
  } catch (error) {
    console.error('\n❌ Errore durante l\'esportazione:', error);
  } finally {
    await prisma.$disconnect();
  }
}

exportData(); 