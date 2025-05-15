-- Create the educational_games table if it doesn't exist
CREATE TABLE IF NOT EXISTS educational_games (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  type TEXT NOT NULL,
  difficulty TEXT NOT NULL,
  category TEXT NOT NULL,
  points_value INTEGER NOT NULL,
  config JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create the game_completions table if it doesn't exist
CREATE TABLE IF NOT EXISTS game_completions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  game_id INTEGER NOT NULL REFERENCES educational_games(id),
  score INTEGER,
  time_taken INTEGER,
  points_earned INTEGER NOT NULL,
  completed_at TIMESTAMP DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS game_completions_user_id_idx ON game_completions(user_id);
CREATE INDEX IF NOT EXISTS game_completions_game_id_idx ON game_completions(game_id);
CREATE INDEX IF NOT EXISTS game_completions_completed_at_idx ON game_completions(completed_at);

-- Insert sample milestone-matching game if no games exist
INSERT INTO educational_games (title, description, type, difficulty, category, points_value, config)
SELECT 
  'Child Development Milestones', 
  'Match the correct developmental milestones to their age groups. Test your knowledge of when children typically develop different skills and abilities.', 
  'milestone-matching', 
  'medium', 
  'child-development', 
  10,
  '{
    "timeLimit": 180,
    "passingScore": 70,
    "items": [
      {
        "id": 1,
        "milestone": "Rolls from back to tummy",
        "ageGroup": "infants"
      },
      {
        "id": 2,
        "milestone": "Begins to use sentences with 3-4 words",
        "ageGroup": "toddlers"
      },
      {
        "id": 3,
        "milestone": "Follows simple two-step directions",
        "ageGroup": "toddlers"
      },
      {
        "id": 4,
        "milestone": "Grasps and shakes toys",
        "ageGroup": "infants"
      },
      {
        "id": 5,
        "milestone": "Begins pretend play",
        "ageGroup": "toddlers"
      },
      {
        "id": 6,
        "milestone": "Takes turns in games",
        "ageGroup": "preschoolers"
      },
      {
        "id": 7,
        "milestone": "Recognizes and identifies emotions in others",
        "ageGroup": "preschoolers"
      },
      {
        "id": 8,
        "milestone": "Draws recognizable pictures",
        "ageGroup": "preschoolers"
      },
      {
        "id": 9,
        "milestone": "Holds head steady without support",
        "ageGroup": "infants"
      },
      {
        "id": 10,
        "milestone": "Walks alone with good balance",
        "ageGroup": "toddlers"
      },
      {
        "id": 11,
        "milestone": "Sorts objects by color, shape, or size",
        "ageGroup": "preschoolers"
      },
      {
        "id": 12,
        "milestone": "Responds to own name",
        "ageGroup": "infants"
      }
    ]
  }'::JSONB
WHERE NOT EXISTS (SELECT 1 FROM educational_games LIMIT 1);