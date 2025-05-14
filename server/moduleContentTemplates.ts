/**
 * Module content templates and utilities
 * 
 * This file provides structured content templates for learning modules
 * to ensure consistency and completeness of educational materials.
 */

import { LearningModule } from '@shared/schema';

/**
 * Interface for a standard module content structure
 */
export interface ModuleContentStructure {
  learningObjectives: string[];
  introduction: string;
  mainContent: string[];
  keyTakeaways: string[];
  reflectionQuestions: string[];
  implementationTips: string[];
  videoId: string; // YouTube video ID for the related content
  quiz: {
    questions: {
      question: string;
      options: string[];
      correctAnswer: number;
      explanation: string;
    }[]
  };
}

/**
 * Generate standardized HTML content for a module based on content structure
 * 
 * @param content The structured content for the module
 * @returns HTML string containing the formatted module content
 */
export function generateModuleContent(content: ModuleContentStructure): string {
  const { 
    learningObjectives, 
    introduction, 
    mainContent, 
    keyTakeaways,
    reflectionQuestions,
    implementationTips,
    videoId
  } = content;

  // Create the learning objectives section
  const objectivesList = learningObjectives
    .map(obj => `<li>${obj}</li>`)
    .join('');

  // Create the main content with proper headings and paragraphs
  const contentSections = mainContent
    .map(section => `<p>${section}</p>`)
    .join('');

  // Create key takeaways list
  const takeawaysList = keyTakeaways
    .map(point => `<li>${point}</li>`)
    .join('');

  // Create reflection questions
  const reflectionList = reflectionQuestions
    .map(question => `<li>${question}</li>`)
    .join('');

  // Create implementation tips
  const implementationList = implementationTips
    .map(tip => `<li>${tip}</li>`)
    .join('');

  // Combine everything into a well-structured HTML document
  return `
    <div class="module-content">
      <section class="learning-objectives">
        <h2>Learning Objectives</h2>
        <p>By the end of this module, you will be able to:</p>
        <ul>${objectivesList}</ul>
      </section>

      <section class="introduction">
        <h2>Introduction</h2>
        <p>${introduction}</p>
      </section>

      <section class="video-content">
        <h2>Video Lesson</h2>
        <p>Watch this video to deepen your understanding of the topic:</p>
        <div class="video-container">
          <iframe 
            width="560" 
            height="315" 
            src="https://www.youtube.com/embed/${videoId}" 
            title="Educational video" 
            frameborder="0" 
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
            allowfullscreen>
          </iframe>
        </div>
        <p class="video-note">Please watch the complete video before proceeding to the quiz section.</p>
      </section>

      <section class="main-content">
        <h2>Key Concepts</h2>
        ${contentSections}
      </section>

      <section class="takeaways">
        <h2>Key Takeaways</h2>
        <ul>${takeawaysList}</ul>
      </section>

      <section class="reflection">
        <h2>Reflection Questions</h2>
        <p>Consider these questions as you apply what you've learned:</p>
        <ul>${reflectionList}</ul>
      </section>

      <section class="implementation">
        <h2>Implementation in Your Classroom</h2>
        <p>Here are some practical ways to apply these concepts:</p>
        <ul>${implementationList}</ul>
      </section>

      <section class="next-steps">
        <h2>Next Steps</h2>
        <p>To complete this module:</p>
        <ol>
          <li>Review the key concepts above</li>
          <li>Watch the video lesson completely</li>
          <li>Take the quiz to test your understanding</li>
          <li>Implement at least one idea in your classroom</li>
        </ol>
      </section>
    </div>
  `;
}

/**
 * Default content templates for various module categories
 * These can be used to ensure minimum content standards are met
 */
