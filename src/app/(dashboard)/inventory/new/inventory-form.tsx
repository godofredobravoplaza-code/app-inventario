'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { calculateMonthsInOperation } from '@/lib/utils/inventory-math'
import type { ModelCatalogItem, EquipmentCategory, EquipmentStatus } from '@/lib/supabase/types'
import { Save, Plus, AlertCircle } from 'lucide-react'

export default function InventoryForm({ initialCatalog }: { initialCatalog: ModelCatalogItem[] }) {
  const router = useRouter()
  const supabase = createClient()
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // State for Mantenedor updates
  const [catalog, setCatalog] = useState<ModelCatalogItem[]>(initialCatalog)
  const [showNewModelInput, setShowNewModelInput] = useState(false)
  
  // Form State
  const [hostname, setHostname] = useState('')
  const [osVersion, setOsVersion] = useState('Windows 11 Pro')
  const [serialNumber, setSerialNumber] = useState('')
  const [assetTag, setAssetTag] = useState('')
  const [category, setCategory] = useState<EquipmentCategory>('LAPTOP')
  const [brand, setBrand] = useState('')
  const [model, setModel] = useState('')
  
  // New Model State
  const [newBrand, setNewBrand] = useState('')
  const [newModelName, setNewModelName] = useState('')
  const [addingModel, setAddingModel] = useState(false)

  // Specs
  const [ram, setRam] = useState<string>('')
  const [storage, setStorage] = useState<string>('')
  const [status, setStatus] = useState<EquipmentStatus>('EN_BODEGA')
  
  // Dates
  const [isNewEquipment, setIsNewEquipment] = useState(true)
  const [receptionDate, setReceptionDate] = useState('')
  const [manualMonths, setManualMonths] = useState<string>('')

  // Derived Catalog Data
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
      .insert({
        category,
        brand: newBrand.trim(),
        model: newModelName.trim()
      })
      .select()
      .single()

    if (insertError) {
      console.error(insertError)
      setError(`Error de DB: ${insertError.message || insertError.details || 'Revisa la consola'}`)
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (!brand || !model) {
      setError('Debes seleccionar una marca y modelo del catálogo.')
      setLoading(false)
      return
    }

    // Get current user for audit and created_by
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setError('No estás autenticado.')
      setLoading(false)
      return
    }

    // Calculate months
    let finalMonths = 0
    let finalReception = null
    let finalManual = 0

    if (isNewEquipment) {
      if (!receptionDate) {
        setError('Debe ingresar la fecha de guía para un equipo nuevo.')
        setLoading(false)
        return
      }
      finalReception = receptionDate
      finalMonths = calculateMonthsInOperation(receptionDate, 0)
    } else {
      if (!manualMonths) {
        setError('Debe ingresar los meses de uso previo para un equipo antiguo.')
        setLoading(false)
        return
      }
      finalManual = parseInt(manualMonths, 10)
      finalMonths = calculateMonthsInOperation(null, finalManual)
    }

    const { data: insertedItem, error: insertError } = await supabase
      .from('inventory')
      .insert({
        hostname: hostname.trim() || null,
        os_version: osVersion,
        serial_number: serialNumber.trim(),
        asset_tag: assetTag.trim() || null,
        category,
        brand,
        model,
        ram_gb: ram ? parseInt(ram, 10) : null,
        storage_gb: storage ? parseInt(storage, 10) : null,
        status,
        reception_date: finalReception,
        manual_months_offset: finalManual,
        months_in_operation: finalMonths,
        created_by: user.id
      })
      .select()
      .single()

    if (insertError) {
      setError(insertError.message)
      setLoading(false)
      return
    }

    // Create Audit Log
    if (insertedItem) {
      await supabase.from('audit_logs').insert({
        equipment_id: insertedItem.id,
        performed_by: user.id,
        action_type: 'EQUIPMENT_CREATED',
        new_data: insertedItem
      })
    }

    router.push('/inventory')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-8">
      {error && (
        <div className="bg-red-500/10 border border-red-500/50 p-4 rounded-lg flex items-center gap-3 text-red-400">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Identificación */}
      <div>
        <h3 className="text-lg font-medium text-white mb-4 border-b border-slate-800 pb-2">Identificación</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Número de Serie *</label>
            <input 
              required
              type="text" 
              value={serialNumber}
              onChange={e => setSerialNumber(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
              placeholder="Ej: PF123456"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Asset Tag (Placa Sonda)</label>
            <input 
              type="text" 
              value={assetTag}
              onChange={e => setAssetTag(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
              placeholder="Opcional"
            />
          </div>
          {/* Hostname */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Nombre de Máquina (Hostname)</label>
            <input 
              type="text" 
              value={hostname}
              onChange={e => setHostname(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="Ej: CL-SCL-LP001"
            />
          </div>

          {/* OS Version */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Sistema Operativo</label>
            <select 
              value={osVersion}
              onChange={e => setOsVersion(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              <option value="Windows 11 Pro">Windows 11 Pro</option>
              <option value="Windows 10 Pro">Windows 10 Pro</option>
              <option value="macOS">macOS</option>
              <option value="Linux">Linux</option>
              <option value="Sin OS">Sin OS</option>
            </select>
          </div>
        </div>
      </div>

      {/* Mantenedor y Características */}
      <div>
        <div className="flex justify-between items-end border-b border-slate-800 pb-2 mb-4">
          <h3 className="text-lg font-medium text-white">Clasificación y Modelo</h3>
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Categoría *</label>
            <select 
              value={category}
              onChange={e => {
                setCategory(e.target.value as EquipmentCategory)
                setBrand('')
                setModel('')
              }}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              <option value="LAPTOP">Laptop</option>
              <option value="DESKTOP">Desktop</option>
              <option value="PRINTER_COLOR">Impresora Color</option>
              <option value="PRINTER_BN">Impresora B/N</option>
              <option value="ZEBRA_LABEL">Zebra Etiquetas</option>
              <option value="ZEBRA_TRF">Zebra TRF</option>
              <option value="VIDEO_CONFERENCIA">Video Conferencia</option>
              <option value="SERVER">Servidor</option>
              <option value="TABLET">Tablet</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Marca *</label>
            <select 
              required
              value={brand}
              onChange={e => {
                setBrand(e.target.value)
                setModel('')
              }}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-indigo-500 outline-none disabled:opacity-50"
            >
              <option value="">-- Seleccionar --</option>
              {availableBrands.map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Modelo *</label>
            <select 
              required
              value={model}
              onChange={e => setModel(e.target.value)}
              disabled={!brand}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-indigo-500 outline-none disabled:opacity-50"
            >
              <option value="">-- Seleccionar --</option>
              {availableModels.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">RAM (GB)</label>
            <input 
              type="number" 
              min="0"
              list="ram-options"
              value={ram}
              onChange={e => setRam(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-indigo-500 outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [appearance:textfield]"
            />
            <datalist id="ram-options">
              <option value="4" />
              <option value="8" />
              <option value="12" />
              <option value="16" />
              <option value="24" />
              <option value="32" />
              <option value="64" />
            </datalist>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Almacenamiento (GB)</label>
            <input 
              type="number" 
              min="0"
              list="storage-options"
              value={storage}
              onChange={e => setStorage(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-indigo-500 outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [appearance:textfield]"
            />
            <datalist id="storage-options">
              <option value="128" />
              <option value="256" />
              <option value="512" />
              <option value="1000" label="1TB" />
              <option value="1024" label="1TB" />
              <option value="2000" label="2TB" />
              <option value="2048" label="2TB" />
            </datalist>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Estado Inicial *</label>
            <select 
              value={status}
              onChange={e => setStatus(e.target.value as EquipmentStatus)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              <option value="EN_BODEGA">En Bodega</option>
              <option value="ASIGNADO">Asignado / En Operación</option>
              <option value="EN_REEMPLAZO_LAB">En Reemplazo (Siniestro)</option>
              <option value="PRESTAMO_TEMPORAL">Préstamo Temporal</option>
              <option value="EN_LABORATORIO_SONDA">En Lab Sonda (Reparación Oficial)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Trazabilidad Matemática */}
      <div>
        <h3 className="text-lg font-medium text-white mb-4 border-b border-slate-800 pb-2">Vida Útil</h3>
        
        <div className="flex gap-6 mb-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input 
              type="radio" 
              checked={isNewEquipment} 
              onChange={() => setIsNewEquipment(true)}
              className="text-indigo-600 focus:ring-indigo-500 bg-slate-950 border-slate-700" 
            />
            <span className="text-sm text-slate-300">Equipo Nuevo (con fecha de Guía)</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input 
              type="radio" 
              checked={!isNewEquipment} 
              onChange={() => setIsNewEquipment(false)}
              className="text-indigo-600 focus:ring-indigo-500 bg-slate-950 border-slate-700" 
            />
            <span className="text-sm text-slate-300">Equipo Antiguo (con uso previo)</span>
          </label>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-lg p-4">
          {isNewEquipment ? (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Fecha Guía Recepción Sonda *</label>
              <input 
                type="date"
                required={isNewEquipment}
                value={receptionDate}
                onChange={e => setReceptionDate(e.target.value)}
                className="w-full sm:w-1/2 bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
              />
              <p className="text-xs text-slate-500 mt-2">Los meses de operación se calcularán automáticamente cada vez que se visualice desde esta fecha.</p>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Meses de Operación Previos *</label>
              <input 
                type="number" 
                required={!isNewEquipment}
                value={manualMonths}
                onChange={e => setManualMonths(e.target.value)}
                className="w-full sm:w-1/2 bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="Ej: 24"
              />
              <p className="text-xs text-slate-500 mt-2">El equipo ingresará al sistema registrando este valor como base estática de desgaste.</p>
            </div>
          )}
        </div>
      </div>

      <div className="pt-4 flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors shadow-lg shadow-indigo-600/20 disabled:opacity-50"
        >
          <Save className="w-5 h-5" />
          {loading ? 'Guardando...' : 'Guardar Equipo en Inventario'}
        </button>
      </div>

    </form>
  )
}
