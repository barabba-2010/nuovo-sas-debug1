import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';
import { prisma } from '@/app/lib/prisma';

// GET /api/manager/team
export async function GET(request: NextRequest) {
  try {
    console.log('API /api/manager/team - Inizio richiesta');
    
    const session = await getServerSession(authOptions);
    console.log('Session:', session);
    
    if (!session || (session.user as any).role !== 'MANAGER') {
      console.log('Utente non autorizzato o non manager');
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    console.log('Manager userId:', userId);

    // Trova il team gestito dal manager
    const team = await prisma.team.findFirst({
      where: {
        managerId: userId
      },
      include: {
        organization: {
          select: {
            id: true,
            name: true
          }
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        },
        _count: {
          select: {
            members: true
          }
        }
      }
    });

    console.log('Team trovato:', team ? 'Sì' : 'No');

    if (!team) {
      return NextResponse.json({ 
        error: 'Non sei assegnato a nessun team come manager' 
      }, { status: 404 });
    }

    // Per ogni membro, conta i test results e trova l'ultimo test
    const membersWithTestCount = await Promise.all(
      team.members.map(async (member) => {
        const testCount = await prisma.testResult.count({
          where: {
            userId: member.userId
          }
        });

        // Trova l'ultimo test completato
        const lastTest = await prisma.testResult.findFirst({
          where: {
            userId: member.userId
          },
          orderBy: {
            completedAt: 'desc'
          },
          select: {
            completedAt: true,
            test: {
              select: {
                title: true,
                type: true
              }
            }
          }
        });

        return {
          id: member.id,
          user: member.user,
          joinedAt: member.joinedAt,
          _count: {
            testResults: testCount
          },
          lastTest: lastTest
        };
      })
    );

    const formattedTeam = {
      ...team,
      members: membersWithTestCount
    };

    console.log('Risposta pronta, membri:', membersWithTestCount.length);
    return NextResponse.json({ team: formattedTeam });
  } catch (error) {
    console.error('Errore nel recupero del team:', error);
    return NextResponse.json({ 
      error: 'Errore interno del server',
      details: error instanceof Error ? error.message : 'Errore sconosciuto'
    }, { status: 500 });
  }
} 