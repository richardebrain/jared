/**
 * Community Module Management
 * 
 * This file handles functionality related to community module sharing,
 * ratings, and monthly competitions.
 */

import { db } from "./db";
import { 
  communityModules, 
  schools, 
  learningModules,
  moduleRatings,
  communityModuleAwards
} from "@shared/schema";
import { eq, and, desc, sql } from "drizzle-orm";

/**
 * Community Module Manager
 * 
 * Functions for managing community-shared modules, competition entries,
 * and monthly prize awards.
 */
export class CommunityModuleManager {
  
  /**
   * Share a module to the community
   * 
   * This makes a module available to all schools on the platform
   */
  static async shareModuleToCommunity(moduleId: number, schoolId: number) {
    // First check if the module exists and belongs to the school
    const module = await db.query.learningModules.findFirst({
      where: (modules, { eq, and }) => 
        and(eq(modules.id, moduleId), eq(modules.schoolId, schoolId))
    });
    
    if (!module) {
      throw new Error("Module not found or does not belong to your school");
    }
    
    // Check if already shared
    const existingShare = await db.query.communityModules.findFirst({
      where: (shares, { eq }) => eq(shares.moduleId, moduleId)
    });
    
    if (existingShare) {
      // Already shared, just update the status to active if needed
      if (existingShare.status !== "active") {
        await db.update(communityModules)
          .set({ status: "active" })
          .where(eq(communityModules.id, existingShare.id));
      }
      return existingShare;
    }
    
    // Share the module to the community
    const [newShare] = await db.insert(communityModules)
      .values({
        moduleId,
        sharedBySchoolId: schoolId,
        status: "active",
        totalCompletions: 0
      })
      .returning();
    
    // Update the module to mark it as shared
    await db.update(learningModules)
      .set({ isSharedToCommunity: true })
      .where(eq(learningModules.id, moduleId));
    
    return newShare;
  }
  
  /**
   * Unshare a module from the community
   */
  static async unshareModuleFromCommunity(moduleId: number, schoolId: number) {
    // Check if the module belongs to the school
    const module = await db.query.learningModules.findFirst({
      where: (modules, { eq, and }) => 
        and(eq(modules.id, moduleId), eq(modules.schoolId, schoolId))
    });
    
    if (!module) {
      throw new Error("Module not found or does not belong to your school");
    }
    
    // Find the share record
    const share = await db.query.communityModules.findFirst({
      where: (shares, { eq }) => eq(shares.moduleId, moduleId)
    });
    
    if (!share) {
      throw new Error("Module is not shared to the community");
    }
    
    // Mark as inactive rather than deleting
    await db.update(communityModules)
      .set({ status: "archived" })
      .where(eq(communityModules.id, share.id));
    
    // Update the module to mark it as no longer shared
    await db.update(learningModules)
      .set({ isSharedToCommunity: false })
      .where(eq(learningModules.id, moduleId));
    
    return { success: true };
  }
  
  /**
   * Get top rated community modules
   * 
   * Returns the highest rated modules from the community
   */
  static async getTopRatedCommunityModules(limit: number = 10) {
    // Get the highest rated active modules
    const modules = await db.execute(sql`
      SELECT 
        m.id, m.title, m.description, m.duration, m.point_value as "pointValue",
        m.category, m.difficulty, m.image_url as "imageUrl", 
        m.average_rating as "averageRating", m.rating_count as "ratingCount",
        s.name as "schoolName", 
        cm.shared_date as "sharedDate", cm.total_completions as "totalCompletions",
        cm.status
      FROM community_modules cm
      JOIN learning_modules m ON cm.module_id = m.id
      JOIN schools s ON cm.shared_by_school_id = s.id
      WHERE cm.status = 'active'
      ORDER BY m.average_rating DESC, m.rating_count DESC
      LIMIT ${limit}
    `);
    
    return modules.rows;
  }
  
  /**
   * Get community modules with monthly competition flag
   * 
   * This is used to highlight modules that are part of the monthly competition
   */
  static async getCommunityModulesForCompetition(limit: number = 20) {
    const currentMonth = new Date().getMonth() + 1; // 1-12
    const currentYear = new Date().getFullYear();
    
    // Start of current month
    const startDate = new Date(currentYear, currentMonth - 1, 1);
    
    // Get modules shared this month that are eligible for the competition
    const modules = await db.execute(sql`
      SELECT 
        m.id, m.title, m.description, m.duration, m.point_value as "pointValue",
        m.category, m.difficulty, m.image_url as "imageUrl", 
        m.average_rating as "averageRating", m.rating_count as "ratingCount",
        s.name as "schoolName", 
        cm.shared_date as "sharedDate", cm.total_completions as "totalCompletions",
        cm.status,
        CASE WHEN cm.shared_date >= ${startDate} THEN true ELSE false END as "inCurrentCompetition"
      FROM community_modules cm
      JOIN learning_modules m ON cm.module_id = m.id
      JOIN schools s ON cm.shared_by_school_id = s.id
      WHERE cm.status = 'active'
      ORDER BY 
        CASE WHEN cm.shared_date >= ${startDate} THEN 0 ELSE 1 END,
        m.average_rating DESC, 
        m.rating_count DESC
      LIMIT ${limit}
    `);
    
    return modules.rows;
  }
  
