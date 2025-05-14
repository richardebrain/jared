/**
 * Script to add quizzes and point rewards to all videos in the library
 * This ensures all videos have associated learning challenges and rewards
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read videoResources.ts file
const videoResourcesFile = path.join(__dirname, 'shared', 'videoResources.ts');
const fileContent = fs.readFileSync(videoResourcesFile, 'utf8');

// Parse the video resources data
const videoResourcesRegex = /export const videoResourcesData: VideoResource\[] = \[([\s\S]*?)\];/;
const videoResourcesMatch = fileContent.match(videoResourcesRegex);

if (!videoResourcesMatch) {
  console.error("Failed to parse video resources from file.");
  process.exit(1);
}

// Template for quiz questions
function generateQuizQuestions(videoTitle, category) {
  const categoryQuizzes = {
    "inspiration": [
      {
        question: "What is the main message of this inspirational video?",
        options: [
          "Teaching is just a job like any other",
          "Building relationships with students is foundational to learning",
          "Strict discipline is the key to classroom success",
          "Technology should replace traditional teaching methods"
        ],
        correctAnswer: 1,
        explanation: "The video emphasizes that positive teacher-student relationships are at the heart of effective education."
      },
      {
        question: "How can you apply the principles from this video in your classroom?",
        options: [
          "Focus only on academic outcomes and test scores",
          "Create opportunities for positive interactions and connection with each child",
          "Minimize emotional support to maintain professional distance",
          "Treat all children exactly the same regardless of their needs"
        ],
        correctAnswer: 1,
        explanation: "Building meaningful connections with each child helps create the foundation for successful learning."
      },
      {
        question: "How might you apply the concepts from this video in your classroom tomorrow?",
        options: [
          "Make a small change to connect more deeply with one challenging student",
          "Completely overhaul your entire teaching approach immediately",
          "Ignore the concepts as they're too idealistic",
          "Wait until next school year to implement any changes"
        ],
        correctAnswer: 0,
        explanation: "Small, intentional changes in how we connect with students can have meaningful impacts."
      }
    ],
    "behavior": [
      {
        question: "What is a key principle of positive behavior guidance shown in the video?",
        options: [
          "Using punishment to correct misbehavior",
          "Seeing challenging behavior as communication and responding to the need",
          "Removing children from the group when they misbehave",
          "Giving children complete freedom without boundaries"
        ],
        correctAnswer: 1,
        explanation: "Positive guidance involves understanding behavior as communication and responding to the underlying need."
      },
      {
        question: "How should teachers respond to challenging behavior according to the video?",
        options: [
          "With immediate consequences",
          "By ignoring it completely",
          "With empathy, calm, and teaching missing skills",
          "By removing privileges"
        ],
        correctAnswer: 2,
        explanation: "Responding with empathy while teaching skills helps children develop self-regulation."
      },
      {
        question: "What practical strategy from this video could you implement in your classroom?",
        options: [
          "Create a better classroom management plan with clearer consequences",
          "Use visual supports and clear expectations to prevent challenging behavior",
          "Remove children from activities when they misbehave",
          "Implement a strict reward system"
        ],
        correctAnswer: 1,
        explanation: "Visual supports and clear expectations help children understand boundaries and succeed."
      }
    ],
    "mindfulness": [
      {
        question: "What benefit of mindfulness practice was highlighted in the video?",
        options: [
          "It makes children sit still for longer periods",
          "It helps children develop self-regulation skills",
          "It eliminates all behavioral issues",
          "It improves academic test scores immediately"
        ],
        correctAnswer: 1,
        explanation: "Mindfulness helps children develop awareness of their emotions and self-regulation skills."
      },
      {
        question: "How often should mindfulness activities be incorporated into the classroom?",
        options: [
          "Once a month during special occasions",
          "Only when children are misbehaving",
          "Daily, as part of regular classroom routines",
          "Just during parent-teacher conferences"
        ],
        correctAnswer: 2,
        explanation: "Regular daily practice helps children develop mindfulness skills over time."
      },
      {
        question: "What is a practical way to introduce mindfulness in your classroom tomorrow?",
        options: [
          "Begin with a simple 1-minute breathing exercise during circle time",
          "Have children sit silently for 30 minutes",
          "Skip outdoor time to practice meditation",
          "Eliminate all transitions in the schedule"
        ],
        correctAnswer: 0,
        explanation: "Starting with brief, engaging mindfulness moments helps build the foundation for practice."
      }
    ],
    // Default questions for any category
    "default": [
      {
        question: "What was the main concept presented in this video?",
        options: [
          "The importance of teacher-child relationships",
          "Strategies for classroom management",
          "Developmentally appropriate practices",
          "Building a supportive learning environment"
        ],
        correctAnswer: 0,
        explanation: "The video emphasized how positive teacher-child relationships form the foundation for learning."
      },
      {
        question: "How could you apply what you learned in this video?",
        options: [
          "Immediately change all classroom policies",
          "Start with small, intentional changes in daily interactions",
          "Wait until next school year to implement",
          "Delegate these responsibilities to assistants"
        ],
        correctAnswer: 1,
        explanation: "Making small, purposeful changes is the most effective way to implement new practices."
      },
      {
        question: "What is one practical strategy from this video that you could implement tomorrow?",
        options: [
          "Completely redesign your classroom layout",
          "Begin one new routine based on the video's principles",
          "Purchase expensive new materials",
          "Schedule a meeting to discuss in the future"
        ],
        correctAnswer: 1,
        explanation: "Starting with one concrete action helps turn learning into practice."
      },
      {
        question: "How will implementing concepts from this video benefit children in your classroom?",
        options: [
          "By creating a more engaging and supportive learning environment",
          "By making classroom management easier for teachers",
          "By impressing administrators during observations",
          "By reducing the amount of planning required"
        ],
        correctAnswer: 0,
        explanation: "The ultimate goal is creating an environment where children can thrive and learn effectively."
      },
      {
        question: "What is a potential challenge in implementing these ideas, and how might you overcome it?",
        options: [
          "Time constraints - start with brief, focused implementation",
          "Resistance to change - ignore new approaches entirely",
          "Limited resources - wait until you have perfect conditions",
          "Colleague support - implement without team collaboration"
        ],
        correctAnswer: 0,
        explanation: "Recognizing challenges and planning strategic responses helps ensure successful implementation."
      }
    ]
  };

  // Get the relevant quiz category or default to the default questions
  let categoryKey = "default";
  for (const key of Object.keys(categoryQuizzes)) {
    if (videoTitle.toLowerCase().includes(key.toLowerCase()) || 
        (Array.isArray(category) && category.some(cat => cat.toLowerCase().includes(key.toLowerCase())))) {
      categoryKey = key;
      break;
    }
  }

  // Select questions for this video (using the appropriate category or default)
  let questions = categoryQuizzes[categoryKey];
  
  // Add implementation question
  questions.push({
    question: "How will you implement what you've learned from this video in your classroom?",
    options: [
      "I'll try one new strategy from the video this week",
      "I'll share what I learned with a colleague",
      "I'll reflect on how these concepts connect to our school philosophy",
      "I'll observe my classroom to identify where these concepts could help"
    ],
    correctAnswer: 0,
    explanation: "Taking action and implementing new knowledge is the most effective way to improve your teaching practice."
  });

  return questions;
}

// Process the video resources file
async function addQuizzesToVideos() {
  // Identify all videos
  const videoRegex = /\{[\s\S]*?id:\s*["']([^"']+)["'][\s\S]*?title:\s*["']([^"']+)["'][\s\S]*?category:\s*\[([\s\S]*?)\][\s\S]*?(quiz:\s*(null|undefined)|quiz:\s*\{[\s\S]*?\}|quiz:\s*undefined|(?!quiz))[\s\S]*?\}/g;
  
  let updatedContent = fileContent;
  const matches = [...fileContent.matchAll(videoRegex)];
  
  console.log(`Found ${matches.length} video entries to process`);
  
  let updatedCount = 0;
  
  // For each video
  for (const match of matches) {
    const fullMatch = match[0];
    const videoId = match[1];
    const videoTitle = match[2];
    const categoryString = match[3];
    
    // Parse the category array
    let categories = [];
    const categoryRegex = /["']([^"']+)["']/g;
    const categoryMatches = [...categoryString.matchAll(categoryRegex)];
    categories = categoryMatches.map(m => m[1]);
    
    // Check if video has a quiz property already
    if (!fullMatch.includes('quiz:') || fullMatch.includes('quiz: null') || fullMatch.includes('quiz: undefined')) {
      // Generate quiz for this video
      const quizQuestions = generateQuizQuestions(videoTitle, categories);
      
      // Create the new quiz object
      const newQuiz = `quiz: {\n    questions: ${JSON.stringify(quizQuestions, null, 6).replace(/^/gm, '    ')}\n  }`;
      
      // Replace video entry to include the quiz
      // Find the position right before the closing brace
      let updatedVideoEntry = fullMatch;
      
      // If there's a quiz: null or quiz: undefined property, replace it
      if (fullMatch.includes('quiz: null') || fullMatch.includes('quiz: undefined')) {
        updatedVideoEntry = updatedVideoEntry.replace(/(quiz:\s*(null|undefined))/, newQuiz);
      } else {
        // Otherwise insert the quiz property before the closing brace
        updatedVideoEntry = updatedVideoEntry.replace(/}$/, `,\n  ${newQuiz}\n}`);
      }
      
      updatedContent = updatedContent.replace(fullMatch, updatedVideoEntry);
      
      updatedCount++;
      console.log(`✅ Added quiz to "${videoTitle}" (${videoId})`);
    }
  }
  
  // Write the updated content back to the file
  fs.writeFileSync(videoResourcesFile, updatedContent);
  
  console.log(`\nAdded quizzes to ${updatedCount} videos`);
  console.log(`Updated file: ${videoResourcesFile}`);
}

// Run the script
addQuizzesToVideos().catch(error => {
  console.error("Error adding quizzes to videos:", error);
  process.exit(1);
});