import { db } from "./db";
import { earlyLearningStandards } from "@shared/schema";

/**
 * Seeds the Arizona Early Learning Standards database with the 4th Edition standards
 * Based on the official Arizona Early Learning Standards document
 */
export async function seedArizonaStandards() {
  console.log("Starting Arizona Early Learning Standards seeding...");

  const standards = [
    // Social Emotional Standard - Strand 1: Self-Awareness and Emotional Skills
    {
      standardArea: "Social Emotional",
      strand: "Self-Awareness and Emotional Skills",
      standardCode: "SE.1.1",
      ageGroup: "3-5 years",
      standardText: "Shows awareness of self as having certain abilities, characteristics, and preferences",
      description: "Child demonstrates understanding of their own capabilities, traits, and likes/dislikes",
      keywords: ["self-awareness", "identity", "preferences", "abilities", "characteristics"]
    },
    {
      standardArea: "Social Emotional",
      strand: "Self-Awareness and Emotional Skills",
      standardCode: "SE.1.2",
      ageGroup: "3-5 years",
      standardText: "Identifies and expresses a range of emotions",
      description: "Child can recognize and communicate various feelings appropriately",
      keywords: ["emotions", "feelings", "expression", "communication", "emotional literacy"]
    },
    {
      standardArea: "Social Emotional",
      strand: "Self-Awareness and Emotional Skills",
      standardCode: "SE.1.3",
      ageGroup: "3-5 years",
      standardText: "Shows increasing ability to regulate emotions and behavior",
      description: "Child develops self-control and emotional regulation strategies",
      keywords: ["self-regulation", "behavior", "self-control", "coping strategies", "emotional regulation"]
    },

    // Social Emotional Standard - Strand 2: Relationships and Social Skills
    {
      standardArea: "Social Emotional",
      strand: "Relationships and Social Skills",
      standardCode: "SE.2.1",
      ageGroup: "3-5 years",
      standardText: "Forms positive relationships with familiar adults",
      description: "Child builds trusting relationships with teachers, family members, and other caregivers",
      keywords: ["relationships", "adults", "trust", "attachment", "social connections"]
    },
    {
      standardArea: "Social Emotional",
      strand: "Relationships and Social Skills",
      standardCode: "SE.2.2",
      ageGroup: "3-5 years",
      standardText: "Develops friendships with peers",
      description: "Child initiates and maintains positive peer relationships",
      keywords: ["friendships", "peers", "social skills", "cooperation", "play"]
    },
    {
      standardArea: "Social Emotional",
      strand: "Relationships and Social Skills",
      standardCode: "SE.2.3",
      ageGroup: "3-5 years",
      standardText: "Shows empathy and caring for others",
      description: "Child demonstrates understanding of others' feelings and shows compassion",
      keywords: ["empathy", "caring", "compassion", "perspective-taking", "kindness"]
    },

    // Approaches to Learning Standard - Strand 1: Initiative and Curiosity
    {
      standardArea: "Approaches to Learning",
      strand: "Initiative and Curiosity",
      standardCode: "AL.1.1",
      ageGroup: "3-5 years",
      standardText: "Shows curiosity and eagerness to learn",
      description: "Child demonstrates interest in exploring and discovering new things",
      keywords: ["curiosity", "eagerness", "exploration", "discovery", "motivation"]
    },
    {
      standardArea: "Approaches to Learning",
      strand: "Initiative and Curiosity",
      standardCode: "AL.1.2",
      ageGroup: "3-5 years",
      standardText: "Takes initiative in choosing and planning activities",
      description: "Child makes independent choices and shows leadership in planning",
      keywords: ["initiative", "choice-making", "planning", "independence", "leadership"]
    },

    // Approaches to Learning Standard - Strand 2: Attentiveness and Persistence
    {
      standardArea: "Approaches to Learning",
      strand: "Attentiveness and Persistence",
      standardCode: "AL.2.1",
      ageGroup: "3-5 years",
      standardText: "Sustains attention to tasks and activities",
      description: "Child maintains focus on activities for increasing periods of time",
      keywords: ["attention", "focus", "concentration", "sustained attention", "task engagement"]
    },
    {
      standardArea: "Approaches to Learning",
      strand: "Attentiveness and Persistence",
      standardCode: "AL.2.2",
      ageGroup: "3-5 years",
      standardText: "Persists at challenging tasks",
      description: "Child continues working on difficult activities and doesn't give up easily",
      keywords: ["persistence", "perseverance", "challenge", "resilience", "grit"]
    },

    // Language and Literacy Standard - Strand 1: Language
    {
      standardArea: "Language and Literacy",
      strand: "Language",
      standardCode: "LL.1.1",
      ageGroup: "3-5 years",
      standardText: "Uses language to communicate with others",
      description: "Child expresses thoughts, needs, and ideas through spoken language",
      keywords: ["communication", "spoken language", "expression", "vocabulary", "conversation"]
    },
    {
      standardArea: "Language and Literacy",
      strand: "Language",
      standardCode: "LL.1.2",
      ageGroup: "3-5 years",
      standardText: "Uses increasingly complex vocabulary and sentence structure",
      description: "Child demonstrates growing language complexity and sophistication",
      keywords: ["vocabulary", "sentence structure", "grammar", "language development", "complexity"]
    },

    // Language and Literacy Standard - Strand 2: Emergent Literacy
    {
      standardArea: "Language and Literacy",
      strand: "Emergent Literacy",
      standardCode: "LL.2.1",
      ageGroup: "3-5 years",
      standardText: "Shows interest in books and stories",
      description: "Child enjoys listening to and looking at books and stories",
      keywords: ["books", "stories", "reading interest", "literature", "print motivation"]
    },
    {
      standardArea: "Language and Literacy",
      strand: "Emergent Literacy",
      standardCode: "LL.2.2",
      ageGroup: "3-5 years",
      standardText: "Demonstrates understanding of print concepts",
      description: "Child shows awareness of how print works and book conventions",
      keywords: ["print concepts", "book handling", "print awareness", "directionality", "text concepts"]
    },

    // Mathematics Standard - Strand 1: Counting and Cardinality
    {
      standardArea: "Mathematics",
      strand: "Counting and Cardinality",
      standardCode: "M.1.1",
      ageGroup: "3-5 years",
      standardText: "Demonstrates knowledge of number names and the counting sequence",
      description: "Child can recite numbers in order and understands counting principles",
      keywords: ["counting", "number names", "number sequence", "cardinality", "numeracy"]
    },
    {
      standardArea: "Mathematics",
      strand: "Counting and Cardinality",
      standardCode: "M.1.2",
      ageGroup: "3-5 years",
      standardText: "Uses one-to-one correspondence when counting objects",
      description: "Child matches one number word to each object when counting",
      keywords: ["one-to-one correspondence", "counting objects", "number sense", "quantification"]
    },

    // Science Standard - Strand 1: Scientific Inquiry and Application
    {
      standardArea: "Science",
      strand: "Scientific Inquiry and Application",
      standardCode: "S.1.1",
      ageGroup: "3-5 years",
      standardText: "Observes and explores the environment using the five senses",
      description: "Child uses sensory exploration to learn about the world",
      keywords: ["observation", "exploration", "five senses", "sensory learning", "scientific inquiry"]
    },
    {
      standardArea: "Science",
      strand: "Scientific Inquiry and Application",
      standardCode: "S.1.2",
      ageGroup: "3-5 years",
      standardText: "Makes predictions and tests ideas",
      description: "Child forms hypotheses and experiments to test their thinking",
      keywords: ["predictions", "hypotheses", "testing", "experimentation", "scientific method"]
    },

    // Physical Development, Health & Safety Standard - Strand 1: Physical Development
    {
      standardArea: "Physical Development, Health & Safety",
      strand: "Physical Development",
      standardCode: "PD.1.1",
      ageGroup: "3-5 years",
      standardText: "Demonstrates gross motor skills",
      description: "Child shows coordination and control in large muscle movements",
      keywords: ["gross motor", "large muscles", "coordination", "movement", "physical skills"]
    },
    {
      standardArea: "Physical Development, Health & Safety",
      strand: "Physical Development",
      standardCode: "PD.1.2",
      ageGroup: "3-5 years",
      standardText: "Demonstrates fine motor skills",
      description: "Child shows dexterity and control in small muscle movements",
      keywords: ["fine motor", "small muscles", "dexterity", "hand coordination", "manipulation"]
    },

    // Fine Arts Standard - Strand 1: Visual Arts
    {
      standardArea: "Fine Arts",
      strand: "Visual Arts",
      standardCode: "FA.1.1",
      ageGroup: "3-5 years",
      standardText: "Explores and experiments with art materials and techniques",
      description: "Child uses various art materials to create and express ideas",
      keywords: ["art materials", "creativity", "expression", "visual arts", "artistic exploration"]
    },
    {
      standardArea: "Fine Arts",
      strand: "Music",
      standardCode: "FA.2.1",
      ageGroup: "3-5 years",
      standardText: "Explores musical concepts through singing, moving, and playing instruments",
      description: "Child engages with music through various forms of musical expression",
      keywords: ["music", "singing", "movement", "instruments", "musical expression"]
    }
  ];

  try {
    // Insert standards into database
    for (const standard of standards) {
      await db.insert(earlyLearningStandards).values(standard).onConflictDoNothing();
    }

    console.log(`Successfully seeded ${standards.length} Arizona Early Learning Standards`);
  } catch (error) {
    console.error("Error seeding Arizona standards:", error);
    throw error;
  }
}

// Run seeding if this file is executed directly
if (require.main === module) {
  seedArizonaStandards()
    .then(() => {
      console.log("Arizona standards seeding completed successfully");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Arizona standards seeding failed:", error);
      process.exit(1);
    });
}