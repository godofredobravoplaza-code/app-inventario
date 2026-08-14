'use client'

import { useState } from 'react'
import { Plus, Trash2, Search, Edit } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function EmployeeTab({ initialRecords }: { initialRecords: any[] }) {
  const [records, setRecords] = useState(initialRecords)
  const [searchTerm, setSearchTerm] = useState('')
  const [isAdding, setIsAdding] = useState(false)
  
  const [newRut, setNewRut] = useState('')
  const [newName, setNewName] = useState('')
  const [newTitle, setNewTitle] = useState('')
  const [newEmail, setNewEmail] = useState('')

  const supabase = createClient()
  const router = useRouter()

  const filteredRecords = records.filter(r => 
    r.full_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    r.rut.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleAdd = async () => {
    if (!newRut || !newName) return alert('RUT y Nombre son obligatorios')
    
    setIsAdding(true)
    const { data, error } = await supabase
      .from('employees')
      .insert({ 
        rut: newRut.toUpperCase(), 
        full_name: newName.toUpperCase(),
        job_title: newTitle || null,
        email: newEmail || null
      })
      .select()
      .single()

    if (error) {
      alert('Error al agregar: ' + error.message)
    } else if (data) {
      setRecords([...records, data].sort((a, b) => a.full_name.localeCompare(b.full_name)))
      setNewRut('')
      setNewName('')
      setNewTitle('')
      setNewEmail('')
      router.refresh()
    }
    setIsAdding(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este usuario del directorio?')) return
    
    const { error } = await supabase
      .from('employees')
      .delete()
      .eq('id', id)

    if (error) {
      alert('No se puede eliminar porque hay registros históricos asociados.')
    } else {
      setRecords(records.filter(r => r.id !== id))
      router.refresh()
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col xl:flex-row gap-4 justify-between items-start xl:items-end">
        <div className="relative w-full xl:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por Nombre o RUT..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:ring-1 focus:ring-indigo-500 outline-none"
          />
        </div>

        <div className="flex flex-wrap gap-2 w-full xl:w-auto bg-slate-950 p-2 rounded-lg border border-slate-800">
          <input 
            type="text" 
            placeholder="RUT" 
            value={newRut}
            onChange={e => setNewRut(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-sm text-white w-24 sm:w-28 outline-none uppercase"
          />
          <input 
            type="text" 
            placeholder="Nombre Completo" 
            value={newName}
            onChange={e => setNewName(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-sm text-white w-full sm:w-48 outline-none uppercase"
          />
          <input 
            type="text" 
            placeholder="Cargo (Opcional)" 
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-sm text-white w-full sm:w-36 outline-none"
          />
          <input 
            type="email" 
            placeholder="Email (Opcional)" 
            value={newEmail}
            onChange={e => setNewEmail(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-sm text-white w-full sm:w-48 outline-none"
          />
          <button 
            onClick={handleAdd}
            disabled={isAdding}
            className="bg-indigo-600 hover:bg-indigo-700 text-white p-1.5 rounded disabled:opacity-50 transition-colors shrink-0"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-800">
        <table className="w-full text-left text-sm text-slate-300">
          <thead className="bg-slate-950 text-slate-400 font-medium">
            <tr>
              <th className="px-4 py-3">RUT</th>
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">Cargo</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50 bg-slate-900/30">
            {filteredRecords.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-slate-500">
                  No hay usuarios registrados.
                </td>
              </tr>
            ) : (
              filteredRecords.map(record => (
                <tr key={record.id} className="hover:bg-slate-800/50">
                  <td className="px-4 py-2.5 font-mono text-xs">{record.rut}</td>
                  <td className="px-4 py-2.5 font-medium text-slate-200">{record.full_name}</td>
                  <td className="px-4 py-2.5 text-slate-400">{record.job_title || '-'}</td>
                  <td className="px-4 py-2.5 text-slate-400">{record.email || '-'}</td>
                  <td className="px-4 py-2.5 text-right flex justify-end gap-1">
                    {/* Botón Edit placeholder - requiere más estado para edición inline */}
                    <button className="text-slate-500 hover:text-indigo-400 p-1 transition-colors" title="Editar">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDelete(record.id)}
                      className="text-slate-500 hover:text-red-400 p-1 transition-colors"
                      title="Eliminar"
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
