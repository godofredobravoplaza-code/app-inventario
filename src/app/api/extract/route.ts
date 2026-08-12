import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'GEMINI_API_KEY not configured in .env.local' }, { status: 500 });
    }

    // Convert file to base64
    const buffer = await file.arrayBuffer();
    const base64Data = Buffer.from(buffer).toString('base64');

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

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

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Data,
          mimeType: file.type
        }
      }
    ]);

    const responseText = result.response.text();
    // Limpiar markdown json tags if present
    const cleanedJson = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
    
    const data = JSON.parse(cleanedJson);

    return NextResponse.json(data);

  } catch (error: any) {
    console.error('Error in AI extraction:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
