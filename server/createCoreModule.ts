import { db } from "./db";
import { learningModules, type InsertLearningModule } from "@shared/schema";

/**
 * Raising Arizona's CORE Values - derived from mission statement and handbook
 * 
 * 1. Curiosity-Driven Learning: Inspire wonder through curiosity, play and experimentation
 * 2. Emotional Intelligence: Teach emotional regulation through mindfulness and meditation
 * 3. Relationship-Based Teaching: Develop caring relationships, "children don't care what you know until they know that you care"
 * 4. Excellence in Education: Focus on developing future leaders through structured, interactive learning
 * 5. Writing Chapter One: Recognize that we are writing the first chapter of children's lives
 */

/**
 * Creates the flagship Raising Arizona's CORE training module
 * This module is mandatory for all teachers during onboarding
 */
export async function createRaisingArizonaCoreModule() {
  try {
    // Check if module already exists to avoid duplicates
    const existingModule = await db.query.learningModules.findFirst({
      where: (modules, { eq }) => eq(modules.title, "Raising Arizona's CORE")
    });

    if (existingModule) {
      console.log("Raising Arizona's CORE module already exists with ID:", existingModule.id);
      return existingModule;
    }

    // HTML content for the module, structured with sections for each core value
    const moduleContent = `
      <div class="core-module">
        <h1 class="text-3xl font-bold text-center mb-8 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Raising Arizona's CORE Values
        </h1>
        
        <div class="mb-8">
          <h2 class="text-2xl font-bold mb-4">Welcome to Raising Arizona Preschool</h2>
          <p class="mb-4">
            This flagship training module will introduce you to our school's core values and philosophy.
            At Raising Arizona Preschool (RAP), we consider it our great privilege to teach the children of America.
          </p>
          
          <div class="my-6 rounded-lg overflow-hidden shadow-lg">
            <video 
              class="w-full aspect-video" 
              controls 
              src="@assets/Raising Arizona Preschool .mp4"
              poster="@assets/raising-arizona-logo.jpg">
              Your browser does not support the video tag.
            </video>
            <div class="bg-gray-100 p-4">
              <p class="font-semibold">Raising Arizona Preschool Promotional Video</p>
              <p class="text-sm text-gray-600">Watch this video to understand our school's mission and approach.</p>
            </div>
          </div>
        </div>

        <!-- Core Value 1 -->
        <div class="mb-8 p-6 border rounded-lg bg-blue-50">
          <h2 class="text-2xl font-bold mb-4 text-blue-700">Core Value 1: Curiosity-Driven Learning</h2>
          <p class="mb-4">
            We try each and every day to inspire wonder and thought, not through vain repetition, 
            but through curiosity, play and experimentation. We believe learning is not about filling 
            an empty vessel, but about kindling a fire within a young mind.
          </p>
          <div class="p-4 bg-white rounded shadow-sm">
            <h3 class="font-bold text-lg">Key Principles:</h3>
            <ul class="list-disc pl-6 mt-2">
              <li>Encourage children's natural curiosity</li>
              <li>Use play as a primary learning method</li>
              <li>Promote hands-on experimentation</li>
              <li>Create environments that inspire wonder</li>
            </ul>
          </div>
        </div>
        
        <!-- Core Value 2 -->
        <div class="mb-8 p-6 border rounded-lg bg-green-50">
          <h2 class="text-2xl font-bold mb-4 text-green-700">Core Value 2: Emotional Intelligence</h2>
          <p class="mb-4">
            We believe that the most important thing we can teach our students is emotional regulation. 
            Through mindfulness and meditation practices, we help children develop self-regulation techniques
            to make them more successful in all aspects of life.
          </p>
          <div class="p-4 bg-white rounded shadow-sm">
            <h3 class="font-bold text-lg">Key Approaches:</h3>
            <ul class="list-disc pl-6 mt-2">
              <li>Teaching breathing techniques for emotional regulation</li>
              <li>Practicing mindfulness throughout the day</li>
              <li>Creating a calm, supportive environment</li>
              <li>Helping children identify and express their feelings</li>
            </ul>
          </div>
        </div>
        
        <!-- Core Value 3 -->
        <div class="mb-8 p-6 border rounded-lg bg-purple-50">
          <h2 class="text-2xl font-bold mb-4 text-purple-700">Core Value 3: Relationship-Based Teaching</h2>
          <p class="mb-4">
            We believe that children do not care what you know until they know that you care about them. 
            Each day starts and ends with developing a caring relationship with your children, creating 
            trust and a foundation for learning.
          </p>
          <div class="p-4 bg-white rounded shadow-sm">
            <h3 class="font-bold text-lg">Daily Practices:</h3>
            <ul class="list-disc pl-6 mt-2">
              <li>Greeting each child individually every morning</li>
              <li>Taking time to listen to children's thoughts and concerns</li>
              <li>Building trust through consistency and warmth</li>
              <li>Collaborating with families to ensure continuity of care</li>
            </ul>
          </div>
        </div>
        
        <!-- Core Value 4 -->
        <div class="mb-8 p-6 border rounded-lg bg-amber-50">
          <h2 class="text-2xl font-bold mb-4 text-amber-700">Core Value 4: Excellence in Education</h2>
          <p class="mb-4">
            Our school is built to inspire and develop future leaders. We provide high-quality educational 
            experiences through a structured, interactive curriculum that prepares children for success 
            in kindergarten and beyond.
          </p>
          <div class="p-4 bg-white rounded shadow-sm">
            <h3 class="font-bold text-lg">Educational Foundations:</h3>
            <ul class="list-disc pl-6 mt-2">
              <li>Teaching basic Math and beginning reading skills</li>
              <li>Engaging children in hands-on Science exploration</li>
              <li>Supporting language development through rich conversations</li>
              <li>Continuous professional development for all staff (minimum 24 hours per year)</li>
            </ul>
          </div>
        </div>
        
        <!-- Core Value 5 -->
        <div class="mb-8 p-6 border rounded-lg bg-rose-50">
          <h2 class="text-2xl font-bold mb-4 text-rose-700">Core Value 5: Writing Chapter One</h2>
          <p class="mb-4">
            Raising Arizona Preschool is a passageway to your child's future. Together, we are writing your 
            child's first chapter. We recognize the profound responsibility and privilege of being part of 
            these formative early years.
          </p>
          <div class="p-4 bg-white rounded shadow-sm">
            <h3 class="font-bold text-lg">Our Commitment:</h3>
            <ul class="list-disc pl-6 mt-2">
              <li>Creating positive first experiences with education</li>
              <li>Building a strong foundation for lifelong learning</li>
              <li>Treating each child with respect and dignity</li>
              <li>Recognizing that our influence extends far beyond the classroom</li>
            </ul>
          </div>
        </div>
        
        <div class="mt-8 p-4 bg-gray-100 rounded-lg">
          <h3 class="font-bold text-xl mb-2">Ready to Test Your Knowledge?</h3>
          <p>
            Now that you've reviewed our core values, it's time to test your understanding with 
            a quiz. Complete the quiz with 100% accuracy to earn your Raising Arizona's CORE 
            certification, required for all staff.
          </p>
          <p class="mt-2 font-semibold">
            Listen for the special Mario Kart sounds when you get answers correct!
          </p>
        </div>
      </div>
    `;

    // Create quiz for the module
    const quiz = {
      questions: [
        {
          question: "What is the primary approach to learning at Raising Arizona Preschool?",
          options: [
            "Rote memorization and repetition",
            "Curiosity, play, and experimentation",
            "Strict adherence to textbooks",
            "Competition between students"
          ],
          correctAnswer: 1,
          explanation: "At Raising Arizona, we inspire wonder through curiosity, play and experimentation rather than rote repetition."
        },
        {
          question: "According to Raising Arizona's philosophy, what must children know before they care what you know?",
          options: [
            "That you have a college degree",
            "That you have many years of experience",
            "That you care about them",
            "That you know the curriculum"
          ],
          correctAnswer: 2,
          explanation: "We believe children don't care what you know until they know that you care about them."
        },
        {
          question: "What does Raising Arizona consider 'the most important thing' to teach students?",
          options: [
            "Academic skills",
            "Emotional regulation",
            "Social etiquette",
            "Physical coordination"
          ],
          correctAnswer: 1,
          explanation: "We believe that the most important thing we can teach our students is emotional regulation."
        },
        {
          question: "What is the first tool Raising Arizona uses to teach emotional regulation?",
          options: [
            "Time-out",
            "Reward charts",
            "Breathing techniques",
            "Lecture"
          ],
          correctAnswer: 2,
          explanation: "The first tool we use is breathing. We teach students to take deep breaths and control their breathing when upset."
        },
        {
          question: "What metaphor does Raising Arizona use to describe their approach to learning?",
          options: [
            "Building a tower brick by brick",
            "Filling an empty vessel",
            "Kindling a fire within a young mind",
            "Planting seeds in a garden"
          ],
          correctAnswer: 2,
          explanation: "We believe learning is not about filling an empty vessel, but about kindling a fire within a young mind."
        },
        {
          question: "How will you implement the 'Writing Chapter One' philosophy in your classroom?",
          options: [
            "By focusing only on academic readiness for kindergarten",
            "By recognizing my profound influence and creating positive first experiences with education",
            "By letting children do whatever they want",
            "By focusing primarily on discipline and obedience"
          ],
          correctAnswer: 1,
          explanation: "The 'Writing Chapter One' philosophy recognizes our profound responsibility in creating positive first experiences that will influence a child's entire educational journey."
        }
      ]
    };

    // Create the module
    const coreModule: InsertLearningModule = {
      title: "Raising Arizona's CORE",
      description: "Mandatory onboarding module covering Raising Arizona Preschool's Core Values, philosophy, and teaching approach. All teachers must complete this module as part of their orientation.",
      duration: 120, // 2 hours
      imageUrl: "/assets/raising-arizona-logo.jpg",
      featured: true,
      difficulty: "beginner",
      category: "onboarding",
      content: moduleContent,
      quiz: quiz
    };

    const [newModule] = await db.insert(learningModules).values(coreModule).returning();
    
    console.log("Successfully created Raising Arizona's CORE module:", newModule);
    return newModule;
  } catch (error) {
    console.error("Error creating Raising Arizona's CORE module:", error);
    throw error;
  }
}