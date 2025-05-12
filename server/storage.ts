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
      {
        title: "Basic Greetings and Introductions",
        description: "Learn how to introduce yourself and greet others in a new language.",
        duration: 60,
        imageUrl: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b",
        featured: true,
        difficulty: "beginner",
        category: "speaking"
      },
      {
        title: "Essential Vocabulary",
        description: "Build your core vocabulary with the most commonly used words and phrases.",
        duration: 90,
        imageUrl: "https://images.unsplash.com/photo-1609220136736-443140cffec6",
        featured: false,
        difficulty: "beginner",
        category: "vocabulary"
      },
      {
        title: "Grammar Fundamentals",
        description: "Master the basic grammar rules needed for constructing simple sentences.",
        duration: 120,
        imageUrl: "https://images.unsplash.com/photo-1607453998774-d533f65dac99",
        featured: false,
        difficulty: "intermediate",
        category: "grammar"
      },
      {
        title: "Conversation Practice",
        description: "Practice real-world conversations with guided dialogues and scenarios.",
        duration: 60,
        imageUrl: "https://images.unsplash.com/photo-1531482615713-2afd69097998",
        featured: true,
        difficulty: "intermediate",
        category: "speaking"
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
    const user: User = { ...insertUser, id, createdAt: now };
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
    const module: LearningModule = { ...insertModule, id, createdAt: now };
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
        progress: insertProgress.progress,
        completed: insertProgress.completed,
        lastAccessed: new Date()
      };
      
      this.userProgress.set(existingProgress.id, updatedProgress);
      return updatedProgress;
    } else {
      // Create new progress record
      const id = this.progressIdCounter++;
      const now = new Date();
      const progress: UserProgress = {
        ...insertProgress,
        id,
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
    const meeting: Meeting = { ...insertMeeting, id, createdAt: now };
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
    const assessment: Assessment = { ...insertAssessment, id, createdAt: now };
    this.assessments.set(id, assessment);
    return assessment;
  }
}

export const storage = new MemStorage();
