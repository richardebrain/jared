# MentorMe ECE Assessment Platform

## Overview

MentorMe is a professional development platform designed specifically for early childhood educators (ECE). The platform combines AI-powered content generation, interactive learning modules, comprehensive assessment systems, and gamification elements to create an engaging educational experience for teachers.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **UI Library**: Shadcn/ui components with Radix UI primitives
- **Styling**: Tailwind CSS with custom design system
- **State Management**: React Query (TanStack Query) for server state
- **Routing**: React Router for client-side navigation
- **Build Tool**: Vite for fast development and optimized builds

### Backend Architecture
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js for REST API
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Session-based auth with PostgreSQL session store
- **AI Integration**: Multiple AI providers (Anthropic Claude, OpenAI, Perplexity)
- **Voice Features**: ElevenLabs for text-to-speech generation

### Database Design
- **ORM**: Drizzle ORM with PostgreSQL adapter
- **Schema**: Comprehensive schema covering users, schools, assessments, modules, streaks, and certifications
- **Migrations**: Automated database migrations using Drizzle Kit
- **Data Sources**: Integration with CSV-based video libraries and professional development resources

## Key Components

### Authentication System
- User registration and login with session management
- School-based organization with subscription tiers
- Role-based access control (teachers, administrators)
- Password hashing with bcrypt for security

### Assessment Engine
- Adaptive difficulty progression (6-level system)
- Weighted domain selection for balanced assessment
- Fallback strategies for question availability
- Answer timing validation and scoring
- Learning path recommendations based on performance

### Module Creator System
- AI-powered content generation for multiple content types
- 9 specialized builders: Scenario, Matching, Example, Slide, Triage, Mnemonic, Simulation, Activity, and Scenario-Match
- Manual content creation with rich text editing
- PowerPoint import functionality for existing materials
- Section-based module structure with progress tracking

### Gamification Features
- Points system with difficulty-based rewards (5-20 points per question)
- Streak tracking with milestone rewards (5-day Silver Box system)
- Bear Bucks virtual currency for platform purchases
- Achievement system and progress visualization
- Leaderboards and social features

### Video Library Integration
- Comprehensive video resources from professional development libraries
- YouTube integration with availability checking
- Quiz generation for video content
- Categorization and tagging system
- Bookmark and watch later functionality

## Data Flow

### Assessment Flow
1. User starts assessment with default medium difficulty
2. Weighted domain selector chooses next question domain
3. Fallback strategy ensures question availability
4. Answer validation and scoring occurs
5. Difficulty adjusts based on performance
6. Learning paths are recommended based on results

### Module Creation Flow
1. User selects module type (AI-generated, manual, or PowerPoint import)
2. AI generates content blocks based on topic and section type
3. User reviews and edits generated content
4. Specialized builders handle specific content types
5. Module is published to library with metadata
6. Progress tracking and completion certificates are generated

### Points and Rewards Flow
1. User completes activities (assessments, modules, videos)
2. Points are awarded based on difficulty and performance
3. Streak tracking updates daily login records
4. Milestone rewards are unlocked and claimable
5. Bear Bucks are earned and can be spent on platform features

## External Dependencies

### AI Services
- **Anthropic Claude**: Primary AI for content generation and lesson planning
- **OpenAI GPT**: Backup AI service and specialized content generation
- **Perplexity API**: Research and fact-checking capabilities

### Third-Party Integrations
- **ElevenLabs**: Professional text-to-speech generation
- **YouTube API**: Video validation and embedding
- **Stripe**: Payment processing for subscriptions
- **SendGrid**: Email notifications and communications
- **Slack**: Optional team communication integration

### Development Tools
- **Drizzle Kit**: Database migrations and schema management
- **Jest**: Testing framework for backend algorithms
- **ESBuild**: Fast JavaScript bundling
- **TypeScript**: Type safety across the entire stack

## Deployment Strategy

### Environment Configuration
- **Development**: Local development with hot reloading via Vite
- **Production**: Autoscale deployment on Replit infrastructure
- **Database**: PostgreSQL with connection pooling
- **Static Assets**: Served through Vite build process

### Build Process
1. Frontend builds to `dist/public` directory
2. Backend compiles TypeScript to ES modules
3. Database migrations run automatically on deployment
4. Environment variables configure API keys and database connections

### Monitoring and Logging
- Console logging for development debugging
- Error tracking through custom error handlers
- Performance monitoring through request timing
- Database query optimization with Drizzle ORM insights

## Recent Changes

- June 14, 2025: **Visual Lesson Plan Generator** - Added AI-powered image generation tool to both lesson plan creators using OpenAI DALL-E 3. Teachers can now transform their lesson plans into beautiful, shareable visuals with customizable styles (whimsical, modern, storybook, photographic) and target audiences (training, parents, classroom display). Integrated into both the advanced lesson plan creator and simple lesson plan maker.
- June 14, 2025: **Level System Redesign** - Updated level calculation to match teacher progression roles instead of arbitrary point thresholds. Levels now correspond to: Assistant (1), Associate (2), Lead (3), Senior (4), Master (5). Created shared level utilities for consistent calculation across frontend and backend.
- June 13, 2025: Enhanced point system with 5-30 point range across all module creation tools
- June 13, 2025: Fixed streak reward system and updated landing page design
- June 13, 2025: Initial setup

## Changelog

- June 13, 2025. Initial setup

## User Preferences

Preferred communication style: Simple, everyday language.