import Link from 'next/link'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Plus, Eye } from 'lucide-react'
import type { InventoryItem } from '@/lib/supabase/types'
import InventoryFilters from './inventory-filters'
import ExportButton from '@/components/export-button'

export default async function InventoryPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
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

  const params = await searchParams
  const q = params.q as string || ''
  const filtersParam = params.filters as string || ''

  let query = supabase
    .from('inventory')
    .select('*')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  // 1. Búsqueda principal
  if (q) {
    query = query.or(`serial_number.ilike.%${q}%,model.ilike.%${q}%,current_user_name.ilike.%${q}%`)
  }

  // 2. Filtros analíticos dinámicos
  if (filtersParam) {
    const rules = filtersParam.split('|')
    rules.forEach(ruleStr => {
      const [field, operator, value] = ruleStr.split(':')
      if (field && operator && value) {
        // Validar que el valor sea numérico si el campo lo requiere
        const numFields = ['ram_gb', 'storage_gb', 'months_in_operation']
        const finalValue = numFields.includes(field) ? parseInt(value) : value
        
        switch (operator) {
          case 'eq':
            query = query.eq(field, finalValue)
            break
          case 'gte':
            query = query.gte(field, finalValue)
            break
          case 'lte':
            query = query.lte(field, finalValue)
            break
          case 'ilike':
            query = query.ilike(field, `%${value}%`)
            break
        }
      }
    })
  }

  const { data: inventory, error } = await query

  if (error) {
    console.error('Error fetching inventory:', error)
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-500/10 border border-red-500/50 p-4 rounded-lg text-red-400 mb-4">
          Error cargando inventario: {error.message || error.details}
        </div>
      )}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Inventario General</h1>
          <p className="text-slate-400 text-sm mt-1">
            Gestiona los equipos tecnológicos de la planta.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <ExportButton data={inventory} />
          
          <Link 
            href="/inventory/new" 
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-lg shadow-indigo-600/20"
          >
            <Plus className="w-5 h-5" />
            Nuevo Equipo
          </Link>
        </div>
      </div>

      <InventoryFilters />

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-950/50 text-slate-400 text-xs uppercase tracking-wider">
                <th className="px-6 py-4 font-medium border-b border-slate-800">S/N - Tag</th>
                <th className="px-6 py-4 font-medium border-b border-slate-800">Categoría</th>
                <th className="px-6 py-4 font-medium border-b border-slate-800">Marca / Modelo</th>
                <th className="px-6 py-4 font-medium border-b border-slate-800">Estado</th>
                <th className="px-6 py-4 font-medium border-b border-slate-800">Asignado a</th>
                <th className="px-6 py-4 font-medium border-b border-slate-800">Vida Útil</th>
                <th className="px-6 py-4 font-medium border-b border-slate-800 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-sm">
              {!inventory || inventory.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                    No hay equipos registrados que coincidan con la búsqueda.
                  </td>
                </tr>
              ) : (
                inventory.map((item: InventoryItem) => (
                  <tr key={item.id} className="hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-white">{item.serial_number}</div>
                      <div className="text-slate-500 text-xs mt-0.5">{item.asset_tag || '-'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2 py-1 rounded-md bg-slate-800 text-slate-300 text-xs font-medium border border-slate-700">
                        {item.category}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-slate-200">{item.brand}</div>
                      <div className="text-slate-400 text-xs mt-0.5">{item.model}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        item.status === 'EN_BODEGA' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                        item.status === 'ASIGNADO' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                        'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}>
                        {item.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-slate-200">
                        {item.status === 'ASIGNADO' 
                          ? (item.current_user_name || 'Dato Faltante') 
                          : 'Sin Asignar'}
                      </div>
                      <div className="text-slate-500 text-xs mt-0.5">{item.current_user_rut || ''}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-300">
                      {item.months_in_operation} meses
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link 
                        href={`/inventory/${item.id}`}
                        className="p-2 inline-flex text-slate-400 hover:text-white bg-slate-800 hover:bg-indigo-600 rounded-lg transition-colors border border-slate-700 hover:border-indigo-500"
                        title="Ver Detalles e Historial"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
