/**
 * Module Building Templates for Early Childhood Education
 * Provides structured templates that follow educational best practices
 */

export interface ModuleSection {
  id: string;
  title: string;
  type: 'introduction' | 'content' | 'activity' | 'reflection' | 'assessment';
  description: string;
  content: string;
  duration: number; // in minutes
  learningObjectives?: string[];
  materials?: string[];
  instructions?: string[];
  assessmentCriteria?: string[];
}

export interface ModuleTemplate {
  id: string;
  title: string;
  category: string;
  description: string;
  targetAge: string;
  totalDuration: number;
  learningDomains: string[];
  sections: ModuleSection[];
  assessmentStrategy: string;
  differentiationStrategies: string[];
  extensionActivities: string[];
}

export const moduleTemplates: ModuleTemplate[] = [
  {
    id: 'social-emotional-foundation',
    title: 'Social-Emotional Learning Foundation',
    category: 'Social-Emotional Development',
    description: 'A comprehensive module introducing children to emotions, empathy, and social skills through interactive activities and storytelling.',
    targetAge: '3-5 years',
    totalDuration: 45,
    learningDomains: ['Social-Emotional Development', 'Language Development', 'Cognitive Development'],
    sections: [
      {
        id: 'intro-emotions',
        title: 'Welcome Circle: Feelings Check-In',
        type: 'introduction',
        description: 'Interactive opening activity to introduce the concept of emotions',
        content: 'Begin with a welcoming song and emotion check-in using feeling faces. Introduce the day\'s learning adventure about understanding and expressing emotions.',
        duration: 5,
        learningObjectives: [
          'Children will identify basic emotions (happy, sad, angry, excited)',
          'Children will express how they are feeling today'
        ],
        materials: ['Feeling faces chart', 'Welcome song', 'Circle time rug'],
        instructions: [
          'Gather children in circle',
          'Show feeling faces chart',
          'Ask each child to point to how they feel',
          'Sing welcome song together'
        ]
      },
      {
        id: 'story-emotions',
        title: 'Story Time: "The Way I Feel" Exploration',
        type: 'content',
        description: 'Interactive story reading focusing on different emotions and their expressions',
        content: 'Read an engaging story about emotions, pausing to discuss characters\' feelings and relating them to children\'s own experiences.',
        duration: 10,
        learningObjectives: [
          'Children will recognize emotions in story characters',
          'Children will connect story emotions to personal experiences'
        ],
        materials: ['Age-appropriate emotion book', 'Story props or puppets'],
        instructions: [
          'Read story with expressive voice',
          'Pause to ask "How do you think they feel?"',
          'Encourage children to share similar experiences',
          'Use facial expressions to demonstrate emotions'
        ]
      },
      {
        id: 'emotion-activity',
        title: 'Hands-On: Emotion Faces Art',
        type: 'activity',
        description: 'Creative activity where children create their own emotion faces',
        content: 'Children create emotion face collages using various materials, discussing feelings as they work.',
        duration: 15,
        learningObjectives: [
          'Children will create visual representations of emotions',
          'Children will use descriptive language about feelings'
        ],
        materials: ['Paper plates', 'Construction paper', 'Glue sticks', 'Crayons', 'Safety scissors'],
        instructions: [
          'Provide each child with a paper plate',
          'Offer various materials for face features',
          'Encourage discussion about chosen emotions',
          'Support children in explaining their artwork'
        ]
      },
      {
        id: 'emotion-practice',
        title: 'Practice: Emotion Charades',
        type: 'activity',
        description: 'Movement-based activity to practice expressing and recognizing emotions',
        content: 'Children take turns acting out emotions while others guess, reinforcing emotional vocabulary and recognition.',
        duration: 10,
        learningObjectives: [
          'Children will express emotions through body language',
          'Children will identify emotions in others'
        ],
        materials: ['Emotion cards', 'Open space for movement'],
        instructions: [
          'Demonstrate emotion acting first',
          'Have children take turns picking emotion cards',
          'Encourage creative expression',
          'Celebrate all attempts and guesses'
        ]
      },
      {
        id: 'reflection-sharing',
        title: 'Closing Circle: Feeling Reflections',
        type: 'reflection',
        description: 'Reflective discussion about emotions learned and experienced',
        content: 'Children share what they learned about emotions and how they\'re feeling now.',
        duration: 5,
        learningObjectives: [
          'Children will reflect on their learning',
          'Children will practice emotional self-awareness'
        ],
        materials: ['Feeling faces chart', 'Calm background music'],
        instructions: [
          'Return to circle formation',
          'Ask children what emotions they learned about',
          'Have each child share their current feeling',
          'End with calming breathing exercise'
        ]
      }
    ],
    assessmentStrategy: 'Observe children\'s ability to identify emotions, express feelings verbally, and demonstrate empathy during activities. Use simple rubric focusing on participation and emotional expression.',
    differentiationStrategies: [
      'Visual supports for children with language delays',
      'Additional scaffolding for younger children',
      'Extended vocabulary for advanced learners',
      'Sensory adaptations for different learning needs'
    ],
    extensionActivities: [
      'Create a class emotion book with photos',
      'Set up emotion station in dramatic play area',
      'Practice emotion regulation techniques',
      'Connect to family cultures and emotion expression'
    ]
  },
  {
    id: 'nature-science-explorer',
    title: 'Nature Science Explorer',
    category: 'Science & Nature',
    description: 'Hands-on exploration of nature and scientific thinking through observation, experimentation, and discovery.',
    targetAge: '4-6 years',
    totalDuration: 60,
    learningDomains: ['Cognitive Development', 'Physical Development', 'Language Development'],
    sections: [
      {
        id: 'nature-intro',
        title: 'Wonder Walk Preparation',
        type: 'introduction',
        description: 'Introduction to being scientists and nature observers',
        content: 'Introduce children to the role of scientists and nature explorers. Discuss what we might discover outdoors.',
        duration: 8,
        learningObjectives: [
          'Children will understand the role of a scientist',
          'Children will predict what they might observe in nature'
        ],
        materials: ['Magnifying glasses', 'Collection bags', 'Observation journals'],
        instructions: [
          'Show scientist tools and explain their uses',
          'Discuss safety rules for nature exploration',
          'Set expectations for respectful nature observation',
          'Give each child their scientist toolkit'
        ]
      },
      {
        id: 'outdoor-exploration',
        title: 'Nature Discovery Walk',
        type: 'activity',
        description: 'Guided outdoor exploration with scientific observation',
        content: 'Children explore outdoor environment, collecting natural materials and making observations using scientific tools.',
        duration: 20,
        learningObjectives: [
          'Children will make detailed observations of nature',
          'Children will collect and categorize natural materials',
          'Children will use scientific tools appropriately'
        ],
        materials: ['Magnifying glasses', 'Collection containers', 'Digital camera', 'Observation clipboards'],
        instructions: [
          'Guide children to different outdoor areas',
          'Encourage close observation with magnifying glasses',
          'Help children document findings',
          'Support categorization of discoveries'
        ]
      },
      {
        id: 'investigation-station',
        title: 'Indoor Investigation Lab',
        type: 'activity',
        description: 'Structured investigation of collected materials',
        content: 'Children examine their nature collections more closely, comparing, sorting, and hypothesizing about their discoveries.',
        duration: 15,
        learningObjectives: [
          'Children will compare and contrast natural materials',
          'Children will form hypotheses about natural phenomena',
          'Children will document observations'
        ],
        materials: ['Microscopes or magnifying glasses', 'Sorting trays', 'Measurement tools', 'Recording sheets'],
        instructions: [
          'Set up investigation stations',
          'Guide children through close examination',
          'Encourage scientific vocabulary',
          'Help children record discoveries'
        ]
      },
      {
        id: 'experiment-time',
        title: 'Simple Science Experiment',
        type: 'activity',
        description: 'Hands-on experiment related to nature discoveries',
        content: 'Conduct age-appropriate science experiment such as sink/float testing with natural materials or seed germination setup.',
        duration: 12,
        learningObjectives: [
          'Children will make predictions about outcomes',
          'Children will observe cause and effect',
          'Children will understand basic scientific concepts'
        ],
        materials: ['Water containers', 'Natural materials', 'Recording charts', 'Towels'],
        instructions: [
          'Introduce experiment question',
          'Have children make predictions',
          'Conduct experiment together',
          'Discuss observations and conclusions'
        ]
      },
      {
        id: 'scientist-sharing',
        title: 'Science Share & Reflect',
        type: 'reflection',
        description: 'Children share discoveries and reflect on learning',
        content: 'Scientists share their favorite discoveries and what they learned about being nature observers.',
        duration: 5,
        learningObjectives: [
          'Children will communicate scientific observations',
          'Children will reflect on the scientific process'
        ],
        materials: ['Discovery collections', 'Documentation from activities'],
        instructions: [
          'Gather in science circle',
          'Allow each child to share one discovery',
          'Discuss what scientists do',
          'Plan future nature investigations'
        ]
      }
    ],
    assessmentStrategy: 'Document children\'s observation skills, use of scientific vocabulary, and engagement in the scientific process through photos, work samples, and anecdotal records.',
    differentiationStrategies: [
      'Partner systems for children needing support',
      'Varied collection tools for different abilities',
      'Multiple ways to record observations',
      'Flexible grouping for activities'
    ],
    extensionActivities: [
      'Create nature museum display',
      'Plant classroom garden',
      'Weather observation station',
      'Nature art projects using collections'
    ]
  },
  {
    id: 'early-literacy-adventure',
    title: 'Early Literacy Adventure',
    category: 'Language & Literacy',
    description: 'Engaging introduction to letters, sounds, and storytelling through multi-sensory activities and play.',
    targetAge: '3-5 years',
    totalDuration: 50,
    learningDomains: ['Language Development', 'Cognitive Development', 'Physical Development'],
    sections: [
      {
        id: 'letter-intro',
        title: 'Letter of the Day Introduction',
        type: 'introduction',
        description: 'Interactive introduction to featured letter and sound',
        content: 'Introduce the letter through song, movement, and visual displays, connecting to children\'s names and familiar words.',
        duration: 8,
        learningObjectives: [
          'Children will identify the target letter',
          'Children will produce the letter sound',
          'Children will connect letter to familiar words'
        ],
        materials: ['Large letter cards', 'Letter song', 'Name cards', 'Sound props'],
        instructions: [
          'Display large letter prominently',
          'Sing letter introduction song',
          'Find letter in children\'s names',
          'Practice letter sound with actions'
        ]
      },
      {
        id: 'phonemic-play',
        title: 'Sound Play Activities',
        type: 'activity',
        description: 'Multi-sensory activities to reinforce letter-sound connections',
        content: 'Children engage with letter sounds through movement, music, and tactile experiences.',
        duration: 12,
        learningObjectives: [
          'Children will discriminate target sound from others',
          'Children will produce letter sound in isolation and words',
          'Children will identify objects beginning with target sound'
        ],
        materials: ['Sound boxes', 'Musical instruments', 'Textured letters', 'Picture cards'],
        instructions: [
          'Set up sound exploration stations',
          'Guide children through sound discrimination games',
          'Encourage sound production with movement',
          'Practice identifying beginning sounds'
        ]
      },
      {
        id: 'story-creation',
        title: 'Collaborative Story Building',
        type: 'content',
        description: 'Children participate in creating and telling stories',
        content: 'Build a story together using the target letter, encouraging creativity and narrative skills.',
        duration: 15,
        learningObjectives: [
          'Children will contribute to story development',
          'Children will understand story structure',
          'Children will use target letter words in context'
        ],
        materials: ['Story props', 'Recording materials', 'Illustration supplies'],
        instructions: [
          'Begin story with target letter character',
          'Encourage children to add story elements',
          'Include target letter words throughout',
          'Support illustration of story events'
        ]
      },
      {
        id: 'writing-practice',
        title: 'Letter Formation Fun',
        type: 'activity',
        description: 'Multi-sensory letter writing and formation practice',
        content: 'Children practice letter formation through various tactile and visual methods.',
        duration: 10,
        learningObjectives: [
          'Children will trace letter shapes accurately',
          'Children will attempt independent letter formation',
          'Children will develop fine motor control'
        ],
        materials: ['Sand trays', 'Finger paints', 'Letter formation cards', 'Various writing tools'],
        instructions: [
          'Demonstrate proper letter formation',
          'Offer multiple formation methods',
          'Support individual attempts',
          'Celebrate approximations and efforts'
        ]
      },
      {
        id: 'literacy-celebration',
        title: 'Reading & Writing Celebration',
        type: 'reflection',
        description: 'Celebrate literacy learning and share accomplishments',
        content: 'Children share their letter work and story contributions, celebrating their growing literacy skills.',
        duration: 5,
        learningObjectives: [
          'Children will share literacy accomplishments',
          'Children will develop confidence as readers and writers'
        ],
        materials: ['Children\'s work samples', 'Class story book'],
        instructions: [
          'Display children\'s letter work',
          'Read class story aloud together',
          'Celebrate individual contributions',
          'Connect to future literacy adventures'
        ]
      }
    ],
    assessmentStrategy: 'Use authentic assessment through work samples, observation checklists for letter recognition and formation, and documentation of phonemic awareness development.',
    differentiationStrategies: [
      'Multiple letter formation methods for different learners',
      'Peer partnerships for support',
      'Varied complexity levels within activities',
      'Home language connections and support'
    ],
    extensionActivities: [
      'Letter hunt around classroom and school',
      'Author study connecting to target letters',
      'Family story sharing and letter connections',
      'Creative writing center enhancements'
    ]
  },
  {
    id: 'math-concepts-explorer',
    title: 'Mathematical Thinking Explorer',
    category: 'Mathematics',
    description: 'Hands-on exploration of mathematical concepts through play, investigation, and real-world connections.',
    targetAge: '4-6 years',
    totalDuration: 55,
    learningDomains: ['Cognitive Development', 'Physical Development', 'Language Development'],
    sections: [
      {
        id: 'math-warmup',
        title: 'Number Sense Warm-Up',
        type: 'introduction',
        description: 'Engaging mathematical thinking through songs, counting, and pattern recognition',
        content: 'Begin with number songs, counting exercises, and pattern activities to activate mathematical thinking.',
        duration: 8,
        learningObjectives: [
          'Children will practice counting skills',
          'Children will recognize and extend patterns',
          'Children will engage with number concepts'
        ],
        materials: ['Number cards', 'Counting bears', 'Pattern blocks', 'Number songs'],
        instructions: [
          'Lead counting songs with movements',
          'Practice counting with manipulatives',
          'Explore simple patterns together',
          'Connect numbers to quantities'
        ]
      },
      {
        id: 'problem-solving',
        title: 'Real-World Math Problems',
        type: 'content',
        description: 'Children solve authentic problems using mathematical thinking',
        content: 'Present age-appropriate problems related to classroom situations, snack distribution, or play scenarios.',
        duration: 15,
        learningObjectives: [
          'Children will apply mathematical reasoning to real situations',
          'Children will communicate mathematical thinking',
          'Children will use various problem-solving strategies'
        ],
        materials: ['Manipulatives', 'Problem scenario props', 'Recording sheets'],
        instructions: [
          'Present engaging problem context',
          'Encourage multiple solution strategies',
          'Support mathematical communication',
          'Connect to children\'s experiences'
        ]
      },
      {
        id: 'hands-on-exploration',
        title: 'Mathematical Investigation Centers',
        type: 'activity',
        description: 'Rotation through mathematical exploration stations',
        content: 'Children rotate through centers focusing on measurement, geometry, patterns, and number operations.',
        duration: 20,
        learningObjectives: [
          'Children will explore mathematical concepts through manipulation',
          'Children will make mathematical comparisons and observations',
          'Children will develop mathematical vocabulary'
        ],
        materials: ['Measuring tools', 'Geometric shapes', 'Counting materials', 'Scales', 'Sorting trays'],
        instructions: [
          'Set up diverse mathematical exploration centers',
          'Provide clear activity instructions',
          'Rotate children through centers',
          'Facilitate mathematical discussions'
        ]
      },
      {
        id: 'math-games',
        title: 'Collaborative Math Games',
        type: 'activity',
        description: 'Structured games reinforcing mathematical concepts',
        content: 'Play age-appropriate games that reinforce counting, number recognition, and mathematical operations.',
        duration: 10,
        learningObjectives: [
          'Children will apply mathematical skills in game contexts',
          'Children will develop strategic thinking',
          'Children will practice mathematical fluency'
        ],
        materials: ['Dice', 'Game boards', 'Counting tokens', 'Number cards'],
        instructions: [
          'Explain game rules clearly',
          'Model mathematical strategies',
          'Encourage peer support',
          'Celebrate mathematical thinking'
        ]
      },
      {
        id: 'math-reflection',
        title: 'Mathematical Thinking Share',
        type: 'reflection',
        description: 'Children share mathematical discoveries and strategies',
        content: 'Reflect on mathematical learning and share favorite discoveries or problem-solving strategies.',
        duration: 2,
        learningObjectives: [
          'Children will communicate mathematical learning',
          'Children will reflect on problem-solving processes'
        ],
        materials: ['Work samples', 'Mathematical tools used'],
        instructions: [
          'Gather for math sharing circle',
          'Encourage sharing of strategies',
          'Highlight mathematical thinking',
          'Connect to future math explorations'
        ]
      }
    ],
    assessmentStrategy: 'Document mathematical thinking through observation, work samples, and photographs of problem-solving processes. Use performance-based assessment focused on reasoning rather than just correct answers.',
    differentiationStrategies: [
      'Varied manipulative choices for different learning styles',
      'Flexible grouping based on mathematical readiness',
      'Multiple entry points for mathematical problems',
      'Visual supports and concrete representations'
    ],
    extensionActivities: [
      'Mathematical cooking activities',
      'Measurement exploration throughout school',
      'Math journal documentation',
      'Family math challenges and games'
    ]
  }
];

export const getTemplateById = (id: string): ModuleTemplate | undefined => {
  return moduleTemplates.find(template => template.id === id);
};

export const getTemplatesByCategory = (category: string): ModuleTemplate[] => {
  return moduleTemplates.filter(template => template.category === category);
};

export const getAllCategories = (): string[] => {
  return [...new Set(moduleTemplates.map(template => template.category))];
};