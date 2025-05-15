/**
 * Script to update the Child Development Milestones module with comprehensive content
 * Focused on providing teachers with age-appropriate milestone information and government resources
 */

import { db } from './db';
import { storage } from './storage';

/**
 * Updates the Child Development Milestones module with content that adapts to teacher skill level.
 * This creates a hybrid approach:
 * 1. Static, comprehensive information about milestones (accessible to all teachers)
 * 2. Dynamic, skill-level appropriate content generated via Perplexity
 *
 * @param userId Optional user ID to create personalized content (if not provided, creates base module)
 */
async function updateChildDevelopmentModule(userId?: number) {
  try {
    console.log('Starting Child Development Milestones module update...');
    
    // Child Development Milestones module ID
    const moduleId = 6;
    
    // Get current module data
    const module = await storage.getModule(moduleId);
    
    if (!module) {
      console.error('Module not found!');
      return;
    }
    
    // If a userId is provided, get their skill level to personalize content
    let teacherLevel = 'assistant'; // Default level for new teachers
    let userProgress = null;
    
    if (userId) {
      try {
        // Get user data
        const user = await storage.getUser(userId);
        
        // Get their progress records
        const progressRecords = await storage.getUserProgressByUserId(userId);
        
        // Get progress specifically for this module
        userProgress = progressRecords.find(p => p.moduleId === moduleId);
        
        // Determine teacher level from their achievements/points
        if (user && user.points) {
          if (user.points >= 500) {
            teacherLevel = 'master';
          } else if (user.points >= 250) {
            teacherLevel = 'lead';
          } else if (user.points >= 100) {
            teacherLevel = 'teacher';
          }
        }
        
        console.log(`Generating content for user ID ${userId} with teacher level: ${teacherLevel}`);
      } catch (userError) {
        console.error('Error getting user data for personalization:', userError);
        // Continue with default level if there's an error
      }
    }
    
    // Generate the base content that will be available to all teachers
    const baseContent = generateMilestonesContent();
    
    // Create dynamic section based on teacher level (will be populated by Perplexity API)
    let adaptiveContent = '';
    try {
      adaptiveContent = await generateAdaptiveContent(teacherLevel, userProgress);
    } catch (adaptiveError) {
      console.error('Error generating adaptive content:', adaptiveError);
      // If there's an error, create simple adaptive content without API
      adaptiveContent = createFallbackAdaptiveContent(teacherLevel);
    }
    
    // Combine the static and dynamic content
    const combinedContent = injectAdaptiveContent(baseContent, adaptiveContent, teacherLevel);
    
    // Generate quiz with appropriate difficulty
    const quiz = generateMilestonesQuiz(teacherLevel);
    
    // Prepare comprehensive module content
    const updatedModule = {
      ...module,
      content: combinedContent,
      quiz: quiz
    };
    
    // Update the module
    await storage.updateModule(moduleId, updatedModule);
    
    console.log('Child Development Milestones module updated successfully!');
    return updatedModule;
  } catch (error) {
    console.error('Error updating Child Development Milestones module:', error);
    throw error;
  }
}

