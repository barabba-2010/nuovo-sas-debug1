import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../lib/auth';
import { prisma } from '../../../lib/prisma';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { message: 'Non autorizzato' },
        { status: 403 }
      );
    }

    const organizations = await prisma.organization.findMany({
      include: {
        _count: {
          select: {
            teams: true,
            members: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({ organizations });
  } catch (error) {
    console.error('Errore nel recupero delle organizzazioni:', error);
    return NextResponse.json(
      { message: 'Errore nel recupero delle organizzazioni' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { message: 'Non autorizzato' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, code } = body;

    if (!name || !code) {
      return NextResponse.json(
        { message: 'Nome e codice sono obbligatori' },
        { status: 400 }
      );
    }

    // Verifica che il codice non sia già in uso
    const existingOrg = await prisma.organization.findUnique({
      where: { code }
    });

    if (existingOrg) {
      return NextResponse.json(
        { message: 'Codice già in uso' },
        { status: 409 }
      );
    }

    // Crea l'organizzazione
    const organization = await prisma.organization.create({
      data: {
        name,
        code
      }
    });

    return NextResponse.json({ organization }, { status: 201 });
  } catch (error) {
    console.error('Errore nella creazione dell\'organizzazione:', error);
    return NextResponse.json(
      { message: 'Errore nella creazione dell\'organizzazione' },
      { status: 500 }
    );
  }
} 