export const contentTemplates: Record<string, Partial<ModuleContentStructure>> = {
  'classroom-management': {
    learningObjectives: [
      'Establish effective classroom rules and routines',
      'Implement positive behavior management strategies',
      'Create an environment that promotes self-regulation',
      'Apply appropriate consequences for challenging behaviors',
      'Design a classroom layout that supports management goals'
    ],
    introduction: 'Effective classroom management is the foundation for successful teaching and learning in early childhood education. This module will explore evidence-based strategies to create a positive, structured environment where children can thrive socially, emotionally, and academically.',
    mainContent: [
      'Classroom management is much more than simply controlling behavior—it\'s about creating an environment where children feel safe, valued, and empowered to learn. Research shows that well-managed classrooms lead to better academic outcomes and stronger social-emotional development.',
      'The first key concept is establishing clear, consistent rules and expectations. Young children thrive on predictability and structure. When creating rules, focus on 3-5 positively-stated expectations that are easy to understand and remember. For example, "Walking feet inside" is clearer than "No running."',
      'Effective teachers understand that routines are essential for young children. Consistent daily schedules with visual supports help children develop independence and reduce anxiety about what comes next. Transition strategies, such as songs, timers, or special signals, prevent challenging behaviors during schedule changes.',
      'The physical environment plays a crucial role in classroom management. Consider traffic flow, defined learning centers, and appropriate materials. Arrange furniture to create clear boundaries while allowing for supervision. Reduce visual clutter and noise levels which can overstimulate young children.',
      'Positive behavior support strategies focus on teaching appropriate behaviors rather than punishing mistakes. These include specific praise, modeling, redirection, and reinforcement systems. When challenging behaviors occur, respond calmly and consistently, viewing these moments as teaching opportunities.',
      'Building relationships is perhaps the most important aspect of classroom management. When children feel connected to their teachers, they\'re more motivated to follow expectations. Take time daily to connect individually with each child and show genuine interest in their lives and experiences.'
    ],
    keyTakeaways: [
      'Effective classroom management combines clear expectations, consistent routines, thoughtful environment design, and positive behavior support',
      'Prevention strategies are more effective than reactive approaches',
      'Building strong teacher-child relationships is the foundation of successful classroom management',
      'Physical environment influences behavior and learning',
      'Teaching self-regulation skills helps children develop internal control'
    ],
    reflectionQuestions: [
      'How do your current classroom rules align with positive, clear expectations?',
      'Which transitions in your day tend to be the most challenging, and why?',
      'How might you reorganize your physical space to better support your management goals?',
      'What strategies do you currently use to build relationships with each child?',
      'How do you help children develop self-regulation skills in your classroom?'
    ],
    implementationTips: [
      'Create visual supports for rules and routines',
      'Practice transitions with children before expecting mastery',
      'Designate a quiet "calm down" space for children to self-regulate',
      'Use positive narration to highlight desired behaviors',
      'Incorporate movement breaks throughout the day',
      'Schedule regular one-on-one time with each child'
    ]
  },
  
  'child-development': {
    learningObjectives: [
      'Identify key developmental milestones across domains for ages 0-5',
      'Recognize typical variations in development',
      'Apply knowledge of development to create appropriate learning experiences',
      'Identify potential red flags that may require further assessment',
      'Explain developmental theory to families in accessible language'
    ],
    introduction: 'Understanding child development is essential for creating appropriate educational experiences. This module explores the major milestones and developmental sequences that children typically follow from birth to age five, with an emphasis on how this knowledge informs teaching practices.',
    mainContent: [
      'Child development follows predictable patterns while acknowledging individual differences in timing and style. Development occurs across multiple domains—physical, cognitive, language, social, and emotional—which are interconnected and influence each other throughout early childhood.',
      'Physical development includes both gross motor skills (large movements like crawling, walking, and jumping) and fine motor skills (smaller movements like grasping, drawing, and cutting). Physical development generally progresses from head to toe and from the center of the body outward.',
      'Cognitive development refers to how children think, explore, and figure things out. Piaget\'s theory describes how children move from sensorimotor exploration (0-2 years) to preoperational thinking (2-7 years), where symbolic thought emerges but logical reasoning is still developing.',
      'Language development begins with receptive language (understanding) which precedes expressive language (speaking). By age 5, most children have mastered basic grammar and have vocabularies of several thousand words, though significant individual variation exists.',
      'Social-emotional development includes forming attachments, developing self-concept, regulating emotions, and learning to interact with others. Secure attachments in infancy form the foundation for healthy social-emotional development throughout life.',
      'Brain development research shows that the first five years are a period of extraordinary neural growth and connectivity. Experiences during this time literally shape the architecture of the brain, making high-quality early education critically important.'
    ],
    keyTakeaways: [
      'Development follows predictable patterns, but timing varies among children',
      'All developmental domains are interconnected and equally important',
      'Development builds on earlier skills and understandings',
      'Both nature (biology) and nurture (environment) influence development',
      'Play is the primary context through which young children develop and learn'
    ],
    reflectionQuestions: [
      'How do you currently adapt your expectations based on developmental knowledge?',
      'When have you observed a child developing in a way that didn\'t match typical patterns? How did you respond?',
      'How do you explain developmental concepts to families who might be concerned about their child\'s progress?',
      'How do you use your knowledge of development to create challenging but achievable activities?',
      'Which developmental domain do you feel most confident supporting? Which might benefit from more attention in your practice?'
    ],
    implementationTips: [
      'Create a developmental checklist to guide observations',
      'Use knowledge of upcoming developmental milestones to prepare appropriate challenges',
      'Document children\'s progress with photos and work samples',
      'Share developmental information with families regularly',
      'Create learning centers that support multiple developmental domains simultaneously',
      'Follow children\'s leads and interests to support their developmental journey'
    ]
  },
  
  'inclusive-practices': {
    learningObjectives: [
      'Define inclusion in early childhood education',
      'Identify environmental adaptations that support all learners',
      'Apply principles of Universal Design for Learning',
      'Develop strategies for supporting children with diverse needs',
      'Create collaborative partnerships with families and specialists'
    ],
    introduction: 'Inclusive early childhood education benefits all children by honoring diversity and providing appropriate supports for each child to participate fully. This module explores practical strategies for creating truly inclusive environments where every child can thrive.',
    mainContent: [
      'Inclusion in early childhood means more than simply placing children with disabilities in typical classrooms. True inclusion involves creating environments where all children belong, participate, and develop to their full potential through individualized supports.',
      'The Universal Design for Learning (UDL) framework provides a blueprint for creating accessible learning environments. UDL emphasizes providing multiple means of engagement, representation, and action/expression to accommodate diverse learners.',
      'Environmental adaptations can make a significant difference in children\'s ability to participate. Consider physical accessibility, visual supports, sensory-friendly spaces, and specialized materials or equipment that might benefit children with diverse needs.',
      'Instructional strategies for inclusive classrooms include differentiated instruction, embedded learning opportunities, peer-mediated approaches, and positive behavior supports. These strategies benefit all children while providing necessary support for those with specific needs.',
      'Collaboration is essential for successful inclusion. Building partnerships with families, specialists, and other team members ensures consistency and comprehensive support for children with diverse needs. Regular communication and shared goal-setting are key elements of effective collaboration.',
      'Inclusion supports social justice by promoting acceptance of differences from an early age. Research consistently shows that inclusive education benefits both children with disabilities and their typically developing peers, fostering empathy, tolerance, and appreciation of diversity.'
    ],
    keyTakeaways: [
      'Inclusion benefits all children, not just those with identified disabilities',
      'Universal Design for Learning creates accessible environments from the start',
      'Small adaptations can make a significant difference in children\'s participation',
      'Collaboration with families and specialists is essential for successful inclusion',
      'Inclusive practices prepare all children for a diverse society'
    ],
    reflectionQuestions: [
      'How would you define successful inclusion in your classroom or program?',
      'What barriers to full participation exist in your current environment?',
      'How comfortable are you adapting activities for children with diverse needs?',
      'What resources and supports would help you implement more inclusive practices?',
      'How do you currently partner with families of children with diverse needs?'
    ],
    implementationTips: [
      'Conduct an accessibility audit of your environment',
      'Create visual schedules and supports for transitions and routines',
      'Provide options for how children can demonstrate learning',
      'Establish a regular system for communication with specialists',
      'Build a classroom library that depicts diverse abilities positively',
      'Explicitly teach children about differences and similarities'
    ]
  }
};

