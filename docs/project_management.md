# MentorMe Project Management

This document serves as the central project management framework for MentorMe, tracking epics, tasks, dependencies, and progress.

## Structure

### Epic Status Indicators
- 🔴 TODO
- 🟠 In Progress 
- 🟢 Completed
- ⚠️ Blocked

### Task Status Indicators
- ⬜ TODO
- 🟦 In Progress
- ✅ Completed
- 🚫 Blocked

## Epics

### 🟠 [EP-001] Implement Dynamic Initial Assessment for Educators

**Description:** Create a comprehensive initial assessment system for educators that dynamically adjusts difficulty based on performance and establishes personalized learning paths.

**Business Value:** Enables accurate identification of knowledge gaps and strengths, leading to truly personalized professional development. Forms the foundation of the adaptive learning experience.

**Success Criteria:**
- Assessment dynamically adjusts question difficulty based on user performance across 6 levels
- Results clearly identify knowledge gaps across 10 weighted ECE domains
- System generates personalized learning path recommendations based on failed questions
- Assessment completion triggers appropriate achievements/rewards
- Data is securely stored for long-term progress tracking
- 40-question assessment completes in 30-40 minutes with proper domain weighting

**Key Technical Decisions Made:**
- **Assessment Structure**: 40 questions (configurable), 6 difficulty levels, 10 weighted domains
- **Adaptive Algorithm**: Global difficulty tracking with weighted domain selection
- **Time Management**: 60 seconds per question (school-configurable)
- **Database Approach**: Codebase-first using Drizzle with `drizzle-kit push`
- **Content Management**: AI-generated questions with human approval workflow

**Tasks:**
1. 🟦 [EP-001-01] **Investigate Existing Assessment Codebase**
   - **Description:** Review current assessment-related code, identify reusable components, and document the current assessment flow. 
   - **Requirements:** 
     - Map all existing assessment files in both Python and TypeScript codebases
     - Document the current question selection algorithm
     - Analyze existing database schema for assessment data
     - Evaluate the current question bank for coverage and quality
     - Identify any performance or scalability issues
   - **Dependencies:** None
   - **Status Update:** In progress - comprehensive analysis documented in `docs/assessment/` folder
   - **Technical Notes:** 
     - Focus on `backend/assessment.py`, `assessment_api_integration.py` and related files
     - Assess feasibility of consolidating Python and TypeScript assessment code
     - Document API endpoints handling assessment data
     - **Current findings**: Multiple broken implementations identified, need cleanup

2. ✅ [EP-001-02] **Design Dynamic Question Selection Algorithm**
   - **Description:** Create specification for an algorithm that selects questions based on user performance, adjusting difficulty appropriately.
   - **Requirements:** 
     - 6-level adaptive difficulty system (Easy → Master)
     - Weighted domain selection ensuring balanced coverage
     - Comprehensive fallback strategies for question pool management
     - Real-time adaptation based on user performance
   - **Dependencies:** EP-001-01
   - **Technical Notes:** 
     - **Completed**: Detailed algorithm documented in `docs/assessment/initial_assessment_feature_plan.md`
     - Includes initialization, question selection process, domain weight enforcement
     - Comprehensive fallback strategy implemented
     - Performance tracking for mastery confirmation

3. ⬜ [EP-001-03] **Update Database Schema with Assessment Tables**
   - **Description:** Implement new database schema for assessment system using Drizzle's codebase-first approach with `drizzle-kit push`.
   - **Requirements:**
     - Add `assessmentDomains` table with question weights for 10 ECE domains
     - Update `assessmentQuestions` table with domainId reference and 6 difficulty levels
     - Update `assessmentResponses` table with questionSequence field for complete tracking
     - Add `questionAvailability` table for dual-level availability control
     - Update `assessmentConfig` table with 40 question default and 60-second timePerQuestion
     - Update existing `assessments` table with new fields for 6-level system
   - **Dependencies:** EP-001-02
   - **Technical Approach:** 
     - **Codebase-first**: Update TypeScript schema in `shared/schema.ts` as source of truth
     - **Push to Database**: Use `drizzle-kit push` to apply schema changes directly
     - **No SQL Files**: Avoid dealing with SQL migration files, let Drizzle handle the diff
   - **Technical Notes:**
     - Reference: [Drizzle Migrations - Option 2](https://orm.drizzle.team/docs/migrations)
     - Schema changes documented in `docs/assessment/initial_assessment_feature_plan.md`
     - Remove category fields, focus on domain-only structure

4. ⬜ [EP-001-04] **Create Database Indexes for Performance**
   - **Description:** Add proper database indexes to support efficient weighted question selection and assessment queries.
   - **Requirements:**
     - Domain and difficulty lookups (1-6 levels)
     - User assessment queries optimization
     - Weighted question selection performance
     - Availability checking queries
   - **Dependencies:** EP-001-03
   - **Technical Notes:**
     - Use Drizzle's index definitions in schema
     - Focus on assessment performance bottlenecks
     - Test with realistic question pool sizes

5. ⬜ [EP-001-05] **Seed Assessment Domains and Configuration**
   - **Description:** Create seed data for the 10 ECE domains with proper weights and default configuration values.
   - **Requirements:**
     - 10 domains with specific question weights (Child Safety: 10, Health: 8, etc.)
     - Domain descriptions and display order
     - Default assessment configuration (40 questions, 60 seconds per question)
     - Platform-wide default settings
   - **Dependencies:** EP-001-03
   - **Technical Notes:**
     - Create seed script or migration for initial data
     - Ensure domain weights total to 40 questions
     - Reference domain specifications in assessment documentation

6. ⬜ [EP-001-06] **Clean Up Existing Assessment Implementations**
   - **Description:** Remove broken assessment files and consolidate assessment-related code to Node.js-only approach.
   - **Requirements:**
     - Remove broken HTML files (assessment.html, pure-assessment.html, etc.)
     - Remove Python assessment backend code (assessment.py, assessment_api_integration.py)
     - Clean up unused assessment routes and API endpoints
     - Remove unused React components
     - Update imports and dependencies
     - Keep JSON question seed data files for migration to new schema
   - **Dependencies:** EP-001-01
   - **Technical Notes:**
     - List of files to remove documented in assessment analysis
     - **Python Removal**: Migrate to Node.js-only approach, remove Python assessment backend
     - **Preserve Data**: Keep JSON question files for potentially seeding new database schema
     - Ensure no breaking changes to existing functionality
     - Update route documentation after cleanup

## Tracking Progress

Weekly status updates will be added below to track overall project progress.

### Status Updates

**Week of May 26, 2025**
- ✅ Completed comprehensive assessment feature planning and documentation
- ✅ Designed adaptive algorithm with 6-level difficulty and weighted domain selection
- 🟦 In progress: Codebase analysis and documentation in `docs/assessment/` folder
- 🎯 Next: Database schema implementation using Drizzle codebase-first approach
- 📋 Created organized documentation structure in `docs/assessment/` subfolder

**Week of May 19, 2025**
- Created initial project management framework
- Defined first epic for dynamic assessment implementation
- Documented technical debt issues and resolution roadmap

## How to Use This Document

1. **Adding a New Epic:**
   - Assign the next available epic number (e.g., EP-002)
   - Include description, business value, and success criteria
   - Add initial tasks if known

2. **Adding Tasks to an Epic:**
   - Assign the next available task number for the epic (e.g., EP-001-07)
   - Include detailed description and requirements
   - Note dependencies if applicable
   - Add technical notes as needed

3. **Updating Task Status:**
   - Change the status indicator as work progresses
   - Add comments in the technical notes when significant progress occurs

4. **Weekly Status Updates:**
   - Add a new entry under "Status Updates" each week
   - Provide a concise summary of progress, challenges, and next steps
   - Highlight any blocked items that need attention

5. **Task Completion:**
   - When all tasks in an epic are complete, update the epic status to 🟢
   - Document any lessons learned or future considerations