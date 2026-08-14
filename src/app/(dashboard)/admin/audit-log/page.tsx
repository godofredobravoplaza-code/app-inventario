import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import AuditList from './audit-list'

export default async function AuditLogPage() {
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

  const { data: logs, error } = await supabase
    .from('audit_logs')
    .select(`
      id,
      action_type,
      new_data,
      created_at,
      profiles:performed_by (full_name),
      inventory:equipment_id (
        serial_number,
        brand,
        model,
        category
      )
    `)
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) {
    console.error("Error fetching audit logs:", error)
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Auditoría del Sistema</h1>
          <p className="text-slate-400 text-sm mt-1">
            Registro histórico de las acciones críticas ejecutadas en el inventario.
          </p>
        </div>
      </div>

      <AuditList initialLogs={logs || []} />
    </div>
  )
}