/**
 * Generate quiz questions for a module
 * 
 * @param module The learning module to generate questions for
 * @param count Number of questions to generate (default: 6)
 * @returns Quiz object with questions
 */
export function generateDefaultQuiz(module: LearningModule, count: number = 6) {
  // Basic question templates that can be adapted to any module
  const questionTemplates = [
    {
      question: `What is one of the main learning objectives of the "${module.title}" module?`,
      options: [
        "To teach advanced calculus",
        "To improve finger painting techniques",
        `To help teachers understand key concepts in ${module.category}`,
        "To reduce the need for classroom management"
      ],
      correctAnswer: 2,
      explanation: `The ${module.title} module focuses on building professional knowledge in the area of ${module.category}.`
    },
    {
      question: "Which of the following best demonstrates the 'Building Chapter One' philosophy discussed in this module?",
      options: [
        "Focusing exclusively on academic outcomes",
        "Creating meaningful experiences that shape a child's foundation",
        "Allowing children complete freedom without guidance",
        "Limiting creative expression to structured activities"
      ],
      correctAnswer: 1,
      explanation: "The 'Building Chapter One' philosophy emphasizes our role in creating formative experiences that become the foundation of a child's life story."
    },
    {
      question: "Which strategy would be most effective for implementing concepts from this module?",
      options: [
        "Memorizing definitions without practical application",
        "Implementing new ideas without considering your specific classroom context",
        "Trying one new technique at a time and reflecting on its effectiveness",
        "Completely redesigning your entire classroom approach overnight"
      ],
      correctAnswer: 2,
      explanation: "Effective implementation involves thoughtful integration of new ideas, starting with small changes and reflecting on results."
    },
    {
      question: "How does this module connect to the ITERS/ECERS quality framework?",
      options: [
        "It doesn't connect to established quality frameworks",
        "It contradicts established quality standards",
        "It aligns with key indicators in the appropriate environments rating scales",
        "It replaces the need for quality rating systems"
      ],
      correctAnswer: 2,
      explanation: "This module supports implementation of best practices as defined in the ITERS/ECERS framework for high-quality early childhood environments."
    },
    {
      question: "Which of the following represents a key takeaway from this module?",
      options: [
        "Early childhood education requires minimal planning",
        "Children learn best through exclusively teacher-directed activities",
        "Development occurs in isolation within specific domains",
        "Intentional teaching practices support children's optimal development"
      ],
      correctAnswer: 3,
      explanation: "A central theme of this module is that intentional, thoughtful teaching practices create the conditions for children's growth and learning."
    },
    {
      question: "How might you apply learning from this module in your classroom tomorrow?",
      options: [
        "Ignore it since practical application isn't important",
        "Identify one specific strategy to try and observe its impact",
        "Completely overhaul your teaching approach immediately",
        "Wait for perfect conditions before trying anything new"
      ],
      correctAnswer: 1,
      explanation: "Effective professional development involves selecting specific strategies to implement, then reflecting on their effectiveness in your unique context."
    }
  ];
  
  // If we need more than our templates, duplicate some with slight variations
  const questions = count <= questionTemplates.length 
    ? questionTemplates.slice(0, count) 
    : [...questionTemplates, ...questionTemplates.slice(0, count - questionTemplates.length)];
  
  return {
    questions: questions
  };
}

