-- POLÍTICAS DE SEGURIDAD RLS (Row Level Security)

-- Habilitar RLS en todas las tablas
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE der_records ENABLE ROW LEVEL SECURITY;

-- Funciones auxiliares
CREATE OR REPLACE FUNCTION get_user_role() RETURNS user_role AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- 1. Políticas para profiles
-- Cualquiera puede ver su propio perfil
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Admins pueden ver todos los perfiles
CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (get_user_role() = 'ADMIN');

-- Solo Admins pueden modificar perfiles (para cambiar roles)
CREATE POLICY "Admins can update profiles" ON profiles
  FOR UPDATE USING (get_user_role() = 'ADMIN');

-- 2. Políticas para inventory
-- Todos pueden ver el inventario (Viewer, Operator, Admin)
CREATE POLICY "Everyone can view inventory" ON inventory
  FOR SELECT USING (true);

-- Operator y Admin pueden insertar/actualizar
CREATE POLICY "Operators and Admins can insert inventory" ON inventory
  FOR INSERT WITH CHECK (get_user_role() IN ('OPERATOR', 'ADMIN'));

CREATE POLICY "Operators and Admins can update inventory" ON inventory
  FOR UPDATE USING (get_user_role() IN ('OPERATOR', 'ADMIN'));

-- Solo Admin puede usar Soft Delete (actualizar deleted_at) o hard delete
CREATE POLICY "Only Admins can delete inventory" ON inventory
  FOR DELETE USING (get_user_role() = 'ADMIN');

-- 3. Políticas para audit_logs
-- Todos pueden ver los logs (Auditoría)
CREATE POLICY "Everyone can view audit logs" ON audit_logs
  FOR SELECT USING (true);

-- Operators y Admins pueden crear logs, nadie puede editarlos o borrarlos
CREATE POLICY "Operators and Admins can insert logs" ON audit_logs
  FOR INSERT WITH CHECK (get_user_role() IN ('OPERATOR', 'ADMIN'));

-- 4. Políticas para der_records
-- Todos pueden ver los registros DER
CREATE POLICY "Everyone can view DER records" ON der_records
  FOR SELECT USING (true);

-- Operators y Admins pueden crear registros DER
CREATE POLICY "Operators and Admins can insert DER records" ON der_records
  FOR INSERT WITH CHECK (get_user_role() IN ('OPERATOR', 'ADMIN'));