  /**
   * Update module completion count
   * 
   * Called when a user completes a community module
   */
  static async incrementModuleCompletions(moduleId: number) {
    const share = await db.query.communityModules.findFirst({
      where: (shares, { eq }) => eq(shares.moduleId, moduleId)
    });
    
    if (share) {
      await db.update(communityModules)
        .set({ 
          totalCompletions: (share.totalCompletions || 0) + 1 
        })
        .where(eq(communityModules.id, share.id));
    }
  }
  
  /**
   * Award monthly prizes to top community modules
   * 
   * This function should be run on a schedule (e.g., first day of each month)
   * to determine winners of the previous month's competition
   */
  static async awardMonthlyPrizes() {
    const now = new Date();
    // Get previous month (0-11)
    const previousMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
    const year = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
    
    // Format month name for display
    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    const monthName = monthNames[previousMonth];
    
    // Start and end of previous month
    const startDate = new Date(year, previousMonth, 1);
    const endDate = new Date(year, now.getMonth(), 0); // Last day of previous month
    
    try {
      // Find top 3 modules shared in the previous month, based on ratings
      const topModules = await db.execute(sql`
        SELECT 
          m.id, m.title, 
          s.id as "schoolId", s.name as "schoolName",
          cm.id as "communityModuleId",
          m.average_rating as "averageRating", 
          m.rating_count as "ratingCount"
        FROM community_modules cm
        JOIN learning_modules m ON cm.module_id = m.id
        JOIN schools s ON cm.shared_by_school_id = s.id
        WHERE 
          cm.shared_date >= ${startDate} AND
          cm.shared_date <= ${endDate} AND
          cm.status = 'active' AND
          m.rating_count >= 3 -- Require at least 3 ratings to qualify
        ORDER BY 
          m.average_rating DESC, 
          m.rating_count DESC
        LIMIT 3
      `);
      
      if (topModules.rows.length === 0) {
        console.log(`No qualifying modules for ${monthName} ${year} competition`);
        return [];
      }
      
      // Award prizes to the winners
      const awards = [];
      
      for (let i = 0; i < topModules.rows.length; i++) {
        const module = topModules.rows[i];
        const rank = i + 1;
        let prizeAmount = 0;
        
        // Determine prize amount based on rank
        switch (rank) {
          case 1: prizeAmount = 500; break; // 1st place: 500 points
          case 2: prizeAmount = 300; break; // 2nd place: 300 points  
          case 3: prizeAmount = 200; break; // 3rd place: 200 points
          default: prizeAmount = 100; // Honorable mentions: 100 points
        }
        
        // Create the award record
        const [award] = await db.insert(communityModuleAwards)
          .values({
            moduleId: module.id,
            schoolId: module.schoolId,
            awardDate: new Date(),
            prizePoints: prizeAmount,
            rank,
            monthYear: `${monthName} ${year}`,
            averageRating: module.averageRating,
            totalRatings: module.ratingCount
          })
          .returning();
          
        awards.push({
          ...award,
          moduleTitle: module.title,
          schoolName: module.schoolName
        });
        
        // Update the module's status to "featured" for 1st place winner
        if (rank === 1) {
          await db.update(communityModules)
            .set({ status: "featured" })
            .where(eq(communityModules.id, module.communityModuleId));
        }
      }
      
      return awards;
    } catch (error) {
      console.error("Error awarding monthly prizes:", error);
      throw error;
    }
  }
  
  /**
   * Get past competition winners
   */
  static async getPastCompetitionWinners(limit: number = 10) {
    const winners = await db.query.communityModuleAwards.findMany({
      with: {
        module: true,
        school: true
      },
      orderBy: (awards, { desc }) => [desc(awards.awardDate)],
      limit
    });
    
    return winners;
  }
  
  /**
   * Get current month's leaderboard
   * 
   * Shows the current standings in this month's competition
   */
  static async getCurrentMonthLeaderboard(limit: number = 10) {
    const now = new Date();
    const currentMonth = now.getMonth(); // 0-11
    const currentYear = now.getFullYear();
    
    // Start of current month
    const startDate = new Date(currentYear, currentMonth, 1);
    
    // Get current leaderboard
    const leaderboard = await db.execute(sql`
      SELECT 
        m.id, m.title, 
        s.id as "schoolId", s.name as "schoolName",
        m.average_rating as "averageRating", 
        m.rating_count as "ratingCount",
        cm.total_completions as "totalCompletions",
        cm.shared_date as "sharedDate"
      FROM community_modules cm
      JOIN learning_modules m ON cm.module_id = m.id
      JOIN schools s ON cm.shared_by_school_id = s.id
      WHERE 
        cm.shared_date >= ${startDate} AND
        cm.status = 'active'
      ORDER BY 
        m.average_rating DESC, 
        m.rating_count DESC
      LIMIT ${limit}
    `);
    
    // Format the month name for display
    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    
    return {
      month: monthNames[currentMonth],
      year: currentYear,
      leaderboard: leaderboard.rows
    };
  }
}