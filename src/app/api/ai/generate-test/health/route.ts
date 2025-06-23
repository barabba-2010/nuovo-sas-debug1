import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

/**
 * API Health Check per il generatore di test
 * Verifica che tutte le dipendenze necessarie per il generatore siano disponibili e funzionanti
 */
export async function GET() {
  try {
    // Verifica che le dipendenze per il parsing dei documenti siano caricate correttamente
    let pdfParseStatus = 'not_loaded';
    let mammothStatus = 'not_loaded';
    let exceljsStatus = 'not_loaded';
    let openaiStatus = 'not_configured';
    
    try {
      // Test dynamic import for pdf-parse
      const pdfParse = await import('pdf-parse');
      pdfParseStatus = 'loaded';
    } catch (pdfError) {
      console.error('PDF Module not available:', pdfError);
      pdfParseStatus = `error: ${pdfError instanceof Error ? pdfError.message : 'Unknown error'}`;
    }
    
    try {
      // Test import for mammoth
      const mammoth = await import('mammoth');
      mammothStatus = 'loaded';
    } catch (mammothError) {
      console.error('Mammoth Module not available:', mammothError);
      mammothStatus = `error: ${mammothError instanceof Error ? mammothError.message : 'Unknown error'}`;
    }
    
    try {
      // Test import for exceljs
      const exceljs = await import('exceljs');
      exceljsStatus = 'loaded';
    } catch (exceljsError) {
      console.error('ExcelJS Module not available:', exceljsError);
      exceljsStatus = `error: ${exceljsError instanceof Error ? exceljsError.message : 'Unknown error'}`;
    }
    
    // Verifica OpenAI API key
    if (process.env.OPENAI_API_KEY) {
      openaiStatus = 'configured';
    }
    
    // Verifica accesso al database
    let dbStatus = 'not_connected';
    try {
      // Tenta un semplice query per verificare la connessione
      await prisma.$queryRaw`SELECT 1`;
      dbStatus = 'connected';
    } catch (dbError) {
      console.error('Database connection error:', dbError);
      dbStatus = `error: ${dbError instanceof Error ? dbError.message : 'Unknown error'}`;
    }

    return NextResponse.json({
      status: "ok",
      message: "API di generazione test - health check",
      apiVersion: "1.1",
      modules: {
        pdfParse: pdfParseStatus,
        mammoth: mammothStatus,
        exceljs: exceljsStatus
      },
      dependencies: {
        openai: openaiStatus,
        database: dbStatus
      },
      supportedFormats: ["pdf", "docx", "xlsx", "xls"]
    });
  } catch (error) {
    return NextResponse.json({
      status: "error",
      message: "Errore nel controllo dello stato dell'API",
      error: error instanceof Error ? error.message : 'Errore sconosciuto'
    }, { status: 500 });
  }
} 