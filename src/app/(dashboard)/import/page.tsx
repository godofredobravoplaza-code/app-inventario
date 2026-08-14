'use client'

import { useState } from 'react'
import { FileUp, FileText, Brain, UploadCloud, FileSpreadsheet, Loader2, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react'

import { createClient } from '@/lib/supabase/client'

export default function ImportPage() {
  const [activeTab, setActiveTab] = useState<'excel' | 'ai'>('excel')
  const [file, setFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [result, setResult] = useState<any>(null)
  
  // Document Type state
  const [documentType, setDocumentType] = useState<'DER' | 'RECEPTION' | 'RETURN'>('DER')
  
  // Conflict and Renewal states
  const [conflicts, setConflicts] = useState<any[]>([])
  const [oldEquipments, setOldEquipments] = useState<any[]>([])
  const [conflictDecisions, setConflictDecisions] = useState<Record<string, any>>({})


  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0])
      setResult(null)
    }
  }

  const handleProcessExcel = async () => {
    if (!file) return
    setIsProcessing(true)
    
    try {
      const reader = new FileReader()
      reader.onload = async (e) => {
        const data = e.target?.result
        // Here we'll dynamically load xlsx to avoid huge client bundle
        const XLSX = await import('xlsx')
        const workbook = XLSX.read(data, { type: 'array' })
        
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
        const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 })
        
        // Basic mapping logic for DER template
        const extracted = {
          userName: '',
          rut: '',
          receptionDate: '',
          ticketNumber: '',
          items: [] as any[]
        }
        
        // Find user name and rut based on typical positions or text search
        for (let r = 0; r < jsonData.length; r++) {
          const row: any = jsonData[r]
          if (!row) continue;
          
          for (let c = 0; c < row.length; c++) {
            const cell = String(row[c] || '').toLowerCase()
            if (cell.includes('nombre usuario') && c + 1 < row.length) {
              extracted.userName = row[c+1]
            }
            if (cell.includes('rut') && c + 1 < row.length) {
              extracted.rut = row[c+1]
            }
            // If it's a table row for equipment
            if (cell === 'laptop' || cell === 'desktop') {
              extracted.items.push({
                type: row[c],
                brand: row[c+1] || '',
                model: row[c+2] || '',
                serial: row[c+3] || ''
              })
            }
          }
        }
        
        setResult(extracted)
        setIsProcessing(false)
      }
      reader.readAsArrayBuffer(file)
    } catch (err) {
      console.error(err)
      setIsProcessing(false)
    }
  }

  const handleProcessAI = async () => {
    if (!file) return
    setIsProcessing(true)

    try {
      const formData = new FormData()
      formData.append('file', file)
      
      const res = await fetch('/api/extract', {
        method: 'POST',
        body: formData
      })
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Error de red o servidor');
      }
      const data = await res.json()
      
      // Data crossing with Supabase (Conflicts and Renewals)
      const supabase = createClient()
      const serials = data.items?.map((i: any) => i.serial).filter(Boolean) || []
      
      let foundConflicts = []
      let foundOldEquipments = []
      
      if (serials.length > 0) {
        const { data: existingEquipments } = await supabase
          .from('inventory')
          .select('*')
          .in('serial_number', serials)
        
        if (existingEquipments && existingEquipments.length > 0) {
          foundConflicts = existingEquipments
        }
      }
      
      if (data.rut) {
        // Find if user already has an equipment of the same category
        const categories = Array.from(new Set(data.items?.map((i:any) => (i.category || i.type)?.toUpperCase()).filter(Boolean)))
        if (categories.length > 0) {
          const { data: userEquipments } = await supabase
            .from('inventory')
            .select('*')
            .eq('current_user_rut', data.rut)
            .in('category', categories)
          
          if (userEquipments && userEquipments.length > 0) {
            // Filter out those that are part of the new document to avoid self-conflicts
            foundOldEquipments = userEquipments.filter(ue => !serials.includes(ue.serial_number))
          }
        }
      }

      setConflicts(foundConflicts)
      setOldEquipments(foundOldEquipments)
      setConflictDecisions({})
      setResult(data)
    } catch (err: any) {
      console.error(err)
      alert("Error: " + err.message)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleSaveToDrafts = async () => {
    if (!result) return;
    setIsProcessing(true);
    try {
      const supabase = createClient();
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        throw new Error("No se pudo verificar la sesión activa.");
      }

      const draftData = {
        ticket_number: result.ticketNumber || 'S/N',
        user_name: result.userName || '',
        user_rut: result.rut || '',
        status: 'DRAFT',
        form_data: {
          ...result,
          conflictDecisions // Include decisions made in UI
        },
        created_by: user.id
      };

      const { error } = await supabase
        .from('der_records')
        .insert([draftData]);

      if (error) throw error;
      
      alert("Borrador guardado exitosamente. Podrás completarlo en la sección de DER.");
      setResult(null);
      setFile(null);
      setConflicts([]);
      setOldEquipments([]);
      setConflictDecisions({});
    } catch (err: any) {
      console.error(err);
      alert("Error al guardar borrador: " + err.message);
    } finally {
      setIsProcessing(false);
    }
  }

  const handleImportOfficial = async () => {
    if (!result) return;
    setIsProcessing(true);
    
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error("Usuario no autenticado");
      }

      // Upsert User (Employee)
      if (result.rut) {
        await supabase.from('employees').upsert({
          rut: result.rut,
          full_name: result.userName || '',
          updated_at: new Date().toISOString()
        }, { onConflict: 'rut' });
      }

      let fileName = null;
      if (file) {
        fileName = `${Date.now()}_IMPORT_${result.ticketNumber || 'SN'}_${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from('actas_der')
          .upload(fileName, file, { cacheControl: '3600', upsert: false });
          
        if (uploadError) {
          console.warn("No se pudo subir el archivo PDF/Imagen a Storage:", uploadError);
          fileName = null;
        }
      }

      const equipmentIds: string[] = [];

      // Procesar equipos
      for (const item of (result.items || [])) {
        const decision = conflictDecisions[item.serial] || conflictDecisions[item.category || item.type];
        
        // 1. Manejo de Conflictos de Serie
        if (decision?.type === 'CONFLICT' && decision?.action === 'IGNORE') {
          continue; // Saltar este equipo
        }

        let equipmentId = null;

        if (decision?.type === 'CONFLICT' && decision?.action === 'REASSIGN') {
          // Reasignar equipo existente
          equipmentId = decision.existingId;
          
          let reassignStatus = 'ASIGNADO';
          let reassignUser: string | null = result.userName;
          let reassignRut: string | null = result.rut;
          let reassignTicket: string | null = result.ticketNumber || null;
          
          if (item.action === 'DEVUELTO' || item.action === 'DEVOLUCION') {
            reassignStatus = documentType === 'RETURN' ? 'POR_DEVOLVER' : 'EN_BODEGA';
            reassignUser = null;
            reassignRut = null;
            reassignTicket = null;
          } else if (documentType === 'RECEPTION') {
            reassignStatus = 'EN_BODEGA';
            reassignUser = null;
            reassignRut = null;
            reassignTicket = null;
          } else if (documentType === 'RETURN') {
            reassignStatus = 'POR_DEVOLVER';
            reassignUser = null;
            reassignRut = null;
            reassignTicket = null;
          }

          const { error: eqError } = await supabase.from('inventory').update({
            status: reassignStatus,
            current_user_name: reassignUser,
            current_user_rut: reassignRut,
            assignment_ticket: reassignTicket,
            ...(result.receptionDate && documentType === 'RECEPTION' ? { reception_date: result.receptionDate } : {}),
            ...(result.receptionDate && documentType === 'DER' ? { assignment_date: result.receptionDate } : {}),
            ...(result.receptionDate && documentType === 'RETURN' ? { return_date: result.receptionDate } : {})
          }).eq('id', equipmentId);
          if (eqError) throw eqError;

        } else if (decision?.type === 'CONFLICT' && decision?.action === 'UPDATE_MISSING_DATA') {
          equipmentId = decision.existingId;
          
          let updatePayload: any = {};
          
          if (documentType === 'RECEPTION' && result.receptionDate) {
            updatePayload.reception_date = result.receptionDate;
            
            // Calculate leasing months automatically based on reception date
            const recDate = new Date(result.receptionDate);
            const now = new Date();
            const diffMonths = (now.getFullYear() - recDate.getFullYear()) * 12 + (now.getMonth() - recDate.getMonth());
            updatePayload.months_in_operation = Math.max(0, diffMonths);
          } else if (documentType === 'RETURN' && result.receptionDate) {
            updatePayload.return_date = result.receptionDate;
            updatePayload.status = 'POR_DEVOLVER';
            updatePayload.current_user_name = null;
            updatePayload.current_user_rut = null;
          } else if (documentType === 'DER' && result.receptionDate) {
            updatePayload.assignment_date = result.receptionDate;
          }

          if (Object.keys(updatePayload).length > 0) {
            const { error: eqError } = await supabase.from('inventory').update(updatePayload).eq('id', equipmentId);
            if (eqError) throw eqError;
          }

        } else {
          // Equipo Nuevo
          let statusStr = 'ASIGNADO';
          if (item.action === 'DEVUELTO' || item.action === 'DEVOLUCION') {
            statusStr = 'EN_BODEGA'; // Lo consideramos en bodega disponible, o POR_DEVOLVER dependiendo.
            if (documentType === 'RETURN') statusStr = 'POR_DEVOLVER';
          } else {
            if (documentType === 'RECEPTION') statusStr = 'EN_BODEGA';
            else if (documentType === 'RETURN') statusStr = 'POR_DEVOLVER';
          }

          const { data: newEq, error: eqError } = await supabase.from('inventory').insert({
            category: (item.type || item.category || 'OTRO').toUpperCase(),
            brand: item.brand || 'Desconocida',
            model: item.model || 'Desconocido',
            serial_number: item.serial || 'S/N',
            hostname: item.hostname || null,
            status: statusStr,
            current_user_name: documentType === 'DER' ? result.userName : null,
            current_user_rut: documentType === 'DER' ? result.rut : null,
            assignment_ticket: documentType === 'DER' ? (result.ticketNumber || null) : null,
            created_by: user.id,
            ...(documentType === 'RECEPTION' && result.receptionDate ? { reception_date: result.receptionDate } : {}),
            // Si es DER histórico o Guía, guardamos la fecha de creación en base a la fecha del documento
            ...(result.receptionDate ? { created_at: new Date(result.receptionDate).toISOString() } : {})
          }).select().single();
          
          if (eqError) throw eqError;
          equipmentId = newEq.id;
        }

        if (equipmentId) {
          equipmentIds.push(equipmentId);
          // Audit Log de Asignación
          await supabase.from('audit_logs').insert({
            equipment_id: equipmentId,
            performed_by: user.id,
            action_type: 'EQUIPMENT_ASSIGNED_IMPORT',
            new_data: { status: 'ASIGNADO', current_user_name: result.userName, ticket: result.ticketNumber }
          });
        }

        // 2. Manejo de Renovaciones (Equipo Antiguo)
        if (decision?.type === 'RENEWAL' && decision?.oldEquipmentAction && decision.oldEquipmentAction !== 'NONE') {
          const { error: oldEqError } = await supabase.from('inventory').update({
            status: decision.oldEquipmentAction,
            current_user_name: null,
            current_user_rut: null,
            current_user_account: null
          }).eq('id', decision.oldEquipmentId);

          if (!oldEqError) {
            await supabase.from('audit_logs').insert({
              equipment_id: decision.oldEquipmentId,
              performed_by: user.id,
              action_type: 'EQUIPMENT_RETURNED_RENEWAL',
              new_data: { status: decision.oldEquipmentAction }
            });
          }
        }
      }

      // Crear registros DER Definitivos por cada equipo
      for (const eqId of equipmentIds) {
        const draftData = {
          ticket_number: result.ticketNumber || 'S/N',
          user_name: result.userName || '',
          user_rut: result.rut || '',
          equipment_id: eqId,
          status: 'COMPLETED',
          document_type: documentType, // 'DER', 'RECEPTION', 'RETURN'
          drive_file_url: fileName,
          form_data: {
            ...result,
            conflictDecisions,
            imported_officially: true,
            imported_equipment_id: eqId,
            documentType: documentType
          },
          created_by: user.id
        };

        const { error: derError } = await supabase
          .from('der_records')
          .insert([draftData]);

        if (derError) throw derError;
      }
      
      alert("¡Importación Oficial exitosa! Los equipos ya están en el inventario oficial.");
      setResult(null);
      setFile(null);
      setConflicts([]);
      setOldEquipments([]);
      setConflictDecisions({});
    } catch (err: any) {
      console.error(err);
      alert("Error al importar oficialmente: " + err.message);
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white mb-2">Importación Histórica</h1>
        <p className="text-slate-400">Carga documentos pasados para poblar el inventario automáticamente.</p>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-slate-900/50 p-1 rounded-xl border border-slate-800 w-fit">
        <button 
          onClick={() => { setActiveTab('excel'); setFile(null); setResult(null); }}
          className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'excel' ? 'bg-indigo-500/20 text-indigo-400' : 'text-slate-400 hover:text-white'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4 mr-2" />
          Plantilla Excel
        </button>
        <button 
          onClick={() => { setActiveTab('ai'); setFile(null); setResult(null); }}
          className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'ai' ? 'bg-indigo-500/20 text-indigo-400' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Brain className="w-4 h-4 mr-2" />
          Extracción IA (PDF/Fotos)
        </button>
      </div>

      {/* Main Area */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8">
        
        <div className="border-2 border-dashed border-slate-700 rounded-xl p-10 flex flex-col items-center justify-center text-center">
          <UploadCloud className="w-12 h-12 text-slate-500 mb-4" />
          <h3 className="text-lg font-medium text-white mb-1">
            {activeTab === 'excel' ? 'Sube tu archivo Excel (.xlsx)' : 'Sube tu PDF o Foto (Guía / DER)'}
          </h3>
          <p className="text-sm text-slate-400 mb-6">
            Arrastra el archivo aquí o haz clic para seleccionar
          </p>
          <input 
            type="file" 
            id="file-upload" 
            className="hidden" 
            accept={activeTab === 'excel' ? '.xlsx,.xls' : '.pdf,image/*'}
            onChange={handleFileChange}
          />
          <label 
            htmlFor="file-upload" 
            className="bg-slate-800 hover:bg-slate-700 text-white px-6 py-2 rounded-lg cursor-pointer transition-colors border border-slate-700"
          >
            Seleccionar archivo
          </label>
          
          {file && (
            <div className="mt-6 flex flex-col items-center">
              <div className="flex items-center text-emerald-400 bg-emerald-400/10 px-4 py-2 rounded-lg mb-4">
                <FileText className="w-4 h-4 mr-2" />
                <span className="text-sm font-medium">{file.name}</span>
              </div>
              
              {!result && activeTab === 'ai' && (
                <div className="w-full max-w-sm mt-2">
                  <label className="block text-sm font-medium text-slate-300 mb-2">¿Qué tipo de documento es?</label>
                  <select 
                    value={documentType}
                    onChange={(e) => setDocumentType(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-white"
                  >
                    <option value="DER">Acta de Asignación / DER</option>
                    <option value="RECEPTION">Guía de Despacho (Recepción)</option>
                    <option value="RETURN">Guía de Devolución</option>
                  </select>
                </div>
              )}
            </div>
          )}
        </div>

        {file && !result && (
          <div className="mt-8 flex justify-end">
            <button
              onClick={activeTab === 'excel' ? handleProcessExcel : handleProcessAI}
              disabled={isProcessing}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-6 py-3 rounded-lg font-medium flex items-center transition-colors"
            >
              {isProcessing ? (
                <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Procesando...</>
              ) : (
                <><Brain className="w-5 h-5 mr-2" /> {activeTab === 'excel' ? 'Leer Excel' : 'Extraer con IA'}</>
              )}
            </button>
          </div>
        )}

        {/* Results Preview */}
        {result && (
          <div className="mt-8 border-t border-slate-800 pt-8 animate-in fade-in slide-in-from-bottom-4">
            <h3 className="text-lg font-medium text-white mb-4 flex items-center">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 mr-2" />
              Datos Extraídos
            </h3>
            
            <div className="bg-slate-950 rounded-xl p-6 border border-slate-800 space-y-6">
              {(conflicts.length > 0 || oldEquipments.length > 0) && (
                <div className="bg-amber-500/10 border border-amber-500/50 rounded-xl p-4 flex items-start mb-6">
                  <AlertTriangle className="w-5 h-5 text-amber-500 mr-3 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-amber-500 text-sm">Se requiere tu decisión</h4>
                    <p className="text-xs text-amber-500/80 mt-1">
                      Hemos detectado equipos que ya existen o renovaciones. Haz clic en las advertencias de la tabla para decidir qué hacer antes de guardar el borrador.
                    </p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="text-xs text-slate-500 uppercase font-bold tracking-wider">Usuario / Asignado a</label>
                  <p className="text-white font-medium">{result.userName || 'No encontrado'}</p>
                </div>
                <div>
                  <label className="text-xs text-slate-500 uppercase font-bold tracking-wider">RUT</label>
                  <p className="text-white font-medium">{result.rut || 'No encontrado'}</p>
                </div>
                <div>
                  <label className="text-xs text-slate-500 uppercase font-bold tracking-wider">Fecha</label>
                  <p className="text-white font-medium">{result.receptionDate || 'No encontrada'}</p>
                </div>
                <div>
                  <label className="text-xs text-slate-500 uppercase font-bold tracking-wider">N° Ticket</label>
                  <p className="text-white font-medium">{result.ticketNumber || 'No encontrado'}</p>
                </div>
              </div>
              
              <div>
                <label className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-3 block">Equipos Encontrados</label>
                {result.items && result.items.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="text-xs text-slate-400 bg-slate-900/50">
                        <tr>
                          <th className="px-4 py-2 rounded-tl-lg">Tipo</th>
                          <th className="px-4 py-2">Marca</th>
                          <th className="px-4 py-2">Modelo</th>
                          <th className="px-4 py-2">Serie / IMEI</th>
                          <th className="px-4 py-2">Hostname</th>
                          <th className="px-4 py-2 rounded-tr-lg">Estado / Decisión</th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.items.map((item: any, i: number) => {
                          const conflict = conflicts.find(c => c.serial_number === item.serial);
                          const oldEq = oldEquipments.find(oe => (oe.category || '').toUpperCase() === (item.category || item.type || '').toUpperCase());
                          
                          const decision = conflictDecisions[item.serial] || conflictDecisions[item.category || item.type];
                          
                          return (
                            <tr key={i} className="border-b border-slate-800/50">
                              <td className="px-4 py-3 text-slate-300">{item.type || item.category}</td>
                              <td className="px-4 py-3 text-white font-medium">{item.brand}</td>
                              <td className="px-4 py-3 text-slate-300">{item.model}</td>
                              <td className="px-4 py-3 font-mono">
                                <span className="text-emerald-400">{item.serial}</span>
                              </td>
                              <td className="px-4 py-3 text-indigo-400 font-mono">{item.hostname || '-'}</td>
                              <td className="px-4 py-3">
                                {conflict ? (
                                  <div className="flex flex-col gap-2">
                                    <span className="text-xs px-2 py-1 bg-amber-500/20 text-amber-500 rounded font-medium inline-block w-fit">
                                      ⚠️ Serie duplicada
                                    </span>
                                    <select 
                                      className="text-xs bg-slate-800 text-white border border-slate-700 rounded p-1 w-full max-w-[200px]"
                                      value={decision?.action || ''}
                                      onChange={(e) => setConflictDecisions(prev => ({
                                        ...prev, 
                                        [item.serial]: { type: 'CONFLICT', action: e.target.value, existingId: conflict.id }
                                      }))}
                                    >
                                      <option value="">-- Elige una acción --</option>
                                      <option value="REASSIGN">Reasignar equipo existente</option>
                                      <option value="IGNORE">No importar este equipo</option>
                                    </select>
                                  </div>
                                ) : oldEq ? (
                                  <div className="flex flex-col gap-2">
                                    <span className="text-xs px-2 py-1 bg-blue-500/20 text-blue-400 rounded font-medium inline-block w-fit">
                                      🔄 Renovación detectada
                                    </span>
                                    <select 
                                      className="text-xs bg-slate-800 text-white border border-slate-700 rounded p-1 w-full max-w-[250px]"
                                      value={decision?.oldEquipmentAction || ''}
                                      onChange={(e) => setConflictDecisions(prev => ({
                                        ...prev, 
                                        [item.category || item.type]: { type: 'RENEWAL', oldEquipmentAction: e.target.value, oldEquipmentId: oldEq.id }
                                      }))}
                                    >
                                      <option value="">-- ¿Qué hacer con el equipo antiguo? --</option>
                                      <option value="EN_BODEGA">Pasarlo a Disponible (Bodega)</option>
                                      <option value="POR_DEVOLVER">Por devolver al proveedor</option>
                                      <option value="NONE">No hacer nada con el antiguo</option>
                                    </select>
                                  </div>
                                ) : (
                                  <span className="text-xs px-2 py-1 bg-emerald-500/10 text-emerald-400 rounded font-medium border border-emerald-500/20 inline-flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3" /> Se registrará como {item.action === 'DEVUELTO' || item.action === 'DEVOLUCION' ? 'Por Devolver / En Bodega' : (documentType === 'RECEPTION' ? 'En Bodega' : documentType === 'RETURN' ? 'Por Devolver' : 'Asignado')}
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-slate-400 text-sm">No se encontraron equipos en este documento.</p>
                )}
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row justify-end gap-4 pt-4 border-t border-slate-800">
              <button
                onClick={() => {
                  setResult(null);
                  setFile(null);
                  setConflicts([]);
                  setOldEquipments([]);
                  setConflictDecisions({});
                }}
                className="px-6 py-2 rounded-lg text-slate-300 font-medium hover:bg-slate-800 transition-colors"
                disabled={isProcessing}
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveToDrafts}
                disabled={isProcessing}
                className="px-6 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                Guardar en Borradores
              </button>
              <button
                onClick={handleImportOfficial}
                disabled={isProcessing}
                className="px-6 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20"
              >
                Importar Definitivamente <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
