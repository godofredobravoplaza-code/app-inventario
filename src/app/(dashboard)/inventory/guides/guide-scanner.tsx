'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { ModelCatalogItem, EquipmentCategory, EquipmentStatus } from '@/lib/supabase/types'
import { Camera, Save, Plus, AlertCircle, X, Check, ScanLine } from 'lucide-react'

// Para evitar problemas de SSR con Html5QrcodeScanner
import { Html5QrcodeScanner } from 'html5-qrcode'

interface GuideScannerProps {
  initialCatalog: ModelCatalogItem[]
}

export default function GuideScanner({ initialCatalog }: GuideScannerProps) {
  const router = useRouter()
  const supabase = createClient()
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Catalog State
  const [catalog, setCatalog] = useState<ModelCatalogItem[]>(initialCatalog)
  const [showNewModelInput, setShowNewModelInput] = useState(false)
  const [newBrand, setNewBrand] = useState('')
  const [newModelName, setNewModelName] = useState('')
  const [addingModel, setAddingModel] = useState(false)

  // Guide State
  const [guideNumber, setGuideNumber] = useState('')
  const [provider, setProvider] = useState('')
  const [receptionDate, setReceptionDate] = useState(new Date().toISOString().split('T')[0])

  // Equipment Master Specs
  const [category, setCategory] = useState<EquipmentCategory>('LAPTOP')
  const [brand, setBrand] = useState('')
  const [model, setModel] = useState('')
  const [ram, setRam] = useState<string>('')
  const [storage, setStorage] = useState<string>('')

  // Scanning State
  const [scannedSerials, setScannedSerials] = useState<string[]>([])
  const [isScanning, setIsScanning] = useState(false)
  
  // Ref for scanner
  const scannerRef = useRef<Html5QrcodeScanner | null>(null)

  // Derived Catalog
  const availableBrands = useMemo(() => {
    const items = catalog.filter(c => c.category === category)
    return Array.from(new Set(items.map(i => i.brand))).sort()
  }, [catalog, category])

  const availableModels = useMemo(() => {
    const items = catalog.filter(c => c.category === category && c.brand === brand)
    return Array.from(new Set(items.map(i => i.model))).sort()
  }, [catalog, category, brand])

  const handleAddNewModel = async () => {
    if (!newBrand || !newModelName) return
    setAddingModel(true)
    setError(null)

    const { data, error: insertError } = await supabase
      .from('models_catalog')
      .insert({ category, brand: newBrand.trim(), model: newModelName.trim() })
      .select()
      .single()

    if (insertError) {
      setError(`Error DB: ${insertError.message}`)
    } else if (data) {
      setCatalog([...catalog, data as ModelCatalogItem])
      setBrand(data.brand)
      setModel(data.model)
      setShowNewModelInput(false)
      setNewBrand('')
      setNewModelName('')
    }
    setAddingModel(false)
  }

  // Barcode Scanner Logic
  useEffect(() => {
    if (isScanning && !scannerRef.current) {
      const scanner = new Html5QrcodeScanner(
        "reader",
        { fps: 10, qrbox: { width: 250, height: 100 }, rememberLastUsedCamera: true },
        /* verbose= */ false
      )

      scanner.render(
        (decodedText) => {
          // Success callback
          const cleanText = decodedText.trim()
          setScannedSerials(prev => {
            if (!prev.includes(cleanText)) {
              // Play a beep sound using web audio api
              try {
                const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
                const osc = ctx.createOscillator()
                osc.connect(ctx.destination)
                osc.frequency.value = 800
                osc.start()
                osc.stop(ctx.currentTime + 0.1)
              } catch(e) {}
              return [cleanText, ...prev]
            }
            return prev
          })
        },
        (error) => {
          // Error callback (ignored for noise)
        }
      )
      scannerRef.current = scanner
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error)
        scannerRef.current = null
      }
    }
  }, [isScanning])

  const handleStopScanning = () => {
    setIsScanning(false)
  }

  const handleRemoveSerial = (serial: string) => {
    setScannedSerials(prev => prev.filter(s => s !== serial))
  }

  const handleSaveBulk = async () => {
    if (!guideNumber || !provider || !brand || !model || scannedSerials.length === 0) {
      setError("Faltan campos obligatorios o no hay series escaneadas.")
      return
    }

    setLoading(true)
    setError(null)
    setSuccess(null)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setError('No estás autenticado.')
      setLoading(false)
      return
    }

    // Build insert array
    const recordsToInsert = scannedSerials.map(serial => ({
      serial_number: serial,
      category,
      brand,
      model,
      ram_gb: ram ? parseInt(ram, 10) : null,
      storage_gb: storage ? parseInt(storage, 10) : null,
      status: 'EN_BODEGA' as EquipmentStatus,
      reception_date: receptionDate,
      months_in_operation: 0,
      manual_months_offset: 0,
      created_by: user.id,
      // Usaremos un campo para almacenar la guía temporalmente si es necesario, 
      // o se asume implícito por la fecha y serie. Por ahora lo guardamos en notas/auditoria.
    }))

    const { data: insertedItems, error: insertError } = await supabase
      .from('inventory')
      .insert(recordsToInsert)
      .select()

    if (insertError) {
      setError(`Error guardando equipos: ${insertError.message}`)
      setLoading(false)
      return
    }

    // Create bulk audit logs
    if (insertedItems) {
      const auditLogs = insertedItems.map(item => ({
        equipment_id: item.id,
        performed_by: user.id,
        action_type: 'EQUIPMENT_CREATED',
        new_data: { ...item, guide_number: guideNumber, provider }
      }))
      await supabase.from('audit_logs').insert(auditLogs)
    }

    setSuccess(`¡Éxito! Se ingresaron ${scannedSerials.length} equipos bajo la guía ${guideNumber}.`)
    setScannedSerials([])
    setGuideNumber('')
    setIsScanning(false)
    setLoading(false)
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      
      {/* Columna Izquierda: Configuración de la Guía */}
      <div className="space-y-6">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-6">
          
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 p-4 rounded-lg flex items-center gap-3 text-red-400">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )}
          {success && (
            <div className="bg-emerald-500/10 border border-emerald-500/50 p-4 rounded-lg flex items-center gap-3 text-emerald-400">
              <Check className="w-5 h-5 shrink-0" />
              <p className="text-sm">{success}</p>
            </div>
          )}

          <div>
            <h3 className="text-lg font-medium text-white mb-4 border-b border-slate-800 pb-2">1. Datos de la Guía</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">N° de Guía *</label>
                <input 
                  type="text" 
                  value={guideNumber}
                  onChange={e => setGuideNumber(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="Ej: 242662"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Proveedor *</label>
                <input 
                  type="text" 
                  value={provider}
                  onChange={e => setProvider(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="Ej: Sonda S.A."
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-slate-300 mb-1">Fecha de Recepción *</label>
                <input 
                  type="date" 
                  value={receptionDate}
                  onChange={e => setReceptionDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-end border-b border-slate-800 pb-2 mb-4">
              <h3 className="text-lg font-medium text-white">2. Equipos a Ingresar</h3>
              <button 
                type="button"
                onClick={() => setShowNewModelInput(!showNewModelInput)}
                className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                {showNewModelInput ? 'Ocultar Creador' : 'Crear Nueva Marca/Modelo'}
              </button>
            </div>
            
            {showNewModelInput && (
              <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-lg p-4 mb-6">
                <h4 className="text-sm font-medium text-indigo-300 mb-3">Agregar al Catálogo Maestro</h4>
                <div className="flex flex-col sm:flex-row gap-3">
                  <input 
                    type="text" 
                    value={newBrand}
                    onChange={e => setNewBrand(e.target.value)}
                    placeholder="Nueva Marca"
                    className="flex-1 bg-slate-950 border border-indigo-500/30 rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                  <input 
                    type="text" 
                    value={newModelName}
                    onChange={e => setNewModelName(e.target.value)}
                    placeholder="Nuevo Modelo"
                    className="flex-1 bg-slate-950 border border-indigo-500/30 rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddNewModel}
                    disabled={addingModel || !newBrand || !newModelName}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                  >
                    {addingModel ? 'Guardando...' : 'Guardar al Catálogo'}
                  </button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-slate-300 mb-1">Categoría *</label>
                <select 
                  value={category}
                  onChange={e => { setCategory(e.target.value as EquipmentCategory); setBrand(''); setModel(''); }}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="LAPTOP">Laptop</option>
                  <option value="DESKTOP">Desktop</option>
                  <option value="TABLET">Tablet</option>
                  {/* ...otros */}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Marca *</label>
                <select 
                  value={brand}
                  onChange={e => { setBrand(e.target.value); setModel(''); }}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="">-- Seleccionar --</option>
                  {availableBrands.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Modelo *</label>
                <select 
                  value={model}
                  onChange={e => setModel(e.target.value)}
                  disabled={!brand}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-indigo-500 outline-none disabled:opacity-50"
                >
                  <option value="">-- Seleccionar --</option>
                  {availableModels.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">RAM (GB)</label>
                <input 
                  type="number" 
                  value={ram}
                  onChange={e => setRam(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Disco (GB)</label>
                <input 
                  type="number" 
                  value={storage}
                  onChange={e => setStorage(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
            </div>
            
            <div className="bg-emerald-500/10 border border-emerald-500/30 p-3 rounded-lg">
              <p className="text-xs text-emerald-400">
                Al guardar, todos los equipos escaneados quedarán registrados con estos datos maestros, <strong>0 meses de uso</strong> y estado <strong>En Bodega</strong>.
              </p>
            </div>
          </div>

        </div>
      </div>

      {/* Columna Derecha: Escáner y Lista */}
      <div className="space-y-6">
        
        {/* Lector */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-white flex items-center gap-2">
              <ScanLine className="w-5 h-5 text-indigo-400" />
              Escáner de Recepción
            </h3>
            {!isScanning ? (
              <button
                onClick={() => setIsScanning(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
              >
                <Camera className="w-4 h-4" />
                Iniciar Cámara
              </button>
            ) : (
              <button
                onClick={handleStopScanning}
                className="bg-red-500/20 text-red-400 hover:bg-red-500/30 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Detener
              </button>
            )}
          </div>

          {/* Ingreso Manual (Fallback) */}
          <div className="mb-4 bg-slate-950 p-3 rounded-lg border border-slate-800">
            <label className="block text-xs font-medium text-slate-400 mb-1">Ingreso Manual (si no tienes código de barras)</label>
            <div className="flex gap-2">
              <input 
                type="text"
                id="manualSerial"
                placeholder="Ej: TEST-SERIAL-123"
                className="flex-1 bg-slate-900 border border-slate-700 rounded px-3 py-1.5 text-sm text-white focus:ring-1 focus:ring-indigo-500 outline-none"
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    const val = e.currentTarget.value.trim();
                    if (val && !scannedSerials.includes(val)) {
                      setScannedSerials(prev => [val, ...prev]);
                      e.currentTarget.value = '';
                    }
                  }
                }}
              />
              <button 
                type="button"
                onClick={() => {
                  const el = document.getElementById('manualSerial') as HTMLInputElement;
                  const val = el.value.trim();
                  if (val && !scannedSerials.includes(val)) {
                    setScannedSerials(prev => [val, ...prev]);
                    el.value = '';
                  }
                }}
                className="bg-slate-800 hover:bg-slate-700 text-white px-3 py-1.5 rounded text-sm transition-colors"
              >
                Agregar
              </button>
            </div>
          </div>

          {/* Div donde Html5QrcodeScanner inyectará el video */}
          <div className="w-full rounded-lg overflow-hidden border border-slate-800 bg-black min-h-[300px] flex items-center justify-center">
            {!isScanning && (
              <div className="text-slate-500 text-sm text-center p-6">
                <Camera className="w-12 h-12 mx-auto mb-2 opacity-50" />
                Presiona "Iniciar Cámara" y apunta al código de barras.
              </div>
            )}
            <div id="reader" className={`w-full ${!isScanning ? 'hidden' : 'block'}`}></div>
          </div>
        </div>

        {/* Lista de Equipos */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-white">
              Series Escaneadas ({scannedSerials.length})
            </h3>
            {scannedSerials.length > 0 && (
              <button
                onClick={handleSaveBulk}
                disabled={loading}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-lg shadow-emerald-600/20 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {loading ? 'Guardando...' : 'Guardar Todos'}
              </button>
            )}
          </div>

          <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
            {scannedSerials.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-sm border border-dashed border-slate-700 rounded-lg">
                La lista está vacía. Escanea equipos para agregarlos aquí.
              </div>
            ) : (
              scannedSerials.map((serial, index) => (
                <div key={serial} className="flex justify-between items-center bg-slate-950 border border-slate-800 p-3 rounded-lg group hover:border-indigo-500/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="bg-slate-800 text-slate-400 w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium">
                      {scannedSerials.length - index}
                    </span>
                    <span className="text-white font-mono">{serial}</span>
                  </div>
                  <button
                    onClick={() => handleRemoveSerial(serial)}
                    className="text-slate-500 hover:text-red-400 p-1 transition-colors opacity-0 group-hover:opacity-100"
                    title="Eliminar de la lista"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
