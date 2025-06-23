import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';
import { prisma } from '@/app/lib/prisma';

// DELETE /api/admin/organizations/[id]/members/[memberId]
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; memberId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    // Verifica che il membro appartenga all'organizzazione
    const membership = await prisma.userOrganization.findFirst({
      where: {
        id: params.memberId,
        organizationId: params.id
      }
    });

    if (!membership) {
      return NextResponse.json({ error: 'Membro non trovato' }, { status: 404 });
    }

    // Rimuovi il membro dall'organizzazione
    await prisma.userOrganization.delete({
      where: { id: params.memberId }
    });

    return NextResponse.json({ message: 'Membro rimosso con successo' });
  } catch (error) {
    console.error('Errore nella rimozione del membro:', error);
    return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 });
  }
} 