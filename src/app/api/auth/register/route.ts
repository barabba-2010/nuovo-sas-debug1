import { NextResponse } from 'next/server';
import bcryptjs from 'bcryptjs';
import { prisma } from '../../../lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log('Registrazione - richiesta ricevuta:', { 
      name: body.name, 
      email: body.email, 
      organizationCode: body.organizationCode,
      hasPassword: !!body.password 
    });
    
    const { name, email, password, organizationCode } = body;

    // Validate required fields
    if (!name || !email || !password || !organizationCode) {
      console.log('Registrazione - validazione fallita: campi mancanti');
      return NextResponse.json(
        { message: 'Nome, email, password e codice azienda sono obbligatori' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.log('Registrazione - validazione fallita: formato email non valido');
      return NextResponse.json(
        { message: 'Formato email non valido' },
        { status: 400 }
      );
    }

    // Validate password length
    if (password.length < 8) {
      console.log('Registrazione - validazione fallita: password troppo corta');
      return NextResponse.json(
        { message: 'La password deve essere di almeno 8 caratteri' },
        { status: 400 }
      );
    }

    // Check if organization exists
    console.log('Registrazione - verifica codice azienda');
    const organization = await prisma.organization.findUnique({
      where: { code: organizationCode },
    });

    if (!organization) {
      console.log('Registrazione - codice azienda non valido');
      return NextResponse.json(
        { message: 'Codice azienda non valido' },
        { status: 404 }
      );
    }

    // Check if user with email already exists
    console.log('Registrazione - verifica se l\'utente esiste già');
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      console.log('Registrazione - utente già registrato con questa email');
      return NextResponse.json(
        { message: 'Email già registrata' },
        { status: 409 }
      );
    }

    // Hash the password
    console.log('Registrazione - hashing della password');
    const hashedPassword = await bcryptjs.hash(password, 10);

    // Create the user in the database with organization membership
    console.log('Registrazione - creazione utente nel database');
    try {
      const user = await prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role: 'EMPLOYEE',
          organizationMemberships: {
            create: {
              organizationId: organization.id
            }
          }
        },
        include: {
          organizationMemberships: {
            include: {
              organization: true
            }
          }
        }
      });

      // Return a success response with user data (except password)
      const { password: _, ...userData } = user;
      
      console.log('Registrazione - utente registrato con successo:', { 
        id: userData.id, 
        email: userData.email,
        organizationId: organization.id 
      });
      
      return NextResponse.json(
        { 
          message: 'Utente registrato con successo',
          user: userData,
          organizationId: organization.id
        },
        { status: 201 }
      );
    } catch (dbError: any) {
      console.error('Registrazione - errore durante la creazione nel DB:', dbError);
      
      // Controlla se è un errore di violazione di vincolo unico (email duplicata)
      if (dbError.code === 'P2002' && dbError.meta?.target?.includes('email')) {
        return NextResponse.json(
          { message: 'Email già registrata' },
          { status: 409 }
        );
      }
      
      throw dbError; // Rilancia l'errore per essere gestito nel blocco catch generale
    }
  } catch (error: any) {
    console.error('Registrazione - errore globale:', error);
    
    // Fornisci messaggi di errore più dettagliati per il debug
    const errorMessage = error.message || 'Si è verificato un errore durante la registrazione';
    
    return NextResponse.json(
      { 
        message: 'Si è verificato un errore durante la registrazione',
        error: errorMessage,
        stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
} 