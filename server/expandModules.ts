import { db } from "./db";
import { learningModules, InsertLearningModule } from "@shared/schema";

/**
 * Script to expand the content library with more ECE (Early Childhood Education) topics
 * This script adds new modules to the database without affecting existing ones
 */
async function expandModules() {
  console.log("Starting to expand module library with additional ECE content");
  
  try {
    // Get existing modules to avoid duplicates
    const existingModules = await db.select({ title: learningModules.title }).from(learningModules);
    const existingTitles = new Set(existingModules.map(m => m.title));
    
    // New modules to add
    const newModules: InsertLearningModule[] = [
      // New Micro-Modules (5 minutes or less) for Quick Learning
      {
        title: "Child-Led Activities: Following Their Lead",
        description: "This micro-module teaches the importance of following children's interests and supporting their self-directed play. Learn simple techniques to enhance learning through child-initiated activities.",
        duration: 5,
        imageUrl: null,
        featured: false,
        difficulty: "beginner",
        category: "teaching-methods"
      },
      {
        title: "Responsive Caregiving for Infants",
        description: "Learn the essential elements of responsive caregiving for babies and how it builds secure attachment. This micro-module focuses on reading cues and responding appropriately to infant needs.",
        duration: 5,
        imageUrl: null,
        featured: false,
        difficulty: "beginner",
        category: "foundations"
      },
      {
        title: "Outdoor Learning Environments",
        description: "Discover how to transform your outdoor space into an engaging learning environment that promotes exploration, physical development, and nature connection in just 5 minutes.",
        duration: 5,
        imageUrl: null,
        featured: false,
        difficulty: "intermediate",
        category: "teaching-methods"
      },
      {
        title: "Bilingual Development in ECE",
        description: "Quick strategies to support dual language learners in your classroom. Learn how to create an inclusive environment that celebrates linguistic diversity and supports vocabulary acquisition.",
        duration: 5,
        imageUrl: null,
        featured: false,
        difficulty: "intermediate",
        category: "language"
      },

      // New Standard Modules for Comprehensive Learning
      {
        title: "Documentation and Observation Skills",
        description: "Master the art of meaningful observation and documentation to track child development, inform curriculum planning, and create valuable learning stories for families and accreditation.",
        duration: 60,
        imageUrl: null,
        featured: true,
        difficulty: "intermediate",
        category: "foundations"
      },
      {
        title: "Arts Integration in Early Childhood",
        description: "Explore how to meaningfully integrate visual arts, music, movement and drama into your daily curriculum to enhance creativity, self-expression and cognitive development.",
        duration: 75,
        imageUrl: null,
        featured: false,
        difficulty: "intermediate",
        category: "teaching-methods"
      },
      {
        title: "Trauma-Informed Care in ECE",
        description: "Develop essential skills for creating a trauma-sensitive classroom that supports children who have experienced adverse events. Learn strategies for building resilience and emotional safety.",
        duration: 90,
        imageUrl: null,
        featured: true,
        difficulty: "advanced",
        category: "behavior"
      },
      {
        title: "STEM Explorations for Preschoolers",
        description: "Discover engaging ways to incorporate science, technology, engineering and math concepts through play-based activities that build critical thinking and problem-solving skills.",
        duration: 60,
        imageUrl: null,
        featured: false,
        difficulty: "intermediate",
        category: "stem"
      },
      {
        title: "Cultural Responsiveness in Early Education",
        description: "Learn practical approaches to creating a culturally responsive classroom that honors diversity, promotes equity, and helps every child feel represented and valued.",
        duration: 75,
        imageUrl: null,
        featured: true,
        difficulty: "intermediate",
        category: "inclusion"
      },
      {
        title: "Supporting Children with Special Rights",
        description: "Develop strategies for creating an inclusive classroom environment that meets the needs of all children, including those with developmental differences, disabilities, or exceptional learning needs.",
        duration: 90,
        imageUrl: null,
        featured: false,
        difficulty: "advanced",
        category: "inclusion"
      },
      {
        title: "Family Engagement Strategies for ECE",
        description: "Build stronger partnerships with families through effective communication, meaningful involvement opportunities, and culturally responsive engagement strategies.",
        duration: 60,
        imageUrl: null,
        featured: false,
        difficulty: "intermediate",
        category: "family-engagement"
      },
      {
        title: "Emergent Literacy in Preschool",
        description: "Create a literacy-rich environment that fosters language development, phonological awareness, print concepts, and a love of books and storytelling.",
        duration: 75,
        imageUrl: null,
        featured: true,
        difficulty: "intermediate",
        category: "language"
      },
      {
        title: "Transitions and Classroom Flow",
        description: "Master smooth transitions between activities to minimize disruptions, reduce challenging behaviors, and maximize learning time in your early childhood classroom.",
        duration: 60,
        imageUrl: null,
        featured: false,
        difficulty: "beginner",
        category: "management"
      },
      {
        title: "Executive Function Development",
        description: "Learn how to promote crucial executive function skills like working memory, inhibitory control, and cognitive flexibility through playful activities and thoughtful classroom design.",
        duration: 75,
        imageUrl: null,
        featured: false,
        difficulty: "intermediate",
        category: "foundations"
      }
    ];
    
    // Filter out any modules that already exist
    const modulesToAdd = newModules.filter(module => !existingTitles.has(module.title));
    
    if (modulesToAdd.length === 0) {
      console.log("All modules already exist in the database. No new modules added.");
      return;
    }
    
    // Insert new modules
    await db.insert(learningModules).values(modulesToAdd);
    
    console.log(`Successfully added ${modulesToAdd.length} new modules to the content library!`);
    
    // List the added modules
    console.log("Added the following modules:");
    modulesToAdd.forEach(module => {
      console.log(`- ${module.title} (${module.duration} min, ${module.category}, ${module.difficulty})`);
    });
    
  } catch (error) {
    console.error("Error expanding modules:", error);
  }
}

// Execute the function if this file is run directly
if (require.main === module) {
  expandModules().then(() => {
    console.log("Module expansion complete");
    process.exit(0);
  }).catch(err => {
    console.error("Failed to expand modules:", err);
    process.exit(1);
  });
}

export { expandModules };