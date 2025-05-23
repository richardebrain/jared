# MentorMe: Technical Architecture Document

## System Overview

MentorMe is built as a modern web application following a full-stack JavaScript/TypeScript architecture. The system consists of a React frontend, Node.js backend, and PostgreSQL database, with various integrated services for authentication, media handling, and communication.

## Architecture Diagram

```
┌────────────────┐     ┌────────────────┐     ┌────────────────┐
│                │     │                │     │                │
│  Client Layer  │────▶│  Service Layer │────▶│   Data Layer   │
│  (React/TS)    │     │  (Node/Express)│     │  (PostgreSQL)  │
│                │◀────│                │◀────│                │
└────────────────┘     └────────────────┘     └────────────────┘
        │                      │                      │
        ▼                      ▼                      ▼
┌────────────────┐     ┌────────────────┐     ┌────────────────┐
│  UI Components │     │  API Endpoints │     │  Data Models   │
│  State Mgmt    │     │  Middleware    │     │  Relationships │
│  Routing       │     │  Auth Logic    │     │  Migrations    │
└────────────────┘     └────────────────┘     └────────────────┘
        │                      │                      │
        ▼                      ▼                      ▼
┌────────────────┐     ┌────────────────┐     ┌────────────────┐
│ External APIs  │     │  Third-party   │     │  Database      │
│ (Firebase,     │     │  Services      │     │  Operations    │
│  Media, etc.)  │     │  (Email, etc.) │     │  (Drizzle ORM) │
└────────────────┘     └────────────────┘     └────────────────┘
```

## Technology Stack

### Frontend
- **Framework**: React with TypeScript
- **State Management**: React Context API, TanStack Query (React Query)
- **Routing**: Wouter
- **Styling**: TailwindCSS with Shadcn UI components
- **Form Handling**: React Hook Form with Zod validation
- **Authentication**: Firebase Auth integration + custom session management

### Backend
- **Framework**: Node.js with Express
- **API Management**: RESTful endpoints
- **Authentication**: Express session middleware with PostgreSQL session storage
- **Validation**: Zod schemas
- **Email**: Nodemailer (configured for Gmail integration)

### Database
- **RDBMS**: PostgreSQL
- **ORM**: Drizzle ORM
- **Migrations**: Drizzle Kit

### Testing & DevOps
- **Environment**: Replit
- **Deployment**: Replit Deployments
- **Workflow Management**: Replit workflows

### Third-Party Services
- **Authentication**: Firebase Authentication
- **Video Hosting**: YouTube embedded content
- **Email Service**: Gmail (via Nodemailer)

## Core Components

### Client Layer

#### Authentication Flow
The authentication system combines Firebase authentication with custom session management, providing a secure and flexible user identity system.

#### Key Components
1. **Header Component**: Navigation and user account access
2. **Dashboard**: Teacher's home page with progress indicators and recent activities
3. **Module Player**: Video content with integrated quiz functionality
4. **Avatar Customization**: Interface for personalizing teacher avatars
5. **Teacher Leaderboard**: Displays ranking of teachers by performance
6. **Shoutouts Component**: Recognition system for teacher achievements

### Service Layer

#### Core API Endpoints
1. `/api/auth/*`: User authentication and session management
2. `/api/modules`: Learning module management
3. `/api/assessments`: Assessment creation and tracking
4. `/api/progress`: User progress tracking
5. `/api/users`: User management and profiles
6. `/api/avatars`: Avatar customization and management
7. `/api/shoutouts`: Core values recognition system

#### Middleware
1. **Authentication**: Session validation and user verification
2. **Error Handling**: Centralized error processing
3. **Logging**: Activity and error logging
4. **Rate Limiting**: API request throttling

### Data Layer

#### Database Schema
The database schema is organized into the following key entities:

1. **Users**: Teacher and administrator accounts
2. **Schools**: Educational institutions with subscription information
3. **Modules**: Learning content organized as modules
4. **Assessments**: Knowledge evaluation tools
5. **Progress**: Teacher advancement through content
6. **Avatars**: Customizable teacher representations
7. **Shoutouts**: Peer recognition system

#### Key Relationships
- Users belong to Schools
- Progress records connect Users to Modules
- Assessments are linked to Users and specific domains
- Avatars are linked to Users with AvatarItems

## Data Flow

### Authentication Process
1. User enters credentials or uses Google/Firebase login
2. Credentials validated against Firebase auth
3. Upon success, server creates a session
4. User receives session cookie for subsequent requests
5. Session validates on API calls

### Content Delivery
1. Frontend requests module list based on user profile
2. Backend filters modules by school and user progress
3. Frontend displays personalized module recommendations
4. User selects module, triggering content fetch
5. Video and quiz content displayed in sequence
6. Answers submitted to backend for assessment

### Progress Tracking
1. User completes module or assessment
2. Backend calculates points and updates progress
3. User level and streak updated
4. Dashboard reflects new achievements
5. Leaderboard positions recalculated

## Security Measures

### Authentication Security
- Password hashing with bcrypt
- Firebase authentication integration
- Session management with secure cookies
- Role-based access control

### Data Protection
- Input validation with Zod schemas
- SQL injection prevention via ORM
- XSS protection with React's built-in safeguards
- CSRF protection with session tokens

### API Security
- Rate limiting to prevent abuse
- Authentication middleware for protected routes
- Input sanitization and validation
- Error handling that doesn't leak implementation details

## Scalability Considerations

### Database Optimization
- Index optimization for frequently queried fields
- Connection pooling for efficient resource use
- Query optimization for complex data retrieval

### Performance Enhancements
- Client-side caching with TanStack Query
- Pagination for large data sets
- Image and media optimization
- Code splitting for improved load times

### Future Scaling Options
- Horizontal scaling of API servers
- Caching layer with Redis
- Content delivery network integration
- Microservices architecture evolution

## Error Handling and Logging

### Error Categories
1. **Client Validation Errors**: Form and input validation issues
2. **Authentication Errors**: Login and session problems
3. **Server Processing Errors**: Backend logic failures
4. **Database Errors**: Query and connection issues
5. **External Service Errors**: Third-party API failures

### Logging Strategy
- Client-side error logging for UI issues
- Server-side logging for API and processing errors
- Database query logging for performance analysis
- Authentication activity logging for security monitoring

## Development Workflow

### Code Organization
- `client/`: React frontend application
- `server/`: Express backend services
- `shared/`: Common types and utilities
- `public/`: Static assets and resources

### Build and Deployment
1. Development on Replit environment
2. Testing on Replit preview URLs
3. Deployment via Replit Deployments
4. Post-deployment verification

## Maintenance and Monitoring

### Regular Maintenance
- Database backups and optimization
- Dependency updates and security patches
- Performance monitoring and optimization
- Content freshness verification

### Monitoring Systems
- API endpoint response times
- Database query performance
- Authentication success/failure rates
- User engagement metrics

## Disaster Recovery

### Backup Strategy
- Database daily backups
- Code repository versioning
- Configuration backup and documentation
- External service credentials management

### Recovery Procedures
- Database restoration process
- Server recreation procedure
- Configuration redeployment
- Verification and testing protocol

## Appendix

### Database Schema Reference
```
Users
  id (PK)
  schoolId (FK)
  username
  email
  passwordHash
  firstName
  lastName
  profilePicture
  activeAvatarId
  points
  level
  streak
  ...

Schools
  id (PK)
  name
  subscription
  contactEmail
  customization
  ...

Modules
  id (PK)
  title
  description
  content
  pointValue
  ...

Progress
  id (PK)
  userId (FK)
  moduleId (FK)
  status
  completedAt
  score
  ...

Avatars
  id (PK)
  userId (FK)
  name
  ...

AvatarItems
  id (PK)
  categoryId (FK)
  name
  image
  price
  ...

CoreValueShoutouts
  id (PK)
  nominatorId (FK)
  nomineeId (FK)
  coreValue
  message
  createdAt
  ...
```