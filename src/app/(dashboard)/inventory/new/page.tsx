import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import InventoryForm from './inventory-form'
import { ModelCatalogItem } from '@/lib/supabase/types'

export default async function NewInventoryPage() {
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

  // Fetch the current catalog to pass to the client form for autocomplete
  const { data: catalog } = await supabase
    .from('models_catalog')
    .select('*')
    .order('brand')
    .order('model')

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Ingresar Equipo</h1>
        <p className="text-slate-400 text-sm mt-1">
          Registra un nuevo equipo en el inventario o actualiza uno antiguo.
        </p>
      </div>

      <InventoryForm initialCatalog={(catalog as ModelCatalogItem[]) || []} />
    </div>
  )
}
