import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import DerForm from './der-form'
import type { InventoryItem, Profile } from '@/lib/supabase/types'

export default async function NewDerPage(props: { searchParams: Promise<{ id?: string }> }) {
  const searchParams = await props.searchParams
  const draftId = searchParams?.id
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

  // Fetch only equipment that can be assigned (in warehouse, or recovered)
  // According to business logic, maybe 'EN_BODEGA' or 'RECUPERADO_SIN_ACTA'
  const { data: availableEquipment } = await supabase
    .from('inventory')
    .select('*')
    .in('status', ['EN_BODEGA', 'RECUPERADO_SIN_ACTA', 'PRESTAMO_TEMPORAL', 'EN_LABORATORIO_SONDA'])
    .is('deleted_at', null)
    .order('category', { ascending: true })

  // Fetch Technicians
  const { data: technicians } = await supabase
    .from('profiles')
    .select('*')
    .in('role', ['ADMIN', 'OPERATOR'])

  const { data: { user } } = await supabase.auth.getUser()

  let draftData = null
  if (draftId) {
    const { data: draft } = await supabase
      .from('der_records')
      .select('*')
      .eq('id', draftId)
      .single()
    
    if (draft && draft.form_data) {
      draftData = { ...draft.form_data, id: draft.id }
    }
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white tracking-tight">Nueva Acta de Entrega (DER)</h1>
      </div>

      <DerForm 
        availableEquipment={(availableEquipment as InventoryItem[]) || []} 
        technicians={(technicians as Profile[]) || []}
        currentUserEmail={user?.email || ''}
        draftData={draftData}
      />
    </div>
  )
}
