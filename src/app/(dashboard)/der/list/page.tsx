import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import DerList from './der-list'

export default async function DerListPage() {
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
      id,
      ticket_number,
      user_name,
      user_rut,
      equipment_id,
      drive_file_url,
      status,
      created_at,
      profiles:created_by (full_name)
    `)
    .order('created_at', { ascending: false })

  if (error) {
    console.error("Error fetching DER records:", error)
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Registro de Actas (DER)</h1>
          <p className="text-slate-400 text-sm mt-1">
            Administra borradores pendientes y actas emitidas.
          </p>
        </div>
      </div>

      <DerList initialRecords={records || []} />
    </div>
  )
}
