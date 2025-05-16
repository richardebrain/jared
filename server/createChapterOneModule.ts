import { db } from "./db";
import { learningModules, type InsertLearningModule } from "@shared/schema";
import { eq } from "drizzle-orm";

/**
 * Chapter 1: Building a Human - A comprehensive training on childhood development
 * 
 * This module focuses on early childhood development, trauma, attachment science,
 * and the powerful role preschool teachers play in shaping children's futures.
 * It's a required training for all new teachers along with the CORE Values module.
 */
export async function createChapterOneModule() {
  // Check if the module already exists
  const existingModules = await db
    .select()
    .from(learningModules)
    .where(eq(learningModules.title, "Chapter 1: Building a Human"));

  if (existingModules.length > 0) {
    console.log("Chapter 1 module already exists with ID:", existingModules[0].id);
    return existingModules[0];
  }

  // Create the new Chapter 1 module
  const chapterOneModule: InsertLearningModule = {
    title: "Chapter 1: Building a Human",
    description: "Explore the science of early childhood development, trauma, attachment, and how preschool teachers can positively impact brain development and lifelong outcomes. This required training provides essential knowledge for all early childhood educators.",
    duration: 50,
    pointValue: 20, // Assign 20 points for completing this required module
    imageUrl: "/assets/mindful-mornings-logo.jpg", // Placeholder image, should update later
    featured: true,
    difficulty: "beginner",
    category: "onboarding",
    content: `
      <div class="chapter-one-module">
        <h1 class="text-3xl font-bold text-center mb-8 bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
          Chapter 1: Building a Human
        </h1>
        
        <div class="mb-8">
          <h2 class="text-2xl font-bold mb-4">Introduction</h2>
          <p class="mb-4">
            As preschool teachers, we are writing the first chapter of children's lives. This training will help you understand
            the science behind early childhood development and your crucial role in shaping healthy brains and futures.
          </p>
        </div>

        <div class="module-section mb-10">
          <h2 class="text-2xl font-bold mb-6 text-green-700">Module 1: Trauma & Attachment Science</h2>
          
          <div class="video-container mb-6 rounded-lg overflow-hidden shadow-md">
            <div class="aspect-video relative">
              <iframe 
                width="100%" 
                height="100%" 
                src="https://www.youtube.com/embed/95ovIJ3dsNk" 
                title="How childhood trauma affects health across a lifetime | Nadine Burke Harris"
                frameborder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowfullscreen
                class="absolute inset-0"
              ></iframe>
            </div>
            <div class="p-4 bg-gray-50">
              <h3 class="font-medium text-gray-900">How childhood trauma affects health across a lifetime</h3>
              <p class="text-sm text-gray-600">TED Talk by Dr. Nadine Burke Harris (first 5 minutes)</p>
            </div>
          </div>
          
          <div class="quiz-section bg-white p-6 rounded-lg shadow-sm border border-gray-100 mb-6">
            <h3 class="text-xl font-semibold mb-4">Interactive Quiz</h3>
            
            <div class="question mb-6">
              <p class="font-medium mb-2">Which system is most dysregulated by toxic stress?</p>
              <div class="options space-y-2">
                <div class="option flex items-center">
                  <input type="radio" id="immune" name="stress-system" value="immune" class="mr-2">
                  <label for="immune" class="text-green-700 font-medium">Immune ✓</label>
                </div>
                <div class="option flex items-center">
                  <input type="radio" id="visual" name="stress-system" value="visual" class="mr-2">
                  <label for="visual">Visual</label>
                </div>
                <div class="option flex items-center">
                  <input type="radio" id="digestive" name="stress-system" value="digestive" class="mr-2">
                  <label for="digestive">Digestive</label>
                </div>
                <div class="option flex items-center">
                  <input type="radio" id="vestibular" name="stress-system" value="vestibular" class="mr-2">
                  <label for="vestibular">Vestibular</label>
                </div>
              </div>
            </div>
          </div>
          
          <div class="journal-section bg-green-50 p-6 rounded-lg border border-green-100 mb-6">
            <h3 class="text-xl font-semibold text-green-800 mb-3">Journal Prompt</h3>
            <p class="mb-4 text-green-700">Recall a time you felt regulated vs. overwhelmed—what helped you shift?</p>
            <textarea 
              class="w-full p-3 border border-green-200 rounded-md focus:ring-2 focus:ring-green-300 focus:border-transparent"
              rows="4"
              placeholder="Write your reflection here..."
            ></textarea>
          </div>
          
          <div class="action-section bg-blue-50 p-6 rounded-lg border border-blue-100">
            <h3 class="text-xl font-semibold text-blue-800 mb-3">Action Step</h3>
            <p class="mb-4 text-blue-700">Commit to learning one simple on-the-spot regulation strategy you'll practice with children (e.g., 5-finger breathing).</p>
            <div class="flex items-center">
              <input type="checkbox" id="action-commitment" class="mr-2">
              <label for="action-commitment" class="text-blue-700">I commit to practicing this strategy</label>
            </div>
          </div>
        </div>

        <div class="module-section mb-10">
          <h2 class="text-2xl font-bold mb-6 text-amber-700">Module 2: The Cost of Negativity</h2>
          
          <div class="video-container mb-6 rounded-lg overflow-hidden shadow-md">
            <div class="aspect-video relative">
              <iframe 
                width="100%" 
                height="100%" 
                src="https://www.youtube.com/embed/VNNsN9IJkws" 
                title="InBrief: The Science of Early Childhood Development"
                frameborder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowfullscreen
                class="absolute inset-0"
              ></iframe>
            </div>
            <div class="p-4 bg-gray-50">
              <h3 class="font-medium text-gray-900">InBrief: The Science of Early Childhood Development</h3>
              <p class="text-sm text-gray-600">Harvard's Center on the Developing Child</p>
            </div>
          </div>
          
          <div class="data-section bg-amber-50 p-6 rounded-lg border border-amber-100 mb-6">
            <h3 class="text-xl font-semibold text-amber-800 mb-3">Data Snapshot</h3>
            <p class="text-amber-700 mb-4">
              Hart & Risley (1995): By age 3, children in welfare-level families hear 5 positive vs. 11 negative statements per hour, 
              compared to 32 positive vs. 5 negative in professional families—that's one negative every 5 minutes in high-risk homes.
            </p>
            <p class="text-xs text-amber-600">Source: The New Yorker</p>
          </div>
          
          <div class="reflection-section bg-white p-6 rounded-lg shadow-sm border border-gray-100 mb-6">
            <h3 class="text-xl font-semibold mb-4">Reflection</h3>
            <p class="mb-4">How might those early negative messages manifest in behavior or self-talk at preschool?</p>
            <textarea 
              class="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-300 focus:border-transparent"
              rows="4"
              placeholder="Write your thoughts here..."
            ></textarea>
          </div>
          
          <div class="action-section bg-amber-50 p-6 rounded-lg border border-amber-100">
            <h3 class="text-xl font-semibold text-amber-800 mb-3">Micro-Action</h3>
            <p class="mb-4 text-amber-700">Design a quick "Positivity Prompt": a one-sentence encouragement you'll say to each child every day.</p>
            <input 
              type="text" 
              class="w-full p-3 border border-amber-200 rounded-md focus:ring-2 focus:ring-amber-300 focus:border-transparent"
              placeholder="Your positivity prompt here..."
            >
          </div>
        </div>
        
        <div class="module-section mb-10">
          <h2 class="text-2xl font-bold mb-6 text-purple-700">Module 3: The Power of the Preschool Teacher</h2>
          
          <div class="video-container mb-6 rounded-lg overflow-hidden shadow-md">
            <div class="aspect-video relative">
              <iframe 
                width="100%" 
                height="100%" 
                src="https://www.youtube.com/embed/cqO7YoMsccU" 
                title="InBrief: Early Childhood Program Effectiveness"
                frameborder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowfullscreen
                class="absolute inset-0"
              ></iframe>
            </div>
            <div class="p-4 bg-gray-50">
              <h3 class="font-medium text-gray-900">InBrief: Early Childhood Program Effectiveness</h3>
              <p class="text-sm text-gray-600">Harvard's Center on the Developing Child</p>
            </div>
          </div>
          
          <div class="case-section bg-white p-6 rounded-lg shadow-sm border border-gray-100 mb-6">
            <h3 class="text-xl font-semibold mb-4">Case Story</h3>
            <div class="bg-purple-50 p-4 rounded-md border-l-4 border-purple-300">
              <h4 class="font-medium text-purple-900 mb-2">Malika's Story</h4>
              <p class="text-purple-800 text-sm">
                Four-year-old Malika arrived at Raising Arizona with limited language and significant trust issues. 
                She'd experienced 7 adverse childhood experiences (ACEs) including housing instability and exposure to domestic violence. 
                Her teacher, Ms. Elena, offered consistent warmth, predictable routines, and served-and-returned in every interaction. 
                Within 6 months, Malika was speaking in full sentences, initiating play with peers, and showing emotional regulation. 
                At her kindergarten screening, she scored above grade level in social-emotional development, despite ongoing challenges at home.
              </p>
            </div>
          </div>
          
          <div class="worksheet-section bg-purple-50 p-6 rounded-lg border border-purple-100 mb-6">
            <h3 class="text-xl font-semibold text-purple-800 mb-3">Worksheet</h3>
            <p class="mb-4 text-purple-700">List three ways you can "serve and return" in your daily routines:</p>
            <div class="space-y-3">
              <input 
                type="text" 
                class="w-full p-3 border border-purple-200 rounded-md focus:ring-2 focus:ring-purple-300 focus:border-transparent"
                placeholder="1. Example: Naming feelings during transitions"
              >
              <input 
                type="text" 
                class="w-full p-3 border border-purple-200 rounded-md focus:ring-2 focus:ring-purple-300 focus:border-transparent"
                placeholder="2. Example: Mirroring play with descriptive language"
              >
              <input 
                type="text" 
                class="w-full p-3 border border-purple-200 rounded-md focus:ring-2 focus:ring-purple-300 focus:border-transparent"
                placeholder="3. Example: Offering meaningful choices"
              >
            </div>
          </div>
          
          <div class="quiz-section bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <h3 class="text-xl font-semibold mb-4">Commitment Quiz</h3>
            <p class="mb-4">Which of the three strategies are you excited to embed this week?</p>
            <select class="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-300 focus:border-transparent mb-4">
              <option value="" disabled selected>Select one of your strategies</option>
              <option value="strategy1">Strategy 1</option>
              <option value="strategy2">Strategy 2</option>
              <option value="strategy3">Strategy 3</option>
            </select>
            <textarea 
              class="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-300 focus:border-transparent"
              rows="2"
              placeholder="Explain in 1 sentence why you chose this strategy..."
            ></textarea>
          </div>
        </div>
        
        <div class="module-section mb-10">
          <h2 class="text-2xl font-bold mb-6 text-blue-700">Module 4: Wrap-Up & Personal Story Plan</h2>
          
          <div class="plan-section bg-white p-6 rounded-lg shadow-md border border-blue-100 mb-6">
            <h3 class="text-xl font-semibold text-blue-800 mb-4">Chapter One Storybuilder</h3>
            <p class="mb-4">Summarize your learning into a personal action plan:</p>
            
            <div class="space-y-4">
              <div class="bg-blue-50 p-4 rounded-md">
                <h4 class="font-medium text-blue-800 mb-2">1. One regulation tool you'll practice:</h4>
                <input 
                  type="text" 
                  class="w-full p-2 border border-blue-200 rounded-md focus:ring-2 focus:ring-blue-300 focus:border-transparent"
                  placeholder="E.g., 5-finger breathing, pause cue, etc."
                >
              </div>
              
              <div class="bg-blue-50 p-4 rounded-md">
                <h4 class="font-medium text-blue-800 mb-2">2. Your positivity prompt:</h4>
                <input 
                  type="text" 
                  class="w-full p-2 border border-blue-200 rounded-md focus:ring-2 focus:ring-blue-300 focus:border-transparent"
                  placeholder="One sentence encouragement for each child"
                >
              </div>
              
              <div class="bg-blue-50 p-4 rounded-md">
                <h4 class="font-medium text-blue-800 mb-2">3. Your serve-and-return practice:</h4>
                <input 
                  type="text" 
                  class="w-full p-2 border border-blue-200 rounded-md focus:ring-2 focus:ring-blue-300 focus:border-transparent"
                  placeholder="Daily strategy to implement"
                >
              </div>
            </div>
          </div>
          
          <div class="badge-section bg-gradient-to-r from-blue-50 to-green-50 p-6 rounded-lg border border-blue-100 mb-6 text-center">
            <div class="w-24 h-24 mx-auto mb-4 rounded-full bg-white shadow-md flex items-center justify-center">
              <div class="w-20 h-20 rounded-full bg-gradient-to-r from-blue-500 to-green-500 flex items-center justify-center">
                <span class="text-white font-bold text-xl">CH.1</span>
              </div>
            </div>
            <h3 class="text-xl font-semibold text-blue-800 mb-2">Digital Badge</h3>
            <p class="text-sm text-blue-700">Complete all 4 module quizzes to earn your "Chapter One Storybuilder" digital badge</p>
          </div>
          
          <div class="reflection-section bg-green-50 p-6 rounded-lg border border-green-100">
            <h3 class="text-xl font-semibold text-green-800 mb-3">Final Reflection</h3>
            <p class="mb-4 text-green-700">In 1–2 sentences: How will you, as a preschool teacher, change the narrative of every child you meet?</p>
            <textarea 
              class="w-full p-3 border border-green-200 rounded-md focus:ring-2 focus:ring-green-300 focus:border-transparent"
              rows="3"
              placeholder="Write your commitment here..."
            ></textarea>
          </div>
        </div>
        
        <div class="conclusion text-center my-12">
          <h2 class="text-2xl font-bold mb-4 text-blue-800">Thank You for Completing Chapter 1: Building a Human</h2>
          <p class="text-blue-700 max-w-2xl mx-auto">
            You now have the knowledge and tools to positively impact the developing brains in your classroom. Remember: 
            you're not just teaching—you're building humans and writing the first chapter of their life stories.
          </p>
        </div>
      </div>
    `
  };

  // Insert the module
  const [insertedModule] = await db
    .insert(learningModules)
    .values(chapterOneModule)
    .returning();

  console.log("Created Chapter 1: Building a Human module with ID:", insertedModule.id);
  return insertedModule;
}