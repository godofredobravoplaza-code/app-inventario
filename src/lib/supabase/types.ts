export type UserRole = 'ADMIN' | 'OPERATOR' | 'VIEWER';

export type EquipmentCategory = 
  | 'LAPTOP' 
  | 'DESKTOP' 
  | 'PRINTER_COLOR' 
  | 'PRINTER_BN' 
  | 'ZEBRA_LABEL' 
  | 'ZEBRA_TRF' 
  | 'VIDEO_CONFERENCIA' 
  | 'SERVER' 
  | 'TABLET';

export type EquipmentStatus = 
  | 'EN_BODEGA' 
  | 'ASIGNADO' 
  | 'PRESTAMO_TEMPORAL' 
  | 'EN_REEMPLAZO_LAB' 
  | 'EN_LABORATORIO_SONDA' 
  | 'NO_ENTREGADO_A_TI' 
  | 'RECUPERADO_SIN_ACTA' 
  | 'DE_BAJA_RENOVADO' 
  | 'REGISTRO_INCOMPLETO_ATENCION'
  | 'POR_DEVOLVER';

export interface Employee {
  id: string;
  full_name: string;
  rut: string;
  job_title?: string | null;
  department?: string | null;
  email?: string | null;
  phone?: string | null;
  account_name?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  created_at: string;
}

export interface InventoryItem {
  id: string;
  serial_number: string;
  asset_tag: string | null;
  category: EquipmentCategory;
  brand: string;
  model: string;
  ram_gb: number | null;
  storage_gb: number | null;
  status: EquipmentStatus;
  hostname?: string | null
  os_version?: string | null
  current_user_name?: string | null
  current_user_rut?: string | null
  current_user_account?: string | null
  assignment_ticket?: string | null
  reception_date?: string | null; // YYYY-MM-DD format from DB
  manual_months_offset: number;
  months_in_operation: number;
  linked_equipment_id: string | null;
  comments: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface ModelCatalogItem {
  id: string;
  category: EquipmentCategory;
  brand: string;
  model: string;
  created_at: string;
}

export type DerStatus = 'DRAFT' | 'COMPLETED';

export interface DerRecord {
  id: string;
  ticket_number: string;
  user_name?: string | null;
  user_rut?: string | null;
  equipment_id?: string | null;
  drive_file_url?: string | null;
  status: DerStatus;
  form_data?: any; // JSONB
  created_by: string;
  created_at: string;
}
