import { 
  users, type User, type InsertUser,
  learningModules, type LearningModule, type InsertLearningModule,
  userProgress, type UserProgress, type InsertUserProgress,
  meetings, type Meeting, type InsertMeeting,
  assessments, type Assessment, type InsertAssessment
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  
  // Learning modules operations
  getAllModules(): Promise<LearningModule[]>;
  getModule(id: number): Promise<LearningModule | undefined>;
  createModule(module: InsertLearningModule): Promise<LearningModule>;
  
  // User progress operations
  getUserProgressByUserId(userId: number): Promise<UserProgress[]>;
  getUserProgressByModuleId(moduleId: number): Promise<UserProgress[]>;
  updateUserProgress(progress: InsertUserProgress): Promise<UserProgress>;
  
  // Meeting operations
  getMeetingsByUserId(userId: number): Promise<Meeting[]>;
  getMeeting(id: number): Promise<Meeting | undefined>;
  createMeeting(meeting: InsertMeeting): Promise<Meeting>;
  updateMeeting(id: number, meeting: Partial<InsertMeeting>): Promise<Meeting>;
  deleteMeeting(id: number): Promise<void>;
  
  // Assessment operations
  getAssessmentsByUserId(userId: number): Promise<Assessment[]>;
  createAssessment(assessment: InsertAssessment): Promise<Assessment>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private learningModules: Map<number, LearningModule>;
  private userProgress: Map<number, UserProgress>;
  private meetings: Map<number, Meeting>;
  private assessments: Map<number, Assessment>;
  
  private userIdCounter: number;
  private moduleIdCounter: number;
  private progressIdCounter: number;
  private meetingIdCounter: number;
  private assessmentIdCounter: number;

  constructor() {
    this.users = new Map();
    this.learningModules = new Map();
    this.userProgress = new Map();
    this.meetings = new Map();
    this.assessments = new Map();
    
    this.userIdCounter = 1;
    this.moduleIdCounter = 1;
    this.progressIdCounter = 1;
    this.meetingIdCounter = 1;
    this.assessmentIdCounter = 1;
    
    // Initialize with sample modules
    this.initializeModules();
  }

  // Initialize sample learning modules
  private initializeModules() {
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
      },
      
      // Child Development & Theories
      {
        title: "Piaget's Cognitive Development Theory",
        description: "Understand how children's thinking develops through Piaget's four stages and apply this knowledge to create developmentally appropriate activities.",
        duration: 75,
        imageUrl: null,
        featured: false,
        difficulty: "intermediate",
        category: "child-development"
      },
      {
        title: "Vygotsky's Sociocultural Theory",
        description: "Learn about the Zone of Proximal Development and scaffolding techniques to support children's learning through social interactions.",
        duration: 60,
        imageUrl: null,
        featured: false,
        difficulty: "intermediate",
        category: "child-development"
      },
      {
        title: "Attachment Theory in Early Childhood",
        description: "Explore how secure attachments form and their importance in children's emotional development and future relationships.",
        duration: 90,
        imageUrl: null,
        featured: true,
        difficulty: "intermediate",
        category: "child-development"
      },
      
      // Curriculum & Instruction
      {
        title: "Play-Based Learning Fundamentals",
        description: "Discover the science behind play-based learning and how to design intentional play experiences that promote learning across all developmental domains.",
        duration: 120,
        imageUrl: null,
        featured: true,
        difficulty: "beginner",
        category: "curriculum"
      },
      {
        title: "Emergent Curriculum Design",
        description: "Learn to develop curriculum based on children's interests and inquiries while still meeting educational standards and goals.",
        duration: 90,
        imageUrl: null,
        featured: false,
        difficulty: "advanced",
        category: "curriculum"
      },
      {
        title: "STEM in Early Childhood",
        description: "Explore age-appropriate science, technology, engineering, and math activities that foster curiosity and problem-solving skills.",
        duration: 75,
        imageUrl: null,
        featured: true,
        difficulty: "intermediate",
        category: "curriculum"
      },
      
      // Observation & Assessment
      {
        title: "Authentic Assessment Methods",
        description: "Learn effective observation techniques and documentation methods to track children's development and inform your teaching practices.",
        duration: 60,
        imageUrl: null,
        featured: false,
        difficulty: "intermediate",
        category: "assessment"
      },
      {
        title: "Understanding the ECERS/ITERS Framework",
        description: "Deep dive into the Environmental Rating Scales and how to use them to evaluate and improve your classroom environment.",
        duration: 120,
        imageUrl: null,
        featured: true,
        difficulty: "advanced",
        category: "assessment"
      },
      {
        title: "CLASS Assessment Overview",
        description: "Understand the Classroom Assessment Scoring System (CLASS) and how it measures teacher-child interactions across emotional support, classroom organization, and instructional support domains.",
        duration: 90,
        imageUrl: null,
        featured: true,
        difficulty: "intermediate",
        category: "assessment"
      },
      
      // Special Needs & Inclusion
      {
        title: "Inclusive Classroom Practices",
        description: "Learn strategies to create an inclusive environment that supports children with diverse abilities and needs.",
        duration: 75,
        imageUrl: null,
        featured: true,
        difficulty: "intermediate",
        category: "inclusion"
      },
      {
        title: "Understanding IEPs and IFSPs",
        description: "Navigate the process of Individualized Education Programs and Individualized Family Service Plans to support children with special needs.",
        duration: 60,
        imageUrl: null,
        featured: false,
        difficulty: "intermediate",
        category: "inclusion"
      },
      {
        title: "Sensory Processing in Early Childhood",
        description: "Understand sensory processing differences and implement supportive strategies in your classroom environment and activities.",
        duration: 90,
        imageUrl: null,
        featured: false,
        difficulty: "intermediate",
        category: "inclusion"
      },
      
      // Communication & Family Engagement
      {
        title: "Effective Parent-Teacher Communication",
        description: "Develop skills to build strong relationships with families through various communication strategies and tools.",
        duration: 60,
        imageUrl: null,
        featured: true,
        difficulty: "beginner",
        category: "family-engagement"
      },
      {
        title: "Family Engagement Strategies",
        description: "Learn innovative approaches to involve families in their children's learning and the classroom community.",
        duration: 75,
        imageUrl: null,
        featured: false,
        difficulty: "intermediate",
        category: "family-engagement"
      },
      {
        title: "Cultural Competence in Early Childhood Settings",
        description: "Develop awareness and skills to respect and celebrate cultural diversity in your classroom community.",
        duration: 90,
        imageUrl: null,
        featured: true,
        difficulty: "intermediate",
        category: "family-engagement"
      },
      
      // Teacher Wellness & Professional Development
      {
        title: "Teacher Self-Care Strategies",
        description: "Learn practical techniques to manage stress and prevent burnout while working in the demanding field of early childhood education.",
        duration: 60,
        imageUrl: null,
        featured: true,
        difficulty: "beginner",
        category: "teacher-wellness"
      },
      {
        title: "Reflective Teaching Practice",
        description: "Develop skills to critically reflect on your teaching practices and use these insights to continuously improve your effectiveness.",
        duration: 75,
        imageUrl: null,
        featured: false,
        difficulty: "intermediate",
        category: "teacher-wellness"
      },
      {
        title: "Building Your Professional Learning Network",
        description: "Discover resources and strategies to connect with other early childhood professionals for ongoing learning and support.",
        duration: 45,
        imageUrl: null,
        featured: false,
        difficulty: "beginner",
        category: "teacher-wellness"
      }
    ];
    
    moduleData.forEach(module => {
      this.createModule(module);
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }
  
  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const now = new Date();
    const user: User = { 
      ...insertUser, 
      id, 
      createdAt: now,
      profilePicture: insertUser.profilePicture || null 
    };
    this.users.set(id, user);
    return user;
  }

  // Learning modules operations
  async getAllModules(): Promise<LearningModule[]> {
    return Array.from(this.learningModules.values());
  }

  async getModule(id: number): Promise<LearningModule | undefined> {
    return this.learningModules.get(id);
  }

  async createModule(insertModule: InsertLearningModule): Promise<LearningModule> {
    const id = this.moduleIdCounter++;
    const now = new Date();
    const module: LearningModule = {
      ...insertModule,
      id,
      createdAt: now,
      imageUrl: insertModule.imageUrl || null,
      featured: insertModule.featured || null
    };
    this.learningModules.set(id, module);
    return module;
  }

  // User progress operations
  async getUserProgressByUserId(userId: number): Promise<UserProgress[]> {
    return Array.from(this.userProgress.values()).filter(
      (progress) => progress.userId === userId
    );
  }

  async getUserProgressByModuleId(moduleId: number): Promise<UserProgress[]> {
    return Array.from(this.userProgress.values()).filter(
      (progress) => progress.moduleId === moduleId
    );
  }

  async updateUserProgress(insertProgress: InsertUserProgress): Promise<UserProgress> {
    const userId = insertProgress.userId;
    const moduleId = insertProgress.moduleId;
    
    // Check if progress record already exists
    const existingProgress = Array.from(this.userProgress.values()).find(
      (p) => p.userId === userId && p.moduleId === moduleId
    );
    
    if (existingProgress) {
      // Update existing progress
      const updatedProgress: UserProgress = {
        ...existingProgress,
        progress: insertProgress.progress || 0,
        completed: insertProgress.completed || null,
        recommended: insertProgress.recommended || false,
        lastAccessed: new Date()
      };
      
      this.userProgress.set(existingProgress.id, updatedProgress);
      return updatedProgress;
    } else {
      // Create new progress record
      const id = this.progressIdCounter++;
      const now = new Date();
      const progress: UserProgress = {
        id,
        userId: insertProgress.userId,
        moduleId: insertProgress.moduleId,
        progress: insertProgress.progress || 0,
        completed: insertProgress.completed || null,
        recommended: insertProgress.recommended || false,
        lastAccessed: now
      };
      
      this.userProgress.set(id, progress);
      return progress;
    }
  }

  // Meeting operations
  async getMeetingsByUserId(userId: number): Promise<Meeting[]> {
    return Array.from(this.meetings.values()).filter(
      (meeting) => meeting.hostId === userId || meeting.guestId === userId
    );
  }

  async getMeeting(id: number): Promise<Meeting | undefined> {
    return this.meetings.get(id);
  }

  async createMeeting(insertMeeting: InsertMeeting): Promise<Meeting> {
    const id = this.meetingIdCounter++;
    const now = new Date();
    const meeting: Meeting = {
      ...insertMeeting,
      id,
      createdAt: now,
      status: insertMeeting.status || "scheduled",
      description: insertMeeting.description || null,
      guestId: insertMeeting.guestId || null,
      meetingLink: insertMeeting.meetingLink || null
    };
    this.meetings.set(id, meeting);
    return meeting;
  }

  async updateMeeting(id: number, updateData: Partial<InsertMeeting>): Promise<Meeting> {
    const existingMeeting = this.meetings.get(id);
    
    if (!existingMeeting) {
      throw new Error("Meeting not found");
    }
    
    const updatedMeeting: Meeting = {
      ...existingMeeting,
      ...updateData
    };
    
    this.meetings.set(id, updatedMeeting);
    return updatedMeeting;
  }

  async deleteMeeting(id: number): Promise<void> {
    this.meetings.delete(id);
  }

  // Assessment operations
  async getAssessmentsByUserId(userId: number): Promise<Assessment[]> {
    return Array.from(this.assessments.values()).filter(
      (assessment) => assessment.userId === userId
    );
  }

  async createAssessment(insertAssessment: InsertAssessment): Promise<Assessment> {
    const id = this.assessmentIdCounter++;
    const now = new Date();
    const assessment: Assessment = {
      ...insertAssessment,
      id,
      createdAt: now,
      results: insertAssessment.results || {},
      domainScores: insertAssessment.domainScores || {},
      strengthAreas: insertAssessment.strengthAreas || [],
      growthAreas: insertAssessment.growthAreas || [],
      recommendedModules: insertAssessment.recommendedModules || [],
      assessmentType: insertAssessment.assessmentType || 'ITERS_ECERS_CLASS',
      notes: insertAssessment.notes || null,
      completed: insertAssessment.completed || null,
      overallScore: insertAssessment.overallScore || null
    };
    this.assessments.set(id, assessment);
    return assessment;
  }
}