function generateMilestonesContent() {
  return `
<div class="module-content">
  <section class="learning-objectives">
    <h2>Learning Objectives</h2>
    <p>By the end of this module, you will be able to:</p>
    <ul>
      <li>Identify key developmental milestones for children ages 0-5 years</li>
      <li>Recognize red flags that may indicate developmental concerns</li>
      <li>Access and utilize government resources for developmental monitoring</li>
      <li>Communicate effectively with parents about child development</li>
      <li>Implement classroom strategies that support developmental progression</li>
    </ul>
  </section>
  
  <section class="introduction">
    <h2>Introduction</h2>
    <p>Understanding child development milestones is essential for early childhood educators. These milestones serve as guideposts to help us recognize typical patterns of growth and identify potential developmental concerns early when intervention is most effective.</p>
    <p>This module provides a comprehensive overview of developmental milestones across five domains: physical, cognitive, language, social-emotional, and self-help skills. We'll explore resources from trusted government agencies and learn to apply this knowledge in the classroom.</p>
    <p>Remember, every child develops at their own pace, and there's a range of what's considered "typical" development. Our goal is to support each child's individual journey while being alert to signs that additional support may be beneficial.</p>
  </section>

  <section class="developmental-domains">
    <h2>The Five Domains of Development</h2>
    
    <div class="domain-card">
      <h3>1. Physical Development</h3>
      <p>Includes gross motor skills (large movements like crawling, walking, running) and fine motor skills (smaller movements like grasping, drawing, cutting).</p>
      <p><strong>Why it matters:</strong> Physical skills enable children to explore their environment, participate in activities, and develop independence.</p>
    </div>
    
    <div class="domain-card">
      <h3>2. Cognitive Development</h3>
      <p>Involves thinking, learning, problem-solving, reasoning, and understanding concepts.</p>
      <p><strong>Why it matters:</strong> Cognitive skills form the foundation for academic learning and help children make sense of their world.</p>
    </div>
    
    <div class="domain-card">
      <h3>3. Language Development</h3>
      <p>Encompasses receptive language (understanding), expressive language (speaking), and early literacy skills.</p>
      <p><strong>Why it matters:</strong> Language allows children to communicate needs, form relationships, and later succeed in reading and writing.</p>
    </div>
    
    <div class="domain-card">
      <h3>4. Social-Emotional Development</h3>
      <p>Includes forming relationships, recognizing emotions, self-regulation, and developing empathy.</p>
      <p><strong>Why it matters:</strong> Social-emotional skills help children navigate relationships, handle challenges, and develop a positive self-concept.</p>
    </div>
    
    <div class="domain-card">
      <h3>5. Self-Help/Adaptive Skills</h3>
      <p>Involves developing independence in daily living activities like eating, dressing, and personal hygiene.</p>
      <p><strong>Why it matters:</strong> These skills promote confidence, autonomy, and prepare children for school and life.</p>
    </div>
  </section>

  <section class="age-based-milestones">
    <h2>Key Milestones by Age</h2>
    
    <div class="age-milestone-card">
      <h3>2-Month Milestones</h3>
      <div class="milestone-list">
        <p><strong>Social/Emotional:</strong> Begins to smile at people, can briefly calm themselves (may bring hands to mouth and suck on hand)</p>
        <p><strong>Language/Communication:</strong> Coos, makes gurgling sounds, turns head toward sounds</p>
        <p><strong>Cognitive:</strong> Pays attention to faces, begins to follow things with eyes and recognize people at a distance</p>
        <p><strong>Movement/Physical:</strong> Can hold head up and begins to push up when lying on tummy, makes smoother movements with arms and legs</p>
      </div>
    </div>
    
    <div class="age-milestone-card">
      <h3>6-Month Milestones</h3>
      <div class="milestone-list">
        <p><strong>Social/Emotional:</strong> Knows familiar faces and begins to know if someone is a stranger, likes to play with others, especially parents</p>
        <p><strong>Language/Communication:</strong> Responds to sounds by making sounds, strings vowels together when babbling ("ah," "eh," "oh")</p>
        <p><strong>Cognitive:</strong> Looks around at things nearby, brings things to mouth, shows curiosity and tries to get things that are out of reach</p>
        <p><strong>Movement/Physical:</strong> Rolls over in both directions, begins to sit without support, supports weight on legs and might bounce when standing</p>
      </div>
    </div>
    
    <div class="age-milestone-card">
      <h3>12-Month Milestones</h3>
      <div class="milestone-list">
        <p><strong>Social/Emotional:</strong> May be fearful of strangers, cries when mom or dad leaves, has favorite things and people</p>
        <p><strong>Language/Communication:</strong> Responds to simple verbal requests, uses simple gestures like shaking head "no" or waving "bye-bye"</p>
        <p><strong>Cognitive:</strong> Explores things in different ways (shaking, banging, throwing), finds hidden things easily, puts things in and takes things out of containers</p>
        <p><strong>Movement/Physical:</strong> Gets to a sitting position without help, pulls up to stand, walks holding on to furniture ("cruising")</p>
      </div>
    </div>
    
    <div class="age-milestone-card">
      <h3>2-Year Milestones</h3>
      <div class="milestone-list">
        <p><strong>Social/Emotional:</strong> Copies others especially adults and older children, gets excited when with other children, shows increasing independence</p>
        <p><strong>Language/Communication:</strong> Points to things or pictures when they're named, knows names of familiar people and body parts, says sentences with 2-4 words</p>
        <p><strong>Cognitive:</strong> Finds things even when hidden under two or three covers, begins to sort shapes and colors, completes sentences and rhymes in familiar books</p>
        <p><strong>Movement/Physical:</strong> Stands on tiptoe, kicks a ball, begins to run, climbs onto and down from furniture without help</p>
      </div>
    </div>
    
    <div class="age-milestone-card">
      <h3>3-Year Milestones</h3>
      <div class="milestone-list">
        <p><strong>Social/Emotional:</strong> Shows affection for friends without prompting, takes turns in games, expresses a wide range of emotions</p>
        <p><strong>Language/Communication:</strong> Follows instructions with 2 or 3 steps, can name most familiar things, understands words like "in," "on," and "under"</p>
        <p><strong>Cognitive:</strong> Can work toys with buttons, levers, and moving parts; plays make-believe with dolls, animals, and people; does puzzles with 3 or 4 pieces</p>
        <p><strong>Movement/Physical:</strong> Climbs well, runs easily, pedals a tricycle, walks up and down stairs, one foot on each step</p>
      </div>
    </div>
    
    <div class="age-milestone-card">
      <h3>4-Year Milestones</h3>
      <div class="milestone-list">
        <p><strong>Social/Emotional:</strong> Enjoys doing new things, plays "Mom" and "Dad," is more creative with make-believe play, would rather play with other children than alone</p>
        <p><strong>Language/Communication:</strong> Knows some basic grammar rules, sings songs or recites poems from memory, tells stories, can say first and last name</p>
        <p><strong>Cognitive:</strong> Names colors and numbers, understands counting, starts to understand time, remembers parts of a story</p>
        <p><strong>Movement/Physical:</strong> Hops and stands on one foot for up to 2 seconds, catches a bounced ball most of the time, pours, cuts with supervision, and mashes own food</p>
      </div>
    </div>
    
    <div class="age-milestone-card">
      <h3>5-Year Milestones</h3>
      <div class="milestone-list">
        <p><strong>Social/Emotional:</strong> Wants to please friends, wants to be like friends, more likely to agree with rules, likes to sing, dance, and act</p>
        <p><strong>Language/Communication:</strong> Speaks very clearly, tells a simple story using full sentences, uses future tense, says name and address</p>
        <p><strong>Cognitive:</strong> Counts 10 or more things, knows about things used every day (money, food), can draw a person with at least 6 body parts</p>
        <p><strong>Movement/Physical:</strong> Stands on one foot for 10 seconds or longer, hops, may be able to skip, can do a somersault, uses fork and spoon and sometimes a table knife</p>
      </div>
    </div>
  </section>
  
  <section class="developmental-red-flags">
    <h2>Recognizing Developmental Red Flags</h2>
    <p>While all children develop at their own pace, certain signs may indicate a need for further evaluation. If you observe any of the following, it's important to discuss your concerns with parents and suggest they speak with their child's healthcare provider:</p>
    
    <div class="red-flag-container">
      <h3>By 6 months</h3>
      <ul>
        <li>Doesn't try to get things that are in reach</li>
        <li>Shows no affection for caregivers</li>
        <li>Doesn't respond to sounds around them</li>
        <li>Has difficulty getting things to mouth</li>
        <li>Doesn't make vowel sounds ("ah", "eh", "oh")</li>
        <li>Doesn't roll over in either direction</li>
      </ul>
    </div>
    
    <div class="red-flag-container">
      <h3>By 12 months</h3>
      <ul>
        <li>Doesn't crawl</li>
        <li>Can't stand when supported</li>
        <li>Doesn't learn gestures like waving or shaking head</li>
        <li>Doesn't say single words like "mama" or "dada"</li>
        <li>Doesn't point to things</li>
        <li>Loses skills they once had</li>
      </ul>
    </div>
    
    <div class="red-flag-container">
      <h3>By 2 years</h3>
      <ul>
        <li>Doesn't know what to do with common things, like a brush, phone, fork, spoon</li>
        <li>Doesn't copy actions or words</li>
        <li>Doesn't follow simple instructions</li>
        <li>Doesn't use 2-word phrases</li>
        <li>Doesn't walk steadily</li>
        <li>Loses skills they once had</li>
      </ul>
    </div>
    
    <div class="red-flag-container">
      <h3>By 3 years</h3>
      <ul>
        <li>Falls down a lot or has trouble with stairs</li>
        <li>Drools or has very unclear speech</li>
        <li>Can't work simple toys</li>
        <li>Doesn't speak in sentences</li>
        <li>Doesn't understand simple instructions</li>
        <li>Doesn't play pretend or make-believe</li>
        <li>Doesn't want to play with other children or with toys</li>
        <li>Loses skills they once had</li>
      </ul>
    </div>
    
    <div class="red-flag-container">
      <h3>By 4 years</h3>
      <ul>
        <li>Can't jump in place</li>
        <li>Has trouble scribbling</li>
        <li>Shows no interest in interactive games or make-believe</li>
        <li>Ignores other children or doesn't respond to people outside the family</li>
        <li>Resists dressing, sleeping, and using the toilet</li>
        <li>Can't retell a favorite story</li>
        <li>Doesn't understand "same" and "different"</li>
        <li>Loses skills they once had</li>
      </ul>
    </div>
    
    <div class="red-flag-container">
      <h3>By 5 years</h3>
      <ul>
        <li>Doesn't show a wide range of emotions</li>
        <li>Shows extreme behavior (unusually fearful, aggressive, shy or sad)</li>
        <li>Unusually withdrawn and not active</li>
        <li>Easily distracted, has trouble focusing on one activity for more than 5 minutes</li>
        <li>Doesn't respond to people, or responds only superficially</li>
        <li>Can't tell what's real and what's make-believe</li>
        <li>Doesn't play a variety of games and activities</li>
        <li>Can't give first and last name</li>
        <li>Can't draw pictures</li>
        <li>Loses skills they once had</li>
      </ul>
    </div>
  </section>
  
  <section class="government-resources">
    <h2>Essential Government Resources</h2>
    <p>These free, evidence-based resources can help you track children's development and communicate with families:</p>
    
    <div class="resource-card">
      <h3>CDC's Learn the Signs. Act Early. Program</h3>
      <p><strong>Website:</strong> <a href="https://www.cdc.gov/ncbddd/actearly/" target="_blank">https://www.cdc.gov/ncbddd/actearly/</a></p>
      <p>This comprehensive resource provides free milestone checklists, tracking apps, and materials for both educators and parents.</p>
      <p><strong>Key Tools:</strong></p>
      <ul>
        <li>Milestone Tracker Mobile App</li>
        <li>Printable Milestone Checklists (2 months to 5 years)</li>
        <li>Milestone Moments Booklet</li>
        <li>Growth Charts</li>
        <li>Development Monitoring Tools for Early Care and Education Providers</li>
      </ul>
    </div>
    
    <div class="resource-card">
      <h3>Ages and Stages Questionnaires (ASQ)</h3>
      <p>The ASQ is a widely used developmental screening tool. While the full version requires purchase, many states offer free access through early intervention programs.</p>
      <p><strong>Learn more:</strong> <a href="https://agesandstages.com/" target="_blank">https://agesandstages.com/</a></p>
      <p>Contact your local early intervention program to see if free screening tools are available in your area.</p>
    </div>
    
    <div class="resource-card">
      <h3>Head Start Early Childhood Learning & Knowledge Center (ECLKC)</h3>
      <p><strong>Website:</strong> <a href="https://eclkc.ohs.acf.hhs.gov/" target="_blank">https://eclkc.ohs.acf.hhs.gov/</a></p>
      <p>Offers a wealth of free resources on child development, including:</p>
      <ul>
        <li>Development Observation Tools</li>
        <li>Family Engagement Resources</li>
        <li>Support for Inclusive Classrooms</li>
        <li>Professional Development Materials</li>
      </ul>
    </div>
    
    <div class="resource-card">
      <h3>ZERO TO THREE</h3>
      <p><strong>Website:</strong> <a href="https://www.zerotothree.org/" target="_blank">https://www.zerotothree.org/</a></p>
      <p>A national organization focused on infant and toddler development with many free resources:</p>
      <ul>
        <li>Development Milestones</li>
        <li>Brain Development Information</li>
        <li>Early Learning Resources</li>
        <li>Parent-Teacher Partnership Materials</li>
      </ul>
    </div>
    
    <p class="resources-note">Breathe, Smile, Be Present: Remember that watching children reach developmental milestones is one of the most rewarding aspects of early childhood education. Take time to notice and celebrate each child's growth journey!</p>
  </section>
  
  <section class="classroom-strategies">
    <h2>Supporting Development in the Classroom</h2>
    
    <div class="strategy-container">
      <h3>Physical Development</h3>
      <ul>
        <li><strong>Indoor Movement Area:</strong> Create a designated space for gross motor activities, even in small classrooms.</li>
        <li><strong>Fine Motor Stations:</strong> Offer daily opportunities for manipulating small objects (beads, buttons, playdough, scissors).</li>
        <li><strong>Sensory Table:</strong> Rotate materials weekly (water, sand, rice, beans) to encourage tactile exploration.</li>
        <li><strong>Obstacle Courses:</strong> Use classroom furniture and soft equipment to create simple courses that develop balance and coordination.</li>
      </ul>
    </div>
    
    <div class="strategy-container">
      <h3>Cognitive Development</h3>
      <ul>
        <li><strong>Discovery Centers:</strong> Create areas with materials that encourage exploration, sorting, and classification.</li>
        <li><strong>Open-Ended Questions:</strong> Ask "how" and "why" questions to stimulate thinking.</li>
        <li><strong>Problem-Solving Games:</strong> Introduce simple puzzles, shape sorters, and matching activities.</li>
        <li><strong>Nature Exploration:</strong> Bring natural items into the classroom for investigation with magnifying glasses.</li>
      </ul>
    </div>
    
    <div class="strategy-container">
      <h3>Language Development</h3>
      <ul>
        <li><strong>Language-Rich Environment:</strong> Label classroom items, create word walls, and display children's dictated stories.</li>
        <li><strong>Intentional Conversations:</strong> Have meaningful back-and-forth exchanges throughout the day.</li>
        <li><strong>Read, Read, Read:</strong> Make books accessible and have at least three read-aloud sessions daily.</li>
        <li><strong>Storytelling Props:</strong> Use puppets, flannel boards, and story boxes to bring tales to life and encourage retelling.</li>
      </ul>
    </div>
    
    <div class="strategy-container">
      <h3>Social-Emotional Development</h3>
      <ul>
        <li><strong>Feelings Chart:</strong> Create a visual display of emotions to help children identify and express feelings.</li>
        <li><strong>Peace Corner:</strong> Designate a quiet space where children can go to calm down when overwhelmed.</li>
        <li><strong>Collaborative Projects:</strong> Plan activities that require children to work together toward a common goal.</li>
        <li><strong>Role-Play Scenarios:</strong> Use puppets and pretend play to practice social skills and problem-solving.</li>
      </ul>
    </div>
    
    <div class="strategy-container">
      <h3>Self-Help Skills</h3>
      <ul>
        <li><strong>Practical Life Center:</strong> Create stations where children can practice dressing (buttons, zippers), pouring, and serving.</li>
        <li><strong>Visual Schedules:</strong> Post picture schedules to help children follow routines independently.</li>
        <li><strong>Child-Accessible Materials:</strong> Organize classroom items at children's level to promote independence.</li>
        <li><strong>I Can Do It Myself" Chart:</strong> Celebrate self-help milestones with a special display.</li>
      </ul>
    </div>
  </section>
  
  <section class="communicating-with-families">
    <h2>Communicating with Families about Development</h2>
    
    <div class="communication-tips">
      <h3>Effective Communication Strategies</h3>
      <ul>
        <li><strong>Focus on observations, not judgments:</strong> "I've noticed Maya has been using mostly single words" rather than "Maya's language is delayed."</li>
        <li><strong>Use documentation:</strong> Share photos, videos, and work samples to illustrate developmental progress.</li>
        <li><strong>Be specific:</strong> "Jamal can now stack six blocks" is more meaningful than "Jamal's fine motor skills are improving."</li>
        <li><strong>Highlight strengths first:</strong> Begin conversations by acknowledging the child's strengths before discussing concerns.</li>
        <li><strong>Provide resources:</strong> Share the government resources listed in this module with families.</li>
        <li><strong>Maintain confidentiality:</strong> Never discuss one child's development with other parents.</li>
      </ul>
    </div>
    
    <div class="difficult-conversations">
      <h3>Discussing Developmental Concerns</h3>
      <p>When you need to discuss potential developmental concerns with families:</p>
      <ol>
        <li><strong>Prepare:</strong> Document specific observations with dates. Gather resources to share.</li>
        <li><strong>Choose the right time and place:</strong> Schedule a private meeting without distractions.</li>
        <li><strong>Start positively:</strong> Begin with the child's strengths and things they enjoy.</li>
        <li><strong>Be specific but sensitive:</strong> Share concrete observations without diagnostic labels.</li>
        <li><strong>Listen:</strong> Give parents time to process and share their own observations.</li>
        <li><strong>Provide next steps:</strong> Suggest resources and potential referrals if appropriate.</li>
        <li><strong>Follow up:</strong> Check in with parents after they've had time to reflect.</li>
      </ol>
      <p>Remember: Every Genius that ever was had a Mentor. As early childhood educators, we serve as crucial mentors in identifying and supporting children's developmental needs.</p>
    </div>
  </section>
  
  <section class="video-resources">
    <h2>Video Resources on Child Development</h2>
    <p>Watch these informative videos from trusted sources to deepen your understanding of developmental milestones:</p>
    
    <div class="video-container">
      <h3>CDC's Developmental Milestones</h3>
      <iframe width="560" height="315" src="https://www.youtube.com/embed/Agi0HFwlGEA" title="CDC's Developmental Milestones" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
      <p>An overview of how to use CDC's developmental milestone checklists in your classroom.</p>
    </div>
    
    <div class="video-container">
      <h3>The Science of Early Childhood Development</h3>
      <iframe width="560" height="315" src="https://www.youtube.com/embed/WO-CB2nsqTA" title="The Science of Early Childhood Development" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
      <p>From the Center on the Developing Child at Harvard University - explains the critical importance of early experiences on brain development.</p>
    </div>
  </section>
  
  <section class="conclusion">
    <h2>Conclusion</h2>
    <p>Understanding developmental milestones is a foundational skill for effective early childhood educators. By familiarizing yourself with typical patterns of development, red flags that may indicate concerns, and strategies to support growth across all domains, you'll be better equipped to create an environment where all children can thrive.</p>
    <p>Remember that your role in observing, documenting, and communicating about child development is invaluable. You may be the first person to notice when a child needs additional support, making you an essential link in the early intervention chain.</p>
    <p>Continue to use the government resources provided in this module to stay updated on best practices in developmental monitoring and screening. Together, we can ensure that every child reaches their full potential.</p>
  </section>
</div>
`;
}

