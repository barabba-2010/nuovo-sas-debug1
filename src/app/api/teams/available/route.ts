import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../lib/auth';
import { prisma } from '../../../lib/prisma';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { message: 'Non autenticato' },
        { status: 401 }
      );
    }

    const userId = (session.user as any).id;
    
    if (!userId) {
      return NextResponse.json(
        { message: 'ID utente non trovato nella sessione' },
        { status: 400 }
      );
    }

    // Trova l'organizzazione dell'utente
    const userOrg = await prisma.userOrganization.findFirst({
      where: {
        userId: userId
      },
      include: {
        organization: true
      }
    });

    if (!userOrg) {
      return NextResponse.json(
        { message: 'Utente non associato a nessuna organizzazione' },
        { status: 404 }
      );
    }

    // Trova tutti i team dell'organizzazione
    const teams = await prisma.team.findMany({
      where: {
        organizationId: userOrg.organizationId
      },
      include: {
        manager: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    return NextResponse.json({ teams });
  } catch (error) {
    console.error('Errore nel recupero dei team:', error);
    return NextResponse.json(
      { message: 'Errore nel recupero dei team' },
      { status: 500 }
    );
  }
} 