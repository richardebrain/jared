# MentorMe: Database Schema Management Strategy

## Overview

This document outlines our strategy for managing database schema changes in the MentorMe platform using Drizzle ORM's "schema-push" approach. This strategy ensures consistency, reduces errors, and streamlines the database management process.

## Current Challenges

The MentorMe platform currently faces several challenges with database schema management:

1. **Multiple inconsistent migration approaches** including:
   - Raw SQL migrations in various files
   - SQL embedded in TypeScript files
   - One-off migration scripts with different patterns
   - Manual updates during server startup

2. **No schema version tracking**, making it difficult to:
   - Track the current state of the database
   - Verify if environments are in sync
   - Roll back problematic changes safely

3. **Unclear process for schema changes**, leading to:
   - Developers creating ad-hoc solutions
   - Inconsistent application of constraints and indexes
   - Risk of data loss during migrations

## Recommended Approach: Schema-Push

We will adopt Drizzle ORM's "schema-push" approach as recommended in their documentation:

> "I want to have database schema in my TypeScript codebase, I don't wanna deal with SQL migration files.
> I want Drizzle to 'push' my schema directly to the database."

### Key Features

1. **TypeScript Schema as Single Source of Truth**
   - All database tables, columns, relationships, and constraints defined in TypeScript
   - Clear, type-safe schema definition
   - Schema co-located with application code for better visibility

2. **Direct Schema Pushing**
   - Use `drizzle-kit push` to apply schema changes directly to database
   - No manual SQL scripts needed
   - Automatic diff calculation between code and database

3. **Schema Version Tracking**
   - Implement schema version table to track applied changes
   - Store hash of schema definition to detect drift
   - Record timestamp and author of each change

## Implementation Plan

### 1. Schema Consolidation (Week 1)

1. **Consolidate Schema Definitions**
   - Ensure all tables are defined in `shared/schema.ts`
   - Add any missing relationships and constraints
   - Review and document existing tables/columns

2. **Create Schema Version Table**
   ```typescript
   export const schemaVersions = pgTable('schema_versions', {
     id: serial('id').primaryKey(),
     version: text('version').notNull(),
     description: text('description').notNull(),
     schemaHash: text('schema_hash').notNull(),
     appliedAt: timestamp('applied_at').defaultNow().notNull(),
     appliedBy: text('applied_by'),
   });
   ```

### 2. Migration Process Setup (Week 2)

1. **Create Migration Scripts**
   - Script to calculate schema hash
   - Script to apply schema changes and update version table
   - Script to verify schema integrity

2. **Setup CI/CD Integration**
   - Add schema verification to CI pipeline
   - Configure deployment process to include schema updates

### 3. Developer Workflow (Week 3)

1. **Define Developer Workflow**
   - Document process for making schema changes
   - Create guidelines for validation and testing
   - Establish review process for schema changes

2. **Create Documentation**
   - How to add new tables/columns
   - How to modify existing schema
   - How to apply changes in development/staging/production

### 4. Cleanup (Week 4)

1. **Remove Legacy Migration Scripts**
   - Audit and remove outdated scripts
   - Document any special cases that required custom handling

2. **Validate Schema Integrity**
   - Run comprehensive tests on schema changes
   - Verify production database schema matches codebase

## Usage Examples

### Making Schema Changes

```typescript
// shared/schema.ts

// Adding a new column to an existing table
export const users = pgTable('users', {
  // Existing columns...
  id: serial('id').primaryKey(),
  username: text('username').notNull().unique(),
  
  // New column
  preferredTheme: text('preferred_theme').default('light'),
});

// Adding a new table
export const userPreferences = pgTable('user_preferences', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  prefKey: text('pref_key').notNull(),
  prefValue: text('pref_value'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Define relationships
export const userPreferencesRelations = relations(userPreferences, ({ one }) => ({
  user: one(users, {
    fields: [userPreferences.userId],
    references: [users.id],
  }),
}));
```

### Applying Schema Changes

```bash
# Development workflow
npm run drizzle:push

# CI/CD pipeline
npm run drizzle:push:ci
```

## Benefits

1. **Simplified Developer Experience**
   - No need to write SQL migration files
   - Schema changes are type-safe and validated
   - Single source of truth for database schema

2. **Reduced Errors**
   - Automated diff calculation prevents manual errors
   - Type safety catches issues before runtime
   - Consistent application of constraints and indexes

3. **Better Visibility**
   - Schema defined alongside application code
   - Changes tracked in version control
   - Clear history of schema evolution

4. **Faster Development**
   - Streamlined process for schema changes
   - No need to manually track migration sequences
   - Automatic handling of dependencies between tables

## Conclusion

By adopting the Drizzle ORM "schema-push" approach, we will standardize our database schema management, reduce errors, and improve developer productivity. This approach treats the TypeScript schema definition as the single source of truth and provides a simple, reliable way to keep the database schema in sync with the application code.