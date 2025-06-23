import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../../lib/auth';
import { prisma } from '../../../../../lib/prisma';

export async function PATCH(
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
    const { role } = body;

    if (!role || !['EMPLOYEE', 'MANAGER', 'ADMIN'].includes(role)) {
      return NextResponse.json(
        { message: 'Ruolo non valido' },
        { status: 400 }
      );
    }

    // Aggiorna il ruolo dell'utente
    const user = await prisma.user.update({
      where: { id: params.id },
      data: { role }
    });

    return NextResponse.json({ 
      user,
      message: `Utente promosso a ${role} con successo` 
    });
  } catch (error) {
    console.error('Errore nella promozione dell\'utente:', error);
    return NextResponse.json(
      { message: 'Errore nella promozione dell\'utente' },
      { status: 500 }
    );
  }
} 