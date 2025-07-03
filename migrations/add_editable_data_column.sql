-- Add editable_data column to learning_modules table
ALTER TABLE learning_modules ADD COLUMN IF NOT EXISTS editable_data JSONB;
