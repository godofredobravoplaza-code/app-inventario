import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import EditInventoryForm from './edit-inventory-form'

export default async function EditEquipmentPage({
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

  // Fetch Catalog
  const { data: catalog } = await supabase.from('models_catalog').select('*')

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
    <div className="space-y-6 max-w-4xl mx-auto mb-20 p-6 md:p-8">
      <div className="flex items-center gap-4 mb-6">
        <Link 
          href={`/inventory/${equipmentId}`}
          className="p-2 text-slate-400 hover:text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors border border-slate-800"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">Editar Equipo</h1>
          <p className="text-slate-400 text-sm mt-1">S/N: {equipment.serial_number}</p>
        </div>
      </div>

      <EditInventoryForm equipment={equipment} catalog={catalog || []} />
    </div>
  )
}
