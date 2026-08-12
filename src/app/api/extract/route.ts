import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { GoogleAIFileManager } from '@google/generative-ai/server';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'GEMINI_API_KEY no está configurada' }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    let filePart: any;

    if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
      // Para PDFs, Gemini requiere usar la API de Archivos (Upload)
      const fileManager = new GoogleAIFileManager(apiKey);
      
      // Guardar temporalmente en Vercel /tmp
      const buffer = await file.arrayBuffer();
      const tempFilePath = join(tmpdir(), `${Date.now()}_${file.name}`);
      await writeFile(tempFilePath, Buffer.from(buffer));
      
      const uploadResult = await fileManager.uploadFile(tempFilePath, {
        mimeType: 'application/pdf',
        displayName: file.name,
      });

      filePart = {
        fileData: {
          fileUri: uploadResult.file.uri,
          mimeType: uploadResult.file.mimeType
        }
      };
    } else {
      // Para Imágenes, podemos usar inlineData
      const buffer = await file.arrayBuffer();
      const base64Data = Buffer.from(buffer).toString('base64');
      filePart = {
        inlineData: {
          data: base64Data,
          mimeType: file.type || 'image/jpeg'
        }
      };
    }

    const prompt = `
    Analiza este documento (puede ser una Guía de Despacho o un Documento de Entrega/Retiro DER de equipos TI).
    Extrae la siguiente información estructurada en JSON puro:
    {
      "userName": "Nombre de la persona a la que se entregan o retiran los equipos (o el remitente si es guía). Deja vacío si no aplica",
      "rut": "RUT de la persona si aparece, sino vacío",
      "items": [
        {
          "category": "Tipo de equipo (ej. LAPTOP, DESKTOP, PRINTER, etc.)",
          "brand": "Marca del equipo",
          "model": "Modelo del equipo",
          "serial": "Número de serie o IMEI"
        }
      ]
    }
    Si el documento es una guía de despacho, busca la tabla de detalle. En las guías, el número de serie a veces aparece debajo de la descripción del equipo (por ejemplo 'SPW0L89HT/'). Elimina los slash '/' al final de los números de serie.
    Devuelve estrictamente el JSON, sin formato markdown ni texto adicional.
    `;

    const result = await model.generateContent([prompt, filePart]);
    const responseText = result.response.text();
    
    // Limpiar markdown json tags if present
    const cleanedJson = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
    const data = JSON.parse(cleanedJson);

    return NextResponse.json(data);

  } catch (error: any) {
    console.error('Error in AI extraction:', error);
    return NextResponse.json({ 
      error: `Error procesando: ${error.message}` 
    }, { status: 500 });
  }
}
