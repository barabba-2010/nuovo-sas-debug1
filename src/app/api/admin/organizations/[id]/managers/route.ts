import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../../lib/auth';
import { prisma } from '../../../../../lib/prisma';
import bcryptjs from 'bcryptjs';

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
    const { name, email, password, organizationCode } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { message: 'Nome, email e password sono obbligatori' },
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

    // Verifica che l'email non sia già registrata
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json(
        { message: 'Email già registrata' },
        { status: 409 }
      );
    }

    // Hash della password
    const hashedPassword = await bcryptjs.hash(password, 10);

    // Crea il manager con associazione all'organizzazione
    const manager = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: 'MANAGER',
        organizationMemberships: {
          create: {
            organizationId: params.id
          }
        }
      },
      include: {
        organizationMemberships: true
      }
    });

    // Rimuovi la password dalla risposta
    const { password: _, ...managerData } = manager;

    return NextResponse.json({ 
      manager: managerData,
      message: 'Manager creato con successo' 
    }, { status: 201 });
  } catch (error) {
    console.error('Errore nella creazione del manager:', error);
    return NextResponse.json(
      { message: 'Errore nella creazione del manager' },
      { status: 500 }
    );
  }
} 