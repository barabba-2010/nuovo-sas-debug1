import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';
import { prisma } from '@/app/lib/prisma';

// GET /api/admin/organizations/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    const organization = await prisma.organization.findUnique({
      where: { id: params.id },
      include: {
        teams: {
          include: {
            manager: {
              select: {
                id: true,
                name: true,
                email: true
              }
            },
            _count: {
              select: {
                members: true
              }
            }
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
            },
            team: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    });

    if (!organization) {
      return NextResponse.json({ error: 'Organizzazione non trovata' }, { status: 404 });
    }

    return NextResponse.json({ organization });
  } catch (error) {
    console.error('Errore nel recupero dell\'organizzazione:', error);
    return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 });
  }
}

// DELETE /api/admin/organizations/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    // Verifica che l'organizzazione non abbia membri
    const organization = await prisma.organization.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            members: true
          }
        }
      }
    });

    if (!organization) {
      return NextResponse.json({ error: 'Organizzazione non trovata' }, { status: 404 });
    }

    if (organization._count.members > 0) {
      return NextResponse.json({ 
        error: 'Non puoi eliminare un\'organizzazione con membri attivi' 
      }, { status: 400 });
    }

    // Elimina l'organizzazione (i team verranno eliminati automaticamente grazie alla cascade)
    await prisma.organization.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ message: 'Organizzazione eliminata con successo' });
  } catch (error) {
    console.error('Errore nell\'eliminazione dell\'organizzazione:', error);
    return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 });
  }
}

// PATCH /api/admin/organizations/[id]
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
    const { name, code } = body;

    // Verifica che il codice non sia già in uso
    if (code) {
      const existingOrg = await prisma.organization.findFirst({
        where: {
          code,
          NOT: { id: params.id }
        }
      });

      if (existingOrg) {
        return NextResponse.json({ 
          error: 'Il codice organizzazione è già in uso' 
        }, { status: 400 });
      }
    }

    const updatedOrganization = await prisma.organization.update({
      where: { id: params.id },
      data: {
        ...(name && { name }),
        ...(code && { code })
      }
    });

    return NextResponse.json({ organization: updatedOrganization });
  } catch (error) {
    console.error('Errore nell\'aggiornamento dell\'organizzazione:', error);
    return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 });
  }
} 