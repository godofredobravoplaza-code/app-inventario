'use client'

import React, { forwardRef } from 'react'

export interface DerData {
  tecnico: string
  ticket: string
  filial: string
  ciudad: string
  ubicacion: string
  // User
  userName: string
  userRut: string
  userPhone: string
  userEmail: string
  userCargo: string
  userArea: string
  // Equipment In
  tipo: string
  marca: string
  modelo: string
  serie: string
  rotulo: string
  hostname: string
  // Hardware Menor
  hasMonitor: boolean
  hasKitWireless: boolean
  hasDocking: boolean
  hasOtros: boolean
  serieRotulosMenor: string
  hasBolso: boolean
  hasCargador: boolean
  hasCandado: boolean
  hasCableRed: boolean
  hasMouseUSB: boolean
  // Software
  os: string
  osBits: '32' | '64' | null
  ofimatica: string
  ofimaticaBits: '32' | '64' | null
  otrosSoftware: string
  deshabilitarOneDrive: boolean
  // Observaciones
  observaciones: string
  // Equipamiento saliente
  salienteTipo: string
  salienteMarca: string
  salienteModelo: string
  salienteSerie: string
  salienteRotulo: string
  salienteHostname: string
  salienteObservaciones: string
  quedaraPoderDe: 'Cliente' | 'Soporte TI' | 'Bodega' | 'Otros' | null
  quedaraPoderDeOtros: string
  // Date
  dateDay: string
  dateMonth: string
  dateYear: string
  // Signatures
  firmaClienteUrl?: string
  firmaTecnicoUrl?: string
}

interface DerTemplateProps {
  data: DerData
}

