'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Save, AlertCircle, Loader2 } from 'lucide-react'

export default function EditInventoryForm({ equipment, catalog }: { equipment: any, catalog: any[] }) {
  const router = useRouter()
  const supabase = createClient()
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [category, setCategory] = useState(equipment.category || 'LAPTOP')
  const [brand, setBrand] = useState(equipment.brand || '')
  const [model, setModel] = useState(equipment.model || '')
  const [serialNumber, setSerialNumber] = useState(equipment.serial_number || '')
  const [hostname, setHostname] = useState(equipment.hostname || '')
  const [assetTag, setAssetTag] = useState(equipment.asset_tag || '')
  
  const [ram, setRam] = useState(equipment.ram_gb?.toString() || '')
  const [storage, setStorage] = useState(equipment.storage_gb?.toString() || '')
  const [status, setStatus] = useState(equipment.status || 'EN_BODEGA')
  const [comments, setComments] = useState(equipment.comments || '')

  // User Assignment states
  const [currentUserName, setCurrentUserName] = useState(equipment.current_user_name || '')
  const [currentUserRut, setCurrentUserRut] = useState(equipment.current_user_rut || '')
  const [currentUserAccount, setCurrentUserAccount] = useState(equipment.current_user_account || '')
  const [assignmentTicket, setAssignmentTicket] = useState(equipment.assignment_ticket || '')
  
  // Date calculation states
  const [receptionDate, setReceptionDate] = useState(equipment.reception_date || '')
  const [months, setMonths] = useState(equipment.months_in_operation?.toString() || '')

  const handleDateChange = (dateStr: string) => {
    setReceptionDate(dateStr)
    if (!dateStr) {
      setMonths('')
      return
    }
    const recDate = new Date(dateStr)
    const now = new Date()
    const diffMonths = (now.getFullYear() - recDate.getFullYear()) * 12 + (now.getMonth() - recDate.getMonth())
    setMonths(Math.max(0, diffMonths).toString())
  }

  const handleMonthsChange = (monthsStr: string) => {
    setMonths(monthsStr)
    if (!monthsStr || isNaN(parseInt(monthsStr, 10))) {
      setReceptionDate('')
      return
    }
    const m = parseInt(monthsStr, 10)
    const now = new Date()
    now.setMonth(now.getMonth() - m)
    setReceptionDate(now.toISOString().split('T')[0]) // YYYY-MM-DD
  }

  const availableBrands = Array.from(new Set(catalog.filter(c => c.category === category).map(c => c.brand))).sort()
  const availableModels = Array.from(new Set(catalog.filter(c => c.category === category && c.brand === brand).map(c => c.model))).sort()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setError('No estás autenticado')
      setLoading(false)
      return
    }

    const { error: updateError } = await supabase
      .from('inventory')
      .update({
        category,
        brand,
        model,
        serial_number: serialNumber || null,
        hostname: hostname || null,
        asset_tag: assetTag || null,
        ram_gb: ram ? parseInt(ram, 10) : null,
        storage_gb: storage ? parseInt(storage, 10) : null,
        status,
        comments,
        reception_date: receptionDate || null,
        months_in_operation: months ? parseInt(months, 10) : 0,
        current_user_name: currentUserName || null,
        current_user_rut: currentUserRut || null,
        current_user_account: currentUserAccount || null,
        assignment_ticket: assignmentTicket || null
      })
      .eq('id', equipment.id)

    if (updateError) {
      setError(updateError.message)
      setLoading(false)
      return
    }

    // Registrar auditoría
    await supabase.from('audit_logs').insert({
      equipment_id: equipment.id,
      performed_by: user.id,
      action_type: 'EQUIPMENT_UPDATED',
      new_data: { 
        category, brand, model, serial_number: serialNumber, hostname, asset_tag: assetTag,
        ram, storage, status, comments, reception_date: receptionDate, months_in_operation: months,
        current_user_name: currentUserName, current_user_rut: currentUserRut, 
        current_user_account: currentUserAccount, assignment_ticket: assignmentTicket
      }
    })

    router.push(`/inventory/${equipment.id}`)
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-6">
      {error && (
        <div className="bg-red-500/10 border border-red-500/50 p-4 rounded-lg flex items-center gap-3 text-red-400">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Estado del Equipo</label>
          <select 
            value={status}
            onChange={e => setStatus(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
          >
            <option value="EN_BODEGA">En Bodega (Stock)</option>
            <option value="ASIGNADO">Asignado</option>
            <option value="PRESTAMO_TEMPORAL">Préstamo Temporal</option>
            <option value="EN_REEMPLAZO_LAB">En Reemplazo (Laboratorio)</option>
            <option value="EN_LABORATORIO_SONDA">En Laboratorio Sonda</option>
            <option value="DE_BAJA_RENOVADO">De Baja (Renovado)</option>
            <option value="NO_ENTREGADO_A_TI">No Entregado a TI</option>
            <option value="RECUPERADO_SIN_ACTA">Recuperado sin Acta</option>
            <option value="REGISTRO_INCOMPLETO_ATENCION">Registro Incompleto/Atención</option>
            <option value="POR_DEVOLVER">Por Devolver</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Categoría</label>
          <select 
            value={category}
            onChange={e => {
              setCategory(e.target.value)
              setBrand('')
              setModel('')
            }}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
          >
            <option value="LAPTOP">Laptop / Notebook</option>
            <option value="DESKTOP">Desktop / PC Escritorio</option>
            <option value="TABLET">Tablet</option>
            <option value="PRINTER_COLOR">Impresora Color</option>
            <option value="PRINTER_BN">Impresora B/N</option>
            <option value="ZEBRA_LABEL">Impresora Zebra (Etiquetas)</option>
            <option value="ZEBRA_TRF">Impresora Zebra (Brazaletes TRF)</option>
            <option value="VIDEO_CONFERENCIA">Equipo de Video Conferencia</option>
            <option value="SERVER">Servidor</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Marca</label>
          <select 
            value={brand}
            onChange={e => {
              setBrand(e.target.value)
              setModel('')
            }}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
          >
            <option value="">Seleccione una marca...</option>
            {availableBrands.map(b => (
              <option key={b as string} value={b as string}>{b as string}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Modelo</label>
          <select 
            value={model}
            onChange={e => setModel(e.target.value)}
            disabled={!brand}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-indigo-500 outline-none disabled:opacity-50"
          >
            <option value="">Seleccione un modelo...</option>
            {availableModels.map(m => (
              <option key={m as string} value={m as string}>{m as string}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Número de Serie (S/N)</label>
          <input 
            type="text" 
            value={serialNumber}
            onChange={e => setSerialNumber(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
            placeholder="Ej: PF123456"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Hostname</label>
          <input 
            type="text" 
            value={hostname}
            onChange={e => setHostname(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
            placeholder="Ej: CL-PC-01"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Rótulo / Asset Tag</label>
          <input 
            type="text" 
            value={assetTag}
            onChange={e => setAssetTag(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
            placeholder="Opcional"
          />
        </div>

        {category === 'LAPTOP' || category === 'DESKTOP' || category === 'SERVER' ? (
          <>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">RAM (GB)</label>
              <input 
                type="number" 
                value={ram}
                onChange={e => setRam(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="Ej: 16"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Almacenamiento (GB)</label>
              <input 
                type="number" 
                value={storage}
                onChange={e => setStorage(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="Ej: 512"
              />
            </div>
          </>
        ) : null}
        
        <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-950/50 p-4 rounded-lg border border-slate-800">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Fecha de Llegada (Recepción)</label>
            <input 
              type="date"
              value={receptionDate}
              onChange={e => handleDateChange(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
            />
            <p className="text-xs text-slate-500 mt-1">Calcula los meses automáticamente</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Meses en Operación (Leasing)</label>
            <input 
              type="number" 
              value={months}
              onChange={e => handleMonthsChange(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="Ej: 14"
            />
            <p className="text-xs text-slate-500 mt-1">Calcula la fecha hacia atrás automáticamente</p>
          </div>
        </div>

        <div className="md:col-span-2 space-y-4 pt-4 border-t border-slate-800">
          <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Asignación Actual</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Nombre del Usuario</label>
              <input 
                type="text" 
                value={currentUserName}
                onChange={e => setCurrentUserName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="Ej: Juan Pérez"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">RUT del Usuario</label>
              <input 
                type="text" 
                value={currentUserRut}
                onChange={e => setCurrentUserRut(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="Ej: 12.345.678-9"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Cuenta/Correo del Usuario</label>
              <input 
                type="text" 
                value={currentUserAccount}
                onChange={e => setCurrentUserAccount(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="Ej: jperez@empresa.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Ticket de Asignación</label>
              <input 
                type="text" 
                value={assignmentTicket}
                onChange={e => setAssignmentTicket(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="Ej: WO00000014620"
              />
            </div>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1">Notas / Comentarios / Proveedor / Guía</label>
        <textarea 
          value={comments}
          onChange={e => setComments(e.target.value)}
          rows={3}
          className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
          placeholder="Agrega el número de guía, información del proveedor, o notas sobre el estado físico del equipo..."
        />
      </div>

      <div className="flex justify-end pt-4 border-t border-slate-800">
        <button
          type="submit"
          disabled={loading || !brand || !model}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Guardar Cambios
        </button>
      </div>
    </form>
  )
}
