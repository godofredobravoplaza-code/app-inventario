'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { InventoryItem, Profile } from '@/lib/supabase/types'
import { Save, AlertCircle, Share2, FileText } from 'lucide-react'
import SignatureCanvas from 'react-signature-canvas'
import { jsPDF } from 'jspdf'
import html2canvas from 'html2canvas'
import { DerTemplate, DerData } from '@/components/der-template'

interface DerFormProps {
  availableEquipment: InventoryItem[];
  technicians: Profile[];
  currentUserEmail: string;
  draftData?: any;
}

export default function DerForm({ availableEquipment, technicians, currentUserEmail, draftData }: DerFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const sigCanvasTech = useRef<SignatureCanvas>(null)
  const sigCanvasClient = useRef<SignatureCanvas>(null)
  const templateRef = useRef<HTMLDivElement>(null)
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // General Info
  const [ticketNumber, setTicketNumber] = useState(draftData?.ticketNumber || '')
  const [tecnico, setTecnico] = useState(draftData?.tecnico || '')
  const [tecnicoManual, setTecnicoManual] = useState(draftData?.tecnicoManual || '')
  const [dateDay, setDateDay] = useState(draftData?.dateDay || new Date().getDate().toString().padStart(2, '0'))
  const [dateMonth, setDateMonth] = useState(draftData?.dateMonth || (new Date().getMonth() + 1).toString().padStart(2, '0'))
  const [dateYear, setDateYear] = useState(draftData?.dateYear || new Date().getFullYear().toString())
  const [filial, setFilial] = useState(draftData?.filial || 'Forsac Chillan')
  const [ciudad, setCiudad] = useState(draftData?.ciudad || 'Chillan')
  const [ubicacion, setUbicacion] = useState(draftData?.ubicacion || 'Longitudinal Norte KM 3')

  // User State
  const [searchUser, setSearchUser] = useState('') // Used for autocomplete simulation
  const [userName, setUserName] = useState(draftData?.userName || '')
  const [userRut, setUserRut] = useState(draftData?.userRut || '')
  const [userAccount, setUserAccount] = useState(draftData?.userAccount || '')
  const [userCargo, setUserCargo] = useState(draftData?.userCargo || 'Ingeniero logistico')
  const [userArea, setUserArea] = useState(draftData?.userArea || 'Supply Chain')
  const [userPhone, setUserPhone] = useState(draftData?.userPhone || '+56 9 ')
  const [userEmail, setUserEmail] = useState(draftData?.userEmail || '')

  // Equipment Selection
  const [selectedEqId, setSelectedEqId] = useState(draftData?.selectedEqId || '')
  
  // Manual Equipment Entry
  const [isManualEq, setIsManualEq] = useState(draftData?.isManualEq ?? false)
  const [manualEqCategory, setManualEqCategory] = useState(draftData?.manualEqCategory || 'NOTEBOOK')
  const [manualEqBrand, setManualEqBrand] = useState(draftData?.manualEqBrand || '')
  const [manualEqModel, setManualEqModel] = useState(draftData?.manualEqModel || '')
  const [manualEqSerial, setManualEqSerial] = useState(draftData?.manualEqSerial || '')
  const [manualEqHostname, setManualEqHostname] = useState(draftData?.manualEqHostname || '')
  const [manualEqRam, setManualEqRam] = useState(draftData?.manualEqRam || '')
  const [manualEqStorage, setManualEqStorage] = useState(draftData?.manualEqStorage || '')
  const [observacionesEntrante, setObservacionesEntrante] = useState(draftData?.observacionesEntrante || '')
  const [manualEqAssetTag, setManualEqAssetTag] = useState(draftData?.manualEqAssetTag || '')

  // Checkboxes Menores
  const [hasMonitor, setHasMonitor] = useState(draftData?.hasMonitor ?? false)
  const [hasKitWireless, setHasKitWireless] = useState(draftData?.hasKitWireless ?? false)
  const [hasDocking, setHasDocking] = useState(draftData?.hasDocking ?? false)
  const [hasOtros, setHasOtros] = useState(draftData?.hasOtros ?? false)
  const [serieRotulosMenor, setSerieRotulosMenor] = useState(draftData?.serieRotulosMenor || '')
  
  const [hasBolso, setHasBolso] = useState(draftData?.hasBolso ?? false)
  const [hasCargador, setHasCargador] = useState(draftData?.hasCargador ?? true)
  const [hasCandado, setHasCandado] = useState(draftData?.hasCandado ?? false)
  const [hasCableRed, setHasCableRed] = useState(draftData?.hasCableRed ?? false)
  const [hasMouseUSB, setHasMouseUSB] = useState(draftData?.hasMouseUSB ?? false)

  // Software Config
  const [os, setOs] = useState(draftData?.os || 'Windows 11 Pro')
  const [osBits, setOsBits] = useState<'32' | '64' | null>(draftData?.osBits || '64')
  const [ofimatica, setOfimatica] = useState(draftData?.ofimatica || '')
  const [ofimaticaBits, setOfimaticaBits] = useState<'32' | '64' | null>(draftData?.ofimaticaBits || null)
  const [otrosSoftware, setOtrosSoftware] = useState(draftData?.otrosSoftware || '')
  const [deshabilitarOneDrive, setDeshabilitarOneDrive] = useState(draftData?.deshabilitarOneDrive ?? true)

  // Observaciones
  const [observaciones, setObservaciones] = useState(draftData?.observaciones || 'Se prepara y entrega equipo a usuario con bateria de aplicativos base.')

  // Equipamiento Saliente
  const [salienteTipo, setSalienteTipo] = useState(draftData?.salienteTipo || '')
  const [salienteMarca, setSalienteMarca] = useState(draftData?.salienteMarca || '')
  const [salienteModelo, setSalienteModelo] = useState(draftData?.salienteModelo || '')
  const [salienteSerie, setSalienteSerie] = useState(draftData?.salienteSerie || '')
  const [salienteRotulo, setSalienteRotulo] = useState(draftData?.salienteRotulo || '')
  const [salienteHostname, setSalienteHostname] = useState(draftData?.salienteHostname || '')
  const [salienteObservaciones, setSalienteObservaciones] = useState(draftData?.salienteObservaciones || '')
  const [quedaraPoderDe, setQuedaraPoderDe] = useState<'Cliente' | 'Soporte TI' | 'Bodega' | 'Otros' | null>(draftData?.quedaraPoderDe || null)
  const [quedaraPoderDeOtros, setQuedaraPoderDeOtros] = useState(draftData?.quedaraPoderDeOtros || '')

  // Hidden Signatures state for rendering in template before capturing PDF
  const [firmaTecnicoUrl, setFirmaTecnicoUrl] = useState('')
  const [firmaClienteUrl, setFirmaClienteUrl] = useState('')

  // Auto-fill from DB (Buscador)
  useEffect(() => {
    const fetchUser = async () => {
      if (searchUser.length > 2) {
        const { data, error } = await supabase
          .from('employees')
          .select('*')
          .or(`full_name.ilike.%${searchUser}%,rut.ilike.%${searchUser}%`)
          .limit(1)
          .maybeSingle()

        if (data && !error) {
          setUserName(data.full_name || '')
          setUserRut(data.rut || '')
          setUserCargo(data.job_title || '')
          setUserArea(data.department || '')
          setUserPhone(data.phone || '')
          setUserEmail(data.email || '')
          setUserAccount(data.account_name || '')
        }
      }
    }
    fetchUser()
    // Set initial technician based on current user email
    if (technicians.length > 0 && !tecnico) {
      const currentTech = technicians.find(t => t.email === currentUserEmail)
      if (currentTech) {
        setTecnico(currentTech.full_name)
      } else {
        setTecnico(technicians[0].full_name)
      }
    }
  }, [searchUser, technicians, currentUserEmail, tecnico])

  const generatePDF = async (): Promise<Blob> => {
    if (!templateRef.current) throw new Error("Template ref not found")

    // Temporarily ensure the template is visible and properly sized for html2canvas
    const element = templateRef.current

    // Make sure signatures are updated before rendering
    const techSigUrl = sigCanvasTecnico?.getTrimmedCanvas().toDataURL('image/png')
    const clientSigUrl = sigCanvasCliente?.getTrimmedCanvas().toDataURL('image/png')
    if (techSigUrl && !sigCanvasTecnico.isEmpty()) setFirmaTecnicoUrl(techSigUrl)
    if (clientSigUrl && !sigCanvasCliente.isEmpty()) setFirmaClienteUrl(clientSigUrl)

    // Wait a tick for state update
    await new Promise(resolve => setTimeout(resolve, 100))

    const canvas = await html2canvas(element, {
      scale: 2, // High resolution
      useCORS: true,
      logging: false,
      width: element.scrollWidth,
      height: element.scrollHeight,
      windowWidth: element.scrollWidth,
      windowHeight: element.scrollHeight
    })

    const imgData = canvas.toDataURL('image/jpeg', 1.0)
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'letter'
    })

    const pdfWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    let imgWidth = pdfWidth
    let imgHeight = (canvas.height * imgWidth) / canvas.width

    if (imgHeight > pageHeight) {
      imgHeight = pageHeight
      imgWidth = (canvas.width * imgHeight) / canvas.height
    }

    const xPos = (pdfWidth - imgWidth) / 2
    pdf.addImage(imgData, 'JPEG', xPos, 0, imgWidth, imgHeight)
    return pdf.output('blob')
  }

  const handlePreview = async () => {
    // Abrir la ventana INMEDIATAMENTE para evitar el bloqueo de popups del navegador
    const previewWindow = window.open('', '_blank');
    if (!previewWindow) {
      setError("Tu navegador bloqueó la vista previa. Por favor, permite las ventanas emergentes (pop-ups) para este sitio.");
      return;
    }
    
    previewWindow.document.write('Generando vista previa, por favor espera...');
    
    try {
      const pdfBlob = await generatePDF();
      const pdfUrl = URL.createObjectURL(pdfBlob);
      previewWindow.location.href = pdfUrl;
    } catch (err) {
      console.error("Preview error", err);
      previewWindow.close();
      setError("Error al generar vista previa.");
    }
  }

  const formatRut = (rut: string) => {
    const cleanRut = rut.replace(/[^0-9kK]/g, '').toUpperCase();
    if (cleanRut.length <= 1) return cleanRut;
    const body = cleanRut.slice(0, -1);
    const dv = cleanRut.slice(-1);
    const formattedBody = body.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    return `${formattedBody}-${dv}`;
  }

  const handleRutChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUserRut(formatRut(e.target.value));
  }

  const handleSave = async (status: 'DRAFT' | 'COMPLETED') => {
    setLoading(true)
    setError(null)

    if (!ticketNumber) {
      setError('El N° Ticket es obligatorio para guardar (incluso borradores).')
      setLoading(false)
      return
    }

    if (status === 'COMPLETED') {
      if (!isManualEq && !selectedEqId) {
        setError('Debes seleccionar un Equipo para completar el acta.')
        setLoading(false)
        return
      }
      if (isManualEq) {
        if (!manualEqCategory || !manualEqBrand || !manualEqModel || !manualEqSerial || !manualEqHostname) {
          setError('Faltan campos obligatorios en el equipo manual (Categoría, Marca, Modelo, Serie, Hostname).')
          setLoading(false)
          return
        }
      }
      if (sigCanvasTecnico.isEmpty() || sigCanvasCliente.isEmpty()) {
        setError('Ambas firmas son obligatorias para el acta definitiva.')
        setLoading(false)
        return
      }
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setError('No estás autenticado.')
      setLoading(false)
      return
    }

    const finalTecnico = tecnico === 'Otro' ? tecnicoManual : tecnico

    const formData = {
      ticketNumber, tecnico: finalTecnico, filial, ciudad, ubicacion,
      userName, userRut, userAccount, userCargo, userArea, userPhone, userEmail,
      selectedEqId,
      isManualEq, manualEqCategory, manualEqBrand, manualEqModel, manualEqSerial, manualEqHostname, manualEqRam, manualEqStorage, manualEqAssetTag,
      observacionesEntrante,
      hasMonitor, hasKitWireless, hasDocking, hasOtros, serieRotulosMenor,
      hasBolso, hasCargador, hasCandado, hasCableRed, hasMouseUSB,
      os, osBits, ofimatica, ofimaticaBits, otrosSoftware, deshabilitarOneDrive,
      observaciones: observacionesEntrante ? `${observaciones}\n\nObservaciones adicionales: ${observacionesEntrante}` : observaciones,
      salienteTipo, salienteMarca, salienteModelo, salienteSerie, salienteRotulo, salienteHostname, salienteObservaciones,
      quedaraPoderDe, quedaraPoderDeOtros,
      dateDay, dateMonth, dateYear
    }

    try {
      let fileName = null
      let derRecordId = null

      let finalEquipmentId = selectedEqId

      if (status === 'COMPLETED') {
        if (isManualEq) {
          const { data: newEq, error: eqError } = await supabase.from('inventory').insert({
            category: manualEqCategory as any,
            brand: manualEqBrand,
            model: manualEqModel,
            serial_number: manualEqSerial,
            hostname: manualEqHostname,
            ram: manualEqRam || null,
            storage: manualEqStorage || null,
            asset_tag: manualEqAssetTag || null,
            status: 'ASIGNADO'
          }).select().single()

          if (eqError) throw new Error(`Error creando equipo en inventario: ${eqError.message}`)
          finalEquipmentId = newEq.id
        }

        const techSigUrl = sigCanvasTecnico.getTrimmedCanvas().toDataURL('image/png')
        const clientSigUrl = sigCanvasCliente.getTrimmedCanvas().toDataURL('image/png')
        setFirmaTecnicoUrl(techSigUrl)
        setFirmaClienteUrl(clientSigUrl)

        await new Promise(resolve => setTimeout(resolve, 500))

        const pdfBlob = await generatePDF()
        fileName = `${Date.now()}_DER_${ticketNumber}_${userRut.replace(/[^0-9kK]/g, '')}.pdf`
        
        const { error: uploadError } = await supabase.storage
          .from('actas_der')
          .upload(fileName, pdfBlob, { contentType: 'application/pdf', cacheControl: '3600', upsert: false })

        if (uploadError) throw new Error(`Error subiendo PDF: ${uploadError.message}`)
      }

      // Create/Update DER Record
      const derRecordPayload: any = {
        ticket_number: ticketNumber.trim(),
        user_name: userName.trim() || null,
        user_rut: userRut.trim() || null,
        equipment_id: finalEquipmentId || null,
        drive_file_url: fileName,
        status: status,
        form_data: formData,
        created_by: user.id
      }
      
      if (draftData?.id) {
        derRecordPayload.id = draftData.id
      }

      const { data: derRecord, error: derError } = await supabase
        .from('der_records')
        .upsert(derRecordPayload, { onConflict: 'id' })
        .select().single()

      if (derError) throw new Error(`Error guardando acta: ${derError.message}`)
      derRecordId = derRecord.id

      if (status === 'COMPLETED') {
        // Update Equipment status
        const { error: updateError } = await supabase
          .from('inventory')
          .update({
            status: 'ASIGNADO',
            current_user_name: userName.trim() || null,
            current_user_rut: userRut.trim() || null,
            current_user_account: userAccount.trim() || null,
            assignment_ticket: ticketNumber.trim()
          }).eq('id', selectedEqId)

        if (updateError) throw new Error(`Error actualizando equipo: ${updateError.message}`)

        // Save Employee if rut is provided
        if (userRut.trim()) {
          await supabase.from('employees').upsert({
            rut: userRut.trim(),
            full_name: userName.trim(),
            job_title: userCargo.trim(),
            department: userArea.trim(),
            email: userEmail.trim(),
            phone: userPhone.trim(),
            account_name: userAccount.trim(),
            updated_at: new Date().toISOString()
          }, { onConflict: 'rut' })
        }

        // Process Equipamiento Saliente
        if (salienteSerie.trim()) {
          const { data: existingSaliente } = await supabase
            .from('inventory')
            .select('id')
            .eq('serial_number', salienteSerie.trim())
            .maybeSingle()

          if (existingSaliente) {
            await supabase.from('inventory').update({
              status: 'POR_DEVOLVER',
              current_user_name: null,
              current_user_rut: null,
              current_user_account: null
            }).eq('id', existingSaliente.id)

            await supabase.from('audit_logs').insert({
              equipment_id: existingSaliente.id,
              performed_by: user.id,
              action_type: 'EQUIPMENT_RETURNED_DER',
              new_data: { status: 'POR_DEVOLVER', der_record_id: derRecordId }
            })
          } else {
            const { data: newSaliente } = await supabase.from('inventory').insert({
              serial_number: salienteSerie.trim(),
              category: salienteTipo.trim() || 'LAPTOP',
              brand: salienteMarca.trim() || 'Desconocida',
              model: salienteModelo.trim() || 'Desconocido',
              status: 'POR_DEVOLVER',
              hostname: salienteHostname.trim() || null,
              asset_tag: salienteRotulo.trim() || null,
              comments: salienteObservaciones.trim() || null,
              created_by: user.id,
              manual_months_offset: 0,
              months_in_operation: 0
            }).select().single()

            if (newSaliente) {
              await supabase.from('audit_logs').insert({
                equipment_id: newSaliente.id,
                performed_by: user.id,
                action_type: 'EQUIPMENT_CREATED_AND_RETURNED_DER',
                new_data: { status: 'POR_DEVOLVER', der_record_id: derRecordId }
              })
            }
          }
        }

        await supabase.from('audit_logs').insert({
          equipment_id: finalEquipmentId,
          performed_by: user.id,
          action_type: 'EQUIPMENT_ASSIGNED_DER',
          new_data: { status: 'ASIGNADO', current_user_name: userName, der_record_id: derRecordId, ticket: ticketNumber }
        })
      }

      router.push('/inventory')
      router.refresh()

    } catch (err: any) {
      console.error(err)
      setError(err.message || 'Ocurrió un error inesperado al procesar el acta.')
      setLoading(false)
    }
  }

  const handleShare = async () => {
    try {
      setLoading(true)
      const pdfBlob = await generatePDF()
      const file = new File([pdfBlob], `DER_${ticketNumber || 'Borrador'}.pdf`, { type: 'application/pdf' })
      
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `Acta DER - ${ticketNumber || 'Borrador'}`,
        })
      } else {
        // Fallback to preview/download
        const pdfUrl = URL.createObjectURL(pdfBlob)
        const a = document.createElement('a')
        a.href = pdfUrl
        a.download = file.name
        a.click()
      }
    } catch (err) {
      console.error("Share error", err)
      setError("No se pudo compartir el archivo.")
    } finally {
      setLoading(false)
    }
  }

  // Derived props for the template
  const selectedEq = availableEquipment.find(eq => eq.id === selectedEqId)
  
  const templateData: DerData = {
    tecnico, ticket: ticketNumber, filial, ciudad, ubicacion,
    userName, userRut, userPhone, userEmail, userCargo, userArea,
    tipo: isManualEq ? manualEqCategory : (selectedEq?.category || ''), 
    marca: isManualEq ? manualEqBrand : (selectedEq?.brand || ''), 
    modelo: isManualEq ? manualEqModel : (selectedEq?.model || ''),
    serie: isManualEq ? manualEqSerial : (selectedEq?.serial_number || ''), 
    rotulo: isManualEq ? manualEqAssetTag : (selectedEq?.asset_tag || ''), 
    hostname: isManualEq ? manualEqHostname : (selectedEq?.hostname || ''),
    hasMonitor, hasKitWireless, hasDocking, hasOtros, serieRotulosMenor,
    hasBolso, hasCargador, hasCandado, hasCableRed, hasMouseUSB,
    os, osBits, ofimatica, ofimaticaBits, otrosSoftware, deshabilitarOneDrive,
    observaciones: observacionesEntrante ? `${observaciones}\n\nObservaciones adicionales: ${observacionesEntrante}` : observaciones,
    salienteTipo, salienteMarca, salienteModelo, salienteSerie, salienteRotulo,
    salienteHostname,
    salienteObservaciones,
    quedaraPoderDe, quedaraPoderDeOtros,
    dateDay: new Date().getDate().toString().padStart(2, '0'),
    dateMonth: (new Date().getMonth() + 1).toString().padStart(2, '0'),
    dateYear: new Date().getFullYear().toString(),
    firmaClienteUrl, firmaTecnicoUrl
  }

  const sigCanvasTecnico = sigCanvasTech.current as any
  const sigCanvasCliente = sigCanvasClient.current as any

  return (
    <>
      <form onSubmit={(e) => { e.preventDefault(); handleSave('COMPLETED') }} className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-8">
        {error && (
          <div className="bg-red-500/10 border border-red-500/50 p-4 rounded-lg flex items-center gap-3 text-red-400">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Buscador Autocompletado */}
          <div>
            <h3 className="text-lg font-medium text-white mb-4 border-b border-slate-800 pb-2">Buscador Inteligente</h3>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Buscar Usuario (Nombre o RUT)</label>
              <input 
                type="text" 
                value={searchUser}
                onChange={e => setSearchUser(e.target.value)}
                className="w-full bg-slate-950 border border-indigo-500/50 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="Ej: Eduardo Torres..."
              />
              <p className="text-xs text-indigo-400 mt-1">Escribe para autocompletar mágicamente los datos del usuario.</p>
            </div>
          </div>
          
          {/* Metadatos (Técnico y Fecha) */}
          <div>
            <h3 className="text-lg font-medium text-white mb-4 border-b border-slate-800 pb-2">Metadatos del Acta</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Técnico Asignado</label>
                <select value={tecnico} onChange={e => setTecnico(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-white mb-2">
                  <option value="">Seleccionar...</option>
                  {technicians.map(t => (
                    <option key={t.id} value={t.full_name}>{t.full_name}</option>
                  ))}
                  <option value="Otro">Otro (Ingresar manualmente)</option>
                </select>
                {tecnico === 'Otro' && (
                  <input type="text" placeholder="Nombre del técnico" value={tecnicoManual} onChange={e => setTecnicoManual(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-white" />
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Fecha del Acta</label>
                <div className="flex gap-2">
                  <input type="number" min="1" max="31" value={dateDay} onChange={e => setDateDay(e.target.value)} className="w-1/3 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white" placeholder="DD" />
                  <input type="number" min="1" max="12" value={dateMonth} onChange={e => setDateMonth(e.target.value)} className="w-1/3 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white" placeholder="MM" />
                  <input type="number" min="2000" max="2100" value={dateYear} onChange={e => setDateYear(e.target.value)} className="w-1/3 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white" placeholder="YYYY" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Datos Principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">TICKET & EQUIPO</h4>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">N° Ticket *</label>
              <input type="text" value={ticketNumber} onChange={e => setTicketNumber(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-white border-l-4 border-l-indigo-500" />
            </div>
            
            <div className="flex items-center gap-2 mb-2">
              <input 
                type="checkbox" 
                id="isManualEq" 
                checked={isManualEq} 
                onChange={e => setIsManualEq(e.target.checked)}
                className="rounded border-slate-700 bg-slate-950 text-indigo-500 focus:ring-indigo-500"
              />
              <label htmlFor="isManualEq" className="text-sm text-slate-300 cursor-pointer">
                ¿Ingresar equipo manualmente? (No está en inventario)
              </label>
            </div>

            {!isManualEq ? (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Seleccionar Equipo</label>
                <select value={selectedEqId} onChange={e => setSelectedEqId(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-white">
                  <option value="">-- Seleccionar Disponible --</option>
                  {availableEquipment.map(eq => (
                    <option key={eq.id} value={eq.id}>{eq.category} {eq.brand} {eq.model} - S/N: {eq.serial_number}</option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="bg-slate-900/50 p-4 rounded-lg border border-indigo-500/30 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Categoría *</label>
                    <select value={manualEqCategory} onChange={e => setManualEqCategory(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white">
                      <option value="NOTEBOOK">Notebook</option>
                      <option value="DESKTOP">Desktop</option>
                      <option value="PRINTER_COLOR">Impresora Color</option>
                      <option value="PRINTER_BN">Impresora B/N</option>
                      <option value="ZEBRA_LABEL">Zebra Etiquetas</option>
                      <option value="ZEBRA_TRF">Zebra TRF</option>
                      <option value="VIDEO_CONFERENCIA">Video Conferencia</option>
                      <option value="SERVER">Servidor</option>
                      <option value="TABLET">Tablet</option>
                      <option value="MONITOR">Monitor</option>
                      <option value="CELULAR">Celular</option>
                      <option value="PERIFERICO">Periférico</option>
                      <option value="OTRO">Otro</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Marca *</label>
                    <input type="text" value={manualEqBrand} onChange={e => setManualEqBrand(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Modelo *</label>
                    <input type="text" value={manualEqModel} onChange={e => setManualEqModel(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Número de Serie *</label>
                    <input type="text" value={manualEqSerial} onChange={e => setManualEqSerial(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-slate-400 mb-1">Hostname *</label>
                    <input type="text" value={manualEqHostname} onChange={e => setManualEqHostname(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white" placeholder="Ej: CL-PC-01" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Asset Tag</label>
                    <input type="text" value={manualEqAssetTag} onChange={e => setManualEqAssetTag(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white" placeholder="Opcional" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">RAM</label>
                    <input type="text" value={manualEqRam} onChange={e => setManualEqRam(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white" placeholder="Ej: 16 GB" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-slate-400 mb-1">Disco</label>
                    <input type="text" value={manualEqStorage} onChange={e => setManualEqStorage(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white" placeholder="Ej: 512 GB SSD" />
                  </div>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Observaciones de Entrega</label>
              <textarea 
                placeholder="Estado del equipo entregado, detalles adicionales..." 
                value={observacionesEntrante} 
                onChange={e => setObservacionesEntrante(e.target.value)} 
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white h-20" 
              />
            </div>
          </div>
          
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">DATOS USUARIO</h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Nombre</label>
                <input type="text" placeholder="Nombre completo" value={userName} onChange={e => setUserName(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">RUT</label>
                <input type="text" placeholder="RUT" value={userRut} onChange={handleRutChange} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Cargo</label>
                <input type="text" placeholder="Cargo" value={userCargo} onChange={e => setUserCargo(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Área</label>
                <input type="text" placeholder="Área" value={userArea} onChange={e => setUserArea(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Teléfono</label>
                <input type="text" placeholder="+56 9..." value={userPhone} onChange={e => setUserPhone(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Correo</label>
                <input type="email" placeholder="correo@empresa.com" value={userEmail} onChange={e => setUserEmail(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Equipamiento Saliente */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h3 className="text-lg font-medium text-white mb-4 border-b border-slate-800 pb-2">Equipamiento Saliente (Opcional)</h3>
          <p className="text-xs text-slate-400 mb-4">Si el usuario está devolviendo un equipo, ingresa al menos su número de serie para registrar la devolución en el inventario.</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Serie (S/N)</label>
              <input type="text" placeholder="Número de serie" value={salienteSerie} onChange={e => setSalienteSerie(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Tipo de Equipo</label>
              <select value={salienteTipo} onChange={e => setSalienteTipo(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white">
                <option value="">Seleccionar...</option>
                <option value="LAPTOP">Laptop</option>
                <option value="DESKTOP">Desktop</option>
                <option value="TABLET">Tablet</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Marca</label>
              <input type="text" placeholder="Marca" value={salienteMarca} onChange={e => setSalienteMarca(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Modelo</label>
              <input type="text" placeholder="Modelo" value={salienteModelo} onChange={e => setSalienteModelo(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Rótulo</label>
              <input type="text" placeholder="Rótulo / N° Línea" value={salienteRotulo} onChange={e => setSalienteRotulo(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Hostname</label>
              <input type="text" placeholder="PC-NAME-01" value={salienteHostname} onChange={e => setSalienteHostname(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Quedará en poder de</label>
              <select value={quedaraPoderDe || ''} onChange={e => setQuedaraPoderDe(e.target.value as any)} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white">
                <option value="">Seleccionar...</option>
                <option value="Cliente">Cliente</option>
                <option value="Soporte TI">Soporte TI</option>
                <option value="Bodega">Bodega</option>
                <option value="Otros">Otros</option>
              </select>
            </div>
            <div className="col-span-full">
              <label className="block text-xs font-medium text-slate-400 mb-1">Observaciones</label>
              <textarea placeholder="Estado y observaciones del equipo devuelto..." value={salienteObservaciones} onChange={e => setSalienteObservaciones(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white h-20" />
            </div>
          </div>
        </div>

        {/* Hardware Menor */}
        <div>
          <h3 className="text-lg font-medium text-white mb-4 border-b border-slate-800 pb-2">Accesorios a Entregar</h3>
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2"><input type="checkbox" checked={hasCargador} onChange={e => setHasCargador(e.target.checked)} className="rounded bg-slate-900 border-slate-700 text-indigo-500" /><span className="text-sm text-slate-300">Cargador</span></label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={hasBolso} onChange={e => setHasBolso(e.target.checked)} className="rounded bg-slate-900 border-slate-700 text-indigo-500" /><span className="text-sm text-slate-300">Bolso</span></label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={hasCandado} onChange={e => setHasCandado(e.target.checked)} className="rounded bg-slate-900 border-slate-700 text-indigo-500" /><span className="text-sm text-slate-300">Candado</span></label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={hasMouseUSB} onChange={e => setHasMouseUSB(e.target.checked)} className="rounded bg-slate-900 border-slate-700 text-indigo-500" /><span className="text-sm text-slate-300">Mouse USB</span></label>
          </div>
        </div>

        {/* Firmas Hibridas */}
        <div>
          <h3 className="text-lg font-medium text-white mb-4 border-b border-slate-800 pb-2">Captura de Firmas</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-slate-300">Firma Cliente (Usuario)</span>
                <button type="button" onClick={() => sigCanvasClient.current?.clear()} className="text-xs text-red-400">Limpiar</button>
              </div>
              <div className="bg-white rounded-xl overflow-hidden border-2 border-dashed border-slate-700 w-full touch-none">
                <SignatureCanvas ref={sigCanvasClient} penColor="black" canvasProps={{ className: 'w-full h-40 cursor-crosshair' }} />
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-slate-300">Firma Técnico ({tecnico})</span>
                <button type="button" onClick={() => sigCanvasTech.current?.clear()} className="text-xs text-red-400">Limpiar</button>
              </div>
              <div className="bg-white rounded-xl overflow-hidden border-2 border-dashed border-slate-700 w-full touch-none">
                <SignatureCanvas ref={sigCanvasTech} penColor="black" canvasProps={{ className: 'w-full h-40 cursor-crosshair' }} />
              </div>
            </div>
          </div>
        </div>

        <div className="pt-4 flex flex-col sm:flex-row justify-end gap-4 border-t border-slate-800 mt-6 pt-6">
          <button
            type="button"
            onClick={() => handleSave('DRAFT')}
            disabled={loading}
            className="inline-flex justify-center items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 text-base sm:text-lg border border-slate-600"
          >
            Guardar Borrador
          </button>
          
          <button
            type="button"
            onClick={handleShare}
            disabled={loading}
            className="inline-flex justify-center items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 text-base sm:text-lg shadow-lg shadow-teal-600/20"
          >
            <Share2 className="w-5 h-5" />
            Compartir / Exportar
          </button>
          
          <button
            type="submit"
            disabled={loading}
            className="inline-flex justify-center items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-lg font-medium transition-colors shadow-lg shadow-indigo-600/20 disabled:opacity-50 text-base sm:text-lg"
          >
            <Save className="w-5 h-5" />
            {loading ? 'Procesando...' : 'Firmar y Generar Oficial'}
          </button>
        </div>
      </form>

      {/* Invisible render area for HTML2Canvas */}
      <div className="absolute top-0 left-[-9999px] z-[-1]">
        <DerTemplate ref={templateRef} data={templateData} />
      </div>
    </>
  )
}
