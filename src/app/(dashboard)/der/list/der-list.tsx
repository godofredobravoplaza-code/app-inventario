'use client'

import { useState } from 'react'
import Link from 'next/link'
import { FileText, Edit, Search, CheckCircle, Clock } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function DerList({ initialRecords }: { initialRecords: any[] }) {
  const [records, setRecords] = useState(initialRecords)
  const [searchTerm, setSearchTerm] = useState('')
  const supabase = createClient()

  const filteredRecords = records.filter(r => 
    r.ticket_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.user_rut?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleDownload = async (fileName: string) => {
    const { data } = await supabase.storage.from('actas_der').createSignedUrl(fileName, 60)
    if (data?.signedUrl) {
      window.open(data.signedUrl, '_blank')
    }
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
      <div className="p-4 border-b border-slate-800 bg-slate-900/50 flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por Ticket, Nombre o RUT..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:ring-1 focus:ring-indigo-500 outline-none"
          />
        </div>
        <Link 
          href="/der/new"
          className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap text-center"
        >
          Nuevo DER
        </Link>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-300">
          <thead className="bg-slate-950 text-slate-400 font-medium">
            <tr>
              <th className="px-6 py-4">Ticket</th>
              <th className="px-6 py-4">Usuario</th>
              <th className="px-6 py-4">Fecha Creación</th>
              <th className="px-6 py-4">Generado por</th>
              <th className="px-6 py-4">Estado</th>
              <th className="px-6 py-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {filteredRecords.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                  No se encontraron actas registradas.
                </td>
              </tr>
            ) : (
              filteredRecords.map((record) => (
                <tr key={record.id} className="hover:bg-slate-800/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-white">
                    {record.ticket_number}
                  </td>
                  <td className="px-6 py-4">
                    <div>{record.user_name || '-'}</div>
                    <div className="text-xs text-slate-500">{record.user_rut}</div>
                  </td>
                  <td className="px-6 py-4">
                    {new Date(record.created_at).toLocaleDateString('es-CL', {
                      day: '2-digit', month: 'short', year: 'numeric'
                    })}
                  </td>
                  <td className="px-6 py-4">
                    {record.profiles?.full_name || '-'}
                  </td>
                  <td className="px-6 py-4">
                    {record.status === 'COMPLETED' ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <CheckCircle className="w-3.5 h-3.5" /> Oficial
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        <Clock className="w-3.5 h-3.5" /> Borrador
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right space-x-3">
                    {record.status === 'DRAFT' ? (
                      <Link
                        href={`/der/new?id=${record.id}`}
                        className="inline-flex items-center gap-1.5 text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                        Completar
                      </Link>
                    ) : (
                      record.drive_file_url && (
                        <button
                          onClick={() => handleDownload(record.drive_file_url)}
                          className="inline-flex items-center gap-1.5 text-slate-300 hover:text-white font-medium transition-colors"
                        >
                          <FileText className="w-4 h-4" />
                          Ver PDF
                        </button>
                      )
                    )}
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