/**
 * Generates adaptive content using Perplexity AI based on teacher's skill level
 * 
 * @param teacherLevel The current skill level of the teacher
 * @param userProgress Optional progress data if the teacher has previously accessed this module
 * @returns Promise resolving to HTML content for the adaptive section
 */
async function generateAdaptiveContent(teacherLevel: string, userProgress: any = null): Promise<string> {
  if (!process.env.PERPLEXITY_API_KEY) {
    console.log('No Perplexity API key found, using fallback content');
    return createFallbackAdaptiveContent(teacherLevel);
  }

  try {
    const completionPercentage = userProgress?.progress || 0;
    const isRetaking = completionPercentage >= 100;
    
    // Craft prompt based on teacher level
    let prompt = '';
    
    if (teacherLevel === 'assistant') {
      prompt = `Generate beginner-level content about child development milestones for a preschool teacher assistant. 
      Focus on basic milestones that they should observe in their classroom. Include simple, practical tips for supporting development.
      ${isRetaking ? 'This is their second time taking this training, so add slightly more advanced content than pure basics.' : ''}
      Format the content with HTML headings, paragraphs, and bullet points.`;
    } else if (teacherLevel === 'teacher') {
      prompt = `Generate intermediate-level content about child development milestones for a preschool teacher.
      Include specific age-appropriate activities that support development milestones and signs of potential developmental delays.
      ${isRetaking ? 'This is their second time taking this training, so include more nuanced content and recognition of individual differences in development.' : ''}
      Format the content with HTML headings, paragraphs, and bullet points.`;
    } else if (teacherLevel === 'lead') {
      prompt = `Generate advanced content about child development milestones for a lead preschool teacher.
      Include strategies for developing personalized development plans, working with parents on concerns, and adapting classroom activities.
      ${isRetaking ? 'This is their second time taking this training, so include content about mentoring other teachers in recognizing and supporting development.' : ''}
      Format the content with HTML headings, paragraphs, and bullet points.`;
    } else if (teacherLevel === 'master') {
      prompt = `Generate expert-level content about child development milestones for a master preschool teacher.
      Include critical analysis of different developmental theories, latest research findings, and strategies for curriculum development.
      ${isRetaking ? 'This is their second time taking this training, so include content about program development and training strategies for other teachers.' : ''}
      Format the content with HTML headings, paragraphs, and bullet points.`;
    }
    
    // Call Perplexity API
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.1-sonar-small-128k-online',
        messages: [
          {
            role: 'system',
            content: 'You are an early childhood education expert specializing in child development milestones. Generate educational content appropriate for the specified teacher skill level.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 1500,
        temperature: 0.7
      })
    });
    
    const data = await response.json();
    
    if (!response.ok || !data.choices || !data.choices[0]?.message?.content) {
      console.error('Perplexity API error:', data);
      return createFallbackAdaptiveContent(teacherLevel);
    }
    
    // Extract the generated content
    const content = data.choices[0].message.content;
    
    // Format it as a section for the module
    return `
    <div class="adaptive-content-container">
      <div class="adaptive-content-header">
        <h3>Personalized Content For Your Level: ${teacherLevel.charAt(0).toUpperCase() + teacherLevel.slice(1)}</h3>
        <div class="skill-badge ${teacherLevel}-badge">${teacherLevel.toUpperCase()}</div>
      </div>
      <div class="adaptive-content">
        ${content}
      </div>
    </div>
    `;
  } catch (error) {
    console.error('Error generating adaptive content with Perplexity:', error);
    return createFallbackAdaptiveContent(teacherLevel);
  }
}

