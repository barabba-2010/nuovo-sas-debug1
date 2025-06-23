import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';
import { prisma } from '@/app/lib/prisma';

// GET /api/manager/stats
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || (session.user as any).role !== 'MANAGER') {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    const userId = (session.user as any).id;

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

    // Calcola le statistiche
    const memberIds = team.members.map(m => m.userId);
    
    const totalTests = await prisma.testResult.count({
      where: {
        userId: {
          in: memberIds
        }
      }
    });

    // Tutti i test sono considerati completati quando esistono
    const completedTests = totalTests;

    const activeMembers = team.members.length;

    return NextResponse.json({
      totalTests,
      completedTests,
      activeMembers
    });
  } catch (error) {
    console.error('Errore nel recupero delle statistiche:', error);
    return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 });
  }
} 