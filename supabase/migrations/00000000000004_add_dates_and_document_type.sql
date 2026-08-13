-- Add assignment_date and return_date to inventory
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS assignment_date DATE;
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS return_date DATE;

-- Add document_type to der_records
ALTER TABLE der_records ADD COLUMN IF NOT EXISTS document_type VARCHAR(50) DEFAULT 'DER';
