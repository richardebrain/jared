import { 
  users, 
  schools, 
  learningModules,
  userProgress,
  type User,
  type InsertUser,
  type School,
  type InsertSchool,
  type LearningModule,
  type InsertLearningModule,
  type UserProgress,
  type InsertUserProgress
} from "@shared/schema";
import { db } from "./db";
import { eq, sql } from "drizzle-orm";

class DatabaseStorage {
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username));
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email));
    return result[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    const result = await db.insert(users).values(user).returning();
    return result[0];
  }

  async updateUser(id: number, userData: any): Promise<User> {
    const result = await db.update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
    return result[0];
  }

  async addUserPoints(userId: number, points: number): Promise<User> {
    const result = await db.update(users)
      .set({ 
        points: sql`${users.points} + ${points}`,
        lifetimePoints: sql`${users.lifetimePoints} + ${points}`
      })
      .where(eq(users.id, userId))
      .returning();
    return result[0];
  }

  async getAllUsers(): Promise<User[]> {
    return db.select().from(users);
  }

  // School operations
  async getSchool(id: number): Promise<School | undefined> {
    const result = await db.select().from(schools).where(eq(schools.id, id));
    return result[0];
  }

  async getSchoolByName(name: string): Promise<School | undefined> {
    const result = await db.select().from(schools).where(eq(schools.name, name));
    return result[0];
  }

  async getAllSchools(): Promise<School[]> {
    return db.select().from(schools);
  }

  async createSchool(school: InsertSchool): Promise<School> {
    const result = await db.insert(schools).values(school).returning();
    return result[0];
  }

  async updateSchool(id: number, schoolData: Partial<School>): Promise<School> {
    const result = await db.update(schools)
      .set(schoolData)
      .where(eq(schools.id, id))
      .returning();
    return result[0];
  }

  // Learning modules operations
  async getAllModules(): Promise<LearningModule[]> {
    return db.select().from(learningModules);
  }

  async getModule(id: number): Promise<LearningModule | undefined> {
    const result = await db.select().from(learningModules).where(eq(learningModules.id, id));
    return result[0];
  }

  async createModule(module: InsertLearningModule): Promise<LearningModule> {
    const result = await db.insert(learningModules).values(module).returning();
    return result[0];
  }

  async updateModule(id: number, moduleData: Partial<LearningModule>): Promise<LearningModule> {
    const result = await db.update(learningModules)
      .set(moduleData)
      .where(eq(learningModules.id, id))
      .returning();
    return result[0];
  }

  // User progress operations
  async getUserProgressByUserId(userId: number): Promise<UserProgress[]> {
    return db.select().from(userProgress).where(eq(userProgress.userId, userId));
  }

  async createUserProgress(progress: InsertUserProgress): Promise<UserProgress> {
    const result = await db.insert(userProgress).values(progress).returning();
    return result[0];
  }
}

export const storage = new DatabaseStorage();
export type IStorage = DatabaseStorage;