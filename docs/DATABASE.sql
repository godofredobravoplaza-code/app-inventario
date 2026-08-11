-- ENUMS OFICIALES
CREATE TYPE user_role AS ENUM ('ADMIN', 'OPERATOR', 'VIEWER');

CREATE TYPE equipment_category AS ENUM (
  'LAPTOP', 'DESKTOP', 'PRINTER_COLOR', 'PRINTER_BN', 
  'ZEBRA_LABEL', 'ZEBRA_TRF', 'VIDEO_CONFERENCIA', 'SERVER', 'TABLET'
);

CREATE TYPE equipment_status AS ENUM (
  'EN_BODEGA', 'ASIGNADO', 'PRESTAMO_TEMPORAL', 
  'EN_REEMPLAZO_LAB', 'EN_LABORATORIO_SONDA', 'NO_ENTREGADO_A_TI', 
  'RECUPERADO_SIN_ACTA', 'DE_BAJA_RENOVADO', 'REGISTRO_INCOMPLETO_ATENCION'
);

-- TABLA DE PERFILES DE USUARIO
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role user_role DEFAULT 'OPERATOR',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- TABLA DE INVENTARIO PRINCIPAL (ACTUALIZADA)
CREATE TABLE inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  serial_number TEXT UNIQUE NOT NULL,
  asset_tag TEXT, 
  category equipment_category NOT NULL,
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  ram_gb INT,
  storage_gb INT,
  status equipment_status DEFAULT 'EN_BODEGA',
  hostname TEXT,
  os_version TEXT,
  current_user_name TEXT,
  current_user_rut TEXT,
  current_user_account TEXT,
  assignment_ticket TEXT,
  reception_date DATE, -- NUEVO: Fecha de guía para equipos nuevos
  manual_months_offset INT DEFAULT 0, -- NUEVO: Meses ingresados manualmente para antiguos
  months_in_operation INT DEFAULT 0, -- Campo consolidado
  linked_equipment_id UUID REFERENCES inventory(id), 
  comments TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ 
);

-- TABLA DE HISTORIAL Y AUDITORÍA (DIFF)
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id UUID REFERENCES inventory(id),
  performed_by UUID REFERENCES profiles(id) NOT NULL,
  action_type TEXT NOT NULL, 
  previous_data JSONB,
  new_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- TABLA DE REGISTROS DER
CREATE TABLE der_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number TEXT NOT NULL,
  user_name TEXT NOT NULL,
  user_rut TEXT NOT NULL,
  equipment_id UUID REFERENCES inventory(id) NOT NULL,
  signature_url TEXT,
  drive_file_id TEXT,
  drive_file_url TEXT,
  created_by UUID REFERENCES profiles(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);