export const DerTemplate = forwardRef<HTMLDivElement, DerTemplateProps>(({ data }, ref) => {
  const InputBox = ({ value, className = '' }: { value: string, className?: string }) => (
    <div className={`border px-2 flex items-center overflow-hidden ${className}`} style={{ borderColor: '#000000', height: '22px', boxSizing: 'border-box' }}>
      <span style={{ fontSize: '11px', whiteSpace: 'nowrap', position: 'relative', top: '-2px' }}>{value}</span>
    </div>
  )

  const CheckIcon = ({ size = 10 }) => (
    <svg width={size} height={size} viewBox="0 0 10 10" fill="none" stroke="black" strokeWidth="2" strokeLinecap="round">
      <path d="M2 2L8 8M8 2L2 8" />
    </svg>
  )

  const CheckBox = ({ checked, label }: { checked: boolean, label?: string }) => (
    <div className="flex items-center gap-1">
      {label && <span style={{ fontSize: '11px', whiteSpace: 'nowrap' }}>{label}</span>}
      <div className="border flex items-center justify-center" style={{ borderColor: '#000000', width: '16px', height: '16px', boxSizing: 'border-box' }}>
        {checked && <CheckIcon size={10} />}
      </div>
    </div>
  )

  const Label = ({ children, className = '' }: { children: React.ReactNode, className?: string }) => (
    <div className={`text-[11px] font-semibold flex items-center ${className}`}>
      {children}
    </div>
  )

  return (
    <div ref={ref} className="p-8 w-[210mm] min-h-[297mm] mx-auto box-border font-sans" style={{ backgroundColor: '#ffffff', color: '#000000', fontFamily: 'Arial, sans-serif' }}>
      
      {/* Title */}
      <div className="text-center font-bold text-sm border-b-2 pb-1 mb-4" style={{ borderColor: '#000000' }}>
        DOCUMENTO ENTREGA RETIRO TCS
      </div>

      {/* Date */}
      <div className="flex justify-end mb-4">
        <table className="border-collapse text-[10px] text-center">
          <thead>
            <tr>
              <th className="border px-4 py-0.5" style={{ borderColor: '#000000' }}>Día</th>
              <th className="border px-4 py-0.5" style={{ borderColor: '#000000' }}>Mes</th>
              <th className="border px-4 py-0.5" style={{ borderColor: '#000000' }}>Año</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border px-4 py-0.5" style={{ borderColor: '#000000' }}>{data.dateDay}</td>
              <td className="border px-4 py-0.5" style={{ borderColor: '#000000' }}>{data.dateMonth}</td>
              <td className="border px-4 py-0.5" style={{ borderColor: '#000000' }}>{data.dateYear}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Header Info */}
      <div className="grid grid-cols-[100px_300px] gap-y-1 mb-6">
        <Label>TECNICO:</Label>
        <InputBox value={data.tecnico} />
        
        <Label>N° TICKET:</Label>
        <InputBox value={data.ticket} />
        
        <div className="col-span-2 mt-2 grid grid-cols-[100px_400px] gap-y-1">
          <Label>FILIAL</Label>
          <InputBox value={data.filial} />
          <Label>CIUDAD</Label>
          <InputBox value={data.ciudad} />
          <Label>UBICACIÓN</Label>
          <InputBox value={data.ubicacion} />
        </div>
      </div>

      {/* Datos del Usuario */}
      <div className="mb-4">
        <div className="font-bold text-[11px] mb-1">DATOS DEL USUARIO</div>
        <div className="grid grid-cols-[100px_250px_120px_1fr] gap-y-1 items-center">
          <Label className="justify-end pr-2">Nombre Usuario</Label>
          <InputBox value={data.userName} />
          <Label className="justify-end pr-2">Cargo</Label>
          <InputBox value={data.userCargo} />

          <Label className="justify-end pr-2">RUT</Label>
          <InputBox value={data.userRut} />
          <Label className="justify-end pr-2">Departamento o Área</Label>
          <InputBox value={data.userArea} />

          <Label className="justify-end pr-2">Teléfono</Label>
          <InputBox value={data.userPhone} />
          <div></div><div></div>

          <Label className="justify-end pr-2">Correo</Label>
          <InputBox value={data.userEmail} />
          <div></div><div></div>
        </div>
      </div>

      {/* Datos Equipo Entregado */}
      <div className="mb-4">
        <div className="font-bold text-[11px] mb-1">DATOS DEL EQUIPO ENTREGADO</div>
        <div className="grid grid-cols-[80px_200px_170px_1fr] gap-y-1 items-center">
          <Label className="justify-end pr-2">Tipo</Label>
          <InputBox value={data.tipo} />
          <Label className="justify-end pr-2">Serie (o IMEI)</Label>
          <InputBox value={data.serie} />

          <Label className="justify-end pr-2">Marca</Label>
          <InputBox value={data.marca} />
          <Label className="justify-end pr-2">Rótulo (o N°Línea)</Label>
          <InputBox value={data.rotulo} />

          <Label className="justify-end pr-2">Modelo</Label>
          <InputBox value={data.modelo} />
          <Label className="flex-col items-end justify-center pr-2 leading-tight">
            <span>Hostname (o Cola</span>
            <span>Impresión)</span>
          </Label>
          <InputBox value={data.hostname} />
        </div>
      </div>

      {/* Hardware Menor */}
      <div className="mb-4">
        <div className="font-bold text-[11px] mb-1">HARDWARE MENOR ENTREGADO (solo si aplica)</div>
        <div className="grid grid-cols-[200px_150px_1fr] items-start mb-2">
          <div className="space-y-1">
            <div className="flex justify-between items-center pr-4"><span className="text-[11px]">Monitor</span><CheckBox checked={data.hasMonitor} /></div>
            <div className="flex justify-between items-center pr-4"><span className="text-[11px]">Docking</span><CheckBox checked={data.hasDocking} /></div>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between items-center pr-4"><span className="text-[11px]">Kit wireless</span><CheckBox checked={data.hasKitWireless} /></div>
            <div className="flex justify-between items-center pr-4"><span className="text-[11px]">Otros</span><CheckBox checked={data.hasOtros} /></div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] whitespace-nowrap">Serie(s) y Rotulo(s)</span>
            <InputBox value={data.serieRotulosMenor} className="flex-1" />
          </div>
        </div>

        <div className="text-[11px] mb-1">Accesorios menores</div>
        <div className="flex items-center gap-6 justify-center">
          <CheckBox label="Bolso" checked={data.hasBolso} />
          <CheckBox label="Cargador" checked={data.hasCargador} />
          <CheckBox label="Candado" checked={data.hasCandado} />
          <CheckBox label="Cable Red" checked={data.hasCableRed} />
          <CheckBox label="Mouse USB" checked={data.hasMouseUSB} />
        </div>
      </div>

      {/* Yellow Warning */}
      <div className="text-[10px] p-1 mb-4 leading-tight border" style={{ backgroundColor: '#fef08a', borderColor: '#fde047', color: '#000000' }}>
        Alcances respecto a fallas de hardware menor tales como: Cargador y Batería, estas son cubiertas por garantía siendo Batería 6 meses , Cargador 6 meses, como máximo. Cualquier falla no inherente a fallas de fábrica o fuera del plazo de garantía, los costos de reposición son de cargo y gestión directa del negocio.<br/>
        El tiempo de reposición está sujeta a stock de estos repuestos y dependen de la situación de mercado. No existe una definición de continuidad al respecto.
      </div>

      {/* Software */}
      <div className="mb-4">
        <div className="grid grid-cols-[140px_1fr_200px] gap-y-1 items-center">
          <Label className="justify-end pr-2">Sistema Operativo</Label>
          <InputBox value={data.os} />
          <div className="flex items-center gap-4 pl-4">
            <CheckBox checked={data.osBits === '32'} label="32 bits" />
            <CheckBox checked={data.osBits === '64'} label="64 bits" />
          </div>

          <Label className="justify-end pr-2">Plataforma Ofimática</Label>
          <InputBox value={data.ofimatica} />
          <div className="flex items-center gap-4 pl-4">
            <CheckBox checked={data.ofimaticaBits === '32'} label="32 bits" />
            <CheckBox checked={data.ofimaticaBits === '64'} label="64 bits" />
          </div>

          <Label className="justify-end pr-2">Otros software licenciado</Label>
          <InputBox value={data.otrosSoftware} />
          <div className="flex items-center pl-4">
            <CheckBox checked={data.deshabilitarOneDrive} label="Deshabilitar OneDrive" />
          </div>
        </div>
      </div>

      {/* Observaciones */}
      <div className="mb-4">
        <div className="font-bold text-[11px] mb-1 uppercase">Descripción Trabajo y/o Observaciones</div>
        <div className="border p-2 min-h-[60px] text-[11px]" style={{ borderColor: '#000000' }}>
          {data.observaciones}
        </div>
      </div>

      {/* Equipamiento Saliente */}
      <div className="mb-6">
        <div className="font-bold text-[11px] mb-1">Equipamiento saliente (solo si aplica)</div>
        <div className="grid grid-cols-[300px_1fr] gap-x-4">
          
          <div className="space-y-1">
            <div className="grid grid-cols-[120px_1fr] items-center">
              <Label className="justify-end pr-2">Tipo</Label>
              <InputBox value={data.salienteTipo} />
            </div>
            <div className="grid grid-cols-[120px_1fr] items-center">
              <Label className="justify-end pr-2">Marca</Label>
              <InputBox value={data.salienteMarca} />
            </div>
            <div className="grid grid-cols-[120px_1fr] items-center">
              <Label className="justify-end pr-2">Modelo</Label>
              <InputBox value={data.salienteModelo} />
            </div>
            <div className="grid grid-cols-[120px_1fr] items-center">
              <Label className="justify-end pr-2">Serie (o IMEI)</Label>
              <InputBox value={data.salienteSerie} />
            </div>
            <div className="grid grid-cols-[120px_1fr] items-center">
              <Label className="justify-end pr-2">Rótulo (o N°Línea)</Label>
              <InputBox value={data.salienteRotulo} />
            </div>
          </div>
          
          <div className="space-y-1 flex flex-col">
            <div className="grid grid-cols-[100px_1fr] items-center h-[22px]">
              <div className="flex flex-col items-end pr-2 leading-tight">
                <Label>Hostname (o Cola</Label>
                <Label>Impresión)</Label>
              </div>
              <InputBox value={data.salienteHostname} />
            </div>
            <div className="grid grid-cols-[100px_1fr] flex-1 min-h-[88px] mt-1">
              <div className="flex flex-col items-end pr-2 pt-2 leading-tight">
                <Label>Observaciones</Label>
              </div>
              <div className="border w-full h-full p-2 text-[11px]" style={{ borderColor: '#000000' }}>
                {data.salienteObservaciones}
              </div>
            </div>
          </div>

        </div>

        <div className="text-[11px] mt-2 mb-1">Equipamiento saliente quedara en poder de:</div>
        <div className="grid grid-cols-[150px_1fr] gap-4 ml-12">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="border flex items-center justify-center" style={{ borderColor: '#000000', width: '20px', height: '20px', boxSizing: 'border-box' }}>
                {data.quedaraPoderDe === 'Cliente' && <CheckIcon size={12} />}
              </div>
              <span className="text-[11px]">Cliente</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="border flex items-center justify-center" style={{ borderColor: '#000000', width: '20px', height: '20px', boxSizing: 'border-box' }}>
                {data.quedaraPoderDe === 'Soporte TI' && <CheckIcon size={12} />}
              </div>
              <span className="text-[11px]">Soporte TI</span>
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="border flex items-center justify-center" style={{ borderColor: '#000000', width: '20px', height: '20px', boxSizing: 'border-box' }}>
                {data.quedaraPoderDe === 'Bodega' && <CheckIcon size={12} />}
              </div>
              <span className="text-[11px]">Bodega</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="border flex items-center justify-center" style={{ borderColor: '#000000', width: '20px', height: '20px', boxSizing: 'border-box' }}>
                {data.quedaraPoderDe === 'Otros' && <CheckIcon size={12} />}
              </div>
              <span className="text-[11px] whitespace-nowrap">Otros (especificar):</span>
              <InputBox value={data.quedaraPoderDeOtros} className="flex-1" />
            </div>
          </div>
        </div>
      </div>

      {/* Warning Bottom */}
      <div className="text-center font-bold text-[11px] mb-8">
        ADVERTENCIA PREVIA AL INICIO DEL SERVICIO<br/>
        AL FIRMAR ESTE DOCUMENTO EL USUARIO AUTORIZA LA INTERVENCIÓN TÉCNICA A NIVEL DE HARDWARE Y/O SOFTWARE DE LOS EQUIPOS INDICADOS
      </div>

      {/* Signatures */}
      <div className="grid grid-cols-3 text-center mt-12 gap-4">
        <div className="flex flex-col items-center">
          <div className="w-48 h-24 border-b mb-2 flex items-end justify-center" style={{ borderColor: '#000000' }}>
            {data.firmaClienteUrl && <img src={data.firmaClienteUrl} className="max-h-20" alt="Firma Cliente" />}
          </div>
          <div className="font-bold text-[11px]">Firma Cliente</div>
        </div>
        <div className="flex items-center justify-center font-bold text-[12px]">
          FAVOR DEVOLVER FIRMADO
        </div>
        <div className="flex flex-col items-center">
          <div className="w-48 h-24 border-b mb-2 flex items-end justify-center" style={{ borderColor: '#000000' }}>
             {data.firmaTecnicoUrl && <img src={data.firmaTecnicoUrl} className="max-h-20" alt="Firma Tecnico" />}
          </div>
          <div className="font-bold text-[11px]">Firma Técnico</div>
        </div>
      </div>

    </div>
  )
})
DerTemplate.displayName = 'DerTemplate'
