'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search, Filter, X, Plus, Trash2 } from 'lucide-react'

type Operator = 'eq' | 'gte' | 'lte' | 'ilike'

interface FilterRule {
  id: string
  field: string
  operator: Operator
  value: string
}

const FIELD_CONFIGS: Record<string, { label: string, type: 'number' | 'text' | 'select', options?: {value: string, label: string}[], operators: {value: Operator, label: string}[] }> = {
  months_in_operation: {
    label: 'Meses de Operación',
    type: 'number',
    operators: [
      { value: 'gte', label: 'Mayor o igual a (>=)' },
      { value: 'lte', label: 'Menor o igual a (<=)' },
      { value: 'eq', label: 'Igual a (==)' }
    ]
  },
  ram_gb: {
    label: 'RAM (GB)',
    type: 'number',
    operators: [
      { value: 'gte', label: 'Mayor o igual a (>=)' },
      { value: 'eq', label: 'Igual a (==)' }
    ]
  },
  storage_gb: {
    label: 'Disco (GB)',
    type: 'number',
    operators: [
      { value: 'gte', label: 'Mayor o igual a (>=)' },
      { value: 'eq', label: 'Igual a (==)' }
    ]
  },
  status: {
    label: 'Estado',
    type: 'select',
    options: [
      { value: 'EN_BODEGA', label: 'En Bodega' },
      { value: 'ASIGNADO', label: 'Asignado' },
      { value: 'PRESTAMO_TEMPORAL', label: 'Préstamo Temporal' },
      { value: 'EN_REEMPLAZO_LAB', label: 'Reemplazo Siniestro' },
      { value: 'EN_LABORATORIO_SONDA', label: 'En Lab Sonda' },
      { value: 'DE_BAJA_RENOVADO', label: 'De Baja' }
    ],
    operators: [
      { value: 'eq', label: 'Es exactamente' }
    ]
  },
  category: {
    label: 'Categoría',
    type: 'select',
    options: [
      { value: 'LAPTOP', label: 'Laptop' },
      { value: 'DESKTOP', label: 'Desktop' },
      { value: 'TABLET', label: 'Tablet' },
      { value: 'PRINTER_COLOR', label: 'Impresora Color' },
      { value: 'PRINTER_BN', label: 'Impresora B/N' }
    ],
    operators: [
      { value: 'eq', label: 'Es exactamente' }
    ]
  },
  brand: {
    label: 'Marca',
    type: 'text',
    operators: [
      { value: 'ilike', label: 'Contiene' },
      { value: 'eq', label: 'Es exactamente' }
    ]
  }
}

export default function InventoryFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState(searchParams.get('q') || '')
  const [rules, setRules] = useState<FilterRule[]>([])

  // Inicializar reglas desde URL
  useEffect(() => {
    const filtersParam = searchParams.get('filters')
    if (filtersParam) {
      const parsedRules = filtersParam.split('|').map((ruleStr, index) => {
        const [field, operator, value] = ruleStr.split(':')
        return { id: `rule-${index}-${Date.now()}`, field, operator: operator as Operator, value: value || '' }
      }).filter(r => r.field && r.operator)
      setRules(parsedRules)
      if (parsedRules.length > 0) setIsOpen(true)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Búsqueda rápida por texto (debounced)
  useEffect(() => {
    const handler = setTimeout(() => {
      applyFilters(query, rules)
    }, 400)
    return () => clearTimeout(handler)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query])

  const applyFilters = (q: string, activeRules: FilterRule[]) => {
    const params = new URLSearchParams()
    if (q) params.set('q', q)
    
    const validRules = activeRules.filter(r => r.field && r.operator && r.value)
    if (validRules.length > 0) {
      const filtersStr = validRules.map(r => `${r.field}:${r.operator}:${r.value}`).join('|')
      params.set('filters', filtersStr)
    }
    
    router.push(`/inventory?${params.toString()}`)
  }

  const addRule = () => {
    setRules([...rules, { id: `rule-${Date.now()}`, field: 'months_in_operation', operator: 'gte', value: '' }])
  }

  const removeRule = (id: string) => {
    setRules(rules.filter(r => r.id !== id))
  }

  const updateRule = (id: string, updates: Partial<FilterRule>) => {
    setRules(rules.map(r => {
      if (r.id === id) {
        const updated = { ...r, ...updates }
        // Si cambia el field, resetear el operador al primero disponible y vaciar el valor
        if (updates.field && updates.field !== r.field) {
          updated.operator = FIELD_CONFIGS[updates.field].operators[0].value
          updated.value = ''
        }
        return updated
      }
      return r
    }))
  }

  const handleApplyRules = () => {
    applyFilters(query, rules)
  }

  const handleClearRules = () => {
    setRules([])
    applyFilters(query, [])
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-xl mb-6">
      {/* Barra de Búsqueda Rápida */}
      <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative max-w-md w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input 
            type="text" 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar específicamente por Serie, Modelo o Usuario..." 
            className="w-full bg-slate-950 border border-slate-700 text-white text-sm rounded-lg pl-10 pr-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
          />
        </div>
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors border ${
            isOpen || rules.length > 0
              ? 'bg-indigo-600/20 text-indigo-400 border-indigo-500/50' 
              : 'text-slate-300 bg-slate-800 hover:bg-slate-700 border-slate-700'
          }`}
        >
          <Filter className="w-4 h-4" />
          {rules.length > 0 ? `Filtros Activos (${rules.filter(r => r.value).length})` : 'Filtros Analíticos'}
        </button>
      </div>

      {/* Constructor Dinámico de Filtros */}
      {isOpen && (
        <div className="p-4 bg-slate-800/30 border-b border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-slate-300">Reglas de Filtrado</h3>
            <button 
              onClick={addRule}
              className="text-xs font-medium text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
            >
              <Plus className="w-3 h-3" /> Añadir Regla
            </button>
          </div>

          {rules.length === 0 ? (
            <div className="text-center py-6 text-sm text-slate-500 bg-slate-950/50 rounded-lg border border-slate-800/50 border-dashed">
              No hay reglas activas. Presiona "Añadir Regla" para cruzar variables (ej: Meses de operación &gt;= 48).
            </div>
          ) : (
            <div className="space-y-3">
              {rules.map((rule) => {
                const config = FIELD_CONFIGS[rule.field]
                return (
                  <div key={rule.id} className="flex flex-col sm:flex-row gap-3 items-start sm:items-center bg-slate-950 p-3 rounded-lg border border-slate-800">
                    {/* Campo */}
                    <select 
                      value={rule.field}
                      onChange={e => updateRule(rule.id, { field: e.target.value })}
                      className="w-full sm:w-48 bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded px-3 py-1.5 focus:ring-1 focus:ring-indigo-500 outline-none"
                    >
                      {Object.entries(FIELD_CONFIGS).map(([key, conf]) => (
                        <option key={key} value={key}>{conf.label}</option>
                      ))}
                    </select>

                    {/* Operador */}
                    <select 
                      value={rule.operator}
                      onChange={e => updateRule(rule.id, { operator: e.target.value as Operator })}
                      className="w-full sm:w-48 bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded px-3 py-1.5 focus:ring-1 focus:ring-indigo-500 outline-none"
                    >
                      {config.operators.map(op => (
                        <option key={op.value} value={op.value}>{op.label}</option>
                      ))}
                    </select>

                    {/* Valor */}
                    <div className="w-full sm:flex-1 flex gap-2 items-center">
                      {config.type === 'select' ? (
                        <select 
                          value={rule.value}
                          onChange={e => updateRule(rule.id, { value: e.target.value })}
                          className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded px-3 py-1.5 focus:ring-1 focus:ring-indigo-500 outline-none"
                        >
                          <option value="">Selecciona...</option>
                          {config.options?.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      ) : (
                        <input 
                          type={config.type}
                          value={rule.value}
                          onChange={e => updateRule(rule.id, { value: e.target.value })}
                          placeholder={`Valor para ${config.label.toLowerCase()}...`}
                          className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded px-3 py-1.5 focus:ring-1 focus:ring-indigo-500 outline-none"
                        />
                      )}
                      
                      <button 
                        onClick={() => removeRule(rule.id)}
                        className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded transition-colors"
                        title="Eliminar regla"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
            <button 
              onClick={handleClearRules}
              className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white transition-colors flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              Limpiar Reglas
            </button>
            <button 
              onClick={handleApplyRules}
              disabled={rules.length > 0 && rules.some(r => !r.value)}
              className="px-4 py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
            >
              Aplicar Reglas
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