/**
 * Generate complete content for a module that's missing appropriate content
 * 
 * @param module The learning module to generate content for
 * @returns Complete module content structure
 */
export function generateDefaultModuleContent(module: LearningModule): ModuleContentStructure {
  // Default video IDs by category (pre-vetted educational content)
  const defaultVideosByCategory: Record<string, string[]> = {
    'behavior': ['KUWn_TJTrnU', 'sBkNrFqxTpU', 'hyYV_v6uMKA'],
    'classroom-management': ['B-JRAL5TZhs', 'iIADKJUhxGQ', 'qy_bgZ1hDSo'],
    'core-values': ['1Evwgu369Jw', 'kZlXWp6vFQ4', 'sW8TnhQPWP8'],
    'foundations': ['GcgN0lEh5IA', 'BA9gYGtkLLM', 'KoRQZz-HjIY'],
    'inclusion': ['WoOUiMA_3sc', '9SlN4FiLgv8', 'hhXXwJh6kvk'],
    'language': ['NzKdwzc3tAs', 'ry6oju_oTiI', 'ACY_DwVXJtI'],
    'management': ['UNAEjLjm_Pk', 'nMGOQQRroYs', 'Py8fYInb_BY'],
    'mindful-mornings': ['qFqA0sWWbCE', 'RVA2N6tX2cg', 'inpok4MKVLM'],
    'stem': ['2m0dcFMOuIs', 'SRbhLtjOiRc', 'JML7eSJxFLo'],
    'teaching-methods': ['F3rSHQu3VKc', 'jCl0jxM4J8o', 'aOLm-e7E99g'],
    'empathy': ['1Evwgu369Jw', 'B-XbuRVwRqY', 'cDDWvj_q-o8'],
    'family-engagement': ['U5q-jTJ5U-s', '05n_EZRnWvA', 'r9rjf6UyY7c']
  };
  
  // Fall back to general educational videos if category not found
  const fallbackVideos = ['7MCSS9eDlCY', 'MujUDLWrYJU', '8Gu54rpRMGE', 'xJLQA9RJRjY'];
  
  // Select appropriate template based on module category
  const categoryKey = Object.keys(contentTemplates).find(key => 
    module.category.includes(key) || key.includes(module.category)
  ) || 'classroom-management';
  
  const template = contentTemplates[categoryKey] || contentTemplates['classroom-management'];
  
  // Select a video ID based on category
  const videoOptions = defaultVideosByCategory[module.category] || fallbackVideos;
  const videoId = videoOptions[Math.floor(Math.random() * videoOptions.length)];
  
  // Create default structure for sections that aren't in the template
  const defaultLearningObjectives = [
    `Understand key concepts related to ${module.title}`,
    `Apply best practices in ${module.category} to your classroom`,
    `Evaluate your current approach to ${module.title.toLowerCase()}`,
    `Develop strategies for implementing ${module.title.toLowerCase()} effectively`,
    `Reflect on how ${module.title.toLowerCase()} impacts children's development`
  ];
  
  const defaultIntroduction = `This module explores ${module.title}, a crucial aspect of high-quality early childhood education. Through study materials, video content, and interactive elements, you'll gain practical knowledge you can apply immediately in your classroom while building the foundation of "Chapter One" in children's lives.`;
  
  const defaultMainContent = [
    `${module.title} is fundamental to creating high-quality early childhood experiences. Research consistently shows that teachers who implement effective ${module.category} practices see improvements in children's outcomes across developmental domains.`,
    `When implementing ${module.title.toLowerCase()}, it's important to consider the developmental appropriateness of your approach. What works for preschoolers may need modification for toddlers or infants. Always begin by observing the children in your care and understanding their current abilities and interests.`,
    `Professional standards including NAEYC Accreditation Criteria, ITERS/ECERS, and CLASS assessment tools all emphasize the importance of ${module.title.toLowerCase()}. These frameworks provide useful guidance for reflection and implementation.`,
    `The "Building Chapter One" philosophy reminds us that these early experiences form the foundation of children's life story. By implementing thoughtful ${module.title.toLowerCase()} practices, we contribute positively to this important chapter.`,
    `Reflective practice is essential when developing your approach to ${module.title.toLowerCase()}. Consider documenting your current practices, trying new strategies, and evaluating their effectiveness in your unique context.`
  ];
  
  const defaultKeyTakeaways = [
    `${module.title} directly impacts children's development and learning outcomes`,
    `Effective implementation requires understanding both theory and practical applications`,
    `Reflective practice helps refine your approach over time`,
    `Adaptation to your specific classroom context is essential for success`,
    `Ongoing professional development deepens understanding and implementation`
  ];
  
  const defaultReflectionQuestions = [
    `How do you currently approach ${module.title.toLowerCase()} in your classroom?`,
    `What challenges have you faced when implementing aspects of ${module.title.toLowerCase()}?`,
    `How might you adapt these strategies for the specific children in your care?`,
    `What resources would help you implement these ideas more effectively?`,
    `How will you measure the success of your ${module.title.toLowerCase()} approach?`
  ];
  
  const defaultImplementationTips = [
    `Start with one new strategy and build from there`,
    `Document your process and children's responses`,
    `Share your learning with colleagues for support and feedback`,
    `Connect with families about your ${module.title.toLowerCase()} approach`,
    `Review relevant sections of the ITERS/ECERS or CLASS tool for guidance`,
    `Schedule time for regular reflection on your implementation efforts`
  ];
  
  // Combine template with defaults for missing pieces
  return {
    learningObjectives: template.learningObjectives || defaultLearningObjectives,
    introduction: template.introduction || defaultIntroduction,
    mainContent: template.mainContent || defaultMainContent,
    keyTakeaways: template.keyTakeaways || defaultKeyTakeaways,
    reflectionQuestions: template.reflectionQuestions || defaultReflectionQuestions,
    implementationTips: template.implementationTips || defaultImplementationTips,
    videoId: videoId,
    quiz: generateDefaultQuiz(module)
  };
}