/**
 * Creates fallback content if the Perplexity API call fails
 * 
 * @param teacherLevel The skill level of the teacher
 * @returns HTML content as a string
 */
function createFallbackAdaptiveContent(teacherLevel: string): string {
  let content = '';
  
  if (teacherLevel === 'assistant') {
    content = `
      <h3>Key Milestones for Teacher Assistants to Observe</h3>
      <p>As a teacher assistant, you play an important role in observing children's development. Here are some key milestones to watch for:</p>
      <ul>
        <li>Physical: Walking, climbing, holding crayons, building blocks</li>
        <li>Language: First words, simple sentences, following directions</li>
        <li>Social: Sharing, taking turns, playing alongside others</li>
        <li>Emotional: Expressing feelings, self-soothing, showing affection</li>
      </ul>
      <p>Report any concerns to your lead teacher and document your observations in the daily logs.</p>
    `;
  } else if (teacherLevel === 'teacher') {
    content = `
      <h3>Supporting Developmental Milestones in Your Classroom</h3>
      <p>As a teacher, you can create targeted activities that support development:</p>
      <ul>
        <li>Fine Motor: Threading activities, play dough, finger painting</li>
        <li>Gross Motor: Obstacle courses, dance activities, outdoor play</li>
        <li>Language: Story time with questions, song circles, word games</li>
        <li>Cognitive: Sorting activities, matching games, counting exercises</li>
      </ul>
      <p>Watch for children who consistently struggle with age-appropriate activities and consider if adaptations are needed.</p>
    `;
  } else if (teacherLevel === 'lead') {
    content = `
      <h3>Developing Individualized Support Plans</h3>
      <p>As a lead teacher, you'll need to identify when development isn't following typical patterns:</p>
      <ul>
        <li>Systematically observe and document developmental progress</li>
        <li>Implement supportive interventions before referring for assessment</li>
        <li>Communicate concerns with parents effectively and professionally</li>
        <li>Create adaptation plans that address specific developmental needs</li>
      </ul>
      <p>Use developmental screening tools like ASQ-3 to identify potential concerns early.</p>
    `;
  } else if (teacherLevel === 'master') {
    content = `
      <h3>Advanced Developmental Support and Program Integration</h3>
      <p>As a master teacher, you should integrate developmental knowledge across your program:</p>
      <ul>
        <li>Train staff to recognize developmental milestones and appropriate responses</li>
        <li>Design curriculum that addresses all developmental domains</li>
        <li>Create progress monitoring systems to ensure no child falls through the cracks</li>
        <li>Stay current with research on early intervention approaches</li>
      </ul>
      <p>Develop relationships with early intervention specialists to create a support network for children needing additional assistance.</p>
    `;
  }
  
  return `
  <div class="adaptive-content-container">
    <div class="adaptive-content-header">
      <h3>Personalized Content For Your Level: ${teacherLevel.charAt(0).toUpperCase() + teacherLevel.slice(1)}</h3>
      <div class="skill-badge ${teacherLevel}-badge">${teacherLevel.toUpperCase()}</div>
    </div>
    <div class="adaptive-content">
      ${content}
    </div>
  </div>
  `;
}

