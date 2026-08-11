-- Add status to der_records
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'der_status') THEN
    CREATE TYPE der_status AS ENUM ('DRAFT', 'COMPLETED');
  END IF;
END $$;

ALTER TABLE der_records ADD COLUMN IF NOT EXISTS status der_status DEFAULT 'COMPLETED';

-- Add form_data JSONB to store all the input fields for resuming drafts
ALTER TABLE der_records ADD COLUMN IF NOT EXISTS form_data JSONB;

-- Update existing records to have empty JSON object if needed (optional)
UPDATE der_records SET form_data = '{}'::jsonb WHERE form_data IS NULL;

-- Make fields optional in DB if they were NOT NULL, since DRAFTS might not have an equipment_id
ALTER TABLE der_records ALTER COLUMN equipment_id DROP NOT NULL;
ALTER TABLE der_records ALTER COLUMN user_name DROP NOT NULL;
ALTER TABLE der_records ALTER COLUMN user_rut DROP NOT NULL;
ALTER TABLE der_records ALTER COLUMN drive_file_url DROP NOT NULL;