/**
 * Check if a module has adequate content 
 * 
 * @param module The module to check
 * @returns Boolean indicating if content meets minimum standards
 */
export function hasAdequateContent(module: any): boolean {
  // If module is completely invalid, definitely inadequate
  if (!module || module.content === null || module.content === undefined) return false;
  
  // Extract content as string, handling both string and object types
  let contentString = '';
  
  if (typeof module.content === 'string') {
    // If content is already a string, use it directly
    contentString = module.content;
  } else if (typeof module.content === 'object') {
    // If content is an object, try to convert it to a string representation
    try {
      // For safety, try to stringify or use toString() if available
      contentString = typeof module.content.toString === 'function' 
        ? module.content.toString()
        : JSON.stringify(module.content);
    } catch (error) {
      console.error('Error converting module content to string:', error);
      return false;
    }
  } else {
    // Unsupported content type
    return false;
  }
  
  // Check for minimum length (500 characters is pretty minimal)
  if (contentString.length < 500) return false;
  
  // Check for presence of key sections
  const hasLearningObjectives = 
    contentString.includes('Learning Objectives') || 
    contentString.includes('learning objectives') || 
    contentString.includes('objectives');
                               
  const hasVideoEmbed = 
    contentString.includes('youtube.com/embed/') || 
    contentString.includes('youtu.be/');
                        
  const hasQuiz = 
    module.quiz !== null && 
    module.quiz !== undefined &&
    typeof module.quiz === 'object' &&
    module.quiz.questions !== undefined &&
    Array.isArray(module.quiz.questions) && 
    module.quiz.questions.length >= 5;
                 
  // A complete module should have objectives, video, and quiz
  return Boolean(hasLearningObjectives && hasVideoEmbed && hasQuiz);
}