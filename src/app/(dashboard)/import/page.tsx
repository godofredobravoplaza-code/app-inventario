'use client'

import { useState } from 'react'
import { FileUp, FileText, Brain, UploadCloud, FileSpreadsheet, Loader2, CheckCircle2 } from 'lucide-react'

export default function ImportPage() {
  const [activeTab, setActiveTab] = useState<'excel' | 'ai'>('excel')
  const [file, setFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [result, setResult] = useState<any>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0])
      setResult(null)
    }
  }

  const handleProcessExcel = async () => {
    if (!file) return
    setIsProcessing(true)
    
    try {
      const reader = new FileReader()
      reader.onload = async (e) => {
        const data = e.target?.result
        // Here we'll dynamically load xlsx to avoid huge client bundle
        const XLSX = await import('xlsx')
        const workbook = XLSX.read(data, { type: 'array' })
        
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
        const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 })
        
        // Basic mapping logic for DER template
        const extracted = {
          userName: '',
          rut: '',
          items: [] as any[]
        }
        
        // Find user name and rut based on typical positions or text search
        for (let r = 0; r < jsonData.length; r++) {
          const row: any = jsonData[r]
          if (!row) continue;
          
          for (let c = 0; c < row.length; c++) {
            const cell = String(row[c] || '').toLowerCase()
            if (cell.includes('nombre usuario') && c + 1 < row.length) {
              extracted.userName = row[c+1]
            }
            if (cell.includes('rut') && c + 1 < row.length) {
              extracted.rut = row[c+1]
            }
            // If it's a table row for equipment
            if (cell === 'laptop' || cell === 'desktop') {
              extracted.items.push({
                type: row[c],
                brand: row[c+1] || '',
                model: row[c+2] || '',
                serial: row[c+3] || ''
              })
            }
          }
        }
        
        setResult(extracted)
        setIsProcessing(false)
      }
      reader.readAsArrayBuffer(file)
    } catch (err) {
      console.error(err)
      setIsProcessing(false)
    }
  }

  const handleProcessAI = async () => {
    if (!file) return
    setIsProcessing(true)

    try {
      const formData = new FormData()
      formData.append('file', file)
      
      const res = await fetch('/api/extract', {
        method: 'POST',
        body: formData
      })
      
      if (!res.ok) throw new Error('Error processing document')
      const data = await res.json()
      setResult(data)
    } catch (err) {
      console.error(err)
      alert("Hubo un error procesando el archivo con IA.")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleSaveToDrafts = async () => {
    // Implement save logic to supabase der_records as DRAFT
    alert("Borrador guardado! (Lógica en construcción)")
  }

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white mb-2">Importación Histórica</h1>
        <p className="text-slate-400">Carga documentos pasados para poblar el inventario automáticamente.</p>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-slate-900/50 p-1 rounded-xl border border-slate-800 w-fit">
        <button 
          onClick={() => { setActiveTab('excel'); setFile(null); setResult(null); }}
          className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'excel' ? 'bg-indigo-500/20 text-indigo-400' : 'text-slate-400 hover:text-white'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4 mr-2" />
          Plantilla Excel
        </button>
        <button 
          onClick={() => { setActiveTab('ai'); setFile(null); setResult(null); }}
          className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'ai' ? 'bg-indigo-500/20 text-indigo-400' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Brain className="w-4 h-4 mr-2" />
          Extracción IA (PDF/Fotos)
        </button>
      </div>

      {/* Main Area */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8">
        
        <div className="border-2 border-dashed border-slate-700 rounded-xl p-10 flex flex-col items-center justify-center text-center">
          <UploadCloud className="w-12 h-12 text-slate-500 mb-4" />
          <h3 className="text-lg font-medium text-white mb-1">
            {activeTab === 'excel' ? 'Sube tu archivo Excel (.xlsx)' : 'Sube tu PDF o Foto (Guía / DER)'}
          </h3>
          <p className="text-sm text-slate-400 mb-6">
            Arrastra el archivo aquí o haz clic para seleccionar
          </p>
          <input 
            type="file" 
            id="file-upload" 
            className="hidden" 
            accept={activeTab === 'excel' ? '.xlsx,.xls' : '.pdf,image/*'}
            onChange={handleFileChange}
          />
          <label 
            htmlFor="file-upload" 
            className="bg-slate-800 hover:bg-slate-700 text-white px-6 py-2 rounded-lg cursor-pointer transition-colors border border-slate-700"
          >
            Seleccionar archivo
          </label>
          
          {file && (
            <div className="mt-6 flex items-center text-emerald-400 bg-emerald-400/10 px-4 py-2 rounded-lg">
              <FileText className="w-4 h-4 mr-2" />
              <span className="text-sm font-medium">{file.name}</span>
            </div>
          )}
        </div>

        {file && !result && (
          <div className="mt-8 flex justify-end">
            <button
              onClick={activeTab === 'excel' ? handleProcessExcel : handleProcessAI}
              disabled={isProcessing}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-6 py-3 rounded-lg font-medium flex items-center transition-colors"
            >
              {isProcessing ? (
                <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Procesando...</>
              ) : (
                <><Brain className="w-5 h-5 mr-2" /> {activeTab === 'excel' ? 'Leer Excel' : 'Extraer con IA'}</>
              )}
            </button>
          </div>
        )}

        {/* Results Preview */}
        {result && (
          <div className="mt-8 border-t border-slate-800 pt-8 animate-in fade-in slide-in-from-bottom-4">
            <h3 className="text-lg font-medium text-white mb-4 flex items-center">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 mr-2" />
              Datos Extraídos
            </h3>
            
            <div className="bg-slate-950 rounded-xl p-6 border border-slate-800 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-500 uppercase font-bold tracking-wider">Usuario / Asignado a</label>
                  <p className="text-white font-medium">{result.userName || 'No encontrado'}</p>
                </div>
                <div>
                  <label className="text-xs text-slate-500 uppercase font-bold tracking-wider">RUT</label>
                  <p className="text-white font-medium">{result.rut || 'No encontrado'}</p>
                </div>
              </div>
              
              <div>
                <label className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-3 block">Equipos Encontrados</label>
                {result.items && result.items.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="text-xs text-slate-400 bg-slate-900/50">
                        <tr>
                          <th className="px-4 py-2 rounded-tl-lg">Tipo</th>
                          <th className="px-4 py-2">Marca</th>
                          <th className="px-4 py-2">Modelo</th>
                          <th className="px-4 py-2 rounded-tr-lg">Serie / IMEI</th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.items.map((item: any, i: number) => (
                          <tr key={i} className="border-b border-slate-800/50">
                            <td className="px-4 py-3 text-slate-300">{item.type || item.category}</td>
                            <td className="px-4 py-3 text-white font-medium">{item.brand}</td>
                            <td className="px-4 py-3 text-slate-300">{item.model}</td>
                            <td className="px-4 py-3 text-emerald-400 font-mono">{item.serial}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-slate-400 text-sm">No se encontraron equipos en este documento.</p>
                )}
              </div>
            </div>
            
            <div className="mt-6 flex justify-end space-x-4">
              <button
                onClick={() => setResult(null)}
                className="px-6 py-2 rounded-lg text-slate-400 hover:text-white transition-colors"
              >
                Descartar
              </button>
              <button
                onClick={handleSaveToDrafts}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
              >
                Guardar en Borradores
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
