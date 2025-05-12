-- Add the recommended column to user_progress
ALTER TABLE IF EXISTS "user_progress" 
ADD COLUMN IF NOT EXISTS "recommended" boolean DEFAULT false;

-- Update assessment table schema
ALTER TABLE IF EXISTS "assessments"
ADD COLUMN IF NOT EXISTS "overall_score" integer,
ADD COLUMN IF NOT EXISTS "domain_scores" jsonb,
ADD COLUMN IF NOT EXISTS "strength_areas" jsonb,
ADD COLUMN IF NOT EXISTS "growth_areas" jsonb,
ADD COLUMN IF NOT EXISTS "recommended_modules" jsonb,
ADD COLUMN IF NOT EXISTS "assessment_type" text DEFAULT 'ITERS_ECERS_CLASS',
ADD COLUMN IF NOT EXISTS "notes" text;