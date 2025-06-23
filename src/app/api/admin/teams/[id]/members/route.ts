import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';
import { prisma } from '@/app/lib/prisma';

// GET /api/admin/teams/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    const team = await prisma.team.findUnique({
      where: { id: params.id },
      include: {
        organization: true,
        manager: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true
              }
            }
          }
        }
      }
    });

    if (!team) {
      return NextResponse.json({ error: 'Team non trovato' }, { status: 404 });
    }

    return NextResponse.json({ team });
  } catch (error) {
    console.error('Errore nel recupero del team:', error);
    return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 });
  }
}

// DELETE /api/admin/teams/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    // Prima rimuovi tutti i membri dal team
    await prisma.userOrganization.updateMany({
      where: { teamId: params.id },
      data: { teamId: null }
    });

    // Poi elimina il team
    await prisma.team.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ message: 'Team eliminato con successo' });
  } catch (error) {
    console.error('Errore nell\'eliminazione del team:', error);
    return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 });
  }
}

// PATCH /api/admin/teams/[id]
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    const body = await request.json();
    const { name, managerId } = body;

    // Se viene specificato un manager, verifica che sia un manager valido
    if (managerId) {
      const manager = await prisma.user.findUnique({
        where: { id: managerId },
        select: { role: true }
      });

      if (!manager || manager.role !== 'MANAGER') {
        return NextResponse.json({ 
          error: 'L\'utente selezionato non è un manager valido' 
        }, { status: 400 });
      }
    }

    const updatedTeam = await prisma.team.update({
      where: { id: params.id },
      data: {
        ...(name && { name }),
        ...(managerId !== undefined && { managerId: managerId || null })
      },
      include: {
        manager: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    return NextResponse.json({ team: updatedTeam });
  } catch (error) {
    console.error('Errore nell\'aggiornamento del team:', error);
    return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 });
  }
} 