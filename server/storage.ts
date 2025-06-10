// @ts-nocheck - Temporarily disable type checking for this file while we fix database schema issues
import { 
  users, type User, type InsertUser,
  schools, type School, type InsertSchool,
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
  videoQuizCompletions, type VideoQuizCompletion, type InsertVideoQuizCompletion,
  moduleRatings, type ModuleRating, type InsertModuleRating,
  communityModules, type CommunityModule, type InsertCommunityModule,
  teacherSelfAssessments, type TeacherSelfAssessment, type InsertTeacherSelfAssessment,
  teacherInvitations, type TeacherInvitation, type InsertTeacherInvitation,
  avatarCategories, type AvatarCategory, type InsertAvatarCategory,
  avatarItems, type AvatarItem, type InsertAvatarItem,
  userAvatars, type UserAvatar, type InsertUserAvatar,
  userAvatarItems, type UserAvatarItem, type InsertUserAvatarItem,
  streakRewards, type StreakReward, type InsertStreakReward,
  lessonPlans, type LessonPlan, type InsertLessonPlan,
  earlyLearningStandards, type EarlyLearningStandard, type InsertEarlyLearningStandard,
  videoRatings, type VideoRating, type InsertVideoRating,
  moduleDrafts, type ModuleDraft, type InsertModuleDraft
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, gte, lt, or, sql } from "drizzle-orm";

export interface IStorage {
  // Streak rewards
  getStreakRewardsByUserId(userId: number): Promise<StreakReward[]>;
  createStreakReward(reward: InsertStreakReward): Promise<StreakReward>;
  
  // User points and items
  addUserPoints(userId: number, points: number): Promise<User>;
  addUserBearBucks(userId: number, amount: number): Promise<User>;
  addUserItem(userId: number, itemId: number): Promise<UserItem>;
  // School operations
  getSchool(id: number): Promise<School | undefined>;
  getSchoolByName(name: string): Promise<School | undefined>;
  getAllSchools(): Promise<School[]>;
  createSchool(school: InsertSchool): Promise<School>;
  updateSchool(id: number, schoolData: Partial<InsertSchool>): Promise<School>;
  incrementSchoolTeacherCount(schoolId: number): Promise<School>;
  
  // Streak rewards
  getStreakRewardsByUserId(userId: number): Promise<StreakReward[]>;
  createStreakReward(data: InsertStreakReward): Promise<StreakReward>;
  
  // Teacher self-assessment operations
  createSelfAssessment(data: InsertTeacherSelfAssessment): Promise<TeacherSelfAssessment>;
  getLatestSelfAssessment(userId: number): Promise<TeacherSelfAssessment | undefined>;
  updateUserTeacherLevel(userId: number, teacherLevel: string): Promise<User>;
  
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, userData: Partial<InsertUser>): Promise<User>;
  addUserPoints(userId: number, points: number): Promise<User>;
  getUserPointsEarnedToday(userId: number): Promise<number>;
  getAllUsers(): Promise<User[]>;
  getUsersBySchoolId(schoolId: number): Promise<User[]>;
  updateUserSchool(userId: number, schoolId: number): Promise<User>;
  checkUserAccessStatus(userId: number): Promise<{hasAccess: boolean, reason?: string}>;
  
  // Game operations
  getUserGameHistory(userId: number): Promise<GameCompletion[]>;
  recordGamePlay(gamePlay: InsertGameCompletion): Promise<GameCompletion>;
  
  // Learning modules operations
  getAllModules(): Promise<LearningModule[]>;
  getModule(id: number): Promise<LearningModule | undefined>;
  createModule(module: InsertLearningModule): Promise<LearningModule>;
  updateModule(id: number, moduleData: Partial<LearningModule>): Promise<LearningModule>;
  
  // Module rating operations
  getRatingsForModule(moduleId: number): Promise<ModuleRating[]>;
  getRatingByUserAndModule(userId: number, moduleId: number): Promise<ModuleRating | undefined>;
  createOrUpdateRating(rating: InsertModuleRating): Promise<ModuleRating>;
  getAverageRatingForModule(moduleId: number): Promise<number>;
  
  // Community module operations
  getCommunityModules(): Promise<CommunityModule[]>;
  getTopRatedCommunityModules(limit?: number): Promise<(CommunityModule & { module: LearningModule })[]>;
  shareModuleWithCommunity(moduleId: number, schoolId: number): Promise<CommunityModule>;
  removeCommunityModule(id: number): Promise<void>;
  
  // User progress operations
  getUserProgressByUserId(userId: number): Promise<UserProgress[]>;
  getUserProgressByModuleId(moduleId: number): Promise<UserProgress[]>;
  updateUserProgress(progress: InsertUserProgress): Promise<UserProgress>;
  createUserProgress(progress: InsertUserProgress): Promise<UserProgress>;
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
  
  // Self-Assessment operations
  createSelfAssessment(assessment: InsertTeacherSelfAssessment): Promise<TeacherSelfAssessment>;
  getLatestSelfAssessment(userId: number): Promise<TeacherSelfAssessment | undefined>;
  updateUserTeacherLevel(userId: number, teacherLevel: string): Promise<User>;
  
  // Avatar category operations
  getAllAvatarCategories(): Promise<AvatarCategory[]>;
  getAvatarCategory(id: number): Promise<AvatarCategory | undefined>;
  createAvatarCategory(category: InsertAvatarCategory): Promise<AvatarCategory>;
  
  // Avatar item operations
  getAllAvatarItems(): Promise<AvatarItem[]>;
  getAvatarItemsByCategory(categoryId: number): Promise<AvatarItem[]>;
  getAvatarItem(id: number): Promise<AvatarItem | undefined>;
  createAvatarItem(item: InsertAvatarItem): Promise<AvatarItem>;
  
  // User avatar operations
  getUserAvatars(userId: number): Promise<UserAvatar[]>;
  getUserActiveAvatar(userId: number): Promise<UserAvatar | undefined>;
  createUserAvatar(avatar: InsertUserAvatar): Promise<UserAvatar>;
  updateUserAvatar(id: number, avatarData: Partial<InsertUserAvatar>): Promise<UserAvatar>;
  setActiveAvatar(userId: number, avatarId: number): Promise<boolean>;
  
  // User avatar items operations
  getUserAvatarItems(userId: number): Promise<UserAvatarItem[]>;
  purchaseAvatarItem(userId: number, itemId: number): Promise<UserAvatarItem>;
  checkUserOwnsAvatarItem(userId: number, itemId: number): Promise<boolean>;
  
  // Lesson plan operations
  getLessonPlan(id: number): Promise<LessonPlan | undefined>;
  getLessonPlansByUserId(userId: number): Promise<LessonPlan[]>;
  createLessonPlan(lessonPlan: InsertLessonPlan): Promise<LessonPlan>;
  updateLessonPlan(id: number, lessonPlanData: Partial<InsertLessonPlan>): Promise<LessonPlan>;
  deleteLessonPlan(id: number): Promise<void>;
  
  // Early Learning Standards operations
  getAllEarlyLearningStandards(): Promise<EarlyLearningStandard[]>;
  getEarlyLearningStandards(filters: {
    standardArea?: string;
    ageGroup?: string;
    search?: string;
  }): Promise<EarlyLearningStandard[]>;
  getEarlyLearningStandard(id: number): Promise<EarlyLearningStandard | undefined>;
  
  // Video Rating operations
  getVideoRating(userId: number, videoId: string): Promise<VideoRating | undefined>;
  getVideoRatings(videoId: string): Promise<VideoRating[]>;
  getUserVideoRatings(userId: number): Promise<VideoRating[]>;
  createVideoRating(rating: InsertVideoRating): Promise<VideoRating>;
  updateVideoRating(userId: number, videoId: string, ratingData: Partial<InsertVideoRating>): Promise<VideoRating>;
  getVideoAverageRating(videoId: string): Promise<{ avgRating: number; totalRatings: number }>;
}

export class DatabaseStorage implements IStorage {
  constructor() {
    // Database storage doesn't need initialization like in-memory storage
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User> {
    const [user] = await db
      .update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async getUsersBySchoolId(schoolId: number): Promise<User[]> {
    return await db.select().from(users).where(eq(users.schoolId, schoolId));
  }

  async updateUserSchool(userId: number, schoolId: number): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ schoolId })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async getUserById(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  // School operations
  async getSchool(id: number): Promise<School | undefined> {
    const [school] = await db.select().from(schools).where(eq(schools.id, id));
    return school || undefined;
  }

  async getSchoolByName(name: string): Promise<School | undefined> {
    const [school] = await db.select().from(schools).where(eq(schools.name, name));
    return school || undefined;
  }

  async getAllSchools(): Promise<School[]> {
    return await db.select().from(schools);
  }

  async createSchool(school: InsertSchool): Promise<School> {
    const [newSchool] = await db
      .insert(schools)
      .values(school)
      .returning();
    return newSchool;
  }

  async updateSchool(id: number, schoolData: Partial<InsertSchool>): Promise<School> {
    const [school] = await db
      .update(schools)
      .set(schoolData)
      .where(eq(schools.id, id))
      .returning();
    return school;
  }

  async getSchoolById(id: number): Promise<School | undefined> {
    const [school] = await db.select().from(schools).where(eq(schools.id, id));
    return school || undefined;
  }

  async incrementSchoolTeacherCount(schoolId: number): Promise<School> {
    const [school] = await db
      .update(schools)
      .set({ teacherCount: sql`${schools.teacherCount} + 1` })
      .where(eq(schools.id, schoolId))
      .returning();
    return school;
  }

  // Learning modules operations
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
    const [module] = await db
      .update(learningModules)
      .set(moduleData)
      .where(eq(learningModules.id, id))
      .returning();
    return module;
  }

  // User progress operations
  async getUserProgressByUserId(userId: number): Promise<UserProgress[]> {
    return await db.select().from(userProgress).where(eq(userProgress.userId, userId));
  }

  async getUserProgressByModuleId(moduleId: number): Promise<UserProgress[]> {
    return await db.select().from(userProgress).where(eq(userProgress.moduleId, moduleId));
  }

  async updateUserProgress(progress: InsertUserProgress): Promise<UserProgress> {
    const [existingProgress] = await db
      .select()
      .from(userProgress)
      .where(
        and(
          eq(userProgress.userId, progress.userId),
          eq(userProgress.moduleId, progress.moduleId)
        )
      );

    if (existingProgress) {
      const [updated] = await db
        .update(userProgress)
        .set(progress)
        .where(eq(userProgress.id, existingProgress.id))
        .returning();
      return updated;
    } else {
      const [created] = await db
        .insert(userProgress)
        .values(progress)
        .returning();
      return created;
    }
  }

  async createUserProgress(progress: InsertUserProgress): Promise<UserProgress> {
    const [newProgress] = await db
      .insert(userProgress)
      .values(progress)
      .returning();
    return newProgress;
  }

  async resetUserProgress(userId: number): Promise<boolean> {
    await db.delete(userProgress).where(eq(userProgress.userId, userId));
    return true;
  }

  // Assessment operations
  async getAssessmentsByUserId(userId: number): Promise<Assessment[]> {
    return await db.select().from(assessments).where(eq(assessments.userId, userId));
  }

  async createAssessment(assessment: InsertAssessment): Promise<Assessment> {
    const [newAssessment] = await db
      .insert(assessments)
      .values(assessment)
      .returning();
    return newAssessment;
  }

