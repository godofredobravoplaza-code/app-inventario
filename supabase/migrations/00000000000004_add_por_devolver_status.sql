-- Añadir el estado POR_DEVOLVER al enum equipment_status
ALTER TYPE equipment_status ADD VALUE IF NOT EXISTS 'POR_DEVOLVER';
