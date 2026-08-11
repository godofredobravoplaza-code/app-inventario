import Link from 'next/link'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { FileSignature, Search, Filter, ExternalLink } from 'lucide-react'

export default async function DerRecordsPage() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
      },
    }
  )

  const { data: records, error } = await supabase
    .from('der_records')
    .select(`
      *,
      inventory:equipment_id (
        serial_number,
        category,
        brand,
        model
      )
    `)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching DER records:', error)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Actas DER</h1>
          <p className="text-slate-400 text-sm mt-1">
            Documentos de Entrega y Recepción de equipos tecnológicos.
          </p>
        </div>
        
        <Link 
          href="/der/new" 
          className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-lg shadow-indigo-600/20"
        >
          <FileSignature className="w-5 h-5" />
          Generar Nueva Acta
        </Link>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row gap-4 justify-between">
          <div className="relative max-w-md w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input 
              type="text" 
              placeholder="Buscar por ticket, RUT o técnico..." 
              className="w-full bg-slate-950 border border-slate-700 text-white text-sm rounded-lg pl-10 pr-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
            />
          </div>
          <button className="inline-flex items-center gap-2 text-slate-300 bg-slate-800 hover:bg-slate-700 px-3 py-2 rounded-lg text-sm font-medium transition-colors border border-slate-700">
            <Filter className="w-4 h-4" />
            Filtros
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-950/50 text-slate-400 text-xs uppercase tracking-wider">
                <th className="px-6 py-4 font-medium border-b border-slate-800">Fecha y N° Ticket</th>
                <th className="px-6 py-4 font-medium border-b border-slate-800">Técnico Asignado</th>
                <th className="px-6 py-4 font-medium border-b border-slate-800">Equipo Asociado</th>
                <th className="px-6 py-4 font-medium border-b border-slate-800">Documento PDF</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-sm">
              {!records || records.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                    No hay actas DER generadas todavía.
                  </td>
                </tr>
              ) : (
                records.map((record: any) => (
                  <tr key={record.id} className="hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-white">Ticket {record.ticket_number}</div>
                      <div className="text-slate-500 text-xs mt-0.5">
                        {new Date(record.created_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-slate-200">{record.user_name}</div>
                      <div className="text-slate-400 text-xs mt-0.5">{record.user_rut}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-slate-200">
                        {record.inventory?.brand} {record.inventory?.model}
                      </div>
                      <div className="text-slate-400 text-xs mt-0.5">S/N: {record.inventory?.serial_number}</div>
                    </td>
                    <td className="px-6 py-4">
                      {record.drive_file_url ? (
                        <a 
                          href={`/api/pdf/${record.drive_file_url}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-indigo-400 hover:text-indigo-300 font-medium text-sm transition-colors"
                        >
                          Ver PDF Seguro <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <span className="text-slate-500 italic">No disponible</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
