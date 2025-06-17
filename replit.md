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

- June 17, 2025: **Perfect Manager Legendary Leadership Coaching System** - Successfully transformed the Perfect Manager into a comprehensive role-playing practice platform featuring the first tab "Practice Conversations" that blends wisdom from legendary leaders through Brené Brown's empathetic voice. The system integrates Tony Robbins' inspirational energy and solution focus, Simon Sinek's intellectual clarity and purposeful leadership, and Brené Brown's vulnerability-based authenticity into cohesive empathetic guidance. Features include: role-playing practice interface where directors rehearse conversations by playing both employee and director perspectives, conversation starter prompts to help directors understand how to begin practice sessions, simplified AI responses that start with curious questions (2-3 sentences maximum) rather than long advice, real-time coaching that addresses emotional and strategic aspects simultaneously, blended communication style that balances compassion with accountability. Directors can now practice difficult conversations while receiving guidance that combines peak performance principles, purposeful clarity, and vulnerable courage delivered in Brené Brown's authentic, question-first coaching style.
- June 17, 2025: **Perfect Manager Legendary Leadership Integration** - Enhanced Perfect Manager AI to synthesize wisdom from the greatest leadership minds of all time: Tony Robbins (peak performance), Dale Carnegie (influence), Stephen Covey (principles), Brené Brown (vulnerability), Simon Sinek (purpose), and Zig Ziglar (motivation). Each scenario now applies specific principles from these experts with scenario-specific system prompts. Increased AI token limit to 6000, improved JSON parsing with partial recovery system, and created fallback responses based on proven leadership principles when parsing fails. The system now transforms workplace challenges into breakthrough moments using timeless leadership strategies.
- June 17, 2025: **Perfect Manager AI Differentiation System** - Completely redesigned the AI prompt system to generate truly unique advice for each workplace scenario. Implemented scenario-specific system prompts and constraints for 8 different management challenges (tardiness, burnout, performance, communication, motivation, teamwork, attendance, training). Each scenario now has specialized focus areas and explicit constraints preventing generic responses. Enhanced conversation scripts with inspirational messaging about "writing chapter one" privilege, mindful mornings guidance, and "kids will love what you love" principle. Added comprehensive conversation script tab with structured talking points for directors.
- June 17, 2025: **Conversation Script Feature for Perfect Manager** - Added comprehensive conversation script functionality to Perfect Manager providing directors with specific talking points and inspirational messaging. Features include opening lines that set caring tone, listening prompts to encourage sharing, detailed response scenarios with teacher reactions and director replies, and inspiring closing statements. Scripts emphasize "we get to write chapter one" privilege of working with children, mindful mornings and self-care importance, bringing authentic energy, and "kids will love what you love" principle. Enhanced AI prompts to generate scenario-specific advice preventing generic responses across different workplace challenges.
- June 17, 2025: **Perfect Manager ECE-Specific Enhancement** - Enhanced the Perfect Manager AI advisor with deep early childhood education expertise and industry-specific guidance. Updated AI prompts to address ECE-specific stressors like emotional labor, parent communication challenges, and classroom management with young children. Added "Core Values Connection" section linking management strategies to fundamental ECE values. Improved root cause analysis to consider inadequate compensation, lack of professional recognition, and work-life balance issues unique to preschool educators. Enhanced motivational techniques to connect with teachers' passion for child development and their calling to nurture young minds. Includes "they don't care until they know you care" principle emphasizing relationship-building as foundation for effective management.
- June 16, 2025: **Matching Activity Randomization Enhancement** - Enhanced matching activities with comprehensive shuffle functionality to increase difficulty and engagement. Both left-side draggable items and right-side drop zones are now randomized independently on each module load using Fisher-Yates algorithm. This prevents teachers from memorizing visual patterns and ensures they must actually understand content relationships to succeed. Maintains full drag-and-drop functionality while providing varied, challenging educational experiences.
- June 16, 2025: **Matching Activity Drag-and-Drop Functionality Fix** - Completely resolved matching activity interaction issues by restructuring ID system and data flow. Fixed problems where dragging items would light up all zones incorrectly by implementing proper unique ID generation (leftId, rightId) for AI-generated pairs that lack IDs. Updated matching logic, scoring calculations, and visual feedback to work with shuffled content arrays. Matching activities now provide smooth drag-and-drop experience with accurate scoring and proper visual feedback.
- June 16, 2025: **AI Generation and Content Parsing Resolution** - Successfully resolved all AI content generation timeout issues and parsing problems across quiz, matching, and scenario sections. Removed Promise.race timeout wrappers that were causing generation failures and enhanced content parsing to handle multiple AI response formats. Fixed quiz display issues and matching activity data structure handling. All section types now generate and display properly with comprehensive error handling and debug logging.
- June 16, 2025: **Auto-Save Draft System Implementation** - Added comprehensive auto-save functionality to AI module creator preventing work loss during module development. Features include: automatic saving after AI section generation (1 second delay), auto-save after manual content edits (2 second delay), visual save status indicator showing "Saving draft..." with spinner and "Saved [time]" with checkmark, integration with existing draft system infrastructure, proper error handling and state preservation. Teachers can now create modules without fear of losing progress during long editing sessions.
- June 16, 2025: **Publish Button Authentication Fix** - Resolved authentication issue preventing module publishing by adding requireAuth middleware to /api/modules/publish endpoint. Modules can now be properly saved and published to the community library.
- June 16, 2025: **Publish Button Debugging Enhancement** - Enhanced error logging system for module publishing to identify exact failure points. Added comprehensive logging to saveModule function including data validation, API request tracking, response status monitoring, and user-friendly error messages with toast notifications. Fixed template duration parsing to handle "Variable" duration and non-standard formats. Publishing workflow now provides detailed debugging information for troubleshooting.
- June 16, 2025: **AI Generation System Fully Restored** - Successfully resolved all AI content generation issues with comprehensive error handling and timeout protection. Fixed "Generate with AI" button functionality across all section types (text, quiz, matching, scenario, video). Confirmed AI generation working properly for all three section types with full contextual content generation. Enhanced error logging and user feedback with toast notifications for better debugging experience.
- June 16, 2025: **Image Upload Toast Notification Fix** - Fixed image upload feedback system where users weren't receiving visual confirmation that images were saved. Added proper toast notifications using useToast hook to show "Image Uploaded & Saved!" message with image description. Enhanced user experience by providing clear confirmation that auto-save functionality is working. Images now display immediate feedback when successfully stored in database structure.
- June 16, 2025: **Module Display Issue Resolution** - Successfully resolved critical module display problem where user-created modules weren't appearing in "My Modules" section. Fixed database creator_id assignment issue for modules missing proper ownership (module ID 62: "Classroom management and transitions"). Updated routing system with `/new-module-creator` alias to prevent 404 errors. Cleaned up debugging code after successful resolution. Users now see all their personal modules correctly with proper edit access.
- June 16, 2025: **Navigation Button Update** - Changed comprehensive module creator "Back to Admin" button to navigate to dashboard instead for better user flow consistency.
- June 16, 2025: **Image Persistence Auto-Save System** - Fixed critical issue where AI-generated and uploaded images created during module building weren't being saved to the database. Implemented comprehensive auto-save functionality in TextSectionBuilder that immediately persists images when added or removed. Images are now stored in content.blocks[0].images array structure and automatically saved on every image operation. This ensures teachers can see their educational illustrations during module playback without manual saving requirements.
- June 16, 2025: **Video URL Detection Fix** - Fixed critical issue where custom video URLs weren't being detected in module playback. Updated video URL extraction logic in ModulePlayer to properly handle user-added videos stored in content.blocks[0].content structure. Videos now display correctly regardless of how they were added (AI-generated or manually entered). Enhanced URL detection with comprehensive debugging logs for future troubleshooting.
- June 16, 2025: **Custom Template Title Cleanup** - Removed "Custom Template" prefix from module titles in both display logic and database records. Updated ModulePlayer and CommunityModules components to clean titles using regex replacement, and executed SQL update to fix existing database records. Module titles now show authentic user-provided names without system-generated prefixes.
- June 16, 2025: **Image Upload Integration in Text Sections** - Added comprehensive image upload functionality to TextSectionBuilder alongside existing AI image generation. Users can now upload images directly from their device with file validation (image types only, 5MB limit), automatic data URL conversion, and proper integration into module content structure. Uploaded images are saved with module sections and displayed in ModulePlayer during teaching experience. Enhanced user flexibility by providing both AI-generated and user-uploaded image options.
- June 16, 2025: **Module Card UI Modernization** - Updated new module page cards to match teacher tools styling with gradient backgrounds, hover animations, floating circle effects, and purple/blue color scheme. Added proper empty state message when no modules exist instead of showing fake placeholders. Cards now feature enhanced visual hierarchy, gradient buttons, and improved star rating display with smooth transitions and modern visual effects.
- June 16, 2025: **Fixed Message Notification Systems** - Resolved multiple notification and cache issues: Fixed WelcomeDashboard to only show unread messages preventing dismissed core value nominations from reappearing at login, fixed module deletion cache invalidation so deleted modules immediately disappear from screen, corrected X button functionality for dismissing messages in header dropdown with proper event handling and query invalidation. Message filtering now consistent across all components showing only unread notifications.
- June 16, 2025: **Module Deletion with Confirmation System** - Added comprehensive module deletion functionality to the new-module-creator page. Features include: red-styled delete button with trash icon alongside View and Edit buttons, "Are you sure?" confirmation dialog showing the exact module title being deleted, proper API integration with DELETE endpoint, automatic refresh of module list after successful deletion, loading states and error handling with descriptive messages. Users can now safely manage their module library with appropriate safety measures to prevent accidental deletions.
- June 16, 2025: **Comprehensive Pass/Fail Tracking System** - Implemented complete pass/fail tracking for module completion that properly handles quiz scoring requirements. Added `passed` boolean and `finalScore` numeric fields to user_progress table. Updated ModulePlayer component to track pass status (80% quiz score requirement) and properly award points only for passed modules. Enhanced progress API to handle pass/fail data and modified all dashboard and modules displays to show checkmarks only for successfully passed modules. Fixed quiz completion flow to allow retakes for failed attempts while maintaining proper completion tracking. Module completion counts now accurately reflect only passed modules across the entire platform.
- June 16, 2025: **Module Title Preservation and Star Rating Updates** - Fixed critical issue where custom template modules were incorrectly saved with "Custom Template" prefix instead of user's actual module titles. Updated handleTemplateSelect function to preserve user-provided titles for custom templates. Enhanced star rating system with immediate query invalidation to refresh community module ratings in real-time after submissions. Corrected existing database records by removing "Custom Template" prefixes from previously affected modules. Community modules now display authentic data with proper error handling when API connections fail.
- June 16, 2025: **Dashboard Redirect After Module Completion** - Implemented automatic dashboard navigation after module completion regardless of pass/fail status. Fixed database error preventing rating submissions by removing reference to non-existent 'updated_at' column in module_ratings table. Added dashboard redirects with appropriate delays: 2 seconds after rating submission, 1 second when skipping rating, and 3 seconds after failed retake attempts. Enhanced user flow to ensure seamless return to dashboard after any module completion scenario.
- June 16, 2025: **AI-Generated Image Display Integration** - Fixed AI-generated images not appearing in module sections during the teaching experience. Updated ModulePlayer component to properly display images from both `imageUrl` field and `content.blocks[0].images` array structure. Images now appear in all section types (text, default, etc.) with proper error handling, descriptions, and responsive design. Teachers can now see the AI-generated visual content they created during module development.
- June 16, 2025: **Scenario-Match Activity Enhancement** - Fixed comprehensive issues with scenario-match activities to ensure proper functionality across all module types. Improvements include: multi-scenario component that cycles through all scenarios in sequence, proper correct answer display when users select wrong options, enhanced feedback system with detailed explanations, scenario progress counter (1 of 3, 2 of 3), fixed answer validation for both string and index-based answers, consistent 0-point award policy (only final quiz awards points). Activities now provide complete educational experiences with proper progression through all scenarios.
- June 16, 2025: **ECE Hours Tracking System** - Implemented comprehensive ECE (Early Childhood Education) hours tracking that automatically records training hours when teachers complete eligible modules. Features include: automatic hours tracking upon module completion, ECE category-based organization (social-emotional, cognitive-development, etc.), approved trainer validation system, API endpoints for hours retrieval and manual entry, database schema with ece_hours table and learning module ECE fields, integration with existing progress tracking system. Teachers' learning paths now maintain detailed ECE compliance records for professional development requirements.
- June 16, 2025: **Custom Template System with Section Management** - Added comprehensive Custom Template option allowing users to build modules with personalized sections in any order. Features include: Add Section dialog with 11 section types (text, video, quiz, matching, scenario, example, story, triage, mnemonic, simulation, scenario-match), delete section functionality with UI protection, dynamic section reordering, custom titles and durations. Updated all video sections from 3 to 6 minutes duration across templates.
- June 16, 2025: **Improved Image Generation Accuracy** - Enhanced prompt engineering to prioritize user descriptions and reduce confusing AI instructions. Updated backend to use cleaner, more focused prompts that follow user intent better. Improved style options with specific visual descriptors (cartoon illustration, clean backgrounds, vibrant colors). Fixed frontend API calls to use direct fetch for more reliable image generation responses.
- June 15, 2025: **Enhanced Image Generation Quality & UX** - Upgraded lesson plan image generator to use high-definition (HD) quality settings by default instead of standard quality. Added intelligent prompt enhancement for educational content that automatically improves prompts with professional styling, clean layouts, child-friendly designs, and classroom-appropriate formatting. Enhanced prompts now include specifications for typography, color palettes, visual hierarchy, and educational icons. Implemented comprehensive loading experience with 30-60 second time expectations, progress indicators, and detailed status updates during HD image generation.
- June 15, 2025: **Fixed Percentage Display** - Updated progression map to show rounded percentages (81% instead of 80.666%) for cleaner user interface presentation.
- June 15, 2025: **Points System Bug Fix** - Resolved API request format issue in ModulePlayer component where points award system was failing due to incorrect data structure. Fixed apiRequest calls to use proper data parameter instead of JSON.stringify.
- June 15, 2025: **Star Rating System Implementation** - Added comprehensive star rating functionality for teachers to rate modules after completion. Features include: automatic rating dialog display upon module completion, 1-5 star rating system with optional comments, real-time average rating calculation and display, community modules now show star ratings with visual indicators, rating API endpoints for submission and retrieval. Fixed community modules filtering to show user's own shared modules.
- June 15, 2025: **Community Module Display Enhancement** - Resolved issue where users couldn't see their own shared modules by removing school-based filtering restrictions. Community modules now display all shared content including from the user's own school, with proper star rating visualization.
- June 14, 2025: **Enhanced Visual Lesson Plan Generator** - Improved the AI-powered image generation tool with text-aware prompts and "Pretty Formatted Plan" option. Now extracts actual lesson plan content to avoid spelling errors and create bulletin board-ready displays for parents. Features include: text-aware image generation using real lesson content, four visual types (infographic, sections, formatted plan, wall display), and medium quality images as standard.
- June 14, 2025: **Level System Redesign** - Updated level calculation to match teacher progression roles instead of arbitrary point thresholds. Levels now correspond to: Assistant (1), Associate (2), Lead (3), Senior (4), Master (5). Created shared level utilities for consistent calculation across frontend and backend.
- June 13, 2025: Enhanced point system with 5-30 point range across all module creation tools
- June 13, 2025: Fixed streak reward system and updated landing page design
- June 13, 2025: Initial setup

## Changelog

- June 13, 2025. Initial setup

## User Preferences

Preferred communication style: Simple, everyday language.