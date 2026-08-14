'use client'

import { useState } from 'react'
import { Search, RefreshCcw, AlertTriangle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function TrashList({ initialRecords }: { initialRecords: any[] }) {
  const [records, setRecords] = useState(initialRecords)
  const [searchTerm, setSearchTerm] = useState('')
  const [isRestoring, setIsRestoring] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  const filteredRecords = records.filter(r => {
    const s = searchTerm.toLowerCase()
    return (
      r.serial_number?.toLowerCase().includes(s) ||
      r.brand?.toLowerCase().includes(s) ||
      r.model?.toLowerCase().includes(s)
    )
  })

  const handleRestore = async (id: string) => {
    if (!confirm('¿Estás seguro de que deseas restaurar este equipo al inventario activo?')) return

    setIsRestoring(true)
    const { data: { user } } = await supabase.auth.getUser()

    // 1. Restaurar el equipo (quitar deleted_at)
    const { error } = await supabase
      .from('inventory')
      .update({ deleted_at: null })
      .eq('id', id)

    if (!error) {
      // 2. Registrar en auditoría
      await supabase.from('audit_logs').insert({
        equipment_id: id,
        performed_by: user?.id,
        action_type: 'EQUIPMENT_RESTORED',
        new_data: { status: 'RESTORED' }
      })

      // Actualizar UI
      setRecords(records.filter(r => r.id !== id))
      router.refresh()
    } else {
      alert('Error al restaurar: ' + error.message)
    }
    
    setIsRestoring(false)
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
      <div className="p-4 border-b border-slate-800 bg-slate-900/50">
        <div className="relative max-w-md w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por Serie, Marca o Modelo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:ring-1 focus:ring-indigo-500 outline-none"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-300">
          <thead className="bg-slate-950 text-slate-400 font-medium border-b border-slate-800">
            <tr>
              <th className="px-6 py-4">Equipo</th>
              <th className="px-6 py-4">S/N y Placa</th>
              <th className="px-6 py-4">Fecha Eliminación</th>
              <th className="px-6 py-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {filteredRecords.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center justify-center space-y-3 text-slate-500">
                    <AlertTriangle className="w-8 h-8 opacity-50" />
                    <p>La papelera está vacía.</p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredRecords.map((record) => (
                <tr key={record.id} className="hover:bg-slate-800/50 transition-colors opacity-80">
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-200">
                      {record.brand} {record.model}
                    </div>
                    <div className="text-xs text-slate-500">{record.category}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-mono text-slate-300">{record.serial_number}</div>
                    {record.asset_tag && (
                      <div className="text-xs text-slate-500 font-mono">PT: {record.asset_tag}</div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {new Date(record.deleted_at).toLocaleDateString('es-CL', {
                      day: '2-digit', month: 'short', year: 'numeric'
                    })}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleRestore(record.id)}
                      disabled={isRestoring}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20 transition-colors disabled:opacity-50"
                    >
                      <RefreshCcw className="w-4 h-4" />
                      Restaurar
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
