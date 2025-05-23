# MentorMe: Database Schema Documentation

## Overview

This document outlines the database schema for the MentorMe platform, including tables, relationships, and key constraints. The database is built on PostgreSQL and uses Drizzle ORM for database operations.

## Entity Relationship Diagram

```
┌───────────────┐       ┌───────────────┐       ┌───────────────┐
│    schools    │       │     users     │       │    modules    │
├───────────────┤       ├───────────────┤       ├───────────────┤
│ id            │◄─────┐│ id            │       │ id            │
│ name          │      ││ schoolId      │──────▶│ schoolId      │
│ subscription  │      ││ username      │       │ title         │
│ contactEmail  │      ││ email         │       │ description   │
│ customization │      ││ firstName     │       │ content       │
└───────────────┘      ││ lastName      │       │ pointValue    │
                       ││ points        │       │ duration      │
                       ││ level         │       │ difficulty    │
┌───────────────┐      ││ streak        │       │ category      │
│  assessments  │      ││ activeAvatarId│       │ isVisible     │
├───────────────┤      │└───────────────┘       └───────────────┘
│ id            │      │        │                      ▲
│ userId        │──────┘        │                      │
│ type          │               ▼                      │
│ overallScore  │       ┌───────────────┐       ┌───────────────┐
│ domain        │       │   progress    │       │ moduleRatings │
│ completedAt   │       ├───────────────┤       ├───────────────┤
└───────────────┘       │ id            │       │ id            │
                        │ userId        │────┐  │ moduleId      │
                        │ moduleId      │─────┼─│ userId        │
┌───────────────┐       │ progress      │    ┌┴─│ rating        │
│  userAnswers  │       │ completedAt   │    │  │ comment       │
├───────────────┤       │ score         │    │  └───────────────┘
│ id            │       └───────────────┘    │
│ userId        │────┐                       │
│ questionId    │    │                       │
│ answer        │    │  ┌───────────────┐    │
│ isCorrect     │    │  │ shoutouts     │    │
│ pointsEarned  │    │  ├───────────────┤    │
└───────────────┘    │  │ id            │    │
                     │  │ nominatorId   │────┘
                     │  │ nomineeId     │────┐
┌───────────────┐    │  │ coreValue     │    │
│   questions   │    │  │ message       │    │
├───────────────┤    │  │ createdAt     │    │
│ id            │◄───┘  └───────────────┘    │
│ domain        │                            │
│ text          │                            │
│ options       │       ┌───────────────┐    │
│ answer        │       │   avatars     │    │
│ explanation   │       ├───────────────┤    │
│ difficulty    │       │ id            │◄───┘
└───────────────┘       │ userId        │────┐
                        │ name          │    │
                        │ isActive      │    │
                        └───────────────┘    │
                                             │
┌───────────────┐       ┌───────────────┐    │
│ avatarItems   │       │userAvatarItems│    │
├───────────────┤       ├───────────────┤    │
│ id            │◄─────┐│ id            │    │
│ categoryId    │      ││ userId        │────┘
│ name          │      ││ avatarItemId  │────┐
│ image         │      ││ isPurchased   │    │
│ price         │      │└───────────────┘    │
└───────────────┘      │                     │
       ▲               └─────────────────────┘
       │
┌───────────────┐
│avatarCategories│
├───────────────┤
│ id            │
│ name          │
│ description   │
└───────────────┘
```

## Tables

### schools

Represents educational institutions that subscribe to the platform.

| Column        | Type         | Constraints   | Description                         |
|---------------|--------------|---------------|-------------------------------------|
| id            | integer      | PK            | Unique identifier                   |
| name          | varchar(255) | NOT NULL      | School name                         |
| address       | varchar(255) |               | Physical address                    |
| city          | varchar(100) |               | City                                |
| state         | varchar(50)  |               | State/province                      |
| zipCode       | varchar(20)  |               | Postal code                         |
| contactEmail  | varchar(255) |               | Primary contact email               |
| contactPhone  | varchar(50)  |               | Primary contact phone               |
| adminPasswordHash | text     |               | Admin access password hash          |
| subscription  | json         |               | Subscription details                |
| customization | json         |               | School branding customization       |
| createdAt     | timestamp    | DEFAULT NOW() | Account creation timestamp          |
| activeTeacherCount | integer | DEFAULT 0     | Number of active teachers           |

### users

Represents teachers and administrators who use the platform.

| Column          | Type         | Constraints          | Description                      |
|-----------------|--------------|----------------------|----------------------------------|
| id              | integer      | PK                   | Unique identifier                |
| schoolId        | integer      | FK -> schools.id     | Associated school                |
| username        | varchar(50)  | UNIQUE, NOT NULL     | Unique login username            |
| email           | varchar(255) | UNIQUE, NOT NULL     | Email address                    |
| passwordHash    | text         | NOT NULL             | Hashed password                  |
| firstName       | varchar(100) |                      | Teacher's first name             |
| lastName        | varchar(100) |                      | Teacher's last name              |
| language        | varchar(50)  | DEFAULT 'English'    | Preferred language               |
| nativeLanguage  | varchar(50)  |                      | Native language                  |
| timeZone        | varchar(50)  | DEFAULT 'UTC'        | User's time zone                 |
| profilePicture  | text         |                      | Profile image URL                |
| learningStyle   | json         |                      | Learning style preferences       |
| bearBucks       | integer      | DEFAULT 0            | Virtual currency balance         |
| points          | integer      | DEFAULT 0            | Achievement points               |
| lifetimePoints  | integer      | DEFAULT 0            | Total points earned              |
| level           | integer      | DEFAULT 1            | Current level                    |
| streak          | integer      | DEFAULT 0            | Consecutive days active          |
| lastActive      | timestamp    | DEFAULT NOW()        | Last platform activity           |
| achievementCount| integer      | DEFAULT 0            | Number of achievements earned    |
| isAdmin         | boolean      | DEFAULT false        | Platform administrator flag      |
| isSchoolAdmin   | boolean      | DEFAULT false        | School administrator flag        |
| isOwner         | boolean      | DEFAULT false        | School owner flag                |
| fingerprintExpiration | date   |                      | Fingerprint certificate expiry   |
| cprExpiration   | date         |                      | CPR certification expiry         |
| firstAidExpiration | date      |                      | First aid certification expiry   |
| foodHandlerExpiration | date   |                      | Food handler certification expiry|
| jobTitle        | varchar(100) |                      | Job title at school              |
| designations    | text[]       |                      | Professional designations        |
| createdAt       | timestamp    | DEFAULT NOW()        | Account creation timestamp       |
| activeAvatarId  | integer      | FK -> avatars.id     | Current active avatar            |

### modules

Represents learning modules available on the platform.

| Column         | Type          | Constraints         | Description                      |
|----------------|---------------|---------------------|----------------------------------|
| id             | integer       | PK                  | Unique identifier                |
| schoolId       | integer       | FK -> schools.id    | Creating school (null=system)    |
| title          | varchar(255)  | NOT NULL            | Module title                     |
| description    | text          | NOT NULL            | Module description               |
| content        | text          |                     | Module content or URL            |
| pointValue     | integer       | DEFAULT 10          | Points awarded for completion    |
| duration       | integer       | NOT NULL            | Estimated minutes to complete    |
| difficulty     | varchar(50)   | DEFAULT 'Beginner'  | Difficulty level                 |
| category       | varchar(100)  |                     | Module category                  |
| imageUrl       | text          |                     | Cover image URL                  |
| featured       | boolean       | DEFAULT false       | Featured on homepage flag        |
| isVisible      | boolean       | DEFAULT true        | Visibility flag                  |
| createdAt      | timestamp     | DEFAULT NOW()       | Creation timestamp               |
| createdBy      | integer       | FK -> users.id      | Creator user ID                  |
| quiz           | json          |                     | Embedded quiz questions          |
| averageRating  | decimal(3,2)  | DEFAULT 0           | Average user rating              |
| ratingCount    | integer       | DEFAULT 0           | Number of ratings received       |
| isSharedToCommunity | boolean | DEFAULT false       | Available to other schools       |

### progress

Tracks user progress through modules.

| Column      | Type        | Constraints            | Description                   |
|-------------|-------------|------------------------|-------------------------------|
| id          | integer     | PK                     | Unique identifier             |
| userId      | integer     | FK -> users.id         | User who made progress        |
| moduleId    | integer     | FK -> modules.id       | Module being tracked          |
| progress    | integer     | DEFAULT 0              | Percentage complete (0-100)   |
| startedAt   | timestamp   | DEFAULT NOW()          | Start timestamp               |
| completedAt | timestamp   |                        | Completion timestamp          |
| score       | integer     |                        | Quiz score if applicable      |
| attempts    | integer     | DEFAULT 1              | Number of attempts            |

### assessments

Represents knowledge assessments taken by users.

| Column       | Type        | Constraints        | Description                     |
|--------------|-------------|--------------------|----------------------------------|
| id           | integer     | PK                 | Unique identifier                |
| userId       | integer     | FK -> users.id     | User who took assessment         |
| type         | varchar(50) | DEFAULT 'standard' | Assessment type                  |
| overallScore | integer     |                    | Overall assessment score         |
| domain       | varchar(100)|                    | Knowledge domain assessed        |
| startedAt    | timestamp   | DEFAULT NOW()      | Start timestamp                  |
| completedAt  | timestamp   |                    | Completion timestamp             |
| feedback     | text        |                    | Personalized feedback            |
| results      | json        |                    | Detailed assessment results      |

### questions

Knowledge assessment questions.

| Column      | Type          | Constraints       | Description                      |
|-------------|---------------|-------------------|----------------------------------|
| id          | integer       | PK                | Unique identifier                |
| domain      | varchar(100)  | NOT NULL          | Knowledge domain                 |
| text        | text          | NOT NULL          | Question text                    |
| options     | json          | NOT NULL          | Multiple choice options          |
| answer      | varchar(255)  | NOT NULL          | Correct answer                   |
| explanation | text          |                   | Answer explanation               |
| difficulty  | integer       | DEFAULT 1         | Difficulty level (1-5)           |
| source      | varchar(255)  |                   | Reference source                 |
| isActive    | boolean       | DEFAULT true      | Whether question is active       |

### userAnswers

Records user responses to assessment questions.

| Column       | Type        | Constraints            | Description                    |
|--------------|-------------|------------------------|--------------------------------|
| id           | integer     | PK                     | Unique identifier              |
| userId       | integer     | FK -> users.id         | User who answered              |
| questionId   | integer     | FK -> questions.id     | Question answered              |
| assessmentId | integer     | FK -> assessments.id   | Associated assessment          |
| answer       | varchar(255)| NOT NULL               | User's answer                  |
| isCorrect    | boolean     | NOT NULL               | Whether answer was correct     |
| pointsEarned | integer     | DEFAULT 0              | Points earned for answer       |
| timeTaken    | integer     |                        | Seconds taken to answer        |
| answeredAt   | timestamp   | DEFAULT NOW()          | Timestamp of answer            |

### avatars

User avatar profiles.

| Column       | Type          | Constraints        | Description                     |
|--------------|---------------|--------------------|----------------------------------|
| id           | integer       | PK                 | Unique identifier                |
| userId       | integer       | FK -> users.id     | Owner user                       |
| name         | varchar(100)  | NOT NULL           | Avatar name                      |
| isActive     | boolean       | DEFAULT false      | Whether avatar is active         |
| createdAt    | timestamp     | DEFAULT NOW()      | Creation timestamp               |
| baseColor    | varchar(50)   |                    | Avatar base color                |

### avatarCategories

Categories for avatar customization items.

| Column      | Type          | Constraints       | Description                      |
|-------------|---------------|-------------------|----------------------------------|
| id          | integer       | PK                | Unique identifier                |
| name        | varchar(100)  | NOT NULL          | Category name                    |
| description | text          |                   | Category description             |
| displayOrder| integer       | DEFAULT 0         | Display sorting order            |

### avatarItems

Individual items for avatar customization.

| Column      | Type          | Constraints            | Description                    |
|-------------|---------------|------------------------|--------------------------------|
| id          | integer       | PK                     | Unique identifier              |
| categoryId  | integer       | FK -> avatarCategories.id | Associated category         |
| name        | varchar(100)  | NOT NULL               | Item name                      |
| description | text          |                        | Item description               |
| image       | text          | NOT NULL               | Item image path/URL            |
| price       | integer       | DEFAULT 10             | Cost in Bear Bucks             |
| rarity      | varchar(50)   | DEFAULT 'common'       | Item rarity level              |
| isDefault   | boolean       | DEFAULT false          | Available by default           |

### userAvatarItems

Links users to purchased/unlocked avatar items.

| Column       | Type        | Constraints               | Description                   |
|--------------|-------------|---------------------------|-------------------------------|
| id           | integer     | PK                        | Unique identifier             |
| userId       | integer     | FK -> users.id            | User who owns item            |
| avatarItemId | integer     | FK -> avatarItems.id      | Owned item                    |
| isPurchased  | boolean     | DEFAULT true              | Whether item was purchased    |
| isEquipped   | boolean     | DEFAULT false             | Whether item is equipped      |
| purchasedAt  | timestamp   | DEFAULT NOW()             | Purchase timestamp            |

### coreValueShoutouts

Peer recognition for demonstrating core values.

| Column      | Type          | Constraints       | Description                      |
|-------------|---------------|-------------------|----------------------------------|
| id          | integer       | PK                | Unique identifier                |
| nominatorId | integer       | FK -> users.id    | User giving recognition          |
| nomineeId   | integer       | FK -> users.id    | User receiving recognition       |
| coreValue   | varchar(100)  | NOT NULL          | Core value demonstrated          |
| message     | text          | NOT NULL          | Recognition message              |
| createdAt   | timestamp     | DEFAULT NOW()     | Creation timestamp               |
| isPublic    | boolean       | DEFAULT true      | Visible on leaderboard           |

### moduleRatings

User ratings and reviews for completed modules.

| Column     | Type          | Constraints             | Description                   |
|------------|---------------|-------------------------|-------------------------------|
| id         | integer       | PK                      | Unique identifier             |
| moduleId   | integer       | FK -> modules.id        | Rated module                  |
| userId     | integer       | FK -> users.id          | Rating user                   |
| rating     | integer       | NOT NULL                | Rating (1-5)                  |
| comment    | text          |                         | Review comment                |
| createdAt  | timestamp     | DEFAULT NOW()           | Creation timestamp            |

## Key Relationships

1. **Schools to Users**: One-to-many relationship where a school has multiple teacher users
2. **Users to Progress**: One-to-many relationship tracking module completion
3. **Users to Assessments**: One-to-many relationship for knowledge evaluation
4. **Users to Avatars**: One-to-many relationship for customizable profiles
5. **Avatars to AvatarItems**: Many-to-many relationship through userAvatarItems
6. **Questions to UserAnswers**: One-to-many relationship for assessment responses
7. **Users to Shoutouts**: Two one-to-many relationships (as nominator and nominee)

## Indexes

| Table           | Indexed Columns                 | Purpose                                |
|-----------------|--------------------------------|----------------------------------------|
| users           | schoolId                       | Fast lookup of users by school        |
| users           | username                       | Fast login                            |
| users           | email                          | Fast lookup by email                  |
| progress        | userId, moduleId               | Fast progress lookup                  |
| modules         | schoolId                       | Fast module lookup by school          |
| assessments     | userId                         | Fast assessment history lookup        |
| userAnswers     | userId, questionId             | Fast answer lookup                    |
| avatars         | userId                         | Fast avatar lookup by user            |
| userAvatarItems | userId                         | Fast item lookup by user              |
| coreValueShoutouts | nomineeId                   | Fast shoutout lookup for leaderboard  |

## Constraints

1. Users must have unique usernames and email addresses
2. Progress entries must have a valid user and module
3. Assessments must be associated with a valid user
4. Shoutouts must have different nominator and nominee IDs
5. Avatar items must belong to a valid category

## Migration Strategy

Database migrations are managed through Drizzle ORM, with the following guidelines:

1. All schema changes should be made through migration scripts
2. Never manually alter the database schema
3. Test migrations in development before applying to production
4. Always create backup before migrations
5. Include both up and down migration paths for rollback

## Data Access Patterns

1. **User Authentication**: Lookup by username/email + password verification
2. **Dashboard Data**: Aggregated progress, assessments, and activity for a user
3. **Leaderboard**: Ranked teachers by points within a school
4. **Module Access**: Module content with progress tracking
5. **Avatar Customization**: Available and purchased items for a user

## Appendix

### Sample Queries

**User Profile with Level**
```sql
SELECT 
  u.id, u.username, u.firstName, u.lastName, 
  u.points, u.level, u.streak,
  COUNT(p.id) AS completedModulesCount
FROM 
  users u
LEFT JOIN 
  progress p ON u.id = p.userId AND p.completedAt IS NOT NULL
WHERE 
  u.id = [user_id]
GROUP BY 
  u.id;
```

**Leaderboard by School**
```sql
SELECT 
  u.id, u.username, u.firstName, u.lastName,
  u.profilePicture, u.points, u.level,
  COUNT(p.id) AS completedModulesCount,
  (u.id = [current_user_id]) AS isCurrentUser
FROM 
  users u
LEFT JOIN 
  progress p ON u.id = p.userId AND p.completedAt IS NOT NULL
WHERE 
  u.schoolId = [school_id]
GROUP BY 
  u.id
ORDER BY 
  u.points DESC
LIMIT 10;
```

**Recent Shoutouts**
```sql
SELECT 
  s.id, s.coreValue, s.message, s.createdAt,
  nom.firstName AS nominatorFirstName, nom.lastName AS nominatorLastName,
  nee.firstName AS nomineeFirstName, nee.lastName AS nomineeLastName
FROM 
  coreValueShoutouts s
JOIN 
  users nom ON s.nominatorId = nom.id
JOIN 
  users nee ON s.nomineeId = nee.id
WHERE 
  s.isPublic = true
  AND (nom.schoolId = [school_id] OR nee.schoolId = [school_id])
ORDER BY 
  s.createdAt DESC
LIMIT 5;
```