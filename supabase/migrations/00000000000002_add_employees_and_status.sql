-- Migración para agregar la tabla de Empleados y actualizar el estado de Inventario

-- 1. Crear tabla de Empleados (Usuarios finales de los equipos)
CREATE TABLE IF NOT EXISTS employees (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    full_name TEXT NOT NULL,
    rut TEXT UNIQUE NOT NULL,
    job_title TEXT,
    department TEXT,
    email TEXT,
    phone TEXT,
    account_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Habilitar RLS en la tabla employees
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

-- Políticas para employees (similar a profiles)
CREATE POLICY "Everyone can view employees" ON employees
    FOR SELECT USING (true);

CREATE POLICY "Operators and Admins can insert employees" ON employees
    FOR INSERT WITH CHECK (get_user_role() IN ('OPERATOR', 'ADMIN'));

CREATE POLICY "Operators and Admins can update employees" ON employees
    FOR UPDATE USING (get_user_role() IN ('OPERATOR', 'ADMIN'));

-- 2. Actualizar el ENUM de estados (Si usas un ENUM en Postgres)
-- Descomenta y ejecuta esta línea si 'equipment_status' es un tipo ENUM en tu base de datos:
-- ALTER TYPE equipment_status ADD VALUE IF NOT EXISTS 'POR_DEVOLVER';

-- Nota: Si el estado es solo una columna TEXT (con o sin CHECK constraint), no necesitas modificar el ENUM.
-- Solo asegúrate de actualizar la restricción CHECK si existe:
-- ALTER TABLE inventory DROP CONSTRAINT IF EXISTS inventory_status_check;
-- ALTER TABLE inventory ADD CONSTRAINT inventory_status_check CHECK (status IN ('EN_BODEGA', 'ASIGNADO', 'PRESTAMO_TEMPORAL', 'EN_REEMPLAZO_LAB', 'EN_LABORATORIO_SONDA', 'NO_ENTREGADO_A_TI', 'RECUPERADO_SIN_ACTA', 'DE_BAJA_RENOVADO', 'REGISTRO_INCOMPLETO_ATENCION', 'POR_DEVOLVER'));
