import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import GuideScanner from './guide-scanner'

export default async function GuidesPage() {
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

  const { data: catalog } = await supabase
    .from('models_catalog')
    .select('*')
    .order('brand', { ascending: true })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Procesar Guía de Despacho</h1>
        <p className="text-slate-400 text-sm mt-1">
          Ingreso masivo de equipos mediante escáner de código de barras.
        </p>
      </div>

      <GuideScanner initialCatalog={catalog || []} />
    </div>
  )
}
