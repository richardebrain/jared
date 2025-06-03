/**
 * Difficulty Level Utility
 * 
 * Provides consistent difficulty level labels and colors across the application.
 * Uses the 6-level system: Easy → Easy/Medium → Medium → Medium/Hard → Hard → Master
 */

export type DifficultyLevel = 1 | 2 | 3 | 4 | 5 | 6;

export const getDifficultyLabel = (difficulty: number | string): string => {
  const level = typeof difficulty === 'string' ? parseInt(difficulty, 10) : difficulty;
  
  switch (level) {
    case 1: return 'Easy';
    case 2: return 'Easy/Medium';
    case 3: return 'Medium';
    case 4: return 'Medium/Hard';
    case 5: return 'Hard';
    case 6: return 'Master';
    default: return 'Unknown';
  }
};

export const getDifficultyColor = (difficulty: number | string): string => {
  const level = typeof difficulty === 'string' ? parseInt(difficulty, 10) : difficulty;
  
  switch (level) {
    case 1: return 'bg-green-100 text-green-800 border-green-200';
    case 2: return 'bg-blue-100 text-blue-800 border-blue-200';
    case 3: return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 4: return 'bg-orange-100 text-orange-800 border-orange-200';
    case 5: return 'bg-red-100 text-red-800 border-red-200';
    case 6: return 'bg-purple-100 text-purple-800 border-purple-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

export const getDifficultyIcon = (difficulty: number | string) => {
  const level = typeof difficulty === 'string' ? parseInt(difficulty, 10) : difficulty;
  
  // Return appropriate icon class names or components
  if (level <= 2) return 'BookOpen'; // Easy levels
  if (level <= 4) return 'Target';   // Medium levels  
  return 'TrendingUp';               // Hard levels
};

export const DIFFICULTY_LEVELS = [
  { value: 1, label: 'Easy' },
  { value: 2, label: 'Easy/Medium' },
  { value: 3, label: 'Medium' },
  { value: 4, label: 'Medium/Hard' },
  { value: 5, label: 'Hard' },
  { value: 6, label: 'Master' }
] as const;

export const DIFFICULTY_OPTIONS = DIFFICULTY_LEVELS.map(level => ({
  value: level.value.toString(),
  label: level.label
})); 