/**
 * Injects the adaptive content into the base content at the appropriate location
 * 
 * @param baseContent The full module HTML content
 * @param adaptiveContent The personalized adaptive content
 * @param teacherLevel The skill level of the teacher
 * @returns Combined HTML content
 */
function injectAdaptiveContent(baseContent: string, adaptiveContent: string, teacherLevel: string): string {
  // Find a good injection point - after the first main section
  const injectionPoint = baseContent.indexOf('</section>');
  
  if (injectionPoint === -1) {
    // If we can't find a good injection point, just append it
    return baseContent + `
      <section class="personalized-content">
        <h2>Personalized Content for Your Professional Level</h2>
        ${adaptiveContent}
      </section>
    `;
  }
  
  // Insert after the first section
  return baseContent.slice(0, injectionPoint + 10) + `
    <section class="personalized-content">
      <h2>Personalized Content for Your Professional Level</h2>
      ${adaptiveContent}
    </section>
  ` + baseContent.slice(injectionPoint + 10);
}

/**
 * Generates quiz questions with appropriate difficulty based on teacher level
 * 
 * @param teacherLevel Optional skill level of the teacher (defaults to assistant)
 * @returns Quiz object with questions of appropriate difficulty
 */
function generateMilestonesQuiz(teacherLevel: string = 'assistant') {
  // Base questions for all levels - these appear for everyone
  const baseQuestions = [
      {
        question: "At what age should a child typically begin to walk independently?",
        options: [
          "Around 6 months",
          "Between 9-12 months",
          "Between 12-15 months",
          "After 18 months"
        ],
        correctAnswer: 2,
        explanation: "Most children begin walking independently between 12-15 months, though there is a normal range from 9-18 months."
      },
      {
        question: "Which resource provides free developmental milestone checklists, tracking apps, and materials for educators?",
        options: [
          "National Association for the Education of Young Children (NAEYC)",
          "CDC's Learn the Signs. Act Early. Program",
          "American Academy of Pediatrics",
          "National Institute of Child Health"
        ],
        correctAnswer: 1,
        explanation: "The CDC's Learn the Signs. Act Early. Program offers free milestone checklists, a mobile tracking app, and various materials for both educators and parents."
      },
      {
        question: "Which of the following would be considered a 'red flag' for a 2-year-old child?",
        options: [
          "Cannot jump with both feet off the ground",
          "Does not know all letter names",
          "Doesn't use 2-word phrases",
          "Is shy around strangers"
        ],
        correctAnswer: 2,
        explanation: "By age 2, children typically use 2-word phrases. Not doing so may indicate a need for further evaluation of language development."
      },
      {
        question: "Which domain of development involves children recognizing emotions, forming relationships, and developing empathy?",
        options: [
          "Cognitive development",
          "Physical development",
          "Language development",
          "Social-emotional development"
        ],
        correctAnswer: 3,
        explanation: "Social-emotional development encompasses recognizing emotions, forming relationships, self-regulation, and developing empathy."
      },
      {
        question: "When communicating with families about developmental concerns, what is the recommended approach?",
        options: [
          "Use diagnostic labels to ensure clarity",
          "Share observations without judgment and provide resources",
          "Compare the child to peers to illustrate differences",
          "Suggest immediate professional intervention"
        ],
        correctAnswer: 1,
        explanation: "When discussing developmental concerns, it's best to share specific observations without judgment, focus on strengths, and provide appropriate resources."
      },
      {
        question: "What is the main purpose of developmental screening tools like the Ages and Stages Questionnaire (ASQ)?",
        options: [
          "To diagnose developmental disabilities",
          "To identify gifted children early",
          "To compare children's abilities to their peers",
          "To identify potential developmental concerns for further evaluation"
        ],
        correctAnswer: 3,
        explanation: "Developmental screening tools like the ASQ are designed to identify potential developmental concerns that may warrant further evaluation by specialists, not to diagnose conditions."
      },
      {
        question: "By age 3, most children can:",
        options: [
          "Read simple words",
          "Write their full name",
          "Draw a person with at least 6 body parts",
          "Pedal a tricycle and climb well"
        ],
        correctAnswer: 3,
        explanation: "By age 3, most children can pedal a tricycle, climb well, and run easily. Drawing a detailed person typically develops around age 5."
      },
      {
        question: "Which classroom strategy best supports language development in preschoolers?",
        options: [
          "Daily worksheets practicing letter formation",
          "Extended periods of quiet individual work",
          "Multiple daily read-alouds and intentional conversations",
          "Memorization of the alphabet and sight words"
        ],
        correctAnswer: 2,
        explanation: "Language development is best supported through a language-rich environment that includes multiple daily read-alouds and meaningful back-and-forth conversations throughout the day."
      }
    ];
  
  // Additional questions based on teacher level
  const teacherQuestions = [
    {
      question: "Which development theory emphasizes the role of social interaction in cognitive development?",
      options: [
        "Piaget's Theory",
        "Psychoanalytic Theory",
        "Vygotsky's Sociocultural Theory",
        "Behaviorist Theory"
      ],
      correctAnswer: 2,
      explanation: "Vygotsky's Sociocultural Theory emphasizes that social interaction plays a fundamental role in the development of cognition, highlighting concepts like the Zone of Proximal Development."
    },
    {
      question: "What is the purpose of executive function skills in early childhood?",
      options: [
        "To strengthen muscles for physical activities",
        "To develop leadership qualities for group play",
        "To develop mental skills that help with planning, focus, and self-control",
        "To express creativity through arts and dramatic play"
      ],
      correctAnswer: 2,
      explanation: "Executive function skills are mental processes that help children plan, focus attention, remember instructions, and juggle multiple tasks - they're crucial for academic and social success."
    }
  ];
  
  const leadQuestions = [
    {
      question: "Which assessment approach is most appropriate when evaluating development in culturally diverse classrooms?",
      options: [
        "Standardized assessments with national norms",
        "Observation-based assessment with culturally responsive interpretation",
        "Academic readiness tests focusing on universal skills",
        "Computer-based assessment tools with automatic scoring"
      ],
      correctAnswer: 1,
      explanation: "Observation-based assessment with culturally responsive interpretation allows teachers to consider cultural context and values while evaluating development, avoiding cultural bias that may be present in standardized assessments."
    },
    {
      question: "When creating an Individual Development Plan for a child with potential language delays, which approach is most effective?",
      options: [
        "Focusing exclusively on the delayed skill area with intensive intervention",
        "Creating a comprehensive plan addressing all developmental domains",
        "Waiting for formal diagnosis before implementing any specialized strategies",
        "Comparing the child to peers to establish clear developmental goals"
      ],
      correctAnswer: 1,
      explanation: "Creating a comprehensive development plan is most effective as development is interconnected. Even when addressing a specific delay, considering all developmental domains creates a holistic approach that can support the targeted area."
    }
  ];
  
  const masterQuestions = [
    {
      question: "Which approach to developmental screening shows the strongest evidence base for early identification of autism spectrum disorder?",
      options: [
        "General developmental screening at 9, 18, and 24-30 months with autism-specific screening at 18 and 24 months",
        "Autism-specific screening once at 36 months when language skills are fully developed",
        "Wait-and-see approach until school age when behaviors are more consistent",
        "Reactive screening only when parents express specific concerns"
      ],
      correctAnswer: 0,
      explanation: "The American Academy of Pediatrics recommends general developmental screening at 9, 18, and 24-30 months with autism-specific screening at 18 and 24 months, as research shows this approach provides the best chance for early identification and intervention."
    },
    {
      question: "Which assessment framework best evaluates the quality of early childhood education environments?",
      options: [
        "ECERS-R (Early Childhood Environment Rating Scale, Revised)",
        "BRIGANCE Early Childhood Screens",
        "Portfolio Assessment",
        "The Denver Developmental Screening Test"
      ],
      correctAnswer: 0,
      explanation: "The ECERS-R is specifically designed to assess the quality of early childhood education environments, examining space and furnishing, personal care routines, language-reasoning, activities, interactions, program structure, and parents and staff."
    }
  ];
  
  // Determine which questions to include based on teacher level
  let allQuestions = [...baseQuestions]; // Start with base questions for everyone
  
  if (teacherLevel === 'teacher' || teacherLevel === 'lead' || teacherLevel === 'master') {
    allQuestions = [...allQuestions, ...teacherQuestions];
  }
  
  if (teacherLevel === 'lead' || teacherLevel === 'master') {
    allQuestions = [...allQuestions, ...leadQuestions];
  }
  
  if (teacherLevel === 'master') {
    allQuestions = [...allQuestions, ...masterQuestions];
  }
  
  // Limit the number of questions based on teacher level
  const questionCount = 
    teacherLevel === 'assistant' ? 7 : 
    teacherLevel === 'teacher' ? 9 : 
    teacherLevel === 'lead' ? 11 : 13;
  
  return {
    questions: allQuestions.slice(0, questionCount)
  };
}

// Export the function
export { updateChildDevelopmentModule };

// In ES modules, we can't check if a module is the main module the same way as in CommonJS
// Instead, we just export the function and call it from the route handler