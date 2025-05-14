import { db } from "./db";
import { learningModules, type InsertLearningModule } from "@shared/schema";

/**
 * Raising Arizona's CORE Values - aligned with the school's mission and values
 * 
 * 1. Be Consistent: Provide stable, predictable environments where children can thrive
 * 2. Be Prepared: Plan effectively and come ready to deliver excellent educational experiences
 * 3. Be Committed: Demonstrate dedication to each child's growth and development
 * 4. Be Caring: Show genuine compassion and empathy for every child
 * 5. Be Positive: Maintain an optimistic attitude that inspires and encourages children
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
          <h2 class="text-2xl font-bold mb-4 text-blue-700">Core Value 1: Be Consistent</h2>
          <p class="mb-4">
            Children thrive in environments where they know what to expect. Consistency in our 
            routines, rules, and responses creates a sense of security that allows children to focus 
            on learning and growing. When we are consistent, children develop trust in their environment 
            and the adults who care for them.
          </p>
          <div class="p-4 bg-white rounded shadow-sm">
            <h3 class="font-bold text-lg">Key Practices:</h3>
            <ul class="list-disc pl-6 mt-2">
              <li>Maintaining predictable daily schedules and routines</li>
              <li>Enforcing classroom rules uniformly and fairly</li>
              <li>Following through on promises and commitments</li>
              <li>Providing clear expectations for behavior and learning</li>
            </ul>
          </div>
        </div>
        
        <!-- Core Value 2 -->
        <div class="mb-8 p-6 border rounded-lg bg-green-50">
          <h2 class="text-2xl font-bold mb-4 text-green-700">Core Value 2: Be Prepared</h2>
          <p class="mb-4">
            Effective teaching requires thoughtful preparation. When we come to school prepared with 
            well-designed lesson plans, organized materials, and a clear understanding of each child's 
            needs, we create optimal conditions for learning and growth. Preparation demonstrates our 
            professionalism and commitment to excellence.
          </p>
          <div class="p-4 bg-white rounded shadow-sm">
            <h3 class="font-bold text-lg">Essential Preparations:</h3>
            <ul class="list-disc pl-6 mt-2">
              <li>Creating detailed weekly lesson plans aligned with learning objectives</li>
              <li>Preparing learning materials before children arrive</li>
              <li>Reviewing and reflecting on previous lessons to inform future planning</li>
              <li>Anticipating potential challenges and preparing appropriate responses</li>
            </ul>
          </div>
        </div>
        
        <!-- Core Value 3 -->
        <div class="mb-8 p-6 border rounded-lg bg-purple-50">
          <h2 class="text-2xl font-bold mb-4 text-purple-700">Core Value 3: Be Committed</h2>
          <p class="mb-4">
            Our commitment to early childhood education goes beyond simply doing a job. We are dedicated to 
            each child's growth, development, and well-being. This commitment drives us to continue learning, 
            improving our practices, and advocating for the best interests of children and families.
          </p>
          <div class="p-4 bg-white rounded shadow-sm">
            <h3 class="font-bold text-lg">Demonstrations of Commitment:</h3>
            <ul class="list-disc pl-6 mt-2">
              <li>Pursuing ongoing professional development</li>
              <li>Persisting with challenging children to help them succeed</li>
              <li>Going above and beyond minimum requirements</li>
              <li>Advocating for children's needs with families and colleagues</li>
            </ul>
          </div>
        </div>
        
        <!-- Core Value 4 -->
        <div class="mb-8 p-6 border rounded-lg bg-amber-50">
          <h2 class="text-2xl font-bold mb-4 text-amber-700">Core Value 4: Be Caring</h2>
          <p class="mb-4">
            At the heart of effective early childhood education is genuine care for children. 
            We believe that children don't care what you know until they know that you care about them. 
            Our compassionate, responsive relationships with children create the foundation for all learning 
            and development.
          </p>
          <div class="p-4 bg-white rounded shadow-sm">
            <h3 class="font-bold text-lg">Ways We Show We Care:</h3>
            <ul class="list-disc pl-6 mt-2">
              <li>Greeting each child warmly by name every day</li>
              <li>Listening attentively to children's thoughts, feelings, and ideas</li>
              <li>Responding promptly and sensitively to children's needs</li>
              <li>Celebrating each child's unique qualities and achievements</li>
            </ul>
          </div>
        </div>
        
        <!-- Core Value 5 -->
        <div class="mb-8 p-6 border rounded-lg bg-rose-50">
          <h2 class="text-2xl font-bold mb-4 text-rose-700">Core Value 5: Be Positive</h2>
          <p class="mb-4">
            Our positive attitude sets the tone for the entire classroom environment. When we approach 
            challenges with optimism, model constructive problem-solving, and focus on children's strengths, 
            we inspire them to develop resilience, confidence, and a lifelong love of learning.
          </p>
          <div class="p-4 bg-white rounded shadow-sm">
            <h3 class="font-bold text-lg">Positive Practices:</h3>
            <ul class="list-disc pl-6 mt-2">
              <li>Using encouraging language that emphasizes effort and growth</li>
              <li>Modeling positive self-talk and constructive problem-solving</li>
              <li>Finding the good in every child, especially when facing challenges</li>
              <li>Creating a joyful, engaging learning environment</li>
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
          question: "Why is consistency important in early childhood education?",
          options: [
            "It makes the teacher's job easier",
            "It creates a sense of security that allows children to focus on learning",
            "It minimizes the need for parent involvement",
            "It reduces the energy level in the classroom"
          ],
          correctAnswer: 1,
          explanation: "Consistency in routines, rules, and responses creates security that allows children to focus on learning and growing."
        },
        {
          question: "According to Raising Arizona's Core Values, what must children know before they care what you know?",
          options: [
            "That you have a college degree",
            "That you have many years of experience",
            "That you care about them",
            "That you know the curriculum"
          ],
          correctAnswer: 2,
          explanation: "Our 'Be Caring' value emphasizes that children don't care what you know until they know that you care about them."
        },
        {
          question: "How does being prepared demonstrate professionalism?",
          options: [
            "It impresses administrators during evaluations",
            "It allows for more free time during the day",
            "It shows credentials to parents",
            "It creates optimal conditions for learning and demonstrates commitment to excellence"
          ],
          correctAnswer: 3,
          explanation: "Being prepared with well-designed lessons and organized materials creates optimal conditions for learning and demonstrates our commitment to excellence."
        },
        {
          question: "Which of the following is NOT one of the ways we show we care?",
          options: [
            "Greeting each child warmly by name every day",
            "Listening attentively to children's thoughts and feelings",
            "Assigning the same activities to all children regardless of interest or ability",
            "Celebrating each child's unique qualities and achievements"
          ],
          correctAnswer: 2,
          explanation: "Assigning the same activities to all children regardless of interest or ability does not show caring. Truly caring for children means recognizing and responding to their individual needs."
        },
        {
          question: "What is one key practice of being consistent?",
          options: [
            "Changing classroom rules frequently to keep children engaged",
            "Allowing some children to break rules if they're having a bad day",
            "Maintaining predictable daily schedules and routines",
            "Letting each day unfold spontaneously without planning"
          ],
          correctAnswer: 2,
          explanation: "Maintaining predictable daily schedules and routines is a key practice of the 'Be Consistent' value."
        },
        {
          question: "How can teachers demonstrate the 'Be Positive' value?",
          options: [
            "By ignoring negative behaviors",
            "By using encouraging language that emphasizes effort and growth",
            "By focusing only on academic achievements",
            "By maintaining a serious classroom environment"
          ],
          correctAnswer: 1,
          explanation: "Using encouraging language that emphasizes effort and growth is a positive practice that helps children develop resilience and confidence."
        },
        {
          question: "Which of the following best demonstrates the 'Be Committed' value?",
          options: [
            "Leaving work exactly at the end of your shift every day",
            "Doing only what is required in your job description",
            "Pursuing ongoing professional development",
            "Avoiding challenging children"
          ],
          correctAnswer: 2,
          explanation: "Pursuing ongoing professional development demonstrates commitment to improving our practices for the benefit of children."
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