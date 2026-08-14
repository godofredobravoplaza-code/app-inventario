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

  // Fetch catalogs and legacy data
  const [modelsRes, employeesRes, inventoryRes, derRes] = await Promise.all([
    supabase.from('models_catalog').select('*').order('brand'),
    supabase.from('employees').select('*').order('full_name'),
    supabase.from('inventory').select('brand, model, category, current_user_name, current_user_rut, current_user_account'),
    supabase.from('der_records').select('user_name, user_rut')
  ])

  // Process and merge distinct models
  const existingModels = new Set((modelsRes.data || []).map(m => `${m.brand?.toUpperCase()}|${m.model?.toUpperCase()}`))
  const mergedModels = [...(modelsRes.data || [])]

  if (inventoryRes.data) {
    inventoryRes.data.forEach(item => {
      if (!item.brand || !item.model) return
      const key = `${item.brand.toUpperCase()}|${item.model.toUpperCase()}`
      if (!existingModels.has(key)) {
        existingModels.add(key)
        mergedModels.push({
          id: `temp_model_${key}`,
          brand: item.brand.toUpperCase(),
          model: item.model.toUpperCase(),
          category: item.category || 'LAPTOP',
          _is_unregistered: true // Custom flag to identify it needs saving
        })
      }
    })
  }

  // Process and merge distinct users
  const existingUsers = new Set((employeesRes.data || []).map(e => e.rut))
  const mergedEmployees = [...(employeesRes.data || [])]

  const processUser = (rut: string | null, name: string | null, account: string | null = null) => {
    if (!rut || !name) return
    const formattedRut = rut.trim().toUpperCase()
    if (!existingUsers.has(formattedRut)) {
      existingUsers.add(formattedRut)
      mergedEmployees.push({
        id: `temp_user_${formattedRut}`,
        rut: formattedRut,
        full_name: name.trim().toUpperCase(),
        account_name: account || null,
        _is_unregistered: true // Custom flag
      })
    }
  }

  if (inventoryRes.data) {
    inventoryRes.data.forEach(item => processUser(item.current_user_rut, item.current_user_name, item.current_user_account))
  }
  if (derRes.data) {
    derRes.data.forEach(item => processUser(item.user_rut, item.user_name))
  }

  // Sort them
  mergedModels.sort((a, b) => a.brand.localeCompare(b.brand))
  mergedEmployees.sort((a, b) => a.full_name.localeCompare(b.full_name))

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
        initialModels={mergedModels} 
        initialEmployees={mergedEmployees} 
      />
    </div>
  )
}
