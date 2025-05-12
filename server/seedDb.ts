import { db } from "./db";
import { 
  users, 
  learningModules, 
  InsertLearningModule, 
  InsertUser
} from "@shared/schema";

async function seedDatabase() {
  console.log("Starting database seeding");
  
  try {
    // Check if we already have data
    const existingModules = await db.select().from(learningModules);
    if (existingModules.length > 0) {
      console.log("Database already seeded. Skipping seed operation.");
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
      // Core Teaching Modules
      {
        title: "Early Childhood Development Basics",
        description: "Understand the fundamental principles of early childhood development and how to apply them in your classroom.",
        duration: 90,
        imageUrl: null,
        featured: true,
        difficulty: "beginner",
        category: "foundations"
      },
      {
        title: "Classroom Management",
        description: "Learn effective techniques for managing a preschool classroom and creating a positive learning environment.",
        duration: 120,
        imageUrl: null,
        featured: false,
        difficulty: "intermediate",
        category: "management"
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
      }
    ];

    await db.insert(learningModules).values(moduleData);
    console.log("Learning modules created");

    console.log("Database seeded successfully");
  } catch (error) {
    console.error("Error seeding database:", error);
  }
}

export { seedDatabase };