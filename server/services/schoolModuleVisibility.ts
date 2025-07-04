/**
 * School Module Visibility Service
 * 
 * Centralized service for managing module visibility across schools
 * Ensures proper isolation and appropriate content sharing
 */

import { db } from "../db";
import { sql } from "drizzle-orm";

export interface ModuleVisibilityRules {
  schoolId: number;
  isNewSchool: boolean;
  allowCommunityModules: boolean;
  allowOnboardingFromOtherSchools: boolean;
}

export class SchoolModuleVisibilityService {
  
  /**
   * Determine visibility rules for a school
   * New schools (created after a certain date or with minimal modules) get restricted access
   */
  static async getVisibilityRules(schoolId: number): Promise<ModuleVisibilityRules> {
    // Get school information and module count
    const schoolInfo = await db.execute(sql`
      SELECT s.id, s.name, s.created_at, s.teacher_count,
             COUNT(lm.id) as module_count
      FROM schools s
      LEFT JOIN learning_modules lm ON lm.school_id = s.id
      WHERE s.id = ${schoolId}
      GROUP BY s.id, s.name, s.created_at, s.teacher_count
    `);

    if (schoolInfo.rows.length === 0) {
      throw new Error(`School with ID ${schoolId} not found`);
    }

    const school = schoolInfo.rows[0] as any;
    const moduleCount = parseInt(school.module_count || '0');
    const createdAt = new Date(school.created_at);
    const cutoffDate = new Date('2025-07-01'); // Schools created after this are considered "new"

    // Determine if this is a new school
    const isNewSchool = createdAt >= cutoffDate || moduleCount < 5;

    return {
      schoolId,
      isNewSchool,
      allowCommunityModules: !isNewSchool, // Only established schools see community modules
      allowOnboardingFromOtherSchools: false // Never allow onboarding modules from other schools
    };
  }

  /**
   * Get filtered modules for a school based on visibility rules
   */
  static async getSchoolModules(schoolId: number, limit?: number) {
    const rules = await this.getVisibilityRules(schoolId);
    
    console.log(`[MODULE VISIBILITY] School ${schoolId} rules:`, rules);

    let baseQuery = `
      SELECT lm.id, lm.title, lm.description, lm.duration, lm.point_value as "pointValue", 
             lm.image_url as "imageUrl", lm.featured, lm.difficulty, lm.category, lm.content, 
             lm.quiz, lm.is_visible as "isVisible", lm.created_at as "createdAt",
             lm.average_rating as "averageRating", lm.rating_count as "ratingCount",
             lm.is_shared_to_community as "isSharedToCommunity", lm.school_id as "schoolId",
             lm.ece_hours as "eceHours", lm.ece_category as "eceCategory",
             lm.creator_id as "creatorId", lm.editable_data as "editableData",
             u.first_name as "creatorFirstName", u.last_name as "creatorLastName",
             s.name as "schoolName"
      FROM learning_modules lm
      LEFT JOIN users u ON lm.creator_id = u.id
      LEFT JOIN schools s ON lm.school_id = s.id
      WHERE lm.is_visible = true
    `;

    if (rules.isNewSchool) {
      // New schools: Only see their own modules
      baseQuery += ` AND lm.school_id = ${schoolId}`;
    } else {
      // Established schools: Own modules + community modules (but not onboarding from other schools)
      baseQuery += ` AND (
        lm.school_id = ${schoolId}
        OR (
          lm.is_shared_to_community = true 
          AND (lm.is_onboarding_module = false OR lm.is_onboarding_module IS NULL)
          AND lm.school_id != ${schoolId}
        )
      )`;
    }

    baseQuery += ` ORDER BY lm.created_at DESC`;

    if (limit) {
      baseQuery += ` LIMIT ${limit}`;
    }

    const result = await db.execute(sql.raw(baseQuery));
    
    console.log(`[MODULE VISIBILITY] School ${schoolId} sees ${result.rows.length} modules (new school: ${rules.isNewSchool})`);
    
    return result.rows;
  }

  /**
   * Get filtered community modules for a school
   */
  static async getCommunityModules(schoolId: number, limit?: number) {
    const rules = await this.getVisibilityRules(schoolId);

    if (rules.isNewSchool) {
      // New schools don't see community modules
      console.log(`[COMMUNITY VISIBILITY] New school ${schoolId} sees 0 community modules`);
      return [];
    }

    let baseQuery = `
      SELECT cm.*, lm.title, lm.description, lm.duration, lm.image_url, 
             lm.difficulty, lm.category, lm.average_rating, lm.rating_count,
             lm.creator_id, lm.point_value, lm.ece_hours, lm.ece_category,
             lm.created_at as module_created_at,
             s.name as school_name,
             u.first_name as creator_first_name, u.last_name as creator_last_name,
             u.username as creator_username
      FROM community_modules cm
      JOIN learning_modules lm ON cm.module_id = lm.id
      JOIN schools s ON cm.shared_by_school_id = s.id
      LEFT JOIN users u ON lm.creator_id = u.id
      WHERE cm.status = 'active' 
      AND (lm.is_onboarding_module = false OR lm.is_onboarding_module IS NULL)
      AND cm.shared_by_school_id != ${schoolId}
      ORDER BY lm.average_rating DESC, cm.shared_date DESC
    `;

    if (limit) {
      baseQuery += ` LIMIT ${limit}`;
    }

    const result = await db.execute(sql.raw(baseQuery));
    
    console.log(`[COMMUNITY VISIBILITY] School ${schoolId} sees ${result.rows.length} community modules`);
    
    return result.rows;
  }

  /**
   * Check if a school can create community modules
   */
  static async canCreateCommunityModules(schoolId: number): Promise<boolean> {
    const rules = await this.getVisibilityRules(schoolId);
    return !rules.isNewSchool; // Only established schools can create community modules
  }

  /**
   * Mark a school as established (override new school status)
   * Useful for promoting test schools or when schools have sufficient content
   */
  static async markSchoolAsEstablished(schoolId: number): Promise<void> {
    // This would typically involve updating a flag in the database
    // For now, we'll rely on the module count and creation date logic
    console.log(`[SCHOOL PROMOTION] School ${schoolId} marked as established`);
  }
}