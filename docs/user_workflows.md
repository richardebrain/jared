# MentorMe: User Workflows

## Overview

This document outlines the key user workflows for the MentorMe platform, organized by user role. It details the step-by-step processes that users follow to accomplish their goals within the system, with special emphasis on the early childhood educator experience.

## User Roles

The MentorMe platform supports the following user roles, each with different permissions and capabilities:

1. **Early Childhood Educators (Teachers)** - Primary users who access learning content, take assessments, and track their professional development
2. **School Administrators** - Manage teacher accounts, monitor progress, and customize school-specific content
3. **School Owners** - Have all administrative privileges plus ability to manage subscription and billing
4. **System Administrators** - Platform-wide administration and support

## Early Childhood Educator Workflows

### 1. Onboarding Process

**Goal**: Complete initial setup and begin the personalized learning journey

1. **Account Activation**
   - Receive email invitation from school administrator
   - Click activation link and set password
   - Complete user profile (name, job title, profile picture)

2. **Learning Style Assessment**
   - Take initial learning style quiz (visual, auditory, reading, kinesthetic)
   - System records preferences for personalization
   - View results and explanation of learning style implications

3. **Knowledge Baseline Assessment**
   - Complete domain knowledge assessment covering ITERS/ECERS framework areas
   - Assessment adapts difficulty based on performance
   - Receive baseline knowledge score and domain strengths/weaknesses

4. **Personalized Dashboard Introduction**
   - View tutorial explaining dashboard elements
   - See recommended modules based on assessment results
   - Set initial professional development goals

### 2. Daily Learning Workflow

**Goal**: Engage in regular professional development activities

1. **Login and Dashboard Review**
   - Log in to platform
   - View daily streak and point status
   - Check for new notifications or shoutouts
   - Review progress toward level advancement

2. **Module Selection**
   - Browse recommended modules based on knowledge gaps
   - Filter by category, duration, or difficulty
   - Preview module content and point value
   - Select module to begin

3. **Module Completion**
   - Watch/read module content at own pace
   - Complete embedded knowledge checks
   - Answer quiz questions at end of module
   - Receive immediate feedback on answers

4. **Progress Review**
   - View points earned and progress toward next level
   - See updated knowledge domain scores
   - Check off completed module from personal development plan
   - Share completion or insights with colleagues (optional)

### 3. Assessment Workflow

**Goal**: Measure knowledge growth and identify areas for improvement

1. **Self-Assessment Initiation**
   - Navigate to assessments section
   - Select self-assessment option
   - Choose domain focus area (or comprehensive assessment)
   - Begin assessment session

2. **Adaptive Assessment Experience**
   - Answer initial baseline questions
   - Receive progressively more challenging questions based on performance
   - Access hints or resources if struggling (with point reduction)
   - Complete required number of questions (typically 10-15)

3. **Assessment Results Review**
   - View overall score and comparison to previous assessments
   - See detailed breakdown by knowledge domain
   - Review correct answers and explanations for missed questions
   - Receive personalized recommendations for improvement

4. **Learning Path Adjustment**
   - Review updated personalized learning path
   - See newly recommended modules based on assessment results
   - Optionally modify learning goals based on results
   - Schedule next assessment (recommended quarterly)

### 4. Avatar and Rewards Workflow

**Goal**: Customize virtual representation and utilize earned rewards

1. **Bear Bucks Accumulation**
   - Earn Bear Bucks through module completion
   - Receive bonus Bear Bucks for assessment performance
   - Collect daily login streak bonuses
   - Earn special rewards for achievements

2. **Avatar Customization**
   - Navigate to avatar customization screen
   - Browse available items by category
   - Purchase items using Bear Bucks
   - Apply items to avatar and save configuration

3. **Achievement Tracking**
   - View current achievements and progress toward new ones
   - Claim rewards for completed achievements
   - Display achievement badges on profile
   - View position on school leaderboard

4. **Reward Redemption**
   - Browse reward options (avatar items, certificate templates, etc.)
   - Redeem Bear Bucks for chosen rewards
   - Apply digital rewards to profile
   - Download or share certificates of achievement

### 5. Community Interaction Workflow

**Goal**: Engage with other educators and share knowledge

1. **Shoutout Creation**
   - Navigate to shoutouts section
   - Select colleague to recognize
   - Choose core value demonstrated
   - Write personalized message
   - Submit shoutout (appears on recipient's dashboard and leaderboard)

2. **Community Content Engagement**
   - Browse community-shared modules
   - Rate and review completed modules
   - Bookmark useful resources
   - Filter by popularity or relevance

3. **Peer Progress Visibility**
   - View school leaderboard
   - See team progress toward school goals
   - Compare personal progress to anonymized peer averages
   - Celebrate team milestones

## School Administrator Workflows

### 1. Teacher Management

**Goal**: Manage teacher accounts and monitor progress

1. **Teacher Invitation**
   - Navigate to teacher management section
   - Enter teacher email and basic information
   - Customize invitation message
   - Send automated invitation

2. **Progress Monitoring**
   - View school-wide progress dashboard
   - Filter by teacher, domain, or time period
   - Identify teachers needing additional support
   - Generate progress reports

3. **Certification Tracking**
   - Monitor teacher certification expiration dates
   - Receive alerts for upcoming expirations
   - Update certifications when renewed
   - Generate compliance reports

### 2. Content Management

**Goal**: Customize and create learning content

1. **Module Creation**
   - Create new custom module
   - Add video, text, and assessment content
   - Set difficulty and point values
   - Publish to school's content library

2. **Content Curation**
   - Review system and community modules
   - Select relevant modules for school's library
   - Organize modules into learning paths
   - Feature priority content on school dashboard

### 3. School Customization

**Goal**: Personalize platform for school's identity

1. **Branding Configuration**
   - Upload school logo and images
   - Set school color scheme
   - Customize welcome messages
   - Configure school-specific achievement badges

2. **Core Values Definition**
   - Define school's core values
   - Create descriptions and examples
   - Configure shoutout categories
   - Set up core value recognition system

## School Owner Workflows

### 1. Subscription Management

**Goal**: Manage platform subscription and billing

1. **Plan Selection**
   - Review available subscription plans
   - Select appropriate teacher capacity
   - Choose billing cycle (monthly/annual)
   - Complete payment information

2. **Account Management**
   - Update billing information
   - Change subscription tier
   - View payment history
   - Download invoices

### 2. Administrator Assignment

**Goal**: Delegate administrative responsibilities

1. **Admin Role Assignment**
   - Navigate to user management
   - Select teachers to promote
   - Assign appropriate admin permissions
   - Send notification of role change

## Personalized Learning Path System

The personalized learning path is the core feature for early childhood educators on the MentorMe platform. It delivers targeted professional development based on individual needs while addressing school requirements.

### Initial Path Creation in MVP

1. **Baseline Data Collection**
   - **Learning Style Assessment**: 
     * Initial questionnaire identifying preferences (visual, auditory, reading/writing, kinesthetic)
     * Teachers self-rate effectiveness of different learning approaches
     * Example questions: "I learn best when I can see diagrams and illustrations" (visual) or "I prefer hands-on practice to understand new concepts" (kinesthetic)
   
   - **Knowledge Domain Assessment**:
     * Results from mandatory onboarding assessment
     * Performance scores across 6 early childhood domains
     * Identified knowledge gaps and strength areas
     * Difficulty level reached in each domain
   
   - **School Requirements**:
     * Mandatory training modules set by school administrator
     * Compliance requirements (health & safety, child protection)
     * School-specific policy modules
     * Required certification preparation

2. **Initial Path Algorithm**
   - **Priority Calculation**:
     * Knowledge gaps (score < 70% in domain) = Highest priority
     * School-required modules = High priority
     * Complementary content for strength areas = Medium priority
     * Special interest areas = Lower priority
   
   - **Content Selection Factors**:
     * 60% gap-filling content
     * 30% school-required content
     * 10% strength-building content
   
   - **Learning Style Integration**:
     * Visual learners receive more video, diagram, and visual demonstration content
     * Auditory learners receive more podcast, discussion, and lecture content
     * Reading/writing learners receive more text-based and writing-reflection content
     * Kinesthetic learners receive more interactive simulation and activity-based content
     * For each recommended module, the system selects presentation format matching the dominant learning style

### Learning Path Adaptation Mechanisms

1. **Performance-Based Triggers**
   
   The system modifies learning paths based on specific performance metrics:
   
   - **Low Module Quiz Performance** (< 70% correct)
     * Generates supplemental content recommendations
     * May repeat key concepts in different learning format
     * Reduces difficulty level of subsequent content
     * Example: Teacher struggles with behavior management quiz → System adds foundational module on child development psychology
   
   - **High Module Quiz Performance** (> 90% correct)
     * Advances content difficulty
     * Reduces similar content recommendations
     * Offers opportunity to skip related introductory content
     * Example: Teacher excels at curriculum planning → System offers advanced unit planning modules
   
   - **Completion Speed**
     * Unusually quick completion with high scores triggers more challenging content
     * Slow completion triggers additional support resources
     * Consistent pace receives standard progression
   
   - **Engagement Patterns**
     * High engagement with specific content types influences future recommendations
     * Low engagement prompts learning format changes
     * Example: Teacher consistently completes video modules but abandons text-based content → System prioritizes video format

2. **Content Balancing Rules**
   
   The system maintains balance between requirements and personalization:
   
   - **School Required vs. Personal Growth**
     * Minimum 30% of recommendations must be school-required content
     * Content alternates between required and personalized to maintain engagement
     * School requirements front-loaded when time-sensitive (e.g., compliance deadlines)
   
   - **Theory vs. Practical Application**
     * Maintains 40/60 ratio of theoretical to practical content
     * Theoretical foundation provided before practical application
     * Practical application follows knowledge acquisition in same domain
   
   - **Domain Coverage**
     * No domain can represent more than 40% of active recommendations
     * All domains receive minimum representation (at least 5%)
     * Weaker domains receive proportionally more content

3. **Timeline and Scheduling Factors**
   
   The system considers timing and scheduling constraints:
   
   - **Time-to-Completion Estimates**
     * Each module tagged with typical completion time
     * Path considers available teacher time (set in preferences)
     * Suggests daily/weekly goals based on teacher schedule
   
   - **Seasonal Relevance**
     * Content aligned with academic calendar when appropriate
     * Special topics for beginning/end of school year
     * Timely topics prioritized (e.g., parent conferences, transitions)
   
   - **Certification Deadlines**
     * System tracks certification expiration dates
     * Required renewal content prioritized as deadlines approach
     * Preparation content scheduled to complete before testing windows

### Learning Path Components for Early Childhood Educators

1. **Module Types and Formats**
   
   The system offers diverse content formats aligned with early childhood practice:
   
   - **Video Demonstration Modules**
     * Expert teachers demonstrating techniques
     * Classroom scenarios with analysis
     * Narrated examples of best practices
     * Virtual classroom observation opportunities
     * Example: "Effective Circle Time Management for 3-4 Year Olds"
   
   - **Interactive Case Studies**
     * Scenario-based decision making
     * Branching narratives with consequences
     * Real-world problem solving with feedback
     * Example: "Navigating Challenging Behaviors: What Would You Do?"
   
   - **Reflection and Application**
     * Guided reflection on current classroom practice
     * Implementation planning templates
     * Documentation tools for classroom application
     * Example: "Applying Learning Centers to Your Current Classroom"
   
   - **Resource Collections**
     * Curated materials for classroom use
     * Printable activities and assessment tools
     * Parent communication templates
     * Example: "STEM Activities for Preschool: Ready-to-Use Resources"

2. **Practical Implementation Support**
   
   Content designed to bridge theory and classroom practice:
   
   - **Classroom Implementation Guides**
     * Step-by-step instructions for implementing new techniques
     * Materials lists and preparation guidance
     * Troubleshooting common challenges
     * Example: "Implementing Learning Centers: First Steps Guide"
   
   - **Peer Connection Opportunities**
     * Discussion prompts for team learning
     * Shared experiences from other teachers
     * Collaborative challenge activities
     * Example: "Mentor Circle: Discussing Child-Led Curriculum Planning"
   
   - **Environmental Assessment Tools**
     * Classroom environment evaluation checklists
     * Self-assessment of teaching practice
     * Guided improvement planning
     * Example: "ECERS Self-Assessment: Improving Your Physical Environment"

3. **Specialized Early Childhood Content**
   
   Domain-specific content aligned with quality standards:
   
   - **Child Development Modules**
     * Age-specific developmental milestones
     * Brain development and learning science
     * Developmentally appropriate practice
     * Example: "Understanding Executive Function in Preschoolers"
   
   - **Curriculum and Planning**
     * Emergent curriculum techniques
     * Child-centered activity planning
     * Assessment and documentation methods
     * Example: "Project Approach: Planning Child-Led Investigations"
   
   - **Family Engagement**
     * Family communication strategies
     * Parent conference preparation
     * Cultural responsiveness
     * Example: "Building Partnerships: Effective Family Communication"
   
   - **Health and Safety**
     * Required certification preparation
     * Crisis response procedures
     * Health and wellness promotion
     * Example: "Recognizing and Reporting: Child Protection Training"

## Assessment System Details

The assessment system is designed to accurately measure early childhood educator knowledge while providing a constructive experience that aligns with professional development goals in the preschool teaching environment.

### Assessment Types

1. **Onboarding Baseline Assessment (MVP)**
   - Mandatory comprehensive evaluation across all early childhood knowledge domains
   - Based on ITERS/ECERS framework and CLASS assessment standards
   - Covers classroom management, child development, safety, curriculum planning, and parent engagement
   - Typically 30-45 questions (5-7 questions per domain)
   - Results directly seed the initial personalized learning path
   - Required for all teachers during first platform login

2. **Future Assessment Types (Post-MVP)**
   - **Domain-Specific Assessment**: Focused evaluation of single knowledge area
   - **Quick Knowledge Checks**: Brief assessments embedded within learning modules
   - **Self-Assessment**: Reflection-based evaluation of teaching practice
   - **Observational Assessment**: Integration of classroom observation data

### Adaptive Difficulty Algorithm

1. **Initial Difficulty Determination**
   - All teachers begin with medium difficulty questions (level 3 on 1-5 scale)
   - Initial questions are carefully selected to represent core competencies in early childhood education
   - Questions drawn from validated item bank aligned with NAEYC standards
   - First 3-5 questions establish baseline performance before adaptation begins

2. **Difficulty Adjustment Metrics**
   - Consecutive correct answers (3+) trigger difficulty increase (+1 level)
   - Consecutive incorrect answers (2+) trigger difficulty decrease (-1 level)
   - Mixed performance maintains current difficulty level
   - Difficulty boundaries enforced (cannot go below level 1 or above level 5)
   - Example progression:
     * Start: Medium (level 3)
     * Answer correctly 3 times → Difficulty increases to level 4
     * Answer incorrectly 2 times → Difficulty decreases to level 3
     * Mixed correct/incorrect → Remains at level 3

3. **Domain-Specific Adaptation**
   - Difficulty adjusts independently within each knowledge domain
   - System tracks performance in:
     * Child Development Knowledge
     * Classroom Environment Management
     * Curriculum Planning & Implementation
     * Health & Safety Protocols
     * Family Engagement Practices
     * Professional Development Knowledge
   - Teacher can excel in one domain while receiving extra support in others

4. **Question Selection Logic**
   - Questions are tagged with:
     * Knowledge domain and sub-domain
     * Difficulty rating (1-5)
     * Question type (multiple choice, scenario-based, etc.)
     * Alignment with specific standards (NAEYC, state requirements)
   - Selection algorithm ensures:
     * No question repeats within same assessment session
     * Appropriate difficulty level based on current performance
     * Coverage across all relevant sub-domains
     * Mix of theoretical and practical application questions
   - Questions with contextual relevance to preschool environments are prioritized

### Assessment Feedback System

1. **Immediate Question Feedback**
   - Correct/incorrect indication immediately after each answer
   - Brief explanation of correct answer with early childhood education context
   - Supporting research or best practice citation
   - Visual indicators (green/red) with accessible design considerations

2. **Comprehensive Assessment Report**
   - Overall score with comparison to professional standards
   - Detailed breakdown by knowledge domain
   - Visual representation of strengths and growth areas specific to early childhood education
   - Identified knowledge gaps with highest priority for improvement
   - Example feedback: 
     * "Strong understanding of child development principles"
     * "Growth opportunity in positive behavior management techniques"
     * "Consider focusing on age-appropriate STEM activities"

3. **Actionable Recommendations**
   - 3-5 specific learning modules recommended based on identified gaps
   - Practical classroom implementation suggestions for each growth area
   - Relevant resources from respected early childhood organizations (NAEYC, Zero to Three)
   - Printable summary for professional development documentation

4. **Progress Comparison**
   - Baseline comparison for subsequent assessments
   - Growth percentage by domain
   - Achievement recognition for significant improvement
   - Professional development hour tracking for certification requirements

### Assessment Data Utilization

1. **Learning Path Generation**
   - Assessment results directly inform personalized learning path
   - Identified knowledge gaps become priority learning modules
   - Strength areas unlock more advanced content options
   - School requirements integrated with personal growth needs

2. **School-Level Insights**
   - Aggregated, anonymized data shows school-wide professional development needs
   - Administrators can identify common growth areas across teaching staff
   - Targeted professional development planning based on collective results
   - Progress tracking against school quality improvement goals

3. **Standards Alignment**
   - Assessment performance mapped to relevant quality rating systems
   - Progress toward meeting state licensing requirements
   - Documentation for accreditation processes
   - Evidence for professional advancement opportunities

## Common Cross-Role Workflows

### 1. Notification Management

**All Users**
1. Receive in-app notifications
2. Optionally receive email digests
3. Configure notification preferences
4. Take action on or dismiss notifications

### 2. Account Management

**All Users**
1. Update profile information
2. Change password
3. Manage communication preferences
4. Access help and support

### 3. Content Search

**All Users**
1. Search content by keyword
2. Filter by multiple parameters
3. Save search preferences
4. Bookmark content for later access

## Appendix: User Journey Maps

### New Teacher First Month Journey

**Week 1**
- Account activation and profile setup
- Learning style assessment
- Baseline knowledge assessment
- First 2-3 introductory modules

**Week 2**
- Daily login habit formation
- Complete 3-5 modules in weakest domain
- First self-assessment in strongest domain
- Avatar customization with initial Bear Bucks

**Week 3**
- Increased module difficulty
- First peer shoutout given and received
- Achievement of first mastery badge
- Completion of school-required modules

**Week 4**
- Review of first month progress
- Adjustment of learning goals
- Comprehensive self-assessment
- Planning for next month's focus areas

### Administrator Monthly Workflow

**Week 1**
- Review previous month's school-wide progress
- Identify teachers needing additional support
- Update content featured on school dashboard
- Send recognition for top performers

**Mid-Month**
- Check-in on monthly completion goals
- Manage any new teacher additions
- Review community content for school relevance
- Update school announcements

**End of Month**
- Generate monthly progress reports
- Plan next month's featured content
- Review certification status updates
- Conduct teacher achievement recognition