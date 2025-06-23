import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../../lib/auth';
import { prisma } from '../../../../../lib/prisma';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { message: 'Non autorizzato' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, managerId } = body;

    if (!name) {
      return NextResponse.json(
        { message: 'Nome del team obbligatorio' },
        { status: 400 }
      );
    }

    // Verifica che l'organizzazione esista
    const organization = await prisma.organization.findUnique({
      where: { id: params.id }
    });

    if (!organization) {
      return NextResponse.json(
        { message: 'Organizzazione non trovata' },
        { status: 404 }
      );
    }

    // Se c'è un managerId, verifica che sia un manager dell'organizzazione
    if (managerId) {
      const manager = await prisma.userOrganization.findFirst({
        where: {
          userId: managerId,
          organizationId: params.id,
          user: {
            role: 'MANAGER'
          }
        }
      });

      if (!manager) {
        return NextResponse.json(
          { message: 'Manager non valido per questa organizzazione' },
          { status: 400 }
        );
      }
    }

    // Crea il team
    const team = await prisma.team.create({
      data: {
        name,
        organizationId: params.id,
        managerId: managerId || undefined
      }
    });

    return NextResponse.json({ team }, { status: 201 });
  } catch (error) {
    console.error('Errore nella creazione del team:', error);
    return NextResponse.json(
      { message: 'Errore nella creazione del team' },
      { status: 500 }
    );
  }
} 