'use client'

import { useState } from 'react'
import { Plus, Trash2, Search } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function ModelCatalogTab({ initialRecords }: { initialRecords: any[] }) {
  const [records, setRecords] = useState(initialRecords)
  const [searchTerm, setSearchTerm] = useState('')
  const [isAdding, setIsAdding] = useState(false)
  
  // New item state
  const [newCategory, setNewCategory] = useState('LAPTOP')
  const [newBrand, setNewBrand] = useState('')
  const [newModel, setNewModel] = useState('')

  const supabase = createClient()
  const router = useRouter()

  const filteredRecords = records.filter(r => 
    r.brand.toLowerCase().includes(searchTerm.toLowerCase()) || 
    r.model.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleAdd = async () => {
    if (!newBrand || !newModel) return alert('La marca y el modelo son obligatorios')
    
    setIsAdding(true)
    const { data, error } = await supabase
      .from('models_catalog')
      .insert({ category: newCategory, brand: newBrand.toUpperCase(), model: newModel.toUpperCase() })
      .select()
      .single()

    if (error) {
      alert('Error al agregar: ' + error.message)
    } else if (data) {
      setRecords([...records, data])
      setNewBrand('')
      setNewModel('')
      router.refresh()
    }
    setIsAdding(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este modelo del catálogo?')) return
    
    // Attempt delete (will fail if there are foreign key constraints from inventory)
    const { error } = await supabase
      .from('models_catalog')
      .delete()
      .eq('id', id)

    if (error) {
      alert('No se puede eliminar porque hay equipos en el inventario usando este modelo.')
    } else {
      setRecords(records.filter(r => r.id !== id))
      router.refresh()
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-end">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar marca o modelo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:ring-1 focus:ring-indigo-500 outline-none"
          />
        </div>

        <div className="flex gap-2 w-full sm:w-auto bg-slate-950 p-2 rounded-lg border border-slate-800">
          <select 
            value={newCategory} 
            onChange={e => setNewCategory(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-sm text-white outline-none"
          >
            <option value="LAPTOP">Laptop</option>
            <option value="DESKTOP">Desktop</option>
            <option value="PRINTER_BN">Impresora B/N</option>
            <option value="PRINTER_COLOR">Impresora Color</option>
            <option value="TABLET">Tablet</option>
            <option value="SERVER">Servidor</option>
            <option value="VIDEO_CONFERENCIA">Video Conferencia</option>
          </select>
          <input 
            type="text" 
            placeholder="Marca" 
            value={newBrand}
            onChange={e => setNewBrand(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-sm text-white w-24 sm:w-32 outline-none uppercase"
          />
          <input 
            type="text" 
            placeholder="Modelo" 
            value={newModel}
            onChange={e => setNewModel(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-sm text-white w-24 sm:w-32 outline-none uppercase"
          />
          <button 
            onClick={handleAdd}
            disabled={isAdding}
            className="bg-indigo-600 hover:bg-indigo-700 text-white p-1.5 rounded disabled:opacity-50 transition-colors"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-800">
        <table className="w-full text-left text-sm text-slate-300">
          <thead className="bg-slate-950 text-slate-400 font-medium">
            <tr>
              <th className="px-4 py-3">Categoría</th>
              <th className="px-4 py-3">Marca</th>
              <th className="px-4 py-3">Modelo</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50 bg-slate-900/30">
            {filteredRecords.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-slate-500">
                  No hay modelos registrados.
                </td>
              </tr>
            ) : (
              filteredRecords.map(record => (
                <tr key={record.id} className="hover:bg-slate-800/50">
                  <td className="px-4 py-2.5">{record.category}</td>
                  <td className="px-4 py-2.5 font-medium text-slate-200">{record.brand}</td>
                  <td className="px-4 py-2.5 font-medium text-slate-200">{record.model}</td>
                  <td className="px-4 py-2.5 text-right">
                    <button 
                      onClick={() => handleDelete(record.id)}
                      className="text-slate-500 hover:text-red-400 p-1 transition-colors"
                      title="Eliminar (si no está en uso)"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