// Create a DatabaseStorage class that implements the IStorage interface
export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }
  
  async getAllModules(): Promise<LearningModule[]> {
    return await db.select().from(learningModules);
  }
  
  async getModule(id: number): Promise<LearningModule | undefined> {
    const [module] = await db.select().from(learningModules).where(eq(learningModules.id, id));
    return module || undefined;
  }
  
  async createModule(module: InsertLearningModule): Promise<LearningModule> {
    const [newModule] = await db
      .insert(learningModules)
      .values(module)
      .returning();
    return newModule;
  }
  
  async getUserProgressByUserId(userId: number): Promise<UserProgress[]> {
    return await db.select().from(userProgress).where(eq(userProgress.userId, userId));
  }
  
  async getUserProgressByModuleId(moduleId: number): Promise<UserProgress[]> {
    return await db.select().from(userProgress).where(eq(userProgress.moduleId, moduleId));
  }
  
  async updateUserProgress(progress: InsertUserProgress): Promise<UserProgress> {
    // Check if progress already exists
    const [existingProgress] = await db
      .select()
      .from(userProgress)
      .where(and(
        eq(userProgress.userId, progress.userId),
        eq(userProgress.moduleId, progress.moduleId)
      ));
    
    if (existingProgress) {
      // Update existing progress
      const [updatedProgress] = await db
        .update(userProgress)
        .set(progress)
        .where(eq(userProgress.id, existingProgress.id))
        .returning();
      return updatedProgress;
    } else {
      // Create new progress
      const [newProgress] = await db
        .insert(userProgress)
        .values(progress)
        .returning();
      return newProgress;
    }
  }
  
  async getMeetingsByUserId(userId: number): Promise<Meeting[]> {
    return await db
      .select()
      .from(meetings)
      .where(eq(meetings.hostId, userId))
      .orderBy(meetings.startTime);
  }
  
  async getMeeting(id: number): Promise<Meeting | undefined> {
    const [meeting] = await db.select().from(meetings).where(eq(meetings.id, id));
    return meeting || undefined;
  }
  
  async createMeeting(meeting: InsertMeeting): Promise<Meeting> {
    const [newMeeting] = await db
      .insert(meetings)
      .values(meeting)
      .returning();
    return newMeeting;
  }
  
  async updateMeeting(id: number, updateData: Partial<InsertMeeting>): Promise<Meeting> {
    const [updatedMeeting] = await db
      .update(meetings)
      .set(updateData)
      .where(eq(meetings.id, id))
      .returning();
    return updatedMeeting;
  }
  
  async deleteMeeting(id: number): Promise<void> {
    await db.delete(meetings).where(eq(meetings.id, id));
  }
  
  async getAssessmentsByUserId(userId: number): Promise<Assessment[]> {
    return await db
      .select()
      .from(assessments)
      .where(eq(assessments.userId, userId))
      .orderBy(desc(assessments.createdAt));
  }
  
  async createAssessment(assessment: InsertAssessment): Promise<Assessment> {
    const [newAssessment] = await db
      .insert(assessments)
      .values(assessment)
      .returning();
    return newAssessment;
  }
}

// Export a new instance of DatabaseStorage
export const storage = new DatabaseStorage();
