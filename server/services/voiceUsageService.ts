import { db } from "../db";
import { voiceNarrationUsage } from "@shared/schema";
import { eq, and, sql } from "drizzle-orm";

export class VoiceUsageService {
  /**
   * Check if user has exceeded weekly voice narration limit (1 per week)
   */
  static async canUseVoiceNarration(userId: number): Promise<{ canUse: boolean; usageCount: number; resetDate: Date }> {
    const now = new Date();
    const weekStart = this.getWeekStart(now);
    const nextWeekStart = new Date(weekStart);
    nextWeekStart.setDate(nextWeekStart.getDate() + 7);

    try {
      // Get total usage count for current week
      const result = await db
        .select({
          totalUsage: sql<number>`COALESCE(SUM(${voiceNarrationUsage.usageCount}), 0)`.as('totalUsage')
        })
        .from(voiceNarrationUsage)
        .where(
          and(
            eq(voiceNarrationUsage.userId, userId),
            eq(voiceNarrationUsage.weekStart, weekStart.toISOString().split('T')[0])
          )
        );

      const usageCount = result[0]?.totalUsage || 0;
      const canUse = usageCount < 1; // Limit: 1 per week

      return {
        canUse,
        usageCount,
        resetDate: nextWeekStart
      };
    } catch (error) {
      console.error('Error checking voice usage:', error);
      // On error, be conservative and allow usage
      return {
        canUse: true,
        usageCount: 0,
        resetDate: nextWeekStart
      };
    }
  }

  /**
   * Record voice narration usage
   */
  static async recordUsage(userId: number): Promise<void> {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const weekStart = this.getWeekStart(now).toISOString().split('T')[0];

    try {
      // Check if usage already recorded for today
      const existingUsage = await db
        .select()
        .from(voiceNarrationUsage)
        .where(
          and(
            eq(voiceNarrationUsage.userId, userId),
            eq(voiceNarrationUsage.usageDate, today)
          )
        )
        .limit(1);

      if (existingUsage.length > 0) {
        // Update existing record
        await db
          .update(voiceNarrationUsage)
          .set({
            usageCount: sql`${voiceNarrationUsage.usageCount} + 1`
          })
          .where(eq(voiceNarrationUsage.id, existingUsage[0].id));
      } else {
        // Create new record
        await db
          .insert(voiceNarrationUsage)
          .values({
            userId,
            usageDate: today,
            weekStart,
            usageCount: 1
          });
      }
    } catch (error) {
      console.error('Error recording voice usage:', error);
      // Don't throw error - usage recording failure shouldn't block the feature
    }
  }

  /**
   * Get the start of the week (Monday) for a given date
   */
  private static getWeekStart(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday as first day
    return new Date(d.setDate(diff));
  }

  /**
   * Get usage statistics for admin/analytics
   */
  static async getUsageStats(userId?: number): Promise<{
    totalUsage: number;
    weeklyUsage: number;
    dailyUsage: number;
  }> {
    try {
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      const weekStart = this.getWeekStart(now).toISOString().split('T')[0];

      let whereCondition = userId ? eq(voiceNarrationUsage.userId, userId) : undefined;

      // Total usage
      const totalResult = await db
        .select({
          total: sql<number>`COALESCE(SUM(${voiceNarrationUsage.usageCount}), 0)`.as('total')
        })
        .from(voiceNarrationUsage)
        .where(whereCondition);

      // Weekly usage
      const weeklyResult = await db
        .select({
          weekly: sql<number>`COALESCE(SUM(${voiceNarrationUsage.usageCount}), 0)`.as('weekly')
        })
        .from(voiceNarrationUsage)
        .where(
          whereCondition 
            ? and(whereCondition, eq(voiceNarrationUsage.weekStart, weekStart))
            : eq(voiceNarrationUsage.weekStart, weekStart)
        );

      // Daily usage
      const dailyResult = await db
        .select({
          daily: sql<number>`COALESCE(SUM(${voiceNarrationUsage.usageCount}), 0)`.as('daily')
        })
        .from(voiceNarrationUsage)
        .where(
          whereCondition
            ? and(whereCondition, eq(voiceNarrationUsage.usageDate, today))
            : eq(voiceNarrationUsage.usageDate, today)
        );

      return {
        totalUsage: totalResult[0]?.total || 0,
        weeklyUsage: weeklyResult[0]?.weekly || 0,
        dailyUsage: dailyResult[0]?.daily || 0
      };
    } catch (error) {
      console.error('Error getting usage stats:', error);
      return {
        totalUsage: 0,
        weeklyUsage: 0,
        dailyUsage: 0
      };
    }
  }
}