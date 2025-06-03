-- Manual migration to change domainId from text to integer
-- This is safer than drizzle-kit push when other contributors have made changes

-- Step 1: Update assessment_questions.domain_id column
ALTER TABLE assessment_questions 
ALTER COLUMN domain_id TYPE integer 
USING domain_id::integer;

-- Step 2: Add foreign key constraint for assessment_questions.domain_id
ALTER TABLE assessment_questions 
ADD CONSTRAINT assessment_questions_domain_id_fkey 
FOREIGN KEY (domain_id) REFERENCES assessment_domains(id);

-- Step 3: Update assessment_responses.domain_id column  
ALTER TABLE assessment_responses 
ALTER COLUMN domain_id TYPE integer 
USING domain_id::integer;

-- Step 4: Add foreign key constraint for assessment_responses.domain_id
ALTER TABLE assessment_responses 
ADD CONSTRAINT assessment_responses_domain_id_fkey 
FOREIGN KEY (domain_id) REFERENCES assessment_domains(id);

-- Verify the changes
SELECT 
    table_name, 
    column_name, 
    data_type 
FROM information_schema.columns 
WHERE table_name IN ('assessment_questions', 'assessment_responses') 
AND column_name = 'domain_id';

-- Verify foreign key constraints were added
SELECT 
    tc.table_name, 
    tc.constraint_name, 
    tc.constraint_type,
    kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND kcu.column_name = 'domain_id'
AND tc.table_name IN ('assessment_questions', 'assessment_responses'); 