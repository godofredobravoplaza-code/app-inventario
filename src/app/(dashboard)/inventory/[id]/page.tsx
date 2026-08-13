import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { ArrowLeft, Clock, FileText, Activity, ExternalLink, ShieldCheck } from 'lucide-react'

export default async function EquipmentHistoryPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
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

  const resolvedParams = await params
  const equipmentId = resolvedParams.id

  // Fetch Equipment
  const { data: equipment, error: eqError } = await supabase
    .from('inventory')
    .select('*')
    .eq('id', equipmentId)
    .single()

  // Fetch DER Records
  const { data: derRecords } = await supabase
    .from('der_records')
    .select('*')
    .eq('equipment_id', equipmentId)
    .order('created_at', { ascending: false })

  // Fetch Audit Logs
  const { data: auditLogs } = await supabase
    .from('audit_logs')
    .select('*, profiles(full_name)')
    .eq('equipment_id', equipmentId)
    .order('created_at', { ascending: false })

  if (eqError || !equipment) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl text-red-400">Equipo no encontrado</h2>
        <Link href="/inventory" className="text-indigo-400 mt-4 inline-block hover:underline">
          Volver al inventario
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto mb-20">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <Link 
            href="/inventory"
            className="p-2 text-slate-400 hover:text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors border border-slate-800"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              Historial del Equipo
              <span className={`text-xs px-2 py-1 rounded-full border ${
                equipment.status === 'EN_BODEGA' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                equipment.status === 'ASIGNADO' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                'bg-amber-500/10 text-amber-400 border-amber-500/20'
              }`}>
                {equipment.status.replace(/_/g, ' ')}
              </span>
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              {equipment.brand} {equipment.model} - S/N: <span className="text-slate-300 font-mono">{equipment.serial_number}</span>
            </p>
          </div>
        </div>
        <Link
          href={`/inventory/${equipment.id}/edit`}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-indigo-500 shrink-0"
        >
          Editar Equipo
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Resumen Card */}
        <div className="md:col-span-1 bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl h-fit">
          <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-indigo-400" />
            Especificaciones
          </h3>
          <div className="space-y-4 text-sm">
            <div>
              <div className="text-slate-500 text-xs">Categoría</div>
              <div className="text-slate-200">{equipment.category}</div>
            </div>
            <div>
              <div className="text-slate-500 text-xs">Hostname</div>
              <div className="text-slate-200 font-mono">{equipment.hostname || 'N/A'}</div>
            </div>
            <div>
              <div className="text-slate-500 text-xs">Sistema Operativo</div>
              <div className="text-slate-200">{equipment.os_version || 'N/A'}</div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-slate-500 text-xs">RAM</div>
                <div className="text-slate-200">{equipment.ram_gb ? `${equipment.ram_gb} GB` : 'N/A'}</div>
              </div>
              <div>
                <div className="text-slate-500 text-xs">Almacenamiento</div>
                <div className="text-slate-200">{equipment.storage_gb ? `${equipment.storage_gb} GB` : 'N/A'}</div>
              </div>
            </div>
            <div>
              <div className="text-slate-500 text-xs">Tiempo en Operación</div>
              <div className="text-slate-200">{equipment.months_in_operation} meses</div>
            </div>
            <hr className="border-slate-800" />
            <div>
              <div className="text-slate-500 text-xs">Asignado Actualmente A</div>
              {equipment.current_user_name ? (
                <div>
                  <div className="text-white font-medium">{equipment.current_user_name}</div>
                  <div className="text-slate-400 text-xs">RUT: {equipment.current_user_rut}</div>
                  {equipment.current_user_account && (
                    <div className="text-slate-400 text-xs">User: {equipment.current_user_account}</div>
                  )}
                  {equipment.assignment_ticket && (
                    <div className="text-indigo-400 text-xs mt-1">Ticket: {equipment.assignment_ticket}</div>
                  )}
                </div>
              ) : (
                <div className="text-slate-500 italic">Nadie</div>
              )}
            </div>
          </div>
        </div>

        <div className="md:col-span-2 space-y-6">
          {/* Historial de Documentos */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
            <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-emerald-400" />
              Historial de Documentos
            </h3>
            
            {(!derRecords || derRecords.length === 0) ? (
              <div className="text-center py-6 text-slate-500 bg-slate-950/50 rounded-lg border border-slate-800/50">
                Este equipo aún no tiene documentos registrados.
              </div>
            ) : (
              <div className="space-y-3">
                {derRecords.map(der => {
                  let docTypeLabel = 'Acta DER';
                  let docTypeColor = 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
                  
                  if (der.document_type === 'RECEPTION') {
                    docTypeLabel = 'Guía de Recepción';
                    docTypeColor = 'bg-blue-500/20 text-blue-400 border-blue-500/30';
                  } else if (der.document_type === 'RETURN') {
                    docTypeLabel = 'Guía de Devolución';
                    docTypeColor = 'bg-amber-500/20 text-amber-400 border-amber-500/30';
                  }

                  return (
                    <div key={der.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-slate-950/50 border border-slate-800 rounded-lg">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-xs px-2 py-0.5 rounded-md border ${docTypeColor}`}>
                            {docTypeLabel}
                          </span>
                        </div>
                        <div className="text-white font-medium flex items-center gap-2">
                          {der.user_name || 'Sin Asignatario'} 
                          {der.ticket_number && (
                            <span className="text-xs px-2 py-0.5 bg-slate-800 text-slate-400 rounded-full">
                              Ticket {der.ticket_number}
                            </span>
                          )}
                        </div>
                        <div className="text-slate-500 text-xs mt-1">
                          {new Date(der.created_at).toLocaleString()}
                        </div>
                      </div>
                      {der.drive_file_url && (
                        <a 
                          href={`/api/pdf/${der.drive_file_url}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-3 sm:mt-0 inline-flex items-center gap-2 text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                        >
                          Ver PDF <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Línea de Tiempo de Auditoría */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
            <h3 className="text-lg font-medium text-white mb-6 flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-400" />
              Línea de Tiempo de Auditoría
            </h3>
            
            <div className="relative pl-6 space-y-8 border-l border-slate-800 ml-2">
              {(!auditLogs || auditLogs.length === 0) ? (
                <div className="text-slate-500 italic">No hay registros de auditoría.</div>
              ) : (
                auditLogs.map((log, index) => (
                  <div key={log.id} className="relative">
                    <div className="absolute -left-[33px] top-1 bg-slate-900 border-2 border-slate-700 p-1 rounded-full">
                      <ShieldCheck className="w-3 h-3 text-slate-400" />
                    </div>
                    <div>
                      <div className="text-slate-300 text-sm font-medium">
                        {log.action_type.replace(/_/g, ' ')}
                      </div>
                      <div className="text-slate-500 text-xs mt-1">
                        Por: <span className="text-slate-400">{log.profiles?.full_name || 'Sistema'}</span> &bull; {new Date(log.created_at).toLocaleString()}
                      </div>
                      {log.new_data && (
                        <div className="mt-2 bg-slate-950 p-3 rounded-lg border border-slate-800 overflow-x-auto">
                          <pre className="text-[10px] text-slate-400">
                            {JSON.stringify(log.new_data, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
