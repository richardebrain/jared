import { db } from "../db";
import { learningModules, type InsertLearningModule } from "@shared/schema";
import { eq } from "drizzle-orm";

/**
 * Creates the Mindful Morning training module for teacher wellness
 * 
 * This module focuses on teacher mental health and well-being practices
 * to reduce burnout and improve classroom presence.
 */
export async function createMindfulMorningsModule() {
  try {
    // Check if module already exists to avoid duplicates
    const existingModule = await db.query.learningModules.findFirst({
      where: (modules, { eq }) => eq(modules.title, "Mindful Morning")
    });

    if (existingModule) {
      console.log("Mindful Morning module already exists with ID:", existingModule.id);
      return existingModule;
    }

    // HTML content for the module with mindfulness practices and videos
    const moduleContent = `
      <div class="mindful-morning-module">
        <h1 class="text-3xl font-bold text-center mb-8 bg-gradient-to-r from-amber-500 to-yellow-500 bg-clip-text text-transparent">
          Mindful Morning: Teacher Wellness Program
        </h1>
        
        <div class="mb-8">
          <h2 class="text-2xl font-bold mb-4">Welcome to Mindful Mornings</h2>
          <p class="mb-4">
            This training focuses on your well-being as a teacher. The children in your care deserve the best version of you,
            and this module will help you develop mindfulness practices to reduce stress and increase your presence in the classroom.
          </p>
          
          <div class="my-6 p-4 bg-amber-50 rounded-lg border border-amber-200">
            <h3 class="text-lg font-medium text-amber-800 mb-2">Why Teacher Wellness Matters</h3>
            <p class="text-amber-700">
              Teacher burnout affects not only you but the children in your care. Research shows that teachers who practice
              mindfulness report less burnout, greater efficacy, more emotionally supportive classrooms, and better classroom organization.
            </p>
          </div>
        </div>

        <div class="module-section mb-10">
          <h2 class="text-xl font-bold mb-6 text-amber-700">Module 1: The Science of Mindfulness</h2>
          
          <div class="video-container my-6 rounded-lg overflow-hidden shadow-lg">
            <audio controls class="w-full">
              <source src="@assets/Sunrise paints the Glendale sky gold.mp3" type="audio/mpeg">
              Your browser does not support the audio element.
            </audio>
            <p class="text-sm text-gray-600 mt-2">Morning meditation audio for classroom use</p>
          </div>
          
          <p class="mb-4">
            Mindfulness is the practice of bringing awareness to the present moment without judgment.
            In early childhood education, this means:
          </p>
          
          <ul class="list-disc pl-6 space-y-2 mb-6">
            <li>Being fully present with children during interactions</li>
            <li>Responding rather than reacting to challenging behaviors</li>
            <li>Recognizing and managing your own stress responses</li>
            <li>Creating an atmosphere of calm in your classroom</li>
          </ul>
          
          <div class="practice-box bg-amber-100 p-4 rounded-lg mb-6">
            <h4 class="font-bold text-amber-800 mb-2">Practice: One-Minute Breathing</h4>
            <p class="mb-2">
              Try this simple practice before your children arrive:
            </p>
            <ol class="list-decimal pl-6">
              <li>Find a comfortable seated position</li>
              <li>Close your eyes or soften your gaze</li>
              <li>Take three deep breaths</li>
              <li>For one minute, simply notice your natural breathing</li>
              <li>When your mind wanders, gently return to your breath</li>
            </ol>
          </div>
        </div>
        
        <div class="module-section mb-10">
          <h2 class="text-xl font-bold mb-6 text-amber-700">Module 2: Mindful Transitions</h2>
          
          <div class="video-container my-6 rounded-lg overflow-hidden shadow-lg">
            <audio controls class="w-full">
              <source src="@assets/Time to Change Activities.mp3" type="audio/mpeg">
              Your browser does not support the audio element.
            </audio>
            <p class="text-sm text-gray-600 mt-2">Transition sounds for classroom use</p>
          </div>
          
          <p class="mb-4">
            Transitions can be challenging times in the preschool day. Mindful transitions help children
            move between activities with less stress and more awareness.
          </p>
          
          <div class="practice-box bg-amber-100 p-4 rounded-lg mb-6">
            <h4 class="font-bold text-amber-800 mb-2">Classroom Practice: Transition Bell</h4>
            <p class="mb-4">
              Use a singing bowl or bell as a transition signal:
            </p>
            <ol class="list-decimal pl-6">
              <li>Ring the bell and ask children to listen until they can no longer hear the sound</li>
              <li>When they can't hear it anymore, they raise their hand</li>
              <li>Once everyone's hand is raised, introduce the next activity</li>
            </ol>
            <p class="mt-2 text-amber-700">
              This practice creates a moment of mindful listening and helps children transition their attention.
            </p>
          </div>
        </div>

        <div class="module-section mb-10">
          <h2 class="text-xl font-bold mb-6 text-amber-700">Module 3: Self-Care for Teachers</h2>
          
          <div class="video-container my-6 rounded-lg overflow-hidden shadow-lg">
            <audio controls class="w-full">
              <source src="@assets/I'm Closing My Eyes.mp3" type="audio/mpeg">
              Your browser does not support the audio element.
            </audio>
            <p class="text-sm text-gray-600 mt-2">End-of-day meditation for teachers</p>
          </div>
          
          <p class="mb-4">
            Self-care isn't selfish—it's necessary for effective teaching. When you care for yourself, 
            you model healthy behaviors and have more to give to the children in your care.
          </p>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div class="bg-amber-50 p-4 rounded-lg">
              <h4 class="font-bold text-amber-800 mb-2">Physical Self-Care</h4>
              <ul class="list-disc pl-4">
                <li>Prioritize sleep</li>
                <li>Stay hydrated throughout the day</li>
                <li>Take short movement breaks</li>
                <li>Eat nourishing foods</li>
              </ul>
            </div>
            
            <div class="bg-amber-50 p-4 rounded-lg">
              <h4 class="font-bold text-amber-800 mb-2">Emotional Self-Care</h4>
              <ul class="list-disc pl-4">
                <li>Set healthy boundaries</li>
                <li>Express feelings appropriately</li>
                <li>Connect with supportive colleagues</li>
                <li>Practice gratitude daily</li>
              </ul>
            </div>
          </div>
          
          <div class="practice-box bg-amber-100 p-4 rounded-lg mb-6">
            <h4 class="font-bold text-amber-800 mb-2">Practice: End-of-Day Reset</h4>
            <p class="mb-2">
              Before leaving work, try this 2-minute practice:
            </p>
            <ol class="list-decimal pl-6">
              <li>Sit quietly at your desk</li>
              <li>Take three deep breaths</li>
              <li>Reflect on three things that went well today</li>
              <li>Set an intention to leave work at work</li>
              <li>Take three more deep breaths</li>
            </ol>
          </div>
        </div>
        
        <div class="conclusion mb-8">
          <h2 class="text-2xl font-bold mb-4">Bringing Mindfulness Into Your Classroom</h2>
          <p class="mb-4">
            The practices in this module are just the beginning. As you incorporate mindfulness into your
            daily routine, you'll discover what works best for you and your children.
          </p>
          
          <div class="bg-gradient-to-r from-amber-100 to-yellow-100 p-4 rounded-lg">
            <h4 class="font-bold text-amber-800 mb-2">Remember:</h4>
            <p class="italic text-amber-700">
              "You cannot pour from an empty cup. Take care of yourself first."
            </p>
          </div>
        </div>
      </div>
    `;

    // Create quiz questions to test knowledge retention
    const moduleQuiz = {
      questions: [
        {
          question: "Why is teacher mindfulness important in early childhood education?",
          options: [
            "It's just a trend with no real benefits",
            "It helps reduce teacher burnout and creates more emotionally supportive classrooms",
            "It's only important for children, not teachers",
            "It takes too much time away from curriculum"
          ],
          correctAnswer: 1,
          explanation: "Research shows that mindful teachers experience less burnout, greater efficacy, and create more emotionally supportive and well-organized classroom environments."
        },
        {
          question: "What is the 'Transition Bell' practice designed to do?",
          options: [
            "Wake up children who are sleeping",
            "Signal that it's time to go home",
            "Create a moment of mindful listening to help children transition between activities",
            "Test children's hearing abilities"
          ],
          correctAnswer: 2,
          explanation: "The Transition Bell creates a moment of mindful listening where children focus on the sound, helping them shift their attention from one activity to the next."
        },
        {
          question: "Which of the following is NOT an example of teacher self-care mentioned in the module?",
          options: [
            "Taking short movement breaks during the day",
            "Practicing daily gratitude",
            "Staying late every day to prepare materials",
            "Setting healthy boundaries"
          ],
          correctAnswer: 2,
          explanation: "Staying late every day is not recommended as self-care. Instead, the module emphasizes boundaries, rest, and emotional wellbeing."
        },
        {
          question: "What does the 'End-of-Day Reset' practice help teachers do?",
          options: [
            "Plan the next day's activities",
            "Clean the classroom",
            "Reflect on positives and mentally transition from work to home",
            "Grade children's work"
          ],
          correctAnswer: 2,
          explanation: "The End-of-Day Reset helps teachers reflect on positive aspects of their day and set an intention to leave work stress at work, creating a healthy work-life boundary."
        },
        {
          question: "Which mindfulness practice is recommended before children arrive?",
          options: [
            "One-Minute Breathing",
            "Transition Bell",
            "End-of-Day Reset",
            "Gratitude Journaling"
          ],
          correctAnswer: 0,
          explanation: "The One-Minute Breathing practice is recommended for teachers to use before children arrive to center themselves and prepare for the day."
        }
      ]
    };

    // Define the module object
    const mindfulModule: InsertLearningModule = {
      title: "Mindful Morning",
      description: "Develop mindfulness practices to reduce stress, prevent burnout, and increase your presence in the classroom. This training focuses on teacher well-being and provides practical tools you can use daily.",
      duration: 35,
      pointValue: 15,
      imageUrl: "/assets/mindful-mornings-logo.jpg",
      featured: true,
      difficulty: "beginner",
      category: "teacher-wellness",
      content: moduleContent,
      quiz: moduleQuiz
    };

    // Insert the module into the database
    const [newModule] = await db.insert(learningModules).values(mindfulModule).returning();
    console.log("Created Mindful Morning module with ID:", newModule.id);

    return newModule;
  } catch (error) {
    console.error("Error creating Mindful Morning module:", error);
    throw error;
  }
}