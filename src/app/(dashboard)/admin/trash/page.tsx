import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import TrashList from './trash-list'

export default async function TrashPage() {
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
    .from('inventory')
    .select('*')
    .not('deleted_at', 'is', null)
    .order('deleted_at', { ascending: false })

  if (error) {
    console.error("Error fetching trashed items:", error)
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Papelera de Reciclaje</h1>
          <p className="text-slate-400 text-sm mt-1">
            Equipos que han sido eliminados del inventario principal. Puedes restaurarlos desde aquí.
          </p>
        </div>
      </div>

      <TrashList initialRecords={records || []} />
    </div>
  )
}
