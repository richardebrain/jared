-- Sample ECE Assessment Questions Import Script
-- This script directly inserts sample assessment questions into the database

-- Clear out any existing test data (optional - remove if you want to keep existing questions)
-- DELETE FROM assessment_questions WHERE id LIKE 'ece-sample-%';

-- Insert beginner level questions
INSERT INTO assessment_questions (id, domain, text, options, correct_answer, difficulty, explanation, created_at)
VALUES 
('ece-sample-1', 'Child Development', 'Which of the following is a key milestone in cognitive development for 3-year-olds?', 
 '["Understanding cause and effect", "Algebraic thinking", "Abstract reasoning", "Writing complete sentences"]', 
 0, 'beginner', 'At age 3, children are developing an understanding of cause and effect relationships through play and observation.', NOW()),

('ece-sample-2', 'Language & Literacy', 'What type of books are most engaging for toddlers?', 
 '["Books with rhyming text and colorful pictures", "Chapter books with complex plots", "Non-fiction reference books", "Books without illustrations"]', 
 0, 'beginner', 'Toddlers are drawn to books with rhyming text, predictable patterns, and colorful illustrations that relate to their everyday experiences.', NOW()),

('ece-sample-3', 'Social-Emotional Development', 'Which strategy best supports emotional regulation in preschoolers?', 
 '["Naming feelings and modeling calm responses", "Removing all emotional triggers from the classroom", "Ignoring emotional outbursts", "Immediately resolving all conflicts for children"]', 
 0, 'beginner', 'Helping children identify their feelings and modeling appropriate responses gives them tools to manage emotions independently.', NOW()),

('ece-sample-4', 'Health & Safety', 'What is the recommended hand-washing duration for children in a classroom setting?', 
 '["At least 20 seconds", "5 seconds", "1 minute", "As long as it takes to count to 10"]', 
 0, 'beginner', 'The CDC recommends washing hands for at least 20 seconds, which is approximately the time it takes to sing the "Happy Birthday" song twice.', NOW()),

('ece-sample-5', 'Curriculum', 'Which approach to early childhood education emphasizes child-directed play and exploration?', 
 '["Play-based learning", "Direct instruction", "Rote memorization", "Academic drilling"]', 
 0, 'beginner', 'Play-based learning approaches value child-initiated activities, exploration, and discovery as the primary vehicles for learning.', NOW());

-- Insert intermediate level questions
INSERT INTO assessment_questions (id, domain, text, options, correct_answer, difficulty, explanation, created_at)
VALUES 
('ece-sample-6', 'Child Development', 'Which cognitive theory describes how children actively construct knowledge through experiences and interactions?', 
 '["Constructivism", "Behaviorism", "Maturationism", "Nativism"]', 
 0, 'intermediate', 'Constructivist theory, associated with Piaget and Vygotsky, suggests children build understanding through active engagement with their environment and social interactions.', NOW()),

('ece-sample-7', 'Assessment', 'What is the primary purpose of formative assessment in early childhood education?', 
 '["To guide ongoing teaching and learning", "To determine final achievement levels", "To compare children to standardized norms", "To evaluate teacher performance"]', 
 0, 'intermediate', 'Formative assessment is used to gather information during the learning process, helping teachers adjust instruction to meet children''s needs.', NOW()),

('ece-sample-8', 'Inclusive Practices', 'Which approach represents best practice when supporting a child with sensory processing challenges?', 
 '["Individualized accommodations based on observation and professional guidance", "Eliminating all sensory stimuli from the environment", "Requiring the child to adapt to typical classroom sensory experiences", "Separating the child from peers during sensory activities"]', 
 0, 'intermediate', 'Effective inclusion involves making individualized accommodations based on the specific sensory needs of the child, often working with occupational therapists or other specialists.', NOW()),

('ece-sample-9', 'Family Engagement', 'Which strategy most effectively promotes culturally responsive family partnerships?', 
 '["Learning about and incorporating families'' cultural practices and values", "Treating all families exactly the same way", "Having one multicultural event each year", "Focusing only on school-based priorities in communication"]', 
 0, 'intermediate', 'Culturally responsive partnerships require learning about and respecting each family''s unique cultural context and incorporating their perspectives and practices.', NOW()),

('ece-sample-10', 'Guidance & Discipline', 'What is the primary goal of positive guidance approaches?', 
 '["To help children develop self-regulation and problem-solving skills", "To ensure immediate compliance with adult directives", "To eliminate all challenging behaviors", "To implement consistent punishments for misbehavior"]', 
 0, 'intermediate', 'Positive guidance approaches focus on teaching children the skills to regulate their own behavior and solve problems, rather than just obtaining compliance.', NOW());

-- Insert advanced level questions
INSERT INTO assessment_questions (id, domain, text, options, correct_answer, difficulty, explanation, created_at)
VALUES 
('ece-sample-11', 'Trauma-Informed Care', 'Which statement accurately describes the impact of adverse childhood experiences (ACEs) on development?', 
 '["ACEs can affect brain architecture and stress response systems, but supportive relationships can buffer these impacts", "ACEs always lead to permanent developmental damage that cannot be reversed", "Children naturally overcome the effects of trauma without intervention", "The effects of ACEs only become apparent in adolescence"]', 
 0, 'advanced', 'Research shows that while ACEs can significantly impact brain development, responsive caregiving and supportive relationships can help buffer these effects and promote resilience.', NOW()),

('ece-sample-12', 'Neuroscience and Learning', 'How does executive function development in early childhood relate to later academic success?', 
 '["Strong executive function skills like working memory and inhibitory control predict later academic achievement", "Executive function skills have no correlation with academic outcomes", "Executive function only affects social development, not academic learning", "Executive function is fixed at birth and cannot be influenced by early experiences"]', 
 0, 'advanced', 'Research demonstrates that executive function skills—including working memory, inhibitory control, and cognitive flexibility—are stronger predictors of academic success than IQ or early academic skills alone.', NOW()),

('ece-sample-13', 'Equity and Anti-Bias Education', 'What is the most appropriate approach to addressing racial and cultural biases in early childhood?', 
 '["Implement ongoing anti-bias curriculum and reflect on personal biases", "Teach children to be colorblind and ignore differences", "Wait until children are older to address bias and discrimination", "Focus exclusively on similarities across cultures"]', 
 0, 'advanced', 'Effective anti-bias education involves ongoing curriculum that acknowledges differences, celebrates diversity, explores fairness concepts, and requires educators to reflect on their own biases.', NOW()),

('ece-sample-14', 'Assessment and Observation', 'Which approach to documentation most effectively captures the complexity of children''s learning processes?', 
 '["Pedagogical documentation that includes multiple perspectives, including children''s voices", "Standardized checklists of developmental milestones", "End-of-unit tests measuring specific skills", "Simple work samples collected without context"]', 
 0, 'advanced', 'Pedagogical documentation goes beyond recording what children do to interpret the meaning of their actions, incorporating multiple perspectives including the children''s own thoughts about their learning.', NOW()),

('ece-sample-15', 'Program Leadership', 'What leadership approach best supports a culture of continuous quality improvement in an early childhood program?', 
 '["Distributed leadership that builds reflective capacity among all staff", "Authoritarian leadership with clear top-down directives", "Hands-off leadership that allows teachers complete autonomy", "Leadership focused primarily on regulatory compliance"]', 
 0, 'advanced', 'Distributed leadership approaches recognize the expertise of all staff members, creating communities of practice where ongoing reflection, learning, and improvement are valued.', NOW());