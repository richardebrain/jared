import { 
  users, type User, type InsertUser,
  learningModules, type LearningModule, type InsertLearningModule,
  userProgress, type UserProgress, type InsertUserProgress,
  meetings, type Meeting, type InsertMeeting,
  assessments, type Assessment, type InsertAssessment,
  storeItems, type StoreItem, type InsertStoreItem,
  userItems, type UserItem, type InsertUserItem,
  discussionThreads, type DiscussionThread, type InsertDiscussionThread,
  discussionComments, type DiscussionComment, type InsertDiscussionComment,
  commentVotes, type CommentVote, type InsertCommentVote,
  coreValuesShoutOuts, type CoreValuesShoutOut, type InsertCoreValuesShoutOut,
  educationalGames, type EducationalGame, type InsertEducationalGame,
  gameCompletions, type GameCompletion, type InsertGameCompletion,
  videoQuizCompletions, type VideoQuizCompletion, type InsertVideoQuizCompletion
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, gte, lt, or, sql } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, userData: Partial<InsertUser>): Promise<User>;
  addUserPoints(userId: number, points: number): Promise<User>;
  getUserPointsEarnedToday(userId: number): Promise<number>;
  getAllUsers(): Promise<User[]>;
  
  // Game operations
  getUserGameHistory(userId: number): Promise<GameCompletion[]>;
  recordGamePlay(gamePlay: InsertGameCompletion): Promise<GameCompletion>;
  
  // Learning modules operations
  getAllModules(): Promise<LearningModule[]>;
  getModule(id: number): Promise<LearningModule | undefined>;
  createModule(module: InsertLearningModule): Promise<LearningModule>;
  updateModule(id: number, moduleData: Partial<LearningModule>): Promise<LearningModule>;
  
  // User progress operations
  getUserProgressByUserId(userId: number): Promise<UserProgress[]>;
  getUserProgressByModuleId(moduleId: number): Promise<UserProgress[]>;
  updateUserProgress(progress: InsertUserProgress): Promise<UserProgress>;
  resetUserProgress(userId: number): Promise<boolean>;
  
  // Meeting operations
  getMeetingsByUserId(userId: number): Promise<Meeting[]>;
  getMeeting(id: number): Promise<Meeting | undefined>;
  createMeeting(meeting: InsertMeeting): Promise<Meeting>;
  updateMeeting(id: number, meeting: Partial<InsertMeeting>): Promise<Meeting>;
  deleteMeeting(id: number): Promise<void>;
  
  // Assessment operations
  getAssessmentsByUserId(userId: number): Promise<Assessment[]>;
  createAssessment(assessment: InsertAssessment): Promise<Assessment>;
  
  // Store and items operations
  getStoreItem(id: number): Promise<StoreItem | undefined>;
  getAllStoreItems(): Promise<StoreItem[]>;
  createStoreItem(item: InsertStoreItem): Promise<StoreItem>;
  getUserItemById(userId: number, itemId: number): Promise<UserItem | undefined>;
  getUserItems(userId: number): Promise<UserItem[]>;
  createUserItem(userItem: InsertUserItem): Promise<UserItem>;
  updateUserItem(id: number, updateData: Partial<InsertUserItem>): Promise<UserItem>;
  
  // Discussion threads operations
  getAllThreads(options?: { limit?: number, offset?: number, category?: string }): Promise<DiscussionThread[]>;
  getThreadById(id: number): Promise<DiscussionThread | undefined>;
  getThreadsByAuthor(authorId: number): Promise<DiscussionThread[]>;
  createThread(thread: InsertDiscussionThread): Promise<DiscussionThread>;
  updateThread(id: number, threadData: Partial<InsertDiscussionThread>): Promise<DiscussionThread>;
  deleteThread(id: number): Promise<void>;
  incrementThreadViewCount(id: number): Promise<void>;
  
  // Discussion comments operations
  getCommentsByThreadId(threadId: number): Promise<DiscussionComment[]>;
  getCommentById(id: number): Promise<DiscussionComment | undefined>;
  getCommentsByAuthor(authorId: number): Promise<DiscussionComment[]>;
  createComment(comment: InsertDiscussionComment): Promise<DiscussionComment>;
  updateComment(id: number, commentData: Partial<InsertDiscussionComment>): Promise<DiscussionComment>;
  deleteComment(id: number): Promise<void>;
  endorseComment(id: number, endorsed: boolean): Promise<void>;
  
  // Comment votes operations
  getVotesByUser(userId: number): Promise<CommentVote[]>;
  getVotesByComment(commentId: number): Promise<CommentVote[]>;
  createOrUpdateVote(vote: InsertCommentVote): Promise<CommentVote>;
  deleteVote(userId: number, commentId: number): Promise<void>;
  
  // Core Values Shout Out operations
  getCoreValuesShoutOutsByNominatorId(nominatorId: number): Promise<CoreValuesShoutOut[]>;
  getCoreValuesShoutOutsByNomineeId(nomineeId: number): Promise<CoreValuesShoutOut[]>;
  getAllCoreValuesShoutOuts(): Promise<CoreValuesShoutOut[]>;
  createCoreValuesShoutOut(shoutOut: InsertCoreValuesShoutOut & { pointsAwarded: number }): Promise<CoreValuesShoutOut>;
  
  // Educational Games operations
  getAllGames(options?: { category?: string, difficulty?: string }): Promise<EducationalGame[]>;
  getGameById(id: number): Promise<EducationalGame | undefined>;
  createGame(game: InsertEducationalGame): Promise<EducationalGame>;
  updateGame(id: number, gameData: Partial<InsertEducationalGame>): Promise<EducationalGame>;
  deleteGame(id: number): Promise<void>;
  
  // Game Completions operations
  getGameCompletionsByUserId(userId: number): Promise<GameCompletion[]>;
  getRecentGameCompletions(userId: number, limit?: number): Promise<GameCompletion[]>;
  getDailyGameCompletionsCount(userId: number): Promise<number>;
  createGameCompletion(completion: InsertGameCompletion): Promise<GameCompletion>;
  
  // Video Quiz Completions operations
  getVideoQuizCompletionsByUserId(userId: number): Promise<VideoQuizCompletion[]>;
  createVideoQuizCompletion(completion: InsertVideoQuizCompletion): Promise<VideoQuizCompletion>;
  getDailyVideoCompletionsCount(userId: number): Promise<number>;
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
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email
    );
  }
  
  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User> {
    const existingUser = this.users.get(id);
    
    if (!existingUser) {
      throw new Error("User not found");
    }
    
    const updatedUser: User = {
      ...existingUser,
      ...userData
    };
    
    this.users.set(id, updatedUser);
    return updatedUser;
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
  
  async updateModule(id: number, moduleData: Partial<LearningModule>): Promise<LearningModule> {
    const existingModule = await this.getModule(id);
    
    if (!existingModule) {
      throw new Error(`Module with ID ${id} not found`);
    }
    
    const updatedModule: LearningModule = {
      ...existingModule,
      ...moduleData
    };
    
    this.learningModules.set(id, updatedModule);
    return updatedModule;
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
  
  /**
   * Reset all progress for a specific user
   * This deletes all module progress for the user
   * @param userId The user ID to reset progress for
   * @returns Boolean indicating success
   */
  async resetUserProgress(userId: number): Promise<boolean> {
    try {
      console.log(`Resetting progress for user ID: ${userId}`);
      
      // Delete all user progress for this user
      const deletedProgress = await db.execute(
        sql`DELETE FROM user_progress WHERE user_id = ${userId}`
      );
      
      console.log(`Successfully reset progress for user ID: ${userId}`);
      return true;
    } catch (error) {
      console.error(`Error resetting progress for user ID ${userId}:`, error);
      return false;
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }
  
  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
      
    if (!updatedUser) {
      throw new Error("User not found");
    }
    
    return updatedUser;
  }
  
  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
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
  
  async updateModule(id: number, moduleData: Partial<LearningModule>): Promise<LearningModule> {
    const [updatedModule] = await db
      .update(learningModules)
      .set(moduleData)
      .where(eq(learningModules.id, id))
      .returning();
      
    if (!updatedModule) {
      throw new Error(`Module with ID ${id} not found`);
    }
    
    return updatedModule;
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
  
  // Used for admin functionality to reset a user's progress
  async deleteAllUserProgress(userId: number): Promise<void> {
    await db
      .delete(userProgress)
      .where(eq(userProgress.userId, userId));
  }
  
  // Alias method for API endpoint naming consistency
  async getProgressByUserId(userId: number): Promise<UserProgress[]> {
    return this.getUserProgressByUserId(userId);
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
  
  // Store items methods
  async getStoreItem(id: number): Promise<StoreItem | undefined> {
    const [item] = await db
      .select()
      .from(storeItems)
      .where(eq(storeItems.id, id));
    return item || undefined;
  }

  async getAllStoreItems(): Promise<StoreItem[]> {
    return db
      .select()
      .from(storeItems)
      .orderBy(storeItems.levelRequired);
  }

  async createStoreItem(item: InsertStoreItem): Promise<StoreItem> {
    const [result] = await db
      .insert(storeItems)
      .values(item)
      .returning();
    return result;
  }

  async getUserItemById(userId: number, itemId: number): Promise<UserItem | undefined> {
    const [userItem] = await db
      .select()
      .from(userItems)
      .where(
        and(
          eq(userItems.userId, userId),
          eq(userItems.itemId, itemId)
        )
      );
    return userItem || undefined;
  }

  async getUserItems(userId: number): Promise<UserItem[]> {
    return db
      .select()
      .from(userItems)
      .where(eq(userItems.userId, userId));
  }

  async createUserItem(userItem: InsertUserItem): Promise<UserItem> {
    const [result] = await db
      .insert(userItems)
      .values(userItem)
      .returning();
    return result;
  }

  async updateUserItem(id: number, updateData: Partial<InsertUserItem>): Promise<UserItem> {
    const [result] = await db
      .update(userItems)
      .set(updateData)
      .where(eq(userItems.id, id))
      .returning();
    return result;
  }
  
  // Discussion threads operations
  async getAllThreads(options?: { limit?: number, offset?: number, category?: string }): Promise<DiscussionThread[]> {
    let query = db.select().from(discussionThreads).orderBy(desc(discussionThreads.createdAt));
    
    if (options?.category) {
      query = query.where(eq(discussionThreads.category, options.category));
    }
    
    if (options?.limit) {
      query = query.limit(options.limit);
    }
    
    if (options?.offset) {
      query = query.offset(options.offset);
    }
    
    return await query;
  }
  
  async getThreadById(id: number): Promise<DiscussionThread | undefined> {
    const [thread] = await db
      .select()
      .from(discussionThreads)
      .where(eq(discussionThreads.id, id));
    return thread || undefined;
  }
  
  async getThreadsByAuthor(authorId: number): Promise<DiscussionThread[]> {
    return await db
      .select()
      .from(discussionThreads)
      .where(eq(discussionThreads.authorId, authorId))
      .orderBy(desc(discussionThreads.createdAt));
  }
  
  async createThread(thread: InsertDiscussionThread): Promise<DiscussionThread> {
    const [newThread] = await db
      .insert(discussionThreads)
      .values(thread)
      .returning();
    return newThread;
  }
  
  async updateThread(id: number, threadData: Partial<InsertDiscussionThread>): Promise<DiscussionThread> {
    const [updatedThread] = await db
      .update(discussionThreads)
      .set(threadData)
      .where(eq(discussionThreads.id, id))
      .returning();
    return updatedThread;
  }
  
  async deleteThread(id: number): Promise<void> {
    // Delete related comments first (to avoid foreign key constraints)
    await db
      .delete(discussionComments)
      .where(eq(discussionComments.threadId, id));
    
    // Then delete the thread
    await db
      .delete(discussionThreads)
      .where(eq(discussionThreads.id, id));
  }
  
  async incrementThreadViewCount(id: number): Promise<void> {
    const thread = await this.getThreadById(id);
    if (thread) {
      await db
        .update(discussionThreads)
        .set({ viewCount: (thread.viewCount || 0) + 1 })
        .where(eq(discussionThreads.id, id));
    }
  }
  
  // Discussion comments operations
  async getCommentsByThreadId(threadId: number): Promise<DiscussionComment[]> {
    return await db
      .select()
      .from(discussionComments)
      .where(eq(discussionComments.threadId, threadId))
      .orderBy(discussionComments.createdAt);
  }
  
  async getCommentById(id: number): Promise<DiscussionComment | undefined> {
    const [comment] = await db
      .select()
      .from(discussionComments)
      .where(eq(discussionComments.id, id));
    return comment || undefined;
  }
  
  async getCommentsByAuthor(authorId: number): Promise<DiscussionComment[]> {
    return await db
      .select()
      .from(discussionComments)
      .where(eq(discussionComments.authorId, authorId))
      .orderBy(desc(discussionComments.createdAt));
  }
  
  async createComment(comment: InsertDiscussionComment): Promise<DiscussionComment> {
    const [newComment] = await db
      .insert(discussionComments)
      .values(comment)
      .returning();
    
    // Update the thread's comment count
    const thread = await this.getThreadById(comment.threadId);
    if (thread) {
      await db
        .update(discussionThreads)
        .set({ 
          commentCount: (thread.commentCount || 0) + 1, 
          lastActivity: new Date() 
        })
        .where(eq(discussionThreads.id, comment.threadId));
    }
    
    return newComment;
  }
  
  async updateComment(id: number, commentData: Partial<InsertDiscussionComment>): Promise<DiscussionComment> {
    const [updatedComment] = await db
      .update(discussionComments)
      .set(commentData)
      .where(eq(discussionComments.id, id))
      .returning();
    return updatedComment;
  }
  
  async deleteComment(id: number): Promise<void> {
    // Get the comment to get the threadId
    const comment = await this.getCommentById(id);
    
    if (comment) {
      // Delete related votes first
      await db
        .delete(commentVotes)
        .where(eq(commentVotes.commentId, id));
      
      // Delete the comment
      await db
        .delete(discussionComments)
        .where(eq(discussionComments.id, id));
      
      // Update the thread's comment count
      const thread = await this.getThreadById(comment.threadId);
      if (thread && thread.commentCount && thread.commentCount > 0) {
        await db
          .update(discussionThreads)
          .set({ 
            commentCount: thread.commentCount - 1, 
            lastActivity: new Date() 
          })
          .where(eq(discussionThreads.id, comment.threadId));
      }
    }
  }
  
  async endorseComment(id: number, endorsed: boolean): Promise<void> {
    await db
      .update(discussionComments)
      .set({ endorsed })
      .where(eq(discussionComments.id, id));
  }
  
  // Comment votes operations
  async getVotesByUser(userId: number): Promise<CommentVote[]> {
    return await db
      .select()
      .from(commentVotes)
      .where(eq(commentVotes.userId, userId));
  }
  
  async getVotesByComment(commentId: number): Promise<CommentVote[]> {
    return await db
      .select()
      .from(commentVotes)
      .where(eq(commentVotes.commentId, commentId));
  }
  
  async createOrUpdateVote(vote: InsertCommentVote): Promise<CommentVote> {
    // Check if vote already exists
    const [existingVote] = await db
      .select()
      .from(commentVotes)
      .where(
        and(
          eq(commentVotes.userId, vote.userId),
          eq(commentVotes.commentId, vote.commentId)
        )
      );
    
    if (existingVote) {
      // Update if vote type is different
      if (existingVote.voteType !== vote.voteType) {
        const [updatedVote] = await db
          .update(commentVotes)
          .set({ voteType: vote.voteType })
          .where(
            and(
              eq(commentVotes.userId, vote.userId),
              eq(commentVotes.commentId, vote.commentId)
            )
          )
          .returning();
        return updatedVote;
      }
      return existingVote;
    } else {
      // Create new vote
      const [newVote] = await db
        .insert(commentVotes)
        .values(vote)
        .returning();
      
      // Update upvote/downvote counts on the comment
      const comment = await this.getCommentById(vote.commentId);
      if (comment) {
        const updatedCounts = { 
          upvotes: comment.upvotes || 0,
          downvotes: comment.downvotes || 0
        };
        
        if (vote.voteType === 'upvote') {
          updatedCounts.upvotes += 1;
        } else {
          updatedCounts.downvotes += 1;
        }
        
        await db
          .update(discussionComments)
          .set(updatedCounts)
          .where(eq(discussionComments.id, vote.commentId));
      }
      
      return newVote;
    }
  }
  
  async deleteVote(userId: number, commentId: number): Promise<void> {
    // Get the vote to know its type
    const [vote] = await db
      .select()
      .from(commentVotes)
      .where(
        and(
          eq(commentVotes.userId, userId),
          eq(commentVotes.commentId, commentId)
        )
      );
    
    if (vote) {
      // Delete the vote
      await db
        .delete(commentVotes)
        .where(
          and(
            eq(commentVotes.userId, userId),
            eq(commentVotes.commentId, commentId)
          )
        );
      
      // Update upvote/downvote counts on the comment
      const comment = await this.getCommentById(commentId);
      if (comment) {
        const updatedCounts = { 
          upvotes: Math.max(0, (comment.upvotes || 0) - (vote.voteType === 'upvote' ? 1 : 0)),
          downvotes: Math.max(0, (comment.downvotes || 0) - (vote.voteType === 'downvote' ? 1 : 0))
        };
        
        await db
          .update(discussionComments)
          .set(updatedCounts)
          .where(eq(discussionComments.id, commentId));
      }
    }
  }

  // Core Values Shout Out operations
  async getCoreValuesShoutOutsByNominatorId(nominatorId: number): Promise<CoreValuesShoutOut[]> {
    return db
      .select()
      .from(coreValuesShoutOuts)
      .where(eq(coreValuesShoutOuts.nominatorId, nominatorId))
      .orderBy(desc(coreValuesShoutOuts.createdAt));
  }

  async getCoreValuesShoutOutsByNomineeId(nomineeId: number): Promise<CoreValuesShoutOut[]> {
    return db
      .select()
      .from(coreValuesShoutOuts)
      .where(eq(coreValuesShoutOuts.nomineeId, nomineeId))
      .orderBy(desc(coreValuesShoutOuts.createdAt));
  }
  
  async getAllCoreValuesShoutOuts(): Promise<CoreValuesShoutOut[]> {
    return db
      .select()
      .from(coreValuesShoutOuts)
      .orderBy(desc(coreValuesShoutOuts.createdAt));
  }

  async createCoreValuesShoutOut(shoutOut: InsertCoreValuesShoutOut & { pointsAwarded: number }): Promise<CoreValuesShoutOut> {
    const [newShoutOut] = await db
      .insert(coreValuesShoutOuts)
      .values(shoutOut)
      .returning();
    
    // Update the nominator's points (add 1 point for nominating someone)
    const nominator = await this.getUser(shoutOut.nominatorId);
    if (nominator && nominator.points !== null) {
      await db
        .update(users)
        .set({ points: nominator.points + 1 })
        .where(eq(users.id, shoutOut.nominatorId));
    }
    
    // Update the nominee's points (add the pointsAwarded)
    const nominee = await this.getUser(shoutOut.nomineeId);
    if (nominee && nominee.points !== null) {
      await db
        .update(users)
        .set({ points: nominee.points + shoutOut.pointsAwarded })
        .where(eq(users.id, shoutOut.nomineeId));
    }
    
    return newShoutOut;
  }
  
  // Educational Games operations
  async getAllGames(options?: { category?: string, difficulty?: string }): Promise<EducationalGame[]> {
    let query = db.select().from(educationalGames);
    
    if (options?.category) {
      query = query.where(eq(educationalGames.category, options.category));
    }
    
    if (options?.difficulty) {
      query = query.where(eq(educationalGames.difficulty, options.difficulty));
    }
    
    return await query;
  }
  
  async getGameById(id: number): Promise<EducationalGame | undefined> {
    const [game] = await db.select().from(educationalGames).where(eq(educationalGames.id, id));
    return game;
  }
  
  async createGame(game: InsertEducationalGame): Promise<EducationalGame> {
    const [newGame] = await db.insert(educationalGames).values(game).returning();
    return newGame;
  }
  
  async updateGame(id: number, gameData: Partial<InsertEducationalGame>): Promise<EducationalGame> {
    const [updatedGame] = await db
      .update(educationalGames)
      .set(gameData)
      .where(eq(educationalGames.id, id))
      .returning();
    return updatedGame;
  }
  
  async deleteGame(id: number): Promise<void> {
    await db.delete(educationalGames).where(eq(educationalGames.id, id));
  }
  
  // Game Completions operations
  async getGameCompletionsByUserId(userId: number): Promise<GameCompletion[]> {
    return await db
      .select()
      .from(gameCompletions)
      .where(eq(gameCompletions.userId, userId))
      .orderBy(desc(gameCompletions.completedAt));
  }
  
  async getRecentGameCompletions(userId: number, limit: number = 10): Promise<GameCompletion[]> {
    return await db
      .select()
      .from(gameCompletions)
      .where(eq(gameCompletions.userId, userId))
      .orderBy(desc(gameCompletions.completedAt))
      .limit(limit);
  }
  
  async getDailyGameCompletionsCount(userId: number): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const completions = await db
      .select()
      .from(gameCompletions)
      .where(
        and(
          eq(gameCompletions.userId, userId),
          // Greater than or equal to today at 00:00:00
          sql`${gameCompletions.completedAt} >= ${today}`,
          // Less than tomorrow at 00:00:00
          sql`${gameCompletions.completedAt} < ${tomorrow}`
        )
      );
    
    return completions.length;
  }
  
  async createGameCompletion(completion: InsertGameCompletion): Promise<GameCompletion> {
    const [newCompletion] = await db
      .insert(gameCompletions)
      .values(completion)
      .returning();
    
    // Also update the user's points
    if (completion.pointsEarned) {
      const user = await this.getUser(completion.userId);
      if (user && user.points !== null) {
        await db
          .update(users)
          .set({ points: user.points + completion.pointsEarned })
          .where(eq(users.id, completion.userId));
      }
    }
    
    return newCompletion;
  }
  
  // Video Quiz Completions implementation
  async getVideoQuizCompletionsByUserId(userId: number): Promise<VideoQuizCompletion[]> {
    return await db
      .select()
      .from(videoQuizCompletions)
      .where(eq(videoQuizCompletions.userId, userId));
  }

  async createVideoQuizCompletion(completion: InsertVideoQuizCompletion): Promise<VideoQuizCompletion> {
    const [result] = await db
      .insert(videoQuizCompletions)
      .values(completion)
      .returning();
    
    // Also update the user's points
    if (completion.pointsEarned) {
      const user = await this.getUser(completion.userId);
      if (user && user.points !== null) {
        await db
          .update(users)
          .set({ points: user.points + completion.pointsEarned })
          .where(eq(users.id, completion.userId));
      }
    }
    
    return result;
  }
  
  async getDailyVideoCompletionsCount(userId: number): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const completions = await db
      .select()
      .from(videoQuizCompletions)
      .where(
        and(
          eq(videoQuizCompletions.userId, userId),
          sql`${videoQuizCompletions.completedAt} >= ${today}`,
          sql`${videoQuizCompletions.completedAt} < ${tomorrow}`
        )
      );
    
    return completions.length;
  }
  
  /**
   * Get the total points earned by a user today
   * Used to enforce the daily points cap of 20
   * 
   * @param userId The user ID to check
   * @returns Promise with the total points earned today
   */
  async getUserPointsEarnedToday(userId: number): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // First check video points
    const videoPoints = await db
      .select({
        totalPoints: sql<number>`sum(${videoQuizCompletions.pointsEarned})`,
      })
      .from(videoQuizCompletions)
      .where(
        and(
          eq(videoQuizCompletions.userId, userId),
          sql`${videoQuizCompletions.completedAt} >= ${today}`,
          sql`${videoQuizCompletions.completedAt} < ${tomorrow}`
        )
      );
    
    // Check game points
    const gamePoints = await db
      .select({
        totalPoints: sql<number>`sum(${gameCompletions.pointsEarned})`,
      })
      .from(gameCompletions)
      .where(
        and(
          eq(gameCompletions.userId, userId),
          sql`${gameCompletions.completedAt} >= ${today}`,
          sql`${gameCompletions.completedAt} < ${tomorrow}`
        )
      );
    
    // Check shout-out points
    const shoutoutPoints = await db
      .select({
        totalPoints: sql<number>`sum(${coreValuesShoutOuts.pointsAwarded})`,
      })
      .from(coreValuesShoutOuts)
      .where(
        and(
          or(
            eq(coreValuesShoutOuts.nominatorId, userId),
            eq(coreValuesShoutOuts.nomineeId, userId)
          ),
          sql`${coreValuesShoutOuts.createdAt} >= ${today}`,
          sql`${coreValuesShoutOuts.createdAt} < ${tomorrow}`
        )
      );
      
    // Sum up all points from different sources
    const videoTotal = videoPoints[0]?.totalPoints || 0;
    const gameTotal = gamePoints[0]?.totalPoints || 0;
    const shoutoutTotal = shoutoutPoints[0]?.totalPoints || 0;
    
    return videoTotal + gameTotal + shoutoutTotal;
  }
  
  /**
   * Add points to a user, respecting the daily points cap
   * 
   * @param userId The user ID to add points to
   * @param points Number of points to add
   * @returns Updated user record
   */
  async addUserPoints(userId: number, points: number): Promise<User> {
    // If deducting points (negative), don't apply the daily cap
    if (points <= 0) {
      const user = await this.getUser(userId);
      if (!user) {
        throw new Error(`User with ID ${userId} not found`);
      }
      
      const currentPoints = user.points || 0;
      const newPoints = currentPoints + points;
      
      // Update the user's points
      return await this.updateUser(userId, { points: newPoints });
    }
    
    // Get the total points earned today so far
    const pointsEarnedToday = await this.getUserPointsEarnedToday(userId);
    
    // Calculate how many points can be added before hitting the cap
    const maxDailyPoints = 20;
    const pointsAvailable = Math.max(0, maxDailyPoints - pointsEarnedToday);
    
    // Cap the points to add
    const pointsToAdd = Math.min(points, pointsAvailable);
    
    // If no points can be added, return the user without changes
    if (pointsToAdd <= 0) {
      console.log(`User ${userId} has reached the daily points cap of ${maxDailyPoints}. No points added.`);
      const user = await this.getUser(userId);
      if (!user) {
        throw new Error(`User with ID ${userId} not found`);
      }
      return user;
    }
    
    console.log(`Adding ${pointsToAdd} points to user ${userId}. Today's total: ${pointsEarnedToday + pointsToAdd}/${maxDailyPoints}`);
    
    // Update the user's points
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error(`User with ID ${userId} not found`);
    }
    
    const currentPoints = user.points || 0;
    const newPoints = currentPoints + pointsToAdd;
    
    // Update the user's points
    return await this.updateUser(userId, { points: newPoints });
  }
  
  // Game history tracking
  async getUserGameHistory(userId: number): Promise<GameCompletion[]> {
    return db
      .select()
      .from(gameCompletions)
      .where(eq(gameCompletions.userId, userId))
      .orderBy(desc(gameCompletions.completedAt));
  }
  
  async recordGamePlay(gamePlay: InsertGameCompletion): Promise<GameCompletion> {
    const [completion] = await db
      .insert(gameCompletions)
      .values(gamePlay)
      .returning();
      
    return completion;
  }
}

// Export a new instance of DatabaseStorage
export const storage = new DatabaseStorage();
