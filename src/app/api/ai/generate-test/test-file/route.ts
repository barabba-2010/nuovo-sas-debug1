import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';
import mammoth from 'mammoth';
import * as ExcelJS from 'exceljs';

/**
 * Estrae testo da file PDF
 */
async function extractPdfText(buffer: Buffer): Promise<string> {
  try {
    // Importiamo pdf-parse dinamicamente solo quando necessario
    const pdfParse = (await import('pdf-parse')).default;
    
    // Aggiunta opzione per eliminare spazi vuoti ed evitare errori di parsing
    const options = {
      // Non ignorare il tipo di carattere
      disableCombineTextItems: false,
      // Timeout per evitare blocchi
      max: 0
    };
    
    const data = await pdfParse(buffer, options);
    if (data && data.text && data.text.length > 0) {
      return data.text;
    }
    
    return "Nessun contenuto significativo estratto dal PDF";
  } catch (error) {
    return `Errore nell'elaborazione del PDF: ${error instanceof Error ? error.message : 'Errore sconosciuto'}`;
  }
}

/**
 * Estrae testo da file DOCX
 */
async function extractDocxText(buffer: Buffer): Promise<string> {
  try {
    const result = await mammoth.extractRawText({ buffer });
    return result.value || 'Nessun contenuto significativo estratto dal DOCX';
  } catch (error) {
    return `Errore nell'elaborazione del DOCX: ${error instanceof Error ? error.message : 'Errore sconosciuto'}`;
  }
}

/**
 * Estrae testo da file Excel (XLSX)
 */
async function extractExcelText(buffer: Buffer): Promise<string> {
  try {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer as any);
    let result = '';
    
    // Estrai testo da ogni foglio di lavoro
    workbook.worksheets.forEach((worksheet) => {
      const sheetName = worksheet.name;
      let sheetText = '';
      
      worksheet.eachRow((row, rowNumber) => {
        const rowData: string[] = [];
        row.eachCell((cell) => {
          rowData.push(cell.value?.toString() || '');
        });
        if (rowData.some(cell => cell.trim())) {
          sheetText += rowData.join(',') + '\n';
        }
      });
      
      if (sheetText.trim()) {
        result += `\n--- Foglio: ${sheetName} ---\n${sheetText}`;
      }
    });
    
    return result || 'Foglio di calcolo vuoto';
  } catch (error) {
    return `Errore nell'elaborazione del file Excel: ${error instanceof Error ? error.message : 'Errore sconosciuto'}`;
  }
}

/**
 * Test endpoint per verificare l'elaborazione dei file senza consumare crediti OpenAI
 * Accetta un file, lo elabora e restituisce il testo estratto
 */
export async function POST(request: NextRequest) {
  try {
    // Verifica autenticazione (solo admin)
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }
    
    // Verifica che l'utente sia admin
    if ((session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Accesso riservato agli amministratori' }, { status: 403 });
    }
    
    // Parsifica FormData
    const data = await request.formData();
    const file = data.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'File non trovato' }, { status: 400 });
    }
    
    // Log informazioni file
    console.log(`Test elaborazione file: nome="${file.name}", tipo="${file.type}", dimensione=${file.size}B`);
    
    // Ottieni il buffer del file
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    
    // Determina il tipo di file
    const fileName = file.name.toLowerCase();
    const fileType = file.type.toLowerCase();
    
    // Estrai il contenuto in base al tipo
    let fileContent = '';
    let processingType = '';
    
    if (fileType.includes('pdf') || fileName.endsWith('.pdf')) {
      console.log("Elaborazione file PDF...");
      processingType = 'pdf';
      fileContent = await extractPdfText(fileBuffer);
    } 
    else if (fileType.includes('word') || fileType.includes('docx') || 
             fileName.endsWith('.docx') || fileName.endsWith('.doc')) {
      console.log("Elaborazione file DOCX...");
      processingType = 'docx';
      fileContent = await extractDocxText(fileBuffer);
    } 
    else if (fileType.includes('excel') || fileType.includes('spreadsheet') || 
             fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
      console.log("Elaborazione file Excel...");
      processingType = 'excel';
      fileContent = await extractExcelText(fileBuffer);
    } 
    else {
      // Per file di testo generici
      console.log(`Elaborazione file di testo generico (tipo: ${fileType})...`);
      processingType = 'text';
      fileContent = Buffer.from(fileBuffer).toString('utf-8');
    }
    
    // Tronca il contenuto se troppo lungo per la risposta HTTP
    const MAX_RESPONSE_LENGTH = 10000;
    const truncatedContent = fileContent.length > MAX_RESPONSE_LENGTH
      ? fileContent.substring(0, MAX_RESPONSE_LENGTH) + `\n\n[...contenuto troncato, il documento completo è di ${fileContent.length} caratteri...]`
      : fileContent;
    
    // Restituisci il risultato
    return NextResponse.json({
      success: true,
      fileInfo: {
        name: file.name,
        type: file.type,
        size: file.size,
        processingType
      },
      contentLength: fileContent.length,
      contentSample: truncatedContent.substring(0, 500) + (fileContent.length > 500 ? '...' : ''),
      truncatedContent
    });
    
  } catch (error) {
    console.error('Errore test elaborazione file:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Errore sconosciuto'
    }, { status: 500 });
  }
} 