import { 
  users, type User, type InsertUser,
  learningModules, type LearningModule, type InsertLearningModule,
  userProgress, type UserProgress, type InsertUserProgress,
  meetings, type Meeting, type InsertMeeting,
  assessments, type Assessment, type InsertAssessment
} from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
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
      completed: insertAssessment.completed || null,
      score: insertAssessment.score || null
    };
    this.assessments.set(id, assessment);
    return assessment;
  }
}

export const storage = new MemStorage();
