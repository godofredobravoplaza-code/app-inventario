'use client'

import { useState } from 'react'
import { Search, Monitor, FileText, CheckCircle, Clock } from 'lucide-react'

function formatActionType(type: string) {
  switch (type) {
    case 'EQUIPMENT_CREATED': return 'Equipo Registrado'
    case 'EQUIPMENT_UPDATED': return 'Equipo Actualizado'
    case 'DER_IMPORTED': return 'DER Importado'
    case 'DER_CREATED': return 'DER Creado'
    default: return type
  }
}

function getActionColor(type: string) {
  if (type.includes('CREATED') || type.includes('IMPORTED')) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
  if (type.includes('UPDATED')) return 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20'
  return 'text-slate-400 bg-slate-500/10 border-slate-500/20'
}

export default function AuditList({ initialLogs }: { initialLogs: any[] }) {
  const [logs, setLogs] = useState(initialLogs)
  const [searchTerm, setSearchTerm] = useState('')

  const filteredLogs = logs.filter(log => {
    const s = searchTerm.toLowerCase()
    return (
      log.profiles?.full_name?.toLowerCase().includes(s) ||
      log.inventory?.serial_number?.toLowerCase().includes(s) ||
      formatActionType(log.action_type).toLowerCase().includes(s)
    )
  })

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
      <div className="p-4 border-b border-slate-800 bg-slate-900/50">
        <div className="relative max-w-md w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por usuario, serie o acción..."
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
              <th className="px-6 py-4">Fecha y Hora</th>
              <th className="px-6 py-4">Usuario (Autor)</th>
              <th className="px-6 py-4">Acción</th>
              <th className="px-6 py-4">Equipo Afectado</th>
              <th className="px-6 py-4">Detalles</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                  No se encontraron registros de auditoría.
                </td>
              </tr>
            ) : (
              filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-800/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-white">
                      {new Date(log.created_at).toLocaleDateString('es-CL')}
                    </div>
                    <div className="text-xs text-slate-500">
                      {new Date(log.created_at).toLocaleTimeString('es-CL')}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-medium text-slate-200">
                      {log.profiles?.full_name || 'Sistema'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getActionColor(log.action_type)}`}>
                      {formatActionType(log.action_type)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {log.inventory ? (
                      <div>
                        <div className="font-medium text-slate-200">
                          {log.inventory.brand} {log.inventory.model}
                        </div>
                        <div className="text-xs text-slate-500">
                          S/N: {log.inventory.serial_number}
                        </div>
                      </div>
                    ) : (
                      <span className="text-slate-500">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 max-w-xs">
                    <div className="text-xs text-slate-400 truncate hover:whitespace-normal hover:break-all">
                      {JSON.stringify(log.new_data)}
                    </div>
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
