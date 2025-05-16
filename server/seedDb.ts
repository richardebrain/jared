import { db } from "./db";
import { 
  users, 
  learningModules, 
  InsertLearningModule, 
  InsertUser
} from "@shared/schema";
import { createRaisingArizonaCoreModule } from "./createCoreModule";
import { createChapterOneModule } from "./createChapterOneModule";

async function seedDatabase() {
  console.log("Starting database seeding");
  
  try {
    // Check if we already have data
    const existingModules = await db.select().from(learningModules);
    if (existingModules.length > 0) {
      console.log("Database already seeded. Checking for required modules.");
      
      // Check if CORE module exists
      const coreModule = await db.query.learningModules.findFirst({
        where: (modules, { eq }) => eq(modules.title, "Raising Arizona's CORE")
      });
      
      if (!coreModule) {
        console.log("Creating missing Raising Arizona's CORE module.");
        await createRaisingArizonaCoreModule();
      } else {
        console.log("Raising Arizona's CORE module already exists with ID:", coreModule.id);
      }
      
      // Check if Chapter 1 module exists
      const chapterOneModule = await db.query.learningModules.findFirst({
        where: (modules, { eq }) => eq(modules.title, "Chapter 1: Building a Human")
      });
      
      if (!chapterOneModule) {
        console.log("Creating missing Chapter 1: Building a Human module.");
        await createChapterOneModule();
      } else {
        console.log("Chapter 1: Building a Human module already exists with ID:", chapterOneModule.id);
      }
      
      return;
    }

    // Seed users
    const demoUser: InsertUser = {
      username: "demo_teacher",
      password: "password123", // In a real app, this should be hashed
      firstName: "Demo",
      lastName: "Teacher",
      email: "demo@raisingarizona.edu",
      language: "en",
      nativeLanguage: "en",
      timeZone: "America/Phoenix",
      profilePicture: null
    };

    await db.insert(users).values(demoUser);
    console.log("Demo user created");

    // Seed learning modules
    const moduleData: InsertLearningModule[] = [
      // Core ECE Teaching Modules
      {
        title: "Child Development Milestones (0-5 years)",
        description: "Master the critical developmental milestones for children ages 0-5, including cognitive, physical, social, and emotional benchmarks that inform your teaching approach.",
        duration: 90,
        imageUrl: null,
        featured: true,
        difficulty: "beginner",
        category: "foundations"
      },
      {
        title: "Play-Based Learning Strategies",
        description: "Learn how to design and implement play-based learning activities that support cognitive development while keeping children engaged and excited about learning.",
        duration: 75,
        imageUrl: null,
        featured: true,
        difficulty: "beginner",
        category: "teaching-methods"
      },
      {
        title: "Preschool Classroom Management",
        description: "Master effective techniques for managing a preschool classroom, including positive discipline approaches, daily routines, and creating a structured environment that supports learning.",
        duration: 120,
        imageUrl: null,
        featured: true,
        difficulty: "intermediate",
        category: "management"
      },
      {
        title: "Language Development in Early Childhood",
        description: "Explore proven techniques to foster language acquisition in young children, including storytelling methods, vocabulary building activities, and supporting bilingual learners.",
        duration: 90,
        imageUrl: null,
        featured: false,
        difficulty: "intermediate",
        category: "language"
      },
      {
        title: "Positive Behavior Support in Preschool",
        description: "Learn strategies to encourage positive behavior, prevent challenging behaviors, and create a supportive emotional environment. Can you find the hidden code word 'Sunshine' in this module? Tell your director to receive a special recognition!",
        duration: 105,
        imageUrl: null,
        featured: false,
        difficulty: "advanced",
        category: "behavior"
      },
      {
        title: "Building Math Foundations for Preschoolers",
        description: "Discover how to introduce mathematical concepts through everyday activities, games, and hands-on experiences appropriate for young learners.",
        duration: 85,
        imageUrl: null,
        featured: false,
        difficulty: "intermediate",
        category: "stem"
      },
      {
        title: "Sensory Play in Early Childhood",
        description: "Learn how to create engaging sensory experiences that support brain development, improve motor skills, and encourage scientific thinking in young children.",
        duration: 60,
        imageUrl: null,
        featured: true,
        difficulty: "beginner",
        category: "teaching-methods"
      },
      // Mindful Mornings Modules
      {
        title: "Mindful Mornings: Breathing Exercises",
        description: "Learn how to teach simple breathing techniques to help children regulate emotions and increase focus. If you memorize the phrase 'Breathe, Smile, Be Present' and tell it to your director, you'll receive a special lunch reward!",
        duration: 45,
        imageUrl: null,
        featured: true,
        difficulty: "beginner",
        category: "mindful-mornings"
      },
      {
        title: "Mindful Mornings: Self-Affirmations",
        description: "Discover effective self-affirmation techniques to teach children positive self-talk and build confidence in the classroom.",
        duration: 45,
        imageUrl: null,
        featured: true,
        difficulty: "beginner",
        category: "mindful-mornings"
      },
      {
        title: "Mindful Mornings: Gratitude Practices",
        description: "Explore activities that foster gratitude and appreciation in young children, creating a positive classroom culture. Hidden challenge: Find the three gratitude statements in this module to unlock a special reward.",
        duration: 45,
        imageUrl: null,
        featured: true,
        difficulty: "beginner",
        category: "mindful-mornings"
      },
      // Family Engagement
      {
        title: "Effective Parent-Teacher Communication",
        description: "Learn best practices for communicating with families, conducting parent conferences, and building collaborative relationships that support child development.",
        duration: 75,
        imageUrl: null,
        featured: false,
        difficulty: "intermediate",
        category: "family-engagement"
      },
      // Special Needs
      {
        title: "Inclusive Practices for Diverse Learners",
        description: "Develop skills to create an inclusive classroom environment that meets the needs of all children, including those with developmental differences or disabilities.",
        duration: 120,
        imageUrl: null,
        featured: false,
        difficulty: "advanced",
        category: "inclusion"
      },
      // LEGO-themed module on building a child's story
      {
        title: "Building a Child: Block by Block",
        description: "Using the LEGO metaphor, learn how each interaction with a child adds another 'block' to their life story. Discover how positive words, actions, and experiences build a beautiful first chapter in a child's life, while negative experiences can create an unstable foundation.",
        duration: 60,
        imageUrl: null,
        featured: true,
        difficulty: "beginner",
        category: "core-values"
      }
    ];

    // Add mini-modules (short-duration, quick learning opportunities)
    const miniModuleData: InsertLearningModule[] = [
      {
        title: "Quick Transition Techniques",
        description: "Learn 5 effective ways to transition between activities while keeping children engaged. Each technique is worth 1 point. Complete all 5 for a 5-point reward!",
        duration: 5,
        imageUrl: null,
        featured: false,
        difficulty: "beginner",
        category: "quick-transition-techniques"
      },
      {
        title: "Coping Strategy: The Turtle Technique",
        description: "Teach children the 'Turtle Technique' for managing big emotions. This simple technique gives children a concrete way to process feelings. Worth 7 points.",
        duration: 7,
        imageUrl: null,
        featured: false,
        difficulty: "beginner",
        category: "social-emotional"
      },
      {
        title: "Mindful Moment Script",
        description: "A 3-minute guided mindfulness exercise to use during morning circle. This script helps children center themselves. Worth 3 points.",
        duration: 3,
        imageUrl: null,
        featured: false,
        difficulty: "beginner",
        category: "mindful-mornings"
      },
      {
        title: "Building Chapter One: Meaningful Greetings",
        description: "Learn how to make morning greetings more meaningful to help children feel valued. This mini-module is worth 4 points toward your Chapter One expertise.",
        duration: 4,
        imageUrl: null,
        featured: true,
        difficulty: "beginner",
        category: "core-values"
      },
      {
        title: "Active Listening Techniques",
        description: "Practice 3 active listening techniques to show children they are truly heard. Each technique is worth 1-2 points for a total of 5 points.",
        duration: 5,
        imageUrl: null,
        featured: false,
        difficulty: "beginner",
        category: "active-listening"
      }
    ];

    // Add mini-modules to the database
    await db.insert(learningModules).values([...moduleData, ...miniModuleData]);
    console.log("Learning modules and mini-modules created");
    
    // Create the Raising Arizona's CORE training module
    await createRaisingArizonaCoreModule();
    console.log("Raising Arizona's CORE training module created");

    console.log("Database seeded successfully");
  } catch (error) {
    console.error("Error seeding database:", error);
  }
}

export { seedDatabase };