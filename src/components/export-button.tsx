'use client'

import { Download } from 'lucide-react'
import type { InventoryItem } from '@/lib/supabase/types'
import * as XLSX from 'xlsx'

interface ExportButtonProps {
  data: InventoryItem[] | null
}

export default function ExportButton({ data }: ExportButtonProps) {
  const handleExport = () => {
    if (!data || data.length === 0) {
      alert("No hay datos para exportar")
      return
    }

    // Preparar los datos en formato de array de objetos para SheetJS
    const exportData = data.map(item => ({
      'Serie': item.serial_number || '',
      'Tag Activo': item.asset_tag || '',
      'Categoría': item.category || '',
      'Marca': item.brand || '',
      'Modelo': item.model || '',
      'RAM (GB)': item.ram_gb || '',
      'Disco (GB)': item.storage_gb || '',
      'Estado': item.status || '',
      'Asignado a': item.current_user_name || '',
      'RUT Asignado': item.current_user_rut || '',
      'Cuenta (User)': item.current_user_account || '',
      'Ticket': item.assignment_ticket || '',
      'Meses Operación': item.months_in_operation || 0,
      'Fecha Recepción': item.reception_date || ''
    }))

    // Crear un libro de trabajo y una hoja
    const worksheet = XLSX.utils.json_to_sheet(exportData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Inventario")

    // Ajustar el ancho de las columnas (opcional pero recomendado)
    const colWidths = [
      { wch: 20 }, // Serie
      { wch: 15 }, // Tag
      { wch: 20 }, // Categoría
      { wch: 15 }, // Marca
      { wch: 20 }, // Modelo
      { wch: 10 }, // RAM
      { wch: 10 }, // Disco
      { wch: 20 }, // Estado
      { wch: 25 }, // Asignado a
      { wch: 15 }, // RUT
      { wch: 15 }, // Cuenta
      { wch: 15 }, // Ticket
      { wch: 15 }, // Meses
      { wch: 15 }  // Fecha Recepción
    ]
    worksheet['!cols'] = colWidths

    // Generar archivo Excel y descargar
    const fileName = `reporte_inventario_${new Date().toISOString().split('T')[0]}.xlsx`
    XLSX.writeFile(workbook, fileName)
  }

  return (
    <button
      onClick={handleExport}
      disabled={!data || data.length === 0}
      className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-lg shadow-emerald-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
      title="Exportar tabla a formato Excel (.xlsx)"
    >
      <Download className="w-5 h-5" />
      Exportar Excel
    </button>
  )
}
