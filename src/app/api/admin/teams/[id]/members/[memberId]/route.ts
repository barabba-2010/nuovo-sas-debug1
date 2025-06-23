import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';
import { prisma } from '@/app/lib/prisma';

// DELETE /api/admin/teams/[id]/members/[memberId]
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; memberId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    // Verifica che il membro appartenga al team
    const membership = await prisma.userOrganization.findFirst({
      where: {
        id: params.memberId,
        teamId: params.id
      }
    });

    if (!membership) {
      return NextResponse.json({ error: 'Membro non trovato nel team' }, { status: 404 });
    }

    // Rimuovi il membro dal team (ma mantienilo nell'organizzazione)
    await prisma.userOrganization.update({
      where: { id: params.memberId },
      data: { teamId: null }
    });

    return NextResponse.json({ message: 'Membro rimosso dal team con successo' });
  } catch (error) {
    console.error('Errore nella rimozione del membro dal team:', error);
    return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 });
  }
} 