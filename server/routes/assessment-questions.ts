import express from 'express';
import path from 'path';
import fs from 'fs';

const router = express.Router();

// Endpoint to get all questions from the master database
router.get('/api/assessment/questions', async (req, res) => {
  try {
    const masterQuestionsPath = path.join(process.cwd(), 'data', 'master_questions.json');
    
    // Check if the file exists
    if (!fs.existsSync(masterQuestionsPath)) {
      return res.status(404).json({ error: 'Master questions database not found' });
    }
    
    // Read the file
    const questionsData = fs.readFileSync(masterQuestionsPath, 'utf8');
    const questions = JSON.parse(questionsData);
    
    // Send the questions back
    res.json(questions);
  } catch (error) {
    console.error('Error fetching assessment questions:', error);
    res.status(500).json({ error: 'Failed to fetch questions' });
  }
});

// Endpoint to get questions filtered by domain
router.get('/api/assessment/questions/:domain', async (req, res) => {
  try {
    const { domain } = req.params;
    const masterQuestionsPath = path.join(process.cwd(), 'data', 'master_questions.json');
    
    // Check if the file exists
    if (!fs.existsSync(masterQuestionsPath)) {
      return res.status(404).json({ error: 'Master questions database not found' });
    }
    
    // Read the file
    const questionsData = fs.readFileSync(masterQuestionsPath, 'utf8');
    const allQuestions = JSON.parse(questionsData);
    
    // Filter by domain
    const filteredQuestions = allQuestions.filter(
      (q: any) => q.domain.toLowerCase() === domain.toLowerCase()
    );
    
    // Send the filtered questions back
    res.json(filteredQuestions);
  } catch (error) {
    console.error('Error fetching domain questions:', error);
    res.status(500).json({ error: 'Failed to fetch questions' });
  }
});

// Endpoint to get questions by difficulty level
router.get('/api/assessment/questions/difficulty/:level', async (req, res) => {
  try {
    const { level } = req.params;
    const difficultyLevel = parseInt(level);
    
    if (isNaN(difficultyLevel) || difficultyLevel < 1 || difficultyLevel > 3) {
      return res.status(400).json({ error: 'Invalid difficulty level' });
    }
    
    const masterQuestionsPath = path.join(process.cwd(), 'data', 'master_questions.json');
    
    // Check if the file exists
    if (!fs.existsSync(masterQuestionsPath)) {
      return res.status(404).json({ error: 'Master questions database not found' });
    }
    
    // Read the file
    const questionsData = fs.readFileSync(masterQuestionsPath, 'utf8');
    const allQuestions = JSON.parse(questionsData);
    
    // Filter by difficulty
    const filteredQuestions = allQuestions.filter(
      (q: any) => q.difficulty === difficultyLevel
    );
    
    // Send the filtered questions back
    res.json(filteredQuestions);
  } catch (error) {
    console.error('Error fetching questions by difficulty:', error);
    res.status(500).json({ error: 'Failed to fetch questions' });
  }
});

// Endpoint to get a random selection of questions
router.get('/api/assessment/questions/random/:count', async (req, res) => {
  try {
    const { count } = req.params;
    const questionCount = parseInt(count);
    
    if (isNaN(questionCount) || questionCount < 1) {
      return res.status(400).json({ error: 'Invalid question count' });
    }
    
    const masterQuestionsPath = path.join(process.cwd(), 'data', 'master_questions.json');
    
    // Check if the file exists
    if (!fs.existsSync(masterQuestionsPath)) {
      return res.status(404).json({ error: 'Master questions database not found' });
    }
    
    // Read the file
    const questionsData = fs.readFileSync(masterQuestionsPath, 'utf8');
    const allQuestions = JSON.parse(questionsData);
    
    // Shuffle the questions
    const shuffled = [...allQuestions].sort(() => 0.5 - Math.random());
    
    // Take the requested number of questions
    const randomQuestions = shuffled.slice(0, Math.min(questionCount, shuffled.length));
    
    // Send the random questions back
    res.json(randomQuestions);
  } catch (error) {
    console.error('Error fetching random questions:', error);
    res.status(500).json({ error: 'Failed to fetch questions' });
  }
});

export default router;