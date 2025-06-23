import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, isAdmin } from '../../../lib/auth';
import { prisma } from '../../../lib/prisma';

// Helper to add TypeScript type for our test
interface TestWithCreator {
  id: string;
  title: string;
  description: string;
  instructions: string;
  category: string;
  type: string;
  questions: string;
  createdAt: Date;
  updatedAt: Date;
  creatorId: string;
  isActive: boolean;
  timeLimit: number;
  scoring?: string;
  metadata?: string;
}

// GET /api/tests/[id] - Get a test by ID
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const params = await context.params;
    const testId = params.id;
    
    if (!testId) {
      return NextResponse.json(
        { error: 'ID test mancante' },
        { status: 400 }
      );
    }
    
    // Se l'utente non è admin, mostra solo test attivi
    let test;
    if ((session?.user as any)?.role !== 'ADMIN') {
      test = await prisma.test.findFirst({
        where: { 
          id: testId,
          isActive: true
        }
      });
    } else {
      test = await prisma.test.findUnique({
        where: { id: testId }
      });
    }
    
    if (!test) {
      return NextResponse.json(
        { error: 'Test non trovato' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(test);
  } catch (error) {
    console.error('Errore nel recupero del test:', error);
    return NextResponse.json(
      { error: 'Errore nel recupero del test', details: error instanceof Error ? error.message : 'Errore sconosciuto' },
      { status: 500 }
    );
  }
}

// PUT /api/tests/[id] - Update a test
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const params = await context.params;
    const testId = params.id;
    
    // Only authenticated users can update tests
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Get the test to check permissions
    const existingTest = await prisma.test.findUnique({
      where: { id: testId }
    }) as unknown as TestWithCreator;
    
    if (!existingTest) {
      return NextResponse.json(
        { error: 'Test not found' },
        { status: 404 }
      );
    }
    
    // Check if user is authorized to update this test
    const userIsAdmin = (session.user as any).role === 'ADMIN';
    
    // In our updated schema, we need to check if the user is the creator
    const isCreator = existingTest.creatorId === (session.user as any).id;
    
    if (!userIsAdmin && !isCreator) {
      return NextResponse.json(
        { error: 'You are not authorized to update this test' },
        { status: 403 }
      );
    }
    
    // Regular users cannot publish tests
    const data = await request.json();
    if (data.isActive !== undefined && !userIsAdmin) {
      return NextResponse.json(
        { error: 'Only administrators can change test status' },
        { status: 403 }
      );
    }
    
    // Parse questions JSON if provided
    let questionsJSON = undefined;
    if (data.questions) {
      try {
        questionsJSON = JSON.stringify(data.questions);
      } catch (e) {
        return NextResponse.json(
          { error: 'Invalid questions format' },
          { status: 400 }
        );
      }
    }
    
    // Update test
    const updateData: any = {
      title: data.title || existingTest.title,
      description: data.description || existingTest.description,
      instructions: data.instructions || existingTest.instructions,
      category: data.category || existingTest.category,
      updatedAt: new Date()
    };
    
    // Only add these fields if they are provided
    if (questionsJSON) updateData.questions = questionsJSON;
    if (userIsAdmin && data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.timeLimit !== undefined) updateData.timeLimit = data.timeLimit;
    if (data.scoring) {
      try {
        updateData.scoring = JSON.stringify(data.scoring);
      } catch (e) {
        return NextResponse.json(
          { error: 'Invalid scoring format' },
          { status: 400 }
        );
      }
    }
    if (data.metadata) {
      try {
        updateData.metadata = JSON.stringify(data.metadata);
      } catch (e) {
        return NextResponse.json(
          { error: 'Invalid metadata format' },
          { status: 400 }
        );
      }
    }
    
    const updatedTest = await prisma.test.update({
      where: { id: testId },
      data: updateData
    });
    
    return NextResponse.json(updatedTest);
    
  } catch (error) {
    console.error('Error updating test:', error);
    return NextResponse.json(
      { error: 'Failed to update test', details: error instanceof Error ? error.message : 'Errore sconosciuto' },
      { status: 500 }
    );
  }
}

// PATCH: Aggiorna uno specifico test (ad es. attivazione/disattivazione)
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Controlla se l'utente è autenticato e ha i permessi
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Non autorizzato' },
        { status: 401 }
      );
    }
    
    // Solo gli admin possono modificare i test
    if ((session.user as any).role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Permessi insufficienti' },
        { status: 403 }
      );
    }
    
    const params = await context.params;
    const testId = params.id;
    
    if (!testId) {
      return NextResponse.json(
        { error: 'ID test mancante' },
        { status: 400 }
      );
    }
    
    // Ottieni i dati inviati nel body
    const data = await request.json();
    
    // Controlla che il test esista
    const existingTest = await prisma.test.findUnique({
      where: { id: testId }
    });
    
    if (!existingTest) {
      return NextResponse.json(
        { error: 'Test non trovato' },
        { status: 404 }
      );
    }
    
    // Dati di aggiornamento
    const updateData: any = {
      updatedAt: new Date()
    };
    
    // Aggiungi solo i campi forniti
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.title) updateData.title = data.title;
    if (data.description) updateData.description = data.description;
    if (data.instructions) updateData.instructions = data.instructions;
    if (data.timeLimit !== undefined) updateData.timeLimit = data.timeLimit;
    
    // Aggiorna il test
    const updatedTest = await prisma.test.update({
      where: { id: testId },
      data: updateData
    });
    
    return NextResponse.json({
      success: true,
      test: updatedTest
    });
  } catch (error) {
    console.error('Errore nell\'aggiornamento del test:', error);
    return NextResponse.json(
      { error: 'Errore nell\'aggiornamento del test', details: error instanceof Error ? error.message : 'Errore sconosciuto' },
      { status: 500 }
    );
  }
}

// DELETE: Elimina completamente un test e tutti i risultati associati
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Controlla se l'utente è autenticato e ha i permessi
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Non autorizzato' },
        { status: 401 }
      );
    }
    
    // Solo gli admin possono eliminare i test
    if ((session.user as any).role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Permessi insufficienti' },
        { status: 403 }
      );
    }
    
    const params = await context.params;
    const testId = params.id;
    
    if (!testId) {
      return NextResponse.json(
        { error: 'ID test mancante' },
        { status: 400 }
      );
    }
    
    // Controlla che il test esista
    const existingTest = await prisma.test.findUnique({
      where: { id: testId }
    });
    
    if (!existingTest) {
      return NextResponse.json(
        { error: 'Test non trovato' },
        { status: 404 }
      );
    }
    
    // Elimina il test (cascading delete è configurato nello schema Prisma)
    // Questo eliminerà anche tutti i TestResult e Report associati
    const deletedTest = await prisma.test.delete({
      where: { id: testId }
    });
    
    return NextResponse.json({
      success: true,
      message: 'Test eliminato definitivamente con successo'
    });
  } catch (error) {
    console.error('Errore nell\'eliminazione del test:', error);
    return NextResponse.json(
      { error: 'Errore nell\'eliminazione del test', details: error instanceof Error ? error.message : 'Errore sconosciuto' },
      { status: 500 }
    );
  }
} 