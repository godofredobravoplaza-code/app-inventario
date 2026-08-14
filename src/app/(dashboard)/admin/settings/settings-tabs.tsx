'use client'

import { useState } from 'react'
import { Server, Users } from 'lucide-react'
import ModelCatalogTab from './model-catalog-tab'
import EmployeeTab from './employee-tab'

export default function SettingsTabs({ 
  initialModels, 
  initialEmployees 
}: { 
  initialModels: any[], 
  initialEmployees: any[] 
}) {
  const [activeTab, setActiveTab] = useState<'models' | 'employees'>('models')

  return (
    <div className="space-y-6">
      <div className="flex space-x-1 bg-slate-900/50 p-1 rounded-xl border border-slate-800 w-fit">
        <button
          onClick={() => setActiveTab('models')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
            activeTab === 'models' 
              ? 'bg-slate-800 text-white shadow-sm' 
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <Server className="w-4 h-4" />
          Catálogo de Modelos
        </button>
        <button
          onClick={() => setActiveTab('employees')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
            activeTab === 'employees' 
              ? 'bg-slate-800 text-white shadow-sm' 
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <Users className="w-4 h-4" />
          Directorio de Usuarios
        </button>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl p-4 sm:p-6">
        {activeTab === 'models' && <ModelCatalogTab initialRecords={initialModels} />}
        {activeTab === 'employees' && <EmployeeTab initialRecords={initialEmployees} />}
      </div>
    </div>
  )
}