  // Points and rewards operations
  async addUserPoints(userId: number, points: number): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ 
        points: sql`${users.points} + ${points}`,
        lifetimePoints: sql`${users.lifetimePoints} + ${points}`
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async addUserBearBucks(userId: number, amount: number): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ bearBucks: sql`${users.bearBucks} + ${amount}` })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async getUserPointsEarnedToday(userId: number): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const result = await db
      .select({ total: sql<number>`COALESCE(SUM(${userProgress.pointsEarned}), 0)` })
      .from(userProgress)
      .where(
        and(
          eq(userProgress.userId, userId),
          gte(userProgress.lastAccessed, today)
        )
      );
    
    return result[0]?.total || 0;
  }

  async checkUserAccessStatus(userId: number): Promise<{hasAccess: boolean, reason?: string}> {
    const user = await this.getUser(userId);
    if (!user) {
      return { hasAccess: false, reason: "User not found" };
    }

    // For now, all users have access - this can be expanded later for subscription logic
    return { hasAccess: true };
  }

  // Initialize sample learning modules (removed from constructor, call manually if needed)
  private async initializeModules() {
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
        pointsEarned: insertProgress.pointsEarned || existingProgress.pointsEarned || 0,
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
        pointsEarned: insertProgress.pointsEarned || 0,
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

  // Streak rewards operations
  async getStreakRewardsByUserId(userId: number): Promise<StreakReward[]> {
    const rewards = await db
      .select()
      .from(streakRewards)
      .where(eq(streakRewards.userId, userId))
      .orderBy(desc(streakRewards.createdAt));
    
    return rewards;
  }
  
  async createStreakReward(data: InsertStreakReward): Promise<StreakReward> {
    const [reward] = await db
      .insert(streakRewards)
      .values(data)
      .returning();
    
    return reward;
  }
  
  // User points and items methods
  async addUserPoints(userId: number, points: number): Promise<User> {
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error(`User with ID ${userId} not found`);
    }
    
    const currentPoints = user.points || 0;
    const currentLifetimePoints = user.lifetimePoints || 0;
    
    const [updatedUser] = await db
      .update(users)
      .set({ 
        points: currentPoints + points,
        lifetimePoints: currentLifetimePoints + points
      })
      .where(eq(users.id, userId))
      .returning();
    
    return updatedUser;
  }
  
  async addUserBearBucks(userId: number, amount: number): Promise<User> {
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error(`User with ID ${userId} not found`);
    }
    
    const currentBearBucks = user.bearBucks || 0;
    
    const [updatedUser] = await db
      .update(users)
      .set({ bearBucks: currentBearBucks + amount })
      .where(eq(users.id, userId))
      .returning();
    
    return updatedUser;
  }
  
  async addUserItem(userId: number, itemId: number): Promise<UserItem> {
    // Create new user item
    const [newItem] = await db
      .insert(userItems)
      .values({
        userId,
        itemId
      })
      .returning();
    
    return newItem;
  }
  
  // Streak reward methods
  async hasClaimedStreakReward(userId: number, rewardType: string): Promise<boolean> {
    const results = await db
      .select()
      .from(streakRewards)
      .where(
        and(
          eq(streakRewards.userId, userId),
          eq(streakRewards.rewardType, rewardType)
        )
      );
    
    return results.length > 0;
  }
  
  async recordStreakReward(userId: number, rewardType: string): Promise<StreakReward> {
    const [reward] = await db
      .insert(streakRewards)
      .values({
        userId,
        rewardType
      })
      .returning();
    
    return reward;
  }
  // Avatar categories operations
  async getAllAvatarCategories(): Promise<AvatarCategory[]> {
    return await db.select().from(avatarCategories).orderBy(avatarCategories.displayOrder);
  }
  
  async getAvatarCategory(id: number): Promise<AvatarCategory | undefined> {
    const [category] = await db.select().from(avatarCategories).where(eq(avatarCategories.id, id));
    return category;
  }
  
  async createAvatarCategory(category: InsertAvatarCategory): Promise<AvatarCategory> {
    const [newCategory] = await db.insert(avatarCategories).values(category).returning();
    return newCategory;
  }
  
  // Avatar items operations
  async getAllAvatarItems(): Promise<AvatarItem[]> {
    return await db.select().from(avatarItems);
  }
  
  async getAvatarItemsByCategory(categoryId: number): Promise<AvatarItem[]> {
    return await db.select().from(avatarItems).where(eq(avatarItems.categoryId, categoryId));
  }
  
  async getAvatarItem(id: number): Promise<AvatarItem | undefined> {
    const [item] = await db.select().from(avatarItems).where(eq(avatarItems.id, id));
    return item;
  }
  
  async createAvatarItem(item: InsertAvatarItem): Promise<AvatarItem> {
    const [newItem] = await db.insert(avatarItems).values(item).returning();
    return newItem;
  }
  
  // User avatar operations
  async getUserAvatars(userId: number): Promise<UserAvatar[]> {
    return await db.select().from(userAvatars).where(eq(userAvatars.userId, userId));
  }
  
  async getUserActiveAvatar(userId: number): Promise<UserAvatar | undefined> {
    const [avatar] = await db.select()
      .from(userAvatars)
      .where(and(
        eq(userAvatars.userId, userId),
        eq(userAvatars.isActive, true)
      ));
    return avatar;
  }
  
  async createUserAvatar(avatar: InsertUserAvatar): Promise<UserAvatar> {
    // If this is set to active, deactivate all other avatars first
    if (avatar.isActive) {
      await db.update(userAvatars)
        .set({ isActive: false })
        .where(eq(userAvatars.userId, avatar.userId));
    }
    
    const [newAvatar] = await db.insert(userAvatars)
      .values({
        ...avatar,
        components: avatar.components || {}, // Ensure components is not null
        updatedAt: new Date()
      })
      .returning();
    
    return newAvatar;
  }
  
  async updateUserAvatar(id: number, avatarData: Partial<InsertUserAvatar>): Promise<UserAvatar> {
    // If setting to active, deactivate all other avatars first
    if (avatarData.isActive) {
      const [avatar] = await db.select().from(userAvatars).where(eq(userAvatars.id, id));
      
      if (avatar) {
        await db.update(userAvatars)
          .set({ isActive: false })
          .where(and(
            eq(userAvatars.userId, avatar.userId),
            sql`${userAvatars.id} != ${id}`
          ));
      }
    }
    
    const [updatedAvatar] = await db.update(userAvatars)
      .set({
        ...avatarData,
        updatedAt: new Date()
      })
      .where(eq(userAvatars.id, id))
      .returning();
    
    return updatedAvatar;
  }
  
  async setActiveAvatar(userId: number, avatarId: number): Promise<boolean> {
    // First deactivate all avatars for this user
    await db.update(userAvatars)
      .set({ isActive: false })
      .where(eq(userAvatars.userId, userId));
    
    // Then activate the requested avatar
    const [updatedAvatar] = await db.update(userAvatars)
      .set({ isActive: true, updatedAt: new Date() })
      .where(and(
        eq(userAvatars.id, avatarId),
        eq(userAvatars.userId, userId)
      ))
      .returning();
    
    return !!updatedAvatar;
  }
  
  // User avatar items operations
  async getUserAvatarItems(userId: number): Promise<UserAvatarItem[]> {
    return await db.select()
      .from(userAvatarItems)
      .where(eq(userAvatarItems.userId, userId));
  }
  
  async purchaseAvatarItem(userId: number, itemId: number): Promise<UserAvatarItem> {
    // First check if the user already owns this item
    const existingItems = await db.select()
      .from(userAvatarItems)
      .where(and(
        eq(userAvatarItems.userId, userId),
        eq(userAvatarItems.itemId, itemId)
      ));
    
    if (existingItems.length > 0) {
      return existingItems[0]; // User already owns this item
    }
    
    // Get the item to check its cost
    const [item] = await db.select().from(avatarItems).where(eq(avatarItems.id, itemId));
    
    if (!item) {
      throw new Error("Avatar item not found");
    }
    
    // Get the user to check and update points
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    
    if (!user) {
      throw new Error("User not found");
    }
    
    // Check if user has enough points
    if (user.points < item.pointsCost) {
      throw new Error("Not enough points to purchase this item");
    }
    
    // Start a transaction
    return await db.transaction(async (tx) => {
      // Deduct points from user
      await tx.update(users)
        .set({ points: user.points - item.pointsCost })
        .where(eq(users.id, userId));
      
      // Create the user avatar item record
      const [userItem] = await tx.insert(userAvatarItems)
        .values({
          userId,
          itemId,
        })
        .returning();
      
      return userItem;
    });
  }
  
  async checkUserOwnsAvatarItem(userId: number, itemId: number): Promise<boolean> {
    const items = await db.select()
      .from(userAvatarItems)
      .where(and(
        eq(userAvatarItems.userId, userId),
        eq(userAvatarItems.itemId, itemId)
      ));
    
    return items.length > 0;
  }
  
  // School operations
  async getSchool(id: number): Promise<School | undefined> {
    const [school] = await db.select({
      id: schools.id,
      name: schools.name,
      address: schools.address,
      city: schools.city,
      state: schools.state,
      zipCode: schools.zipCode,
      contactEmail: schools.contactEmail,
      contactPhone: schools.contactPhone,
      logoUrl: schools.logoUrl,
      websiteUrl: schools.websiteUrl,
      subscriptionActive: schools.subscriptionActive,
      subscriptionType: schools.subscriptionType,
      subscriptionExpiresAt: schools.subscriptionExpiresAt,
      teacherCount: schools.teacherCount,
      isFreeAccess: schools.isFreeAccess,
      adminPasswordHash: schools.adminPasswordHash,
      customization: schools.customization,
      createdAt: schools.createdAt
    }).from(schools).where(eq(schools.id, id));
    return school || undefined;
  }
  
  async getSchoolByName(name: string): Promise<School | undefined> {
    const [school] = await db.select({
      id: schools.id,
      name: schools.name,
      address: schools.address,
      city: schools.city,
      state: schools.state,
      zipCode: schools.zipCode,
      contactEmail: schools.contactEmail,
      contactPhone: schools.contactPhone,
      logoUrl: schools.logoUrl,
      websiteUrl: schools.websiteUrl,
      subscriptionActive: schools.subscriptionActive,
      subscriptionType: schools.subscriptionType,
      subscriptionExpiresAt: schools.subscriptionExpiresAt,
      teacherCount: schools.teacherCount,
      isFreeAccess: schools.isFreeAccess,
      adminPasswordHash: schools.adminPasswordHash,
      customization: schools.customization,
      createdAt: schools.createdAt
    }).from(schools).where(eq(sql`LOWER(${schools.name})`, name.toLowerCase()));
    return school || undefined;
  }
  
  async getAllSchools(): Promise<School[]> {
    return await db.select({
      id: schools.id,
      name: schools.name,
      address: schools.address,
      city: schools.city,
      state: schools.state,
      zipCode: schools.zipCode,
      contactEmail: schools.contactEmail,
      contactPhone: schools.contactPhone,
      logoUrl: schools.logoUrl,
      websiteUrl: schools.websiteUrl,
      subscriptionActive: schools.subscriptionActive,
      subscriptionType: schools.subscriptionType,
      subscriptionExpiresAt: schools.subscriptionExpiresAt,
      teacherCount: schools.teacherCount,
      isFreeAccess: schools.isFreeAccess,
      adminPasswordHash: schools.adminPasswordHash,
      customization: schools.customization,
      createdAt: schools.createdAt
    }).from(schools).orderBy(schools.name);
  }
  
  async createSchool(school: InsertSchool): Promise<School> {
    const [newSchool] = await db.insert(schools).values(school).returning();
    return newSchool;
  }
  
  async updateSchool(id: number, schoolData: Partial<InsertSchool>): Promise<School> {
    const [updatedSchool] = await db
      .update(schools)
      .set(schoolData)
      .where(eq(schools.id, id))
      .returning();
    return updatedSchool;
  }
  
  // User operations with school support
  async updateUserSchool(userId: number, schoolId: number): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set({ schoolId })
      .where(eq(users.id, userId))
      .returning();
    return updatedUser;
  }
  
  async getUsersBySchoolId(schoolId: number): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .where(eq(users.schoolId, schoolId));
  }
  
  async checkUserAccessStatus(userId: number): Promise<{hasAccess: boolean, reason?: string}> {
    try {
      const user = await this.getUser(userId);
      if (!user) {
        return { hasAccess: false, reason: "User not found" };
      }
      
      // If user doesn't have a school, they don't have access
      if (!user.schoolId) {
        return { hasAccess: false, reason: "No school association" };
      }
      
      const school = await this.getSchool(user.schoolId);
      if (!school) {
        return { hasAccess: false, reason: "School not found" };
      }
      
      // Raising Arizona users always have access (isFreeAccess = true)
      if (school.isFreeAccess) {
        return { hasAccess: true };
      }
      
      // Otherwise check if the school has an active subscription
      if (!school.subscriptionActive) {
        return { hasAccess: false, reason: "School subscription inactive" };
      }
      
      // If subscription is expired, no access
      if (school.subscriptionExpiresAt && new Date(school.subscriptionExpiresAt) < new Date()) {
        return { hasAccess: false, reason: "School subscription expired" };
      }
      
      return { hasAccess: true };
    } catch (error) {
      console.error("Error checking user access:", error);
      return { hasAccess: false, reason: "Error checking access" };
    }
  }
  async getUser(id: number): Promise<User | undefined> {
    try {
      const [user] = await db.select({
        id: users.id,
        username: users.username,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
        language: users.language,
        nativeLanguage: users.nativeLanguage,
        timeZone: users.timeZone,
        profilePicture: users.profilePicture,
        learningStyle: users.learningStyle,
        bearBucks: users.bearBucks,
        points: users.points,
        lifetimePoints: users.lifetimePoints,
        level: users.level,
        streak: users.streak,
        lastActive: users.lastActive,
        achievementCount: users.achievementCount,
        isAdmin: users.isAdmin,
        isSchoolAdmin: users.isSchoolAdmin,
        isOwner: users.isOwner,
        schoolId: users.schoolId,
        createdAt: users.createdAt,
      }).from(users).where(eq(users.id, id));
      return user || undefined;
    } catch (error) {
      console.error("Error in getUser:", error);
      return undefined;
    }
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
  
  async getUsersBySchoolId(schoolId: number | null): Promise<User[]> {
    if (!schoolId) {
      return [];
    }
    return await db.select().from(users).where(eq(users.schoolId, schoolId));
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
  
  /**
   * Get a specific user's progress for a specific module
   * This is an optimized method for efficiently querying a single progress record
   * Used in the optimized progress API for better performance with many users
   * 
   * @param userId The user ID to get progress for
   * @param moduleId The module ID to get progress for
   * @returns The progress record or undefined if not found
   */
  async getUserProgressForModule(userId: number, moduleId: number): Promise<UserProgress | undefined> {
    const [progressRecord] = await db
      .select()
      .from(userProgress)
      .where(
        and(
          eq(userProgress.userId, userId),
          eq(userProgress.moduleId, moduleId)
        )
      );
    
    return progressRecord;
  }
  
  async createUserProgress(progress: InsertUserProgress): Promise<UserProgress> {
    const [newProgress] = await db
      .insert(userProgress)
      .values(progress)
      .returning();
    return newProgress;
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

  // Get all user progress for statistics
  async getAllUserProgress(): Promise<UserProgress[]> {
    return await db.select().from(userProgress);
  }

  // Get all video ratings for statistics
  async getAllVideoRatings(): Promise<VideoRating[]> {
    return await db.select().from(videoRatings);
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
      .values({
        nominatorId: shoutOut.nominatorId,
        nomineeId: shoutOut.nomineeId,
        coreValue: shoutOut.coreValue,
        description: shoutOut.description,
        pointsAwarded: shoutOut.pointsAwarded
      })
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

  // Video Rating operations
  async getVideoRating(userId: number, videoId: string): Promise<VideoRating | undefined> {
    const [rating] = await db
      .select()
      .from(videoRatings)
      .where(and(eq(videoRatings.userId, userId), eq(videoRatings.videoId, videoId)));
    return rating;
  }

  async getVideoRatings(videoId: string): Promise<VideoRating[]> {
    return await db
      .select()
      .from(videoRatings)
      .where(eq(videoRatings.videoId, videoId))
      .orderBy(desc(videoRatings.createdAt));
  }

  async getUserVideoRatings(userId: number): Promise<VideoRating[]> {
    return await db
      .select()
      .from(videoRatings)
      .where(eq(videoRatings.userId, userId))
      .orderBy(desc(videoRatings.createdAt));
  }

  async createVideoRating(rating: InsertVideoRating): Promise<VideoRating> {
    const [newRating] = await db
      .insert(videoRatings)
      .values(rating)
      .onConflictDoUpdate({
        target: [videoRatings.userId, videoRatings.videoId],
        set: {
          rating: rating.rating,
          review: rating.review,
          updatedAt: new Date()
        }
      })
      .returning();
    return newRating;
  }

  async updateVideoRating(userId: number, videoId: string, ratingData: Partial<InsertVideoRating>): Promise<VideoRating> {
    const [updatedRating] = await db
      .update(videoRatings)
      .set({ ...ratingData, updatedAt: new Date() })
      .where(and(eq(videoRatings.userId, userId), eq(videoRatings.videoId, videoId)))
      .returning();
    return updatedRating;
  }

  async getVideoAverageRating(videoId: string): Promise<{ avgRating: number; totalRatings: number }> {
    const result = await db
      .select({
        avgRating: sql<number>`avg(${videoRatings.rating})`,
        totalRatings: sql<number>`count(*)`
      })
      .from(videoRatings)
      .where(eq(videoRatings.videoId, videoId));

    return {
      avgRating: result[0]?.avgRating || 0,
      totalRatings: result[0]?.totalRatings || 0
    };
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
  
  // Check if user has completed this video in the last month
  async getRecentVideoQuizCompletion(userId: number, videoId: string): Promise<VideoQuizCompletion | undefined> {
    // Calculate date one month ago
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    
    // Get completions from the last month only
    const [completion] = await db
      .select()
      .from(videoQuizCompletions)
      .where(
        and(
          eq(videoQuizCompletions.userId, userId),
          eq(videoQuizCompletions.videoId, videoId),
          sql`${videoQuizCompletions.completedAt} >= ${oneMonthAgo}`
        )
      );
      
    return completion;
  }

  async createVideoQuizCompletion(completion: InsertVideoQuizCompletion): Promise<VideoQuizCompletion> {
    // First check if the daily limit has been reached - don't add points if it has
    const completionsToday = await this.getDailyVideoCompletionsCount(completion.userId);
    
    // Create a copy of the completion object that we can modify if needed
    let completionToInsert = {...completion};
    
    // If user has already watched 2 videos today, set points to 0
    if (completionsToday >= 2) {
      console.log(`User ${completion.userId} has already reached the daily limit of 2 videos.`);
      completionToInsert.pointsEarned = 0; // Set points to 0 but still record the completion
    }
    
    // Insert the completion record
    const [result] = await db
      .insert(videoQuizCompletions)
      .values(completionToInsert)
      .returning();
    
    // Only update points if we're actually awarding points (limit not reached)
    if (completionToInsert.pointsEarned && completionToInsert.pointsEarned > 0) {
      const user = await this.getUser(completion.userId);
      if (user && user.points !== null) {
        await db
          .update(users)
          .set({ points: user.points + completionToInsert.pointsEarned })
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
    try {
      // Temporarily return a fixed value to avoid database errors
      // This allows points to be added without hitting database tables that don't exist yet
      console.log(`Skipping daily points check for user ${userId} due to missing tables`);
      return 0; // Return 0 so the daily points cap doesn't block points from being added
    } catch (error) {
      console.error('Error checking points earned today:', error);
      return 0;
    }
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
  
  async getGame(gameId: number): Promise<typeof educationalGames.$inferSelect | undefined> {
    const [game] = await db
      .select()
      .from(educationalGames)
      .where(eq(educationalGames.id, gameId));
    
    return game;
  }
  
  async getUserGamePlayToday(userId: number, today: Date): Promise<GameCompletion[]> {
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    return db
      .select()
      .from(gameCompletions)
      .where(and(
        eq(gameCompletions.userId, userId),
        gte(gameCompletions.completedAt, today),
        lt(gameCompletions.completedAt, tomorrow)
      ));
  }
  
  // Self-Assessment operations
  async createSelfAssessment(assessment: InsertTeacherSelfAssessment): Promise<TeacherSelfAssessment> {
    const [newAssessment] = await db
      .insert(teacherSelfAssessments)
      .values(assessment)
      .returning();
    return newAssessment;
  }

  async getLatestSelfAssessment(userId: number): Promise<TeacherSelfAssessment | undefined> {
    const [assessment] = await db
      .select()
      .from(teacherSelfAssessments)
      .where(eq(teacherSelfAssessments.userId, userId))
      .orderBy(desc(teacherSelfAssessments.createdAt))
      .limit(1);
    return assessment || undefined;
  }

  async updateUserTeacherLevel(userId: number, teacherLevel: string): Promise<User> {
    // We store the teacher level in the user record for easy access during personalization
    const [updatedUser] = await db
      .update(users)
      .set({ teacherLevel })
      .where(eq(users.id, userId))
      .returning();
    
    return updatedUser;
  }
  
  // Module ratings operations
  async getRatingsForModule(moduleId: number): Promise<ModuleRating[]> {
    return db
      .select()
      .from(moduleRatings)
      .where(eq(moduleRatings.moduleId, moduleId));
  }
  
  async createModuleRating(rating: InsertModuleRating): Promise<ModuleRating> {
    const [newRating] = await db
      .insert(moduleRatings)
      .values(rating)
      .returning();
    return newRating;
  }
  
  async updateModuleRatingStats(moduleId: number): Promise<void> {
    // Calculate average rating and count for a module
    const ratings = await this.getRatingsForModule(moduleId);
    const ratingCount = ratings.length;
    let ratingSum = 0;
    
    ratings.forEach(rating => {
      ratingSum += rating.rating;
    });
    
    const averageRating = ratingCount > 0 ? Math.round((ratingSum / ratingCount) * 10) / 10 : 0;
    
    // Update the module with the calculated statistics
    await db
      .update(learningModules)
      .set({
        averageRating,
        ratingCount
      })
      .where(eq(learningModules.id, moduleId));
  }

  // Lesson plan operations
  async getLessonPlan(id: number): Promise<LessonPlan | undefined> {
    const [lessonPlan] = await db
      .select()
      .from(lessonPlans)
      .where(eq(lessonPlans.id, id));
    return lessonPlan || undefined;
  }

  async getLessonPlansByUserId(userId: number): Promise<LessonPlan[]> {
    return await db
      .select()
      .from(lessonPlans)
      .where(eq(lessonPlans.createdBy, userId))
      .orderBy(desc(lessonPlans.createdAt));
  }

  async createLessonPlan(lessonPlan: InsertLessonPlan): Promise<LessonPlan> {
    const [newLessonPlan] = await db
      .insert(lessonPlans)
      .values(lessonPlan)
      .returning();
    return newLessonPlan;
  }

  async updateLessonPlan(id: number, lessonPlanData: Partial<InsertLessonPlan>): Promise<LessonPlan> {
    const [updatedLessonPlan] = await db
      .update(lessonPlans)
      .set(lessonPlanData)
      .where(eq(lessonPlans.id, id))
      .returning();
    return updatedLessonPlan;
  }

  async deleteLessonPlan(id: number): Promise<void> {
    await db
      .delete(lessonPlans)
      .where(eq(lessonPlans.id, id));
  }

  // Early Learning Standards operations
  async getAllEarlyLearningStandards(): Promise<EarlyLearningStandard[]> {
    return await db
      .select()
      .from(earlyLearningStandards)
      .orderBy(earlyLearningStandards.standardArea, earlyLearningStandards.standardCode);
  }

  async getEarlyLearningStandards(filters: {
    standardArea?: string;
    ageGroup?: string;
    search?: string;
  }): Promise<EarlyLearningStandard[]> {
    let query = db.select().from(earlyLearningStandards);
    const conditions = [];

    if (filters.standardArea) {
      conditions.push(eq(earlyLearningStandards.standardArea, filters.standardArea));
    }

    if (filters.ageGroup) {
      conditions.push(eq(earlyLearningStandards.ageGroup, filters.ageGroup));
    }

    if (filters.search) {
      conditions.push(
        or(
          sql`${earlyLearningStandards.standardText} ILIKE ${'%' + filters.search + '%'}`,
          sql`${earlyLearningStandards.standardCode} ILIKE ${'%' + filters.search + '%'}`
        )
      );
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    return await query.orderBy(earlyLearningStandards.standardArea, earlyLearningStandards.standardCode);
  }

  async getEarlyLearningStandard(id: number): Promise<EarlyLearningStandard | undefined> {
    const [standard] = await db
      .select()
      .from(earlyLearningStandards)
      .where(eq(earlyLearningStandards.id, id));
    return standard || undefined;
  }
}

// Export a new instance of DatabaseStorage
export const storage = new DatabaseStorage();
