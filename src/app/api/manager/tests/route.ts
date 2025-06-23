import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';
import { prisma } from '@/app/lib/prisma';

// GET /api/manager/tests
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || (session.user as any).role !== 'MANAGER') {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('filter') || 'all';

    // Trova il team gestito dal manager
    const team = await prisma.team.findFirst({
      where: {
        managerId: userId
      },
      include: {
        members: true
      }
    });

    if (!team) {
      return NextResponse.json({ 
        error: 'Non sei assegnato a nessun team come manager' 
      }, { status: 404 });
    }

    // Ottieni gli ID dei membri del team
    const memberIds = team.members.map(m => m.userId);

    // Costruisci la query per i test
    const whereClause: any = {
      userId: {
        in: memberIds
      }
    };

    // Tutti i test nel database sono considerati completati
    // Non abbiamo test "in progress" nel nostro modello

    // Ottieni i test in modo anonimo (senza informazioni utente)
    const tests = await prisma.testResult.findMany({
      where: whereClause,
      select: {
        id: true,
        test: {
          select: {
            title: true,
            type: true
          }
        },
        completedAt: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Formatta i test per renderli anonimi
    const anonymousTests = tests.map(test => ({
      id: test.id,
      testTitle: test.test.title,
      testType: test.test.type,
      status: 'COMPLETED', // Tutti i test salvati sono completati
      completedAt: test.completedAt,
      createdAt: test.createdAt
    }));

    // Calcola le statistiche
    const totalTests = tests.length;
    const completedTests = totalTests; // Tutti i test sono completati
    const inProgressTests = 0;

    // Conta i test per tipo
    const testTypeCounts = tests.reduce((acc, test) => {
      const type = test.test.type;
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const testTypes = Object.entries(testTypeCounts).map(([type, count]) => ({
      type,
      count
    }));

    return NextResponse.json({
      tests: anonymousTests,
      stats: {
        totalTests,
        completedTests,
        inProgressTests,
        testTypes
      }
    });
  } catch (error) {
    console.error('Errore nel recupero dei test:', error);
    return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 });
  }
} 