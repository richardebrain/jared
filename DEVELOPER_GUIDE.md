# MentorMe Platform - Developer Guide

## Technical Stack Overview

MentorMe is a full-stack web application built for early childhood education professional development. Here's what developers need to know:

### Frontend Technology
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite (fast development server and optimized production builds)
- **UI Framework**: Shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom design system
- **State Management**: TanStack Query (React Query v5) for server state
- **Routing**: Wouter for lightweight client-side routing
- **Forms**: React Hook Form with Zod validation
- **Icons**: Lucide React icon library

### Backend Technology
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js REST API
- **Database**: PostgreSQL with connection pooling
- **ORM**: Drizzle ORM (type-safe SQL toolkit)
- **Authentication**: Session-based with express-session + PostgreSQL store
- **File Processing**: Multer for file uploads
- **Validation**: Zod schemas for type-safe API validation

### AI Integration
- **Primary AI**: Anthropic Claude (content generation, lesson planning)
- **Secondary AI**: OpenAI GPT-4o (specialized content, backup service)
- **Voice Synthesis**: ElevenLabs API for text-to-speech
- **Image Generation**: OpenAI DALL-E 3 for educational visuals

### Database Architecture
- **Schema Management**: Drizzle Kit for migrations
- **Tables**: 25+ tables covering users, schools, assessments, modules, progress tracking
- **Relationships**: Comprehensive foreign key relationships
- **Data Types**: JSON columns for complex data structures (quiz content, module sections)

### Development Environment
- **Package Manager**: npm
- **Development Server**: Vite dev server with hot module replacement
- **Backend Development**: tsx for TypeScript execution
- **Database**: PostgreSQL (local development via Replit)
- **Environment Variables**: `.env` file for API keys and database connections

## Project Structure

```
├── client/                    # Frontend React application
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   ├── pages/           # Route-based page components
│   │   ├── lib/             # Utilities, auth context, API clients
│   │   └── hooks/           # Custom React hooks
├── server/                   # Backend Express application
│   ├── api/                 # API route handlers
│   ├── routes.ts            # Main API routes
│   └── storage.ts           # Database operations
├── shared/                  # Shared TypeScript types and schemas
│   └── schema.ts            # Drizzle database schema definitions
├── public/                  # Static assets
└── migrations/             # Database migration files
```

## Key Features & Modules

### Authentication System
- Session-based authentication with PostgreSQL session store
- Role-based access control (teachers, admins, owners)
- Password hashing with bcrypt
- Protected routes with middleware

### Assessment Engine
- Adaptive difficulty system (6 levels)
- Weighted domain selection algorithm
- Real-time progress tracking
- Comprehensive scoring and analytics

### Module Creation System
- AI-powered content generation
- 9 specialized content builders (Quiz, Matching, Scenario, etc.)
- Manual content creation with rich text editing
- PowerPoint import functionality
- Section-based module structure

### Gamification
- Points system (5-30 points per activity)
- Streak tracking with milestone rewards
- Bear Bucks virtual currency
- Achievement system and leaderboards

### AI Content Generation
- Contextual lesson plan creation
- Educational image generation
- Interactive quiz generation
- Scenario-based learning activities

## Getting Started for Developers

### Prerequisites
- Node.js 18+ (included in Replit environment)
- PostgreSQL database (automatically provisioned)
- API keys for AI services (stored in Replit Secrets)

### Development Workflow
1. **Install Dependencies**: `npm install` (already configured)
2. **Start Development**: `npm run dev` (starts both frontend and backend)
3. **Database Operations**: `npm run db:push` (apply schema changes)
4. **Database Studio**: `npm run db:studio` (visual database browser)

### API Structure
- **REST API**: All endpoints follow `/api/` pattern
- **Authentication**: Session-based with middleware protection
- **Validation**: Zod schemas for request/response validation
- **Error Handling**: Comprehensive error responses with proper HTTP status codes

### Database Operations
- **Schema First**: Define tables in `shared/schema.ts`
- **Type Safety**: Automatic TypeScript types from Drizzle
- **Migrations**: Use `npm run db:push` instead of manual SQL
- **Queries**: Type-safe queries with Drizzle ORM

### Frontend Patterns
- **Component Structure**: Functional components with TypeScript
- **State Management**: React Query for server state, useState for local state
- **Form Handling**: React Hook Form with Zod validation
- **Styling**: Tailwind CSS classes with design system tokens
- **API Calls**: Centralized through React Query with proper caching

### AI Integration Patterns
- **Content Generation**: Async functions with proper error handling
- **Rate Limiting**: Built-in request throttling
- **Fallback Systems**: Multiple AI providers for reliability
- **Content Validation**: Zod schemas for AI-generated content

## Configuration & Deployment

### Environment Variables
- `DATABASE_URL`: PostgreSQL connection string
- `OPENAI_API_KEY`: OpenAI API access
- `ANTHROPIC_API_KEY`: Claude API access
- `ELEVENLABS_API_KEY`: Voice synthesis
- `SESSION_SECRET`: Express session encryption

### Build Process
- **Frontend**: Vite builds to `dist/public`
- **Backend**: TypeScript compiles to ES modules
- **Assets**: Static files served through Express
- **Deployment**: Replit Deployments handles automatic scaling

### Performance Considerations
- **Database**: Connection pooling with PostgreSQL
- **Caching**: React Query for client-side caching
- **Bundle Size**: Code splitting with Vite
- **Images**: Optimized loading and caching
- **API**: Request deduplication and batching

## Code Quality & Standards

### TypeScript Configuration
- Strict mode enabled
- Path aliases configured (`@/` for client, shared types)
- Proper type definitions for all API responses

### Development Tools
- **ESLint**: Code linting (configured for React/TypeScript)
- **Prettier**: Code formatting (integrated with Vite)
- **Jest**: Testing framework for critical algorithms
- **Drizzle Studio**: Database visualization tool

### Best Practices
- **Type Safety**: Full TypeScript coverage
- **Error Handling**: Comprehensive try/catch blocks
- **Validation**: Input validation on both client and server
- **Security**: SQL injection prevention through ORM
- **Performance**: Optimized queries and proper indexing

## Common Development Tasks

### Adding New API Endpoints
1. Define Zod schema in `shared/schema.ts`
2. Add database operations to `server/storage.ts`
3. Create API route in `server/routes.ts`
4. Add frontend API call with React Query

### Creating New UI Components
1. Use Shadcn/ui primitives where possible
2. Follow Tailwind CSS design system
3. Add TypeScript interfaces for props
4. Include proper accessibility attributes

### Database Schema Changes
1. Modify `shared/schema.ts`
2. Run `npm run db:push` to apply changes
3. Update related TypeScript types
4. Test with existing data

### AI Feature Integration
1. Add API endpoint for AI service
2. Implement proper error handling and timeouts
3. Add content validation schemas
4. Create user-friendly loading states

This technical overview provides the foundation for any developer to understand and contribute to the MentorMe platform effectively.