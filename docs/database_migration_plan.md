# MentorMe: Database Migration Plan

## Overview

This document outlines the database migration plan for adding the `active_avatar_id` column to the `users` table, which is currently missing and causing API errors.

## Current Issue

Error logs reveal a consistent database error:
```
Error: column "active_avatar_id" does not exist
```

This indicates that while the application code expects an `active_avatar_id` column in the `users` table, this column does not exist in the database schema. This is causing errors in various API endpoints including:
- `/api/users`
- `/api/progress`
- `/api/modules`
- `/api/assessments`
- `/api/games/history`

## Migration Plan

### 1. Backup

Before performing any schema changes, create a full database backup:

```sql
-- For PostgreSQL
pg_dump -U [username] -d [database_name] > mentorme_backup_[date].sql
```

### 2. Schema Update

The migration will add the missing column to the `users` table:

```sql
-- Add active_avatar_id column to users table
ALTER TABLE users
ADD COLUMN active_avatar_id INTEGER;

-- Add a foreign key constraint referencing the avatars table
ALTER TABLE users
ADD CONSTRAINT fk_users_active_avatar
FOREIGN KEY (active_avatar_id) REFERENCES avatars(id)
ON DELETE SET NULL;

-- Create index for better query performance
CREATE INDEX idx_users_active_avatar_id ON users(active_avatar_id);
```

### 3. Data Migration

For existing users, we'll set their active avatar to their most recently created avatar or NULL if they have no avatars:

```sql
-- Update existing users with their most recent avatar
WITH latest_avatars AS (
  SELECT 
    user_id, 
    MAX(id) as latest_avatar_id
  FROM 
    avatars
  GROUP BY 
    user_id
)
UPDATE users
SET active_avatar_id = latest_avatars.latest_avatar_id
FROM latest_avatars
WHERE users.id = latest_avatars.user_id;
```

### 4. Drizzle ORM Implementation

Update the Drizzle schema definition in `shared/schema.ts` to include the new column:

```typescript
export const users = pgTable('users', {
  // Existing columns...
  activeAvatarId: integer('active_avatar_id').references(() => avatars.id),
  // Other columns...
});
```

### 5. Storage Layer Update

Ensure the `DatabaseStorage` class in `server/storage.ts` properly handles the new column in relevant methods:

```typescript
async updateUser(id: number, updates: Partial<User>): Promise<User> {
  // Make sure activeAvatarId is included in the updates if present
  const [updatedUser] = await db
    .update(users)
    .set({
      ...updates,
      updatedAt: new Date()
    })
    .where(eq(users.id, id))
    .returning();
  return updatedUser;
}

async getAllUsers(): Promise<User[]> {
  // Ensure query includes the activeAvatarId field
  return await db
    .select()
    .from(users)
    .orderBy(asc(users.username));
}
```

### 6. API and Component Updates

The API endpoints and React components are already expecting this field, so they should work properly once the database schema is updated.

### 7. Testing Plan

After the migration:

1. **Manual Testing**:
   - Test user profile loading
   - Verify avatar selection and display
   - Check teacher leaderboards
   - Verify shoutouts display

2. **API Endpoint Testing**:
   - Test `/api/auth/me` for proper user data
   - Test `/api/users` for complete user listing
   - Test avatar-related endpoints

3. **Error Monitoring**:
   - Monitor server logs for any remaining `active_avatar_id` errors
   - Check client-side console for related errors

### 8. Rollback Plan

If issues arise, execute the rollback script:

```sql
-- Remove foreign key constraint
ALTER TABLE users
DROP CONSTRAINT IF EXISTS fk_users_active_avatar;

-- Remove index
DROP INDEX IF EXISTS idx_users_active_avatar_id;

-- Remove column
ALTER TABLE users
DROP COLUMN IF EXISTS active_avatar_id;
```

### 9. Timeline

1. **Preparation**: 1 hour - Create backup and prepare scripts
2. **Execution**: 30 minutes - Run migration scripts
3. **Testing**: 2 hours - Verify all functionality
4. **Monitoring**: 24 hours - Watch for any issues in production

## Implementation Using Drizzle Migrations

Instead of raw SQL, we'll implement this using Drizzle ORM migrations:

1. Create a migration file:

```typescript
// server/migrations/add_active_avatar_id.ts

import { sql } from 'drizzle-orm';
import { migrate } from 'drizzle-orm/postgres-js';
import { db } from '../db';

export async function up() {
  // Add active_avatar_id column
  await db.execute(sql`
    ALTER TABLE users
    ADD COLUMN active_avatar_id INTEGER;
    
    ALTER TABLE users
    ADD CONSTRAINT fk_users_active_avatar
    FOREIGN KEY (active_avatar_id) REFERENCES avatars(id)
    ON DELETE SET NULL;
    
    CREATE INDEX idx_users_active_avatar_id ON users(active_avatar_id);
    
    WITH latest_avatars AS (
      SELECT 
        user_id, 
        MAX(id) as latest_avatar_id
      FROM 
        avatars
      GROUP BY 
        user_id
    )
    UPDATE users
    SET active_avatar_id = latest_avatars.latest_avatar_id
    FROM latest_avatars
    WHERE users.id = latest_avatars.user_id;
  `);
}

export async function down() {
  // Rollback changes
  await db.execute(sql`
    ALTER TABLE users
    DROP CONSTRAINT IF EXISTS fk_users_active_avatar;
    
    DROP INDEX IF EXISTS idx_users_active_avatar_id;
    
    ALTER TABLE users
    DROP COLUMN IF EXISTS active_avatar_id;
  `);
}
```

2. Update schema definition in `shared/schema.ts`:

```typescript
// Add to schema.ts file
export const users = pgTable('users', {
  // Existing fields...
  activeAvatarId: integer('active_avatar_id').references(() => avatars.id),
  // Other fields...
});
```

3. Run the migration with Drizzle Kit:

```bash
npm run drizzle:migrate
```

## Conclusion

This migration plan addresses the missing `active_avatar_id` column that's causing errors across multiple API endpoints. By following this plan, we'll resolve these errors while maintaining data integrity and minimizing downtime.