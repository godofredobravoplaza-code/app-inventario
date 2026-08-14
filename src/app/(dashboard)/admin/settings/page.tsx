import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import SettingsTabs from './settings-tabs'

export default async function SettingsPage() {
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

  // Fetch catalogs
  const [modelsRes, employeesRes] = await Promise.all([
    supabase.from('models_catalog').select('*').order('brand'),
    supabase.from('employees').select('*').order('full_name')
  ])

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Mantenedores y Ajustes</h1>
          <p className="text-slate-400 text-sm mt-1">
            Administra los catálogos base (Modelos, Usuarios) que alimentan la aplicación.
          </p>
        </div>
      </div>

      <SettingsTabs 
        initialModels={modelsRes.data || []} 
        initialEmployees={employeesRes.data || []} 
      />
    </div>
  )
}
