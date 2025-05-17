import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { User } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/Header";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, AlertTriangle, Award, Check, ChevronRight, ClipboardList, Star } from "lucide-react";

// Audio feedback functions for game-like experience
const playLevelUpSound = () => {
  try {
    // Just use a beep sound for now as audio files might not be available
    const context = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = context.createOscillator();
    const gainNode = context.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(context.destination);
    
    oscillator.type = 'sine';
    oscillator.frequency.value = 800; // Value in hertz
    gainNode.gain.value = 0.1;
    
    oscillator.start();
    setTimeout(() => oscillator.stop(), 300);
    
    // Play another higher beep for the level-up effect
    setTimeout(() => {
      const oscillator2 = context.createOscillator();
      oscillator2.connect(gainNode);
      oscillator2.type = 'sine';
      oscillator2.frequency.value = 1200;
      oscillator2.start();
      setTimeout(() => oscillator2.stop(), 200);
    }, 300);
  } catch (error) {
    console.log('Sound playback error:', error);
  }
};

const playMasterLevelSound = () => {
  try {
    // Create a more complex sound for master level achievement
    const context = new (window.AudioContext || (window as any).webkitAudioContext)();
    const gainNode = context.createGain();
    gainNode.connect(context.destination);
    gainNode.gain.value = 0.1;
    
    // Play a series of ascending notes like a victory tune
    [300, 400, 500, 600, 800, 1000].forEach((freq, i) => {
      setTimeout(() => {
        const oscillator = context.createOscillator();
        oscillator.connect(gainNode);
        oscillator.type = 'sine';
        oscillator.frequency.value = freq;
        oscillator.start();
        setTimeout(() => oscillator.stop(), 150);
      }, i * 150);
    });
  } catch (error) {
    console.log('Sound playback error:', error);
  }
};

// Define assessment question types
type QuestionType = 'multiple-choice';
type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';

interface Question {
  id: string;
  text: string;
  domain: string;
  type: QuestionType;
  difficulty: DifficultyLevel;
  options: string[];
  correctAnswer: string;
  required: boolean;
  explanation?: string; // For internal reference, not shown to user
}

// Early childhood education domains - expanded to 18 categories based on ITERS/ECERS and CLASS assessment frameworks
const domains = [
  // ITERS/ECERS Categories
  { id: 'space-furnishings', name: 'Space & Furnishings', icon: ClipboardList },
  { id: 'personal-care', name: 'Personal Care Routines', icon: AlertCircle },
  { id: 'language-reasoning', name: 'Language & Reasoning', icon: ClipboardList },
  { id: 'activities', name: 'Activities', icon: Award },
  
  // CLASS Categories
  { id: 'emotional-support', name: 'Emotional Support', icon: Star },
  { id: 'classroom-organization', name: 'Classroom Organization', icon: ClipboardList },
  { id: 'instructional-support', name: 'Instructional Support', icon: Award },
  
  // Knowledge Categories
  { id: 'child-development', name: 'Child Development', icon: ClipboardList },
  { id: 'curriculum', name: 'Curriculum', icon: Award },
  { id: 'behavior-management', name: 'Behavior Management', icon: AlertTriangle },
  { id: 'literacy', name: 'Literacy', icon: ClipboardList },
  { id: 'social-emotional', name: 'Social-Emotional Learning', icon: Star },
  
  // Experience Categories
  { id: 'experience-level', name: 'Experience Level', icon: Award },
  { id: 'education', name: 'Education', icon: ClipboardList },
  { id: 'professional-development', name: 'Professional Development', icon: Star },
  { id: 'age-group-experience', name: 'Age Group Experience', icon: ClipboardList },
  { id: 'professional-goals', name: 'Professional Goals', icon: Star },
  
  // Core Training Modules
  { id: 'chapter-one', name: 'Building Chapter One', icon: Star },
  { id: 'mindful-teaching', name: 'Mindful Teaching', icon: ClipboardList },
  { id: 'core-values', name: 'Raising Arizona\'s CORE Values', icon: Award },
];

// Define adaptive assessment questions with increasing difficulty
const assessmentQuestions: Question[] = [
  // Space & Furnishings - Beginner Level
  {
    id: 'sf-b-1',
    text: 'What is an important consideration when arranging furniture in a preschool classroom?',
    domain: 'space-furnishings',
    type: 'multiple-choice',
    difficulty: 'beginner',
    options: [
      'Placing all furniture against walls to maximize open space', 
      'Creating defined learning areas while allowing for supervision', 
      'Using adult-sized furniture to prepare children for elementary school', 
      'Minimizing furniture to reduce cleaning needs'
    ],
    correctAnswer: 'Creating defined learning areas while allowing for supervision',
    required: true,
    explanation: 'Effective classroom arrangement creates clearly defined learning centers while maintaining sight lines for supervision and allowing smooth traffic flow.'
  },
  {
    id: 'sf-b-2',
    text: 'According to ECERS standards, which of the following is most important for an early childhood classroom?',
    domain: 'space-furnishings',
    type: 'multiple-choice',
    difficulty: 'beginner',
    options: [
      'Having matching decorative themes throughout all areas', 
      'Displaying only perfect examples of children\'s work', 
      'Providing child-sized furniture and fixtures', 
      'Including as many learning materials as possible in each area'
    ],
    correctAnswer: 'Providing child-sized furniture and fixtures',
    required: true,
    explanation: 'Child-sized furniture allows for proper ergonomics, independence, and comfort, which are essential for children\'s learning and development.'
  },
  
  // Space & Furnishings - Intermediate Level
  {
    id: 'sf-i-1',
    text: 'How should teachers effectively use wall displays in an early childhood classroom?',
    domain: 'space-furnishings',
    type: 'multiple-choice',
    difficulty: 'intermediate',
    options: [
      'Cover all wall space with educational posters purchased commercially', 
      'Display only the highest quality children\'s work', 
      'Position displays at child eye level with a balance of children\'s work and useful materials', 
      'Change displays completely each week to maintain interest'
    ],
    correctAnswer: 'Position displays at child eye level with a balance of children\'s work and useful materials',
    required: true,
    explanation: 'Effective displays are positioned at children\'s eye level, include their own work (fostering ownership), incorporate some teacher-created materials, and include functional items like schedules and helper charts.'
  },
  {
    id: 'sf-i-2',
    text: 'What is the purpose of "soft spaces" in an early childhood classroom?',
    domain: 'space-furnishings',
    type: 'multiple-choice',
    difficulty: 'intermediate',
    options: [
      'To separate children during conflict situations', 
      'To provide comfortable areas for rest, reflection, and emotional regulation', 
      'To reduce noise levels in the classroom', 
      'To create designated spaces for children with disabilities'
    ],
    correctAnswer: 'To provide comfortable areas for rest, reflection, and emotional regulation',
    required: true,
    explanation: 'Soft spaces with cushions, pillows, or couches provide children with comfortable retreats for relaxation, emotional regulation, quiet reading, or gentle social interaction.'
  },
  
  // Space & Furnishings - Advanced Level
  {
    id: 'sf-a-1',
    text: 'What approach to classroom design best supports children with sensory processing needs?',
    domain: 'space-furnishings',
    type: 'multiple-choice',
    difficulty: 'advanced',
    options: [
      'Bright, stimulating colors and patterns throughout the room', 
      'Creating a visually uniform environment with minimal distractions', 
      'Incorporating distinct zones with varied sensory properties and predictable boundaries', 
      'Using open-concept design to encourage flexibility'
    ],
    correctAnswer: 'Incorporating distinct zones with varied sensory properties and predictable boundaries',
    required: true,
    explanation: 'An optimal environment for children with sensory processing needs includes clearly defined areas with varied sensory properties (quiet zones, movement zones), predictable boundaries, and options for both sensory engagement and sensory breaks.'
  },
  {
    id: 'sf-a-2',
    text: 'According to best practices in environmental design for early childhood, how should natural elements be incorporated?',
    domain: 'space-furnishings',
    type: 'multiple-choice',
    difficulty: 'advanced',
    options: [
      'Include only artificial natural elements to avoid allergens', 
      'Limit natural elements to isolated science areas', 
      'Integrate natural materials, living things, and outdoor connections throughout the environment', 
      'Use nature-themed decorations rather than actual natural elements'
    ],
    correctAnswer: 'Integrate natural materials, living things, and outdoor connections throughout the environment',
    required: true,
    explanation: 'Best practice involves bringing nature indoors through natural light, views of the outdoors, plants, natural materials (wood, stone, etc.), and natural elements in play materials, creating a biophilic environment that supports children\'s innate connection to nature.'
  },
  
  // Space & Furnishings - Expert Level
  {
    id: 'sf-e-1',
    text: 'Which statement best reflects an expert understanding of how classroom environmental design influences cognitive development?',
    domain: 'space-furnishings',
    type: 'multiple-choice',
    difficulty: 'expert',
    options: [
      'Environmental design primarily affects mood but has minimal impact on cognitive skills', 
      'The physical environment acts as a "third teacher," with complexity, flexibility, and intentional design supporting multiple cognitive processes', 
      'Children adapt quickly to any environment, so design elements have limited long-term impact', 
      'Environmental design should prioritize aesthetic appeal over cognitive considerations'
    ],
    correctAnswer: 'The physical environment acts as a "third teacher," with complexity, flexibility, and intentional design supporting multiple cognitive processes',
    required: true,
    explanation: 'Expert understanding recognizes that thoughtfully designed environments support executive function, problem-solving, creativity, and critical thinking through appropriate complexity, flexible spaces that transform based on children\'s interests, and materials arranged to provoke deeper thinking—aligning with the Reggio Emilia concept of environment as "third teacher."'
  },
  {
    id: 'sf-e-2',
    text: 'How would an expert in early childhood environments design a space to support the development of self-regulation and executive function?',
    domain: 'space-furnishings',
    type: 'multiple-choice',
    difficulty: 'expert',
    options: [
      'Create highly stimulating environments that capture children\'s attention', 
      'Design spaces with minimal distractions and limited choices to reduce stress', 
      'Incorporate graduated challenges, visual cues for expectations, and spaces supporting both engagement and reflection', 
      'Maintain rigid schedules and unchanged environments to build routine-based regulation'
    ],
    correctAnswer: 'Incorporate graduated challenges, visual cues for expectations, and spaces supporting both engagement and reflection',
    required: true,
    explanation: 'Expert design for self-regulation includes visual cues that support memory and expectations (e.g., pictorial schedules, labeled shelves); spaces that balance stimulation with calm; graduated challenges in materials; clear boundaries; and dedicated areas for emotional regulation—all working together to scaffold executive function development.'
  },
  
  // Personal Care Routines - Beginner Level
  {
    id: 'pcr-b-1',
    text: 'What is the most effective way to prevent the spread of illness in a preschool setting?',
    domain: 'personal-care',
    type: 'multiple-choice',
    difficulty: 'beginner',
    options: [
      'Sending home children at the first sign of a runny nose', 
      'Regular handwashing by children and staff', 
      'Using antibacterial soap for all cleaning tasks', 
      'Keeping windows open regardless of weather'
    ],
    correctAnswer: 'Regular handwashing by children and staff',
    required: true,
    explanation: 'Frequent and proper handwashing is the single most effective way to reduce the spread of communicable diseases in early childhood settings.'
  },
  {
    id: 'pcr-b-2',
    text: 'Which approach to diapering aligns with best practices in early childhood health and safety?',
    domain: 'personal-care',
    type: 'multiple-choice',
    difficulty: 'beginner',
    options: [
      'Changing diapers only at scheduled times to maintain classroom routine', 
      'Having children stand during diapering to promote independence', 
      'Following a consistent sanitary procedure including handwashing, gloves, and surface disinfection', 
      'Completing diapering quickly to minimize disruption to the child'
    ],
    correctAnswer: 'Following a consistent sanitary procedure including handwashing, gloves, and surface disinfection',
    required: true,
    explanation: 'Proper diapering procedures minimize the spread of infectious disease, maintain hygiene, and protect both children and caregivers.'
  },
  
  // Personal Care Routines - Intermediate Level
  {
    id: 'pcr-i-1',
    text: 'How can teachers effectively promote self-care skills in preschoolers?',
    domain: 'personal-care',
    type: 'multiple-choice',
    difficulty: 'intermediate',
    options: [
      'Complete care tasks for children to ensure they are done correctly', 
      'Provide verbal step-by-step instructions without physical assistance', 
      'Use peer modeling and gentle guidance, allowing adequate time for practice', 
      'Implement rewards for children who complete self-care tasks quickly'
    ],
    correctAnswer: 'Use peer modeling and gentle guidance, allowing adequate time for practice',
    required: true,
    explanation: 'Supporting self-care skill development involves allowing children time to practice, scaffolding their attempts, using peer modeling, and recognizing the developmental progression of skills.'
  },
  {
    id: 'pcr-i-2',
    text: 'Which of the following best describes an appropriate approach to naptime in an early childhood setting?',
    domain: 'personal-care',
    type: 'multiple-choice',
    difficulty: 'intermediate',
    options: [
      'Requiring all children to sleep for the same duration at the same time', 
      'Playing stimulating music to keep non-sleepers engaged', 
      'Creating individual sleep/rest plans responsive to each child\'s needs with consistent routines and comfort objects', 
      'Keeping the room brightly lit to prevent children from becoming too drowsy'
    ],
    correctAnswer: 'Creating individual sleep/rest plans responsive to each child\'s needs with consistent routines and comfort objects',
    required: true,
    explanation: 'Effective naptime approaches recognize individual differences in sleep needs, provide consistent and calming routines, respect family preferences, and allow for differences in sleep/rest requirements.'
  },
  
  // Personal Care Routines - Advanced Level
  {
    id: 'pcr-a-1',
    text: 'How should teachers approach toilet learning according to developmentally appropriate practice?',
    domain: 'personal-care',
    type: 'multiple-choice',
    difficulty: 'advanced',
    options: [
      'Begin toilet training all children at the same age to encourage peer learning', 
      'Use rewards and consequences to motivate toilet learning progress', 
      'Follow rigid schedules regardless of individual readiness cues', 
      'Collaborate with families while focusing on physiological readiness, child interest, and supportive strategies'
    ],
    correctAnswer: 'Collaborate with families while focusing on physiological readiness, child interest, and supportive strategies',
    required: true,
    explanation: 'Advanced understanding of toilet learning involves recognizing physiological and emotional readiness cues, maintaining consistency between home and school, avoiding power struggles, and using supportive rather than punitive or reward-based approaches.'
  },
  {
    id: 'pcr-a-2',
    text: 'Which approach to mealtime best reflects advanced understanding of personal care routines in early childhood?',
    domain: 'personal-care',
    type: 'multiple-choice',
    difficulty: 'advanced',
    options: [
      'Serve pre-portioned food and require children to eat everything on their plates', 
      'Use a family-style approach that promotes social interaction, self-regulation, and fine motor development', 
      'Minimize conversation to enable efficient eating and quick transitions', 
      'Group children by eating speed to optimize the schedule'
    ],
    correctAnswer: 'Use a family-style approach that promotes social interaction, self-regulation, and fine motor development',
    required: true,
    explanation: 'Advanced mealtime approaches recognize eating as a learning experience that builds social skills, language, self-regulation, and cultural awareness, while respecting children\'s autonomy over how much they eat.'
  },
  
  // Personal Care Routines - Expert Level
  {
    id: 'pcr-e-1',
    text: 'Which statement reflects the most sophisticated understanding of how personal care routines impact children\'s development beyond health and safety?',
    domain: 'personal-care',
    type: 'multiple-choice',
    difficulty: 'expert',
    options: [
      'Personal care routines primarily impact physical development and have minimal influence on other developmental domains', 
      'Well-designed personal care routines build executive function, agency, cultural understanding, and provide opportunities for rich language interactions', 
      'The main developmental impact of personal care routines is teaching children to follow directions', 
      'Personal care routines should be completed quickly to maximize time for academic learning'
    ],
    correctAnswer: 'Well-designed personal care routines build executive function, agency, cultural understanding, and provide opportunities for rich language interactions',
    required: true,
    explanation: 'Expert understanding recognizes that personal care routines are powerful learning contexts for multiple developmental domains—building executive function through predictable sequences, supporting emotional development through caring interactions, developing language through authentic conversations, and respecting cultural diversity through inclusive practices.'
  },
  {
    id: 'pcr-e-2',
    text: 'How would an expert preschool teacher approach transitions between activities as part of personal care routines?',
    domain: 'personal-care',
    type: 'multiple-choice',
    difficulty: 'expert',
    options: [
      'Keep transitions brief with minimal explanation to prevent disruption', 
      'Use adult-directed transitions with strict time limits to maintain efficiency', 
      'View transitions as valuable learning opportunities, using intentional strategies that build self-regulation and reduce stress', 
      'Group children by ability level during transitions to simplify management'
    ],
    correctAnswer: 'View transitions as valuable learning opportunities, using intentional strategies that build self-regulation and reduce stress',
    required: true,
    explanation: 'Expert practice treats transitions as meaningful learning experiences rather than just moving between activities. This includes using visual and auditory cues, embedding learning (songs, fingerplays, movement), providing individualized support, teaching time concepts, and designing the schedule to minimize waiting while maintaining predictability.'
  },
  
  // Activities - Beginner Level
  {
    id: 'act-b-1',
    text: 'Which of the following is most important when selecting materials for art activities?',
    domain: 'activities',
    type: 'multiple-choice',
    difficulty: 'beginner',
    options: [
      'Using only washable materials', 
      'Providing open-ended materials that allow for creativity and self-expression', 
      'Ensuring all children make similar finished products', 
      'Using primarily pre-made craft kits'
    ],
    correctAnswer: 'Providing open-ended materials that allow for creativity and self-expression',
    required: true,
    explanation: 'High-quality art activities focus on the process rather than the product, with open-ended materials allowing children to express themselves creatively.'
  },
  {
    id: 'act-b-2',
    text: 'What is the primary purpose of block play in early childhood?',
    domain: 'activities',
    type: 'multiple-choice',
    difficulty: 'beginner',
    options: [
      'To keep children busy during free play times', 
      'To teach specific architectural concepts', 
      'To support development across multiple domains including spatial awareness, math, problem-solving, and social skills', 
      'To prepare children for construction careers'
    ],
    correctAnswer: 'To support development across multiple domains including spatial awareness, math, problem-solving, and social skills',
    required: true,
    explanation: 'Block play is a foundational early childhood activity that supports spatial reasoning, mathematical thinking, physics concepts, problem-solving, language development, and social skills.'
  },
  
  // Activities - Intermediate Level
  {
    id: 'act-i-1',
    text: 'How should dramatic play areas be set up to maximize learning?',
    domain: 'activities',
    type: 'multiple-choice',
    difficulty: 'intermediate',
    options: [
      'With all materials displayed on open shelves without any thematic arrangement', 
      'With realistic props organized in meaningful thematic setups that reflect children\'s experiences', 
      'With teacher-directed dramatic play scenarios changed daily', 
      'With primarily electronic toys that simulate real-life experiences'
    ],
    correctAnswer: 'With realistic props organized in meaningful thematic setups that reflect children\'s experiences',
    required: true,
    explanation: 'Effective dramatic play areas include realistic props organized in ways that reflect children\'s real-life experiences and community contexts, with materials rotated based on children\'s interests and curriculum goals.'
  },
  {
    id: 'act-i-2',
    text: 'What characterizes high-quality science activities in early childhood?',
    domain: 'activities',
    type: 'multiple-choice',
    difficulty: 'intermediate',
    options: [
      'Teacher demonstrations of scientific principles without hands-on exploration', 
      'Memorization of scientific facts appropriate for young children', 
      'Opportunities for active exploration, observation, prediction, and experimentation with natural materials', 
      'Activities limited to designated science time in the weekly schedule'
    ],
    correctAnswer: 'Opportunities for active exploration, observation, prediction, and experimentation with natural materials',
    required: true,
    explanation: 'Effective early childhood science experiences involve hands-on exploration, observation, questioning, predicting, experimenting, and reflecting—with teachers facilitating children\'s natural curiosity rather than simply presenting facts.'
  },
  
  // Activities - Advanced Level
  {
    id: 'act-a-1',
    text: 'What approach to technology use best supports young children\'s development?',
    domain: 'activities',
    type: 'multiple-choice',
    difficulty: 'advanced',
    options: [
      'Maximizing screen time to prepare children for the digital world', 
      'Avoiding all technology use with young children', 
      'Using technology intentionally as one of many tools, with active adult mediation and emphasis on creation rather than passive consumption', 
      'Focusing on educational apps and games as the primary learning activity'
    ],
    correctAnswer: 'Using technology intentionally as one of many tools, with active adult mediation and emphasis on creation rather than passive consumption',
    required: true,
    explanation: 'Developmentally appropriate technology use is intentional, involves active adult mediation, emphasizes creation over consumption, connects to real-world experiences, and is just one of many learning tools rather than dominating children\'s experiences.'
  },
  {
    id: 'act-a-2',
    text: 'How should outdoor activities be structured in a high-quality early childhood program?',
    domain: 'activities',
    type: 'multiple-choice',
    difficulty: 'advanced',
    options: [
      'As primarily recess time with minimal teacher involvement', 
      'With a focus on organized sports and games led by teachers', 
      'By bringing indoor activities outside on nice days', 
      'As an extension of the learning environment with natural elements, varied terrain, and open-ended materials for exploration'
    ],
    correctAnswer: 'As an extension of the learning environment with natural elements, varied terrain, and open-ended materials for exploration',
    required: true,
    explanation: 'High-quality outdoor experiences view the outdoors as an extension of the learning environment—providing diverse natural elements, varied terrain, open-ended materials, and opportunities for appropriate risk-taking, physical development, and nature connection.'
  },
  
  // Activities - Expert Level
  {
    id: 'act-e-1',
    text: 'Which approach to math activities best reflects current research on mathematical development in young children?',
    domain: 'activities',
    type: 'multiple-choice',
    difficulty: 'expert',
    options: [
      'Focusing on rote counting and numeral recognition to build foundational skills', 
      'Delaying mathematical instruction until children show readiness for abstract thinking', 
      'Integrating mathematical thinking throughout the day in meaningful contexts, building on children\'s informal mathematical knowledge', 
      'Using primarily worksheet-based instruction to ensure school readiness'
    ],
    correctAnswer: 'Integrating mathematical thinking throughout the day in meaningful contexts, building on children\'s informal mathematical knowledge',
    required: true,
    explanation: 'Expert math instruction recognizes that young children develop significant informal mathematical knowledge before formal schooling. It builds on this knowledge by integrating mathematical concepts in meaningful contexts, using spatial and geometric thinking alongside number concepts, and employing intentional math talk throughout the day rather than isolating math to specific lessons.'
  },
  {
    id: 'act-e-2',
    text: 'How should a master teacher approach the integration of diverse cultural perspectives in activities?',
    domain: 'activities',
    type: 'multiple-choice',
    difficulty: 'expert',
    options: [
      'By designating specific days for multicultural activities throughout the year', 
      'By providing general activities that are culturally neutral to be inclusive to all', 
      'By authentically embedding multiple cultural perspectives in everyday activities and materials, involving families, and critically examining biases in resources', 
      'By focusing on universal childhood themes that transcend cultural differences'
    ],
    correctAnswer: 'By authentically embedding multiple cultural perspectives in everyday activities and materials, involving families, and critically examining biases in resources',
    required: true,
    explanation: 'Expert practice involves embedding diverse cultural perspectives authentically in everyday experiences rather than as special events, engaging families as cultural resources, critically examining resources for bias and stereotypes, reflecting children\'s lived experiences, and addressing issues of equity and representation in ways that are developmentally appropriate.'
  },
  
  // Language & Reasoning - Beginner Level
  {
    id: 'lr-b-1',
    text: 'Which of the following best supports language development in preschoolers?',
    domain: 'language-reasoning',
    type: 'multiple-choice',
    difficulty: 'beginner',
    options: [
      'Correcting children\'s grammatical errors immediately', 
      'Engaging in back-and-forth conversations throughout the day', 
      'Using simplified vocabulary with young children', 
      'Having children repeat words and phrases in unison'
    ],
    correctAnswer: 'Engaging in back-and-forth conversations throughout the day',
    required: true,
    explanation: 'Responsive conversations where adults listen, respond to, and expand on children\'s ideas provide the richest context for language development.'
  },
  {
    id: 'lr-b-2',
    text: 'What is the most effective way to build vocabulary in young children?',
    domain: 'language-reasoning',
    type: 'multiple-choice',
    difficulty: 'beginner',
    options: [
      'Using flashcards with new words daily', 
      'Introducing new words within meaningful contexts and experiences', 
      'Having children memorize lists of thematic words', 
      'Focusing primarily on basic vocabulary before introducing complex terms'
    ],
    correctAnswer: 'Introducing new words within meaningful contexts and experiences',
    required: true,
    explanation: 'Children learn new vocabulary most effectively when words are introduced in context, connected to hands-on experiences, and used repeatedly in meaningful situations.'
  },
  
  // Language & Reasoning - Intermediate Level
  {
    id: 'lr-i-1',
    text: 'Which questioning strategy best promotes higher-order thinking in preschoolers?',
    domain: 'language-reasoning',
    type: 'multiple-choice',
    difficulty: 'intermediate',
    options: [
      'Asking primarily yes/no questions to check comprehension', 
      'Using mainly recall questions about basic facts', 
      'Posing open-ended questions that encourage prediction, comparison, and problem-solving', 
      'Avoiding challenging questions to prevent frustration'
    ],
    correctAnswer: 'Posing open-ended questions that encourage prediction, comparison, and problem-solving',
    required: true,
    explanation: 'Open-ended questions that ask children to predict, analyze, compare, or solve problems stimulate language use and cognitive development by encouraging children to think more deeply.'
  },
  {
    id: 'lr-i-2',
    text: 'How can teachers best support bilingual or multilingual learners in the classroom?',
    domain: 'language-reasoning',
    type: 'multiple-choice',
    difficulty: 'intermediate',
    options: [
      'Encouraging families to speak only English at home', 
      'Grouping children by language to minimize confusion', 
      'Valuing home languages while providing scaffolded support for English acquisition', 
      'Limiting instruction to simple English vocabulary and phrases'
    ],
    correctAnswer: 'Valuing home languages while providing scaffolded support for English acquisition',
    required: true,
    explanation: 'Effective support for multilingual learners validates home languages as assets, provides scaffolded English instruction, incorporates cultural references, and engages families as partners in language development.'
  },
  
  // Building Chapter One - Beginner Level
  {
    id: 'ch1-b-1',
    text: 'What does "Building Chapter One" mean in the context of Raising Arizona Preschool?',
    domain: 'chapter-one',
    type: 'multiple-choice',
    difficulty: 'beginner',
    options: [
      'Writing actual books with children as an activity', 
      'Understanding that we are writing the first chapter of children\'s lives through our interactions', 
      'A curriculum focused on literacy development', 
      'A metaphor for creating classroom rules'
    ],
    correctAnswer: 'Understanding that we are writing the first chapter of children\'s lives through our interactions',
    required: true,
    explanation: 'Building Chapter One means recognizing that preschool educators are writing the first chapter of children\'s life stories through meaningful education and interactions.'
  },
  {
    id: 'ch1-b-2',
    text: 'How should morning greeting routines contribute to "Building Chapter One" for each child?',
    domain: 'chapter-one',
    type: 'multiple-choice',
    difficulty: 'beginner',
    options: [
      'By creating a strict schedule that all children follow', 
      'By making children feel they are the main character in their learning story each day', 
      'By focusing only on academic activities during greeting time', 
      'By minimizing transitions to maximize instructional time'
    ],
    correctAnswer: 'By making children feel they are the main character in their learning story each day',
    required: true,
    explanation: 'Morning greetings should make each child feel valued and centered in their own learning story - like they\'re the main character in a book we\'re helping to write.'
  },
  
  // Building Chapter One - Intermediate Level
  {
    id: 'ch1-i-1',
    text: 'Which approach aligns best with the "Building Chapter One" framework?',
    domain: 'chapter-one',
    type: 'multiple-choice',
    difficulty: 'intermediate',
    options: [
      'Consistently using a teacher-directed curriculum with all children receiving the same instruction', 
      'Focusing primarily on academic readiness skills through structured lessons', 
      'Recognizing each child\'s unique narrative and adapting learning experiences accordingly', 
      'Emphasizing discipline and structure to prepare children for kindergarten'
    ],
    correctAnswer: 'Recognizing each child\'s unique narrative and adapting learning experiences accordingly',
    required: true,
    explanation: 'Building Chapter One honors each child\'s unique story and journey, requiring teachers to adapt approaches based on individual needs rather than using a one-size-fits-all approach.'
  },
  {
    id: 'ch1-i-2',
    text: 'How does the concept of narrative influence how we handle challenging behaviors under the "Building Chapter One" approach?',
    domain: 'chapter-one',
    type: 'multiple-choice',
    difficulty: 'intermediate',
    options: [
      'We ignore negative behaviors to avoid reinforcing them', 
      'We view behaviors as communications and part of the child\'s developing story', 
      'We implement strict consequences to teach appropriate classroom behavior', 
      'We remove children from the group when they misbehave'
    ],
    correctAnswer: 'We view behaviors as communications and part of the child\'s developing story',
    required: true,
    explanation: 'Understanding behavior as communication allows us to see challenging moments as part of the child\'s developing narrative, not as isolated incidents that define them.'
  },
  
  // Building Chapter One - Advanced Level
  {
    id: 'ch1-a-1',
    text: 'How would a master teacher implement the "Building Chapter One" philosophy when communicating with parents about their child\'s development?',
    domain: 'chapter-one',
    type: 'multiple-choice',
    difficulty: 'advanced',
    options: [
      'Focus only on positive aspects to maintain parent satisfaction', 
      'Compare the child to peers to provide context for development', 
      'Discuss developmental concerns using clinical terminology to appear professional', 
      'Share observations as part of the child\'s unique story, framing challenges as chapters still being written'
    ],
    correctAnswer: 'Share observations as part of the child\'s unique story, framing challenges as chapters still being written',
    required: true,
    explanation: 'Master teachers communicate with parents by sharing their child\'s story with honesty while maintaining hope and partnership in writing the next parts of their narrative.'
  },
  {
    id: 'ch1-a-2',
    text: 'Which statement best reflects the advanced application of the "Building Chapter One" philosophy in curriculum planning?',
    domain: 'chapter-one',
    type: 'multiple-choice',
    difficulty: 'advanced',
    options: [
      'Creating a year-long plan that covers all required academic standards', 
      'Developing a standard curriculum that works effectively for most children', 
      'Weaving children\'s interests, cultural backgrounds, and individual narratives into emergent learning experiences', 
      'Following established best practices from leading early childhood curriculum models'
    ],
    correctAnswer: 'Weaving children\'s interests, cultural backgrounds, and individual narratives into emergent learning experiences',
    required: true,
    explanation: 'Advanced implementation of Building Chapter One means creating curriculum that incorporates each child\'s existing story (background, interests, culture) while leaving room for their continued development and voice.'
  },
  
  // Building Chapter One - Expert Level
  {
    id: 'ch1-e-1',
    text: 'How might a child\'s attachment style influence your approach to "Building Chapter One" with them?',
    domain: 'chapter-one',
    type: 'multiple-choice',
    difficulty: 'expert',
    options: [
      'Treat all attachment styles the same to ensure equity in the classroom', 
      'Focus exclusively on correcting insecure attachment by creating a highly structured environment', 
      'Recognize attachment patterns and tailor relationship-building accordingly while maintaining consistent safety and responsiveness',
      'Refer children with insecure attachment patterns to specialists and focus on academic skills'
    ],
    correctAnswer: 'Recognize attachment patterns and tailor relationship-building accordingly while maintaining consistent safety and responsiveness',
    required: true,
    explanation: 'Expert teachers understand attachment theory deeply and recognize how different patterns (secure, anxious, avoidant, disorganized) require tailored approaches to building trust, while maintaining the consistent safety and responsiveness that all children need to develop secure attachments.'
  },
  {
    id: 'ch1-e-2',
    text: 'Based on "The Body Keeps the Score" and trauma research, how should trauma-informed practices be integrated into the "Building Chapter One" approach?',
    domain: 'chapter-one',
    type: 'multiple-choice',
    difficulty: 'expert',
    options: [
      'Focus primarily on cognitive interventions since young children need to "think through" their trauma', 
      'Recognize that trauma is stored in the body and integrate sensory-motor activities, rhythmic movement, and co-regulation opportunities throughout the day', 
      'Maintain a highly stimulating environment to distract children from trauma triggers',
      'Avoid discussing emotions or challenging topics that might trigger trauma responses'
    ],
    correctAnswer: 'Recognize that trauma is stored in the body and integrate sensory-motor activities, rhythmic movement, and co-regulation opportunities throughout the day',
    required: true,
    explanation: 'Expert application of trauma research recognizes that trauma is stored in the body and nervous system, not just cognitively. Building Chapter One for children with trauma histories requires a bottom-up approach that starts with bodily safety, sensory integration, rhythmic activities, and co-regulation before addressing cognitive or emotional processing.'
  },
  {
    id: 'ch1-e-3',
    text: 'Which statement represents the most expert-level understanding of how early childhood adversity might affect neurobiological development in ways relevant to the "Building Chapter One" philosophy?',
    domain: 'chapter-one',
    type: 'multiple-choice',
    difficulty: 'expert',
    options: [
      'Early adversity primarily affects language development, so additional reading instruction can compensate', 
      'Children are naturally resilient and typically overcome adverse childhood experiences without intervention', 
      'Adverse experiences alter stress response systems, potentially impacting brain architecture, immune function, and gene expression, requiring multifaceted intervention approaches',
      'Early adversity only significantly impacts children if it occurs during specific developmental windows'
    ],
    correctAnswer: 'Adverse experiences alter stress response systems, potentially impacting brain architecture, immune function, and gene expression, requiring multifaceted intervention approaches',
    required: true,
    explanation: 'An expert understanding integrates epigenetics, neurobiology, and developmental psychology to recognize how toxic stress from adverse experiences can fundamentally alter developmental trajectories through multiple biological systems. This understanding informs a comprehensive approach to Building Chapter One that addresses physiological safety, relationship repair, and environmental modification.'
  },
  {
    id: 'ch1-e-4',
    text: 'When working with a child who exhibits behavioral challenges potentially related to disorganized attachment, which approach best represents mastery of the "Building Chapter One" philosophy?',
    domain: 'chapter-one',
    type: 'multiple-choice',
    difficulty: 'expert',
    options: [
      'Implement a consistent behavioral management system with clear rewards and consequences', 
      'Provide a predictable environment with attentive co-regulation, while scaffolding emotional vocabulary and offering repeated experiences of emotional safety', 
      'Refer the child for professional diagnosis before attempting significant classroom interventions',
      'Focus on academic skills to build self-esteem while minimizing attention to behavioral issues'
    ],
    correctAnswer: 'Provide a predictable environment with attentive co-regulation, while scaffolding emotional vocabulary and offering repeated experiences of emotional safety',
    required: true,
    explanation: 'Mastery in this area recognizes that disorganized attachment often stems from frightening or unpredictable caregiving experiences. The expert response involves creating safety through predictability, offering co-regulation rather than assuming self-regulation capacity, explicitly teaching emotional language, and providing repeated corrective emotional experiences that gradually reshape the child\'s internal working model.'
  },
  
  // Mindful Teaching - Beginner Level
  {
    id: 'mt-b-1',
    text: 'What is the primary purpose of implementing mindfulness practices in the Raising Arizona classroom?',
    domain: 'mindful-teaching',
    type: 'multiple-choice',
    difficulty: 'beginner',
    options: [
      'To keep children quiet during transitions', 
      'To help children learn self-regulation techniques', 
      'To replace traditional discipline methods', 
      'To reduce the need for teacher intervention'
    ],
    correctAnswer: 'To help children learn self-regulation techniques',
    required: true,
    explanation: 'Mindfulness practices help children develop essential self-regulation skills that benefit them academically, socially, and emotionally.'
  },
  {
    id: 'mt-b-2',
    text: 'Which of the following best describes the "Mindful Morning" approach at Raising Arizona Preschool?',
    domain: 'mindful-teaching',
    type: 'multiple-choice',
    difficulty: 'beginner',
    options: [
      'Starting the day with academic work while children are fresh', 
      'Keeping morning routines highly structured and predictable', 
      'Beginning each day with intentional connection and presence for each child', 
      'Minimizing transitions to reduce behavioral issues'
    ],
    correctAnswer: 'Beginning each day with intentional connection and presence for each child',
    required: true,
    explanation: 'Mindful Morning practices emphasize genuine connection and presence, establishing that each child is valued and seen from the moment they arrive.'
  },
  
  // Mindful Teaching - Intermediate Level
  {
    id: 'mt-i-1',
    text: 'How should a teacher respond when a child is having difficulty managing strong emotions, according to Raising Arizona\'s mindful teaching approach?',
    domain: 'mindful-teaching',
    type: 'multiple-choice',
    difficulty: 'intermediate',
    options: [
      'Redirect the child to a different activity to distract them', 
      'Remove the child from the situation until they calm down', 
      'Provide co-regulation support while acknowledging and naming the emotion', 
      'Explain to the child why their reaction is inappropriate'
    ],
    correctAnswer: 'Provide co-regulation support while acknowledging and naming the emotion',
    required: true,
    explanation: 'Mindful teaching recognizes that children need adult support to develop emotional regulation. Co-regulation (supporting the child through the emotion) while naming feelings builds emotional vocabulary and regulation skills.'
  },
  {
    id: 'mt-i-2',
    text: 'Which practice best demonstrates the integration of mindfulness and "Building Chapter One" philosophies?',
    domain: 'mindful-teaching',
    type: 'multiple-choice',
    difficulty: 'intermediate',
    options: [
      'Having a consistent circle time routine each morning', 
      'Creating learning activities based on children\'s assessed academic needs', 
      'Greeting each child by name and with a personalized interaction that recognizes their individuality', 
      'Maintaining a quiet, orderly classroom environment'
    ],
    correctAnswer: 'Greeting each child by name and with a personalized interaction that recognizes their individuality',
    required: true,
    explanation: 'This practice combines mindful presence with the recognition that each child has their own unique story, honoring both philosophies simultaneously.'
  },
  
  // Mindful Teaching - Advanced Level
  {
    id: 'mt-a-1',
    text: 'How would a master teacher apply mindfulness principles when addressing challenging classroom dynamics?',
    domain: 'mindful-teaching',
    type: 'multiple-choice',
    difficulty: 'advanced',
    options: [
      'Identify and separate children who don\'t get along to minimize conflicts', 
      'Create more structured activities with clear rules and consequences', 
      'Pause to observe patterns objectively before responding, then address underlying needs rather than just behaviors', 
      'Implement a classroom management system with rewards and consequences'
    ],
    correctAnswer: 'Pause to observe patterns objectively before responding, then address underlying needs rather than just behaviors',
    required: true,
    explanation: 'A master teacher uses mindful observation to understand patterns and underlying needs, responding thoughtfully rather than reactively to challenging dynamics.'
  },
  {
    id: 'mt-a-2',
    text: 'Which approach to professional growth best exemplifies a teacher committed to mindful teaching practices?',
    domain: 'mindful-teaching',
    type: 'multiple-choice',
    difficulty: 'advanced',
    options: [
      'Focusing on acquiring new classroom management techniques', 
      'Pursuing advanced credentials and certifications in early childhood education', 
      'Developing greater self-awareness and examining how their own emotions and background influence their teaching', 
      'Learning more academic instructional strategies to improve outcomes'
    ],
    correctAnswer: 'Developing greater self-awareness and examining how their own emotions and background influence their teaching',
    required: true,
    explanation: 'Mindful teaching requires ongoing self-reflection and awareness of how a teacher\'s own experiences and emotions affect their interactions with children.'
  },
  
  // Child Development - Beginner Level
  {
    id: 'cd-b-1',
    text: 'At what age do most children begin to walk independently?',
    domain: 'child-development',
    type: 'multiple-choice',
    difficulty: 'beginner',
    options: [
      '6-8 months', 
      '9-12 months', 
      '12-15 months', 
      '18-24 months'
    ],
    correctAnswer: '12-15 months',
    required: true,
    explanation: 'Most children take their first independent steps between 12-15 months, though the normal range can be 9-18 months.'
  },
  {
    id: 'cd-b-2',
    text: 'Which area of development is most closely associated with a child\'s ability to hold a crayon and draw?',
    domain: 'child-development',
    type: 'multiple-choice',
    difficulty: 'beginner',
    options: [
      'Cognitive development', 
      'Fine motor development', 
      'Gross motor development', 
      'Language development'
    ],
    correctAnswer: 'Fine motor development',
    required: true,
    explanation: 'Fine motor skills involve the coordination of small muscles, particularly in the hands and fingers.'
  },
  
  // Child Development - Intermediate Level
  {
    id: 'cd-i-1',
    text: 'According to Piaget\'s theory of cognitive development, in which stage do children begin to use symbolic thinking?',
    domain: 'child-development',
    type: 'multiple-choice',
    difficulty: 'intermediate',
    options: [
      'Sensorimotor stage', 
      'Preoperational stage', 
      'Concrete operational stage', 
      'Formal operational stage'
    ],
    correctAnswer: 'Preoperational stage',
    required: true,
    explanation: 'The preoperational stage (ages 2-7) is when children develop symbolic thinking and use language to represent objects and ideas.'
  },
  {
    id: 'cd-i-2',
    text: 'Which of the following best describes Theory of Mind in early childhood development?',
    domain: 'child-development',
    type: 'multiple-choice',
    difficulty: 'intermediate',
    options: [
      'A child\'s ability to count and understand numbers', 
      'A child\'s understanding that others have different thoughts and feelings', 
      'A child\'s ability to follow rules and regulations', 
      'A child\'s preference for concrete rather than abstract thinking'
    ],
    correctAnswer: 'A child\'s understanding that others have different thoughts and feelings',
    required: true,
    explanation: 'Theory of Mind develops around age 4-5 and refers to the understanding that others have their own thoughts, beliefs, and perspectives.'
  },
  
  // Child Development - Advanced Level
  {
    id: 'cd-a-1',
    text: 'Which brain structure is most responsible for emotion regulation and develops significantly during early childhood?',
    domain: 'child-development',
    type: 'multiple-choice',
    difficulty: 'advanced',
    options: [
      'Cerebellum', 
      'Prefrontal cortex', 
      'Amygdala', 
      'Hippocampus'
    ],
    correctAnswer: 'Prefrontal cortex',
    required: true,
    explanation: 'The prefrontal cortex continues developing into early adulthood and is critical for emotional regulation, impulse control, and executive functions.'
  },
  {
    id: 'cd-a-2',
    text: 'Which of the following best describes the Zone of Proximal Development (ZPD) in Vygotsky\'s sociocultural theory?',
    domain: 'child-development',
    type: 'multiple-choice',
    difficulty: 'advanced',
    options: [
      'The distance between a child\'s independent problem-solving ability and their potential with adult guidance', 
      'The physical area where optimal learning takes place in a classroom', 
      'The period between birth and age 8 when development is most rapid', 
      'The gap between concrete and abstract thinking in children'
    ],
    correctAnswer: 'The distance between a child\'s independent problem-solving ability and their potential with adult guidance',
    required: true,
    explanation: 'ZPD represents the difference between what a child can do independently and what they can achieve with help from a more knowledgeable other.'
  },
  
  // Curriculum & Planning - Beginner Level
  {
    id: 'cp-b-1',
    text: 'Which of the following is a key component of developmentally appropriate practice (DAP)?',
    domain: 'curriculum-planning',
    type: 'multiple-choice',
    difficulty: 'beginner',
    options: [
      'Following a strict, adult-directed curriculum', 
      'Focusing primarily on academic skills', 
      'Tailoring activities to children\'s developmental levels', 
      'Keeping all children on the same learning schedule'
    ],
    correctAnswer: 'Tailoring activities to children\'s developmental levels',
    required: true,
    explanation: 'DAP requires considering each child\'s age, individual characteristics, and cultural background when planning activities.'
  },
  {
    id: 'cp-b-2',
    text: 'What is the primary purpose of learning centers in an early childhood classroom?',
    domain: 'curriculum-planning',
    type: 'multiple-choice',
    difficulty: 'beginner',
    options: [
      'To keep children occupied while teachers complete paperwork', 
      'To provide opportunities for child-directed exploration and discovery', 
      'To separate children by ability level', 
      'To reduce the need for teacher supervision'
    ],
    correctAnswer: 'To provide opportunities for child-directed exploration and discovery',
    required: true,
    explanation: 'Learning centers allow children to explore materials, make choices, and engage in hands-on learning at their own pace.'
  },
  
  // Curriculum & Planning - Intermediate Level
  {
    id: 'cp-i-1',
    text: 'Which approach to early childhood education emphasizes the environment as the "third teacher"?',
    domain: 'curriculum-planning',
    type: 'multiple-choice',
    difficulty: 'intermediate',
    options: [
      'Montessori', 
      'Reggio Emilia', 
      'Waldorf', 
      'HighScope'
    ],
    correctAnswer: 'Reggio Emilia',
    required: true,
    explanation: 'The Reggio Emilia approach views the environment as a crucial teacher alongside adults and peers, with careful attention to aesthetics and organization.'
  },
  {
    id: 'cp-i-2',
    text: 'When implementing emergent curriculum, teachers should primarily:',
    domain: 'curriculum-planning',
    type: 'multiple-choice',
    difficulty: 'intermediate',
    options: [
      'Follow pre-planned lessons regardless of children\'s interests', 
      'Allow children to do whatever they want without guidance', 
      'Build on children\'s interests while integrating learning objectives', 
      'Focus solely on academic skills development'
    ],
    correctAnswer: 'Build on children\'s interests while integrating learning objectives',
    required: true,
    explanation: 'Emergent curriculum responds to children\'s interests while teachers intentionally weave in learning goals and standards.'
  },
  
  // Curriculum & Planning - Advanced Level
  {
    id: 'cp-a-1',
    text: 'Which assessment approach best aligns with the principles of authentic assessment in early childhood education?',
    domain: 'curriculum-planning',
    type: 'multiple-choice',
    difficulty: 'advanced',
    options: [
      'Standardized testing of specific skills', 
      'Documentation of children\'s work and learning processes over time', 
      'Weekly quizzes on taught content', 
      'Comparative rating of children against age norms'
    ],
    correctAnswer: 'Documentation of children\'s work and learning processes over time',
    required: true,
    explanation: 'Authentic assessment involves observing and documenting children in natural contexts, collecting work samples, and tracking progress over time.'
  },
  {
    id: 'cp-a-2',
    text: 'Which of the following best describes the concept of "scaffolding" in early childhood education?',
    domain: 'curriculum-planning',
    type: 'multiple-choice',
    difficulty: 'advanced',
    options: [
      'Breaking skills into small, sequential steps for mastery', 
      'Providing temporary support that is gradually removed as competence increases', 
      'Building physical structures and climbing equipment in the classroom', 
      'Creating distinct learning levels within the curriculum'
    ],
    correctAnswer: 'Providing temporary support that is gradually removed as competence increases',
    required: true,
    explanation: 'Scaffolding offers just enough assistance to help children succeed at tasks they couldn\'t complete independently, gradually reducing support as they become more capable.'
  },
  
  // Social-Emotional Learning - Beginner Level
  {
    id: 'se-b-1',
    text: 'Which of the following activities best supports preschoolers\' emotional development?',
    domain: 'social-emotional',
    type: 'multiple-choice',
    difficulty: 'beginner',
    options: [
      'Flashcards with emotion words', 
      'Quiet, independent reading time', 
      'Reading stories about feelings and discussing characters\' emotions', 
      'Memorizing rules for proper behavior'
    ],
    correctAnswer: 'Reading stories about feelings and discussing characters\' emotions',
    required: true,
    explanation: 'Story discussions help children recognize emotions, develop empathy, and connect narrative elements to their own experiences.'
  },
  {
    id: 'se-b-2',
    text: 'What is the most effective approach to helping toddlers resolve a conflict over a toy?',
    domain: 'social-emotional',
    type: 'multiple-choice',
    difficulty: 'beginner',
    options: [
      'Removing the toy completely', 
      'Telling them to share and take turns', 
      'Getting a duplicate toy for each child', 
      'Approaching calmly, acknowledging feelings, and guiding problem-solving'
    ],
    correctAnswer: 'Approaching calmly, acknowledging feelings, and guiding problem-solving',
    required: true,
    explanation: 'This approach validates children\'s emotions while teaching social skills and modeling peaceful conflict resolution.'
  },
  
  // Social-Emotional Learning - Intermediate Level
  {
    id: 'se-i-1',
    text: 'Which of the following best describes self-regulation in early childhood?',
    domain: 'social-emotional',
    type: 'multiple-choice',
    difficulty: 'intermediate',
    options: [
      'The ability to sit still during group time', 
      'The process of managing emotions, behavior, and attention to meet goals', 
      'Following classroom rules without reminders', 
      'Independence in self-care routines'
    ],
    correctAnswer: 'The process of managing emotions, behavior, and attention to meet goals',
    required: true,
    explanation: 'Self-regulation encompasses emotional, behavioral, and cognitive regulation and develops gradually throughout early childhood.'
  },
  {
    id: 'se-i-2',
    text: 'Which of these strategies is most effective for nurturing prosocial behavior in preschoolers?',
    domain: 'social-emotional',
    type: 'multiple-choice',
    difficulty: 'intermediate',
    options: [
      'Rewarding children with stickers when they share', 
      'Modeling kindness and explaining the impact of actions on others', 
      'Enforcing strict consequences for antisocial behavior', 
      'Separating children who struggle to get along'
    ],
    correctAnswer: 'Modeling kindness and explaining the impact of actions on others',
    required: true,
    explanation: 'This approach demonstrates prosocial behavior while helping children develop empathy by understanding how their actions affect others.'
  },
  
  // Social-Emotional Learning - Advanced Level
  {
    id: 'se-a-1',
    text: 'Which approach is most effective in supporting children who have experienced trauma?',
    domain: 'social-emotional',
    type: 'multiple-choice',
    difficulty: 'advanced',
    options: [
      'Maintaining rigid routines with zero tolerance for behavioral issues', 
      'Creating a trauma-sensitive environment with predictable routines and emotional support', 
      'Avoiding discussions or activities that might trigger emotions', 
      'Treating all children the same regardless of background'
    ],
    correctAnswer: 'Creating a trauma-sensitive environment with predictable routines and emotional support',
    required: true,
    explanation: 'Trauma-sensitive approaches provide safety, consistency, and supportive relationships while acknowledging the impact of adverse experiences on development.'
  },
  {
    id: 'se-a-2',
    text: 'What is the primary difference between emotion coaching and behaviorist approaches to managing challenging behaviors?',
    domain: 'social-emotional',
    type: 'multiple-choice',
    difficulty: 'advanced',
    options: [
      'Emotion coaching takes less time to implement', 
      'Behaviorist approaches focus on the underlying feelings while emotion coaching focuses on actions', 
      'Emotion coaching validates feelings while helping children learn appropriate expression; behaviorist approaches focus on changing behaviors through consequences', 
      'There is no significant difference between the approaches'
    ],
    correctAnswer: 'Emotion coaching validates feelings while helping children learn appropriate expression; behaviorist approaches focus on changing behaviors through consequences',
    required: true,
    explanation: 'Emotion coaching acknowledges emotions as valid while teaching regulation, whereas behaviorist approaches primarily target observable behaviors through reinforcement and consequences.'
  },
  
  // Health & Safety - Beginner Level
  {
    id: 'hs-b-1',
    text: 'What is the recommended hand washing procedure in early childhood settings?',
    domain: 'health-safety',
    type: 'multiple-choice',
    difficulty: 'beginner',
    options: [
      'Using hand sanitizer when soap isn\'t available', 
      'Washing with warm water for 5 seconds', 
      'Washing with soap and water for at least 20 seconds', 
      'Rinsing hands quickly under cold water'
    ],
    correctAnswer: 'Washing with soap and water for at least 20 seconds',
    required: true,
    explanation: 'Proper handwashing with soap and water for at least 20 seconds is the most effective way to prevent the spread of germs.'
  },
  {
    id: 'hs-b-2',
    text: 'Which of the following is a key component of playground safety in preschool settings?',
    domain: 'health-safety',
    type: 'multiple-choice',
    difficulty: 'beginner',
    options: [
      'Providing only equipment designed for school-aged children to challenge preschoolers', 
      'Having adequate fall surfacing under climbing equipment', 
      'Encouraging independent play without adult supervision', 
      'Allowing children to determine their own safety boundaries'
    ],
    correctAnswer: 'Having adequate fall surfacing under climbing equipment',
    required: true,
    explanation: 'Appropriate fall surfaces (like rubber mulch, pea gravel, or rubber mats) help prevent serious injuries from falls, which are the most common playground accidents.'
  },
  
  // Health & Safety - Intermediate Level
  {
    id: 'hs-i-1',
    text: 'What is the most appropriate response to a child with a known food allergy in an early childhood program?',
    domain: 'health-safety',
    type: 'multiple-choice',
    difficulty: 'intermediate',
    options: [
      'Isolating the child at meal times to prevent exposure', 
      'Having an individualized care plan and training all staff on emergency procedures', 
      'Banning all potential allergens from the classroom', 
      'Asking parents to provide all meals and snacks'
    ],
    correctAnswer: 'Having an individualized care plan and training all staff on emergency procedures',
    required: true,
    explanation: 'An individualized plan created with medical professionals and family ensures appropriate accommodations while emergency training prepares staff to respond to reactions.'
  },
  {
    id: 'hs-i-2',
    text: 'In terms of illness policies, when should a child typically be excluded from attending an early childhood program?',
    domain: 'health-safety',
    type: 'multiple-choice',
    difficulty: 'intermediate',
    options: [
      'When they have any symptoms of illness, no matter how mild', 
      'Only when they have a confirmed diagnosis from a doctor', 
      'When they have symptoms that prevent participation in activities, indicate contagious disease, or require more care than staff can provide', 
      'Only when they have a fever over 100°F'
    ],
    correctAnswer: 'When they have symptoms that prevent participation in activities, indicate contagious disease, or require more care than staff can provide',
    required: true,
    explanation: 'This balanced approach considers the individual child\'s well-being, the potential for disease transmission, and the program\'s ability to provide appropriate care.'
  },
  
  // Health & Safety - Advanced Level
  {
    id: 'hs-a-1',
    text: 'Which approach to emergency preparedness is most effective in early childhood programs?',
    domain: 'health-safety',
    type: 'multiple-choice',
    difficulty: 'advanced',
    options: [
      'Having detailed written plans accessible only to administrators', 
      'Conducting infrequent but very realistic emergency drills with children',
      'Having comprehensive, regularly updated plans with developmentally appropriate practice drills and staff training', 
      'Focusing primarily on natural disaster preparation since these are least predictable'
    ],
    correctAnswer: 'Having comprehensive, regularly updated plans with developmentally appropriate practice drills and staff training',
    required: true,
    explanation: 'Effective emergency preparedness requires current plans for various scenarios, regular age-appropriate practice, and staff who are well-trained in emergency procedures.'
  },
  {
    id: 'hs-a-2',
    text: 'Which approach best addresses the prevention of childhood obesity in early childhood settings?',
    domain: 'health-safety',
    type: 'multiple-choice',
    difficulty: 'advanced',
    options: [
      'Implementing calorie-restricted diets for children who are overweight', 
      'Eliminating all treat foods and focusing exclusively on nutrition education', 
      'Offering weekly weigh-ins to track children\'s weight status', 
      'Integrating nutritious food options, regular physical activity, and positive food attitudes into daily routines'
    ],
    correctAnswer: 'Integrating nutritious food options, regular physical activity, and positive food attitudes into daily routines',
    required: true,
    explanation: 'This holistic approach promotes healthy habits without focusing on weight, incorporating regular movement, nutritious foods, and positive relationships with eating.'
  }
];

export default function AssessmentPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  // Get the currently authenticated user
  const { data: user } = useQuery<User>({ 
    queryKey: ["/api/auth/me"]
  });
  
  // Track the current domain being assessed
  const [currentDomainIndex, setCurrentDomainIndex] = useState(0);
  const currentDomain = domains[currentDomainIndex].id;
  
  // Track difficulty level and performance for adaptive assessment
  const [domainDifficulty, setDomainDifficulty] = useState<Record<string, DifficultyLevel>>(() => {
    // Initialize difficulty levels for all domains
    const initialDifficulties: Record<string, DifficultyLevel> = {};
    domains.forEach(domain => {
      initialDifficulties[domain.id] = 'beginner';
    });
    return initialDifficulties;
  });
  
  // Feedback for the current answer
  const [answerFeedback, setAnswerFeedback] = useState<{
    shown: boolean;
    correct: boolean;
    explanation: string;
  }>({
    shown: false,
    correct: false,
    explanation: ''
  });
  
  // Progress tracking state
  const [progress, setProgress] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [computeLearningPath, setComputeLearningPath] = useState(false);
  
  // Track correct answers by domain
  const [correctByDomain, setCorrectByDomain] = useState<Record<string, number>>({
    'child-development': 0,
    'curriculum-planning': 0,
    'social-emotional': 0,
    'health-safety': 0,
    'chapter-one': 0,     // New domain
    'mindful-teaching': 0 // New domain
  });
  
  // Track incorrect answers by domain
  const [incorrectByDomain, setIncorrectByDomain] = useState<Record<string, number>>({
    'child-development': 0,
    'curriculum-planning': 0,
    'social-emotional': 0,
    'health-safety': 0,
    'chapter-one': 0,     // New domain
    'mindful-teaching': 0 // New domain
  });
  
  // State variables for tracking the assessment are declared above
  
  // Track answered questions by ID
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [completedQuestions, setCompletedQuestions] = useState<string[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  
  // We'll track if assessment data exists when we need it
  
  // Function to initialize/reset assessment state
  const initializeAssessment = () => {
    setCurrentQuestionIndex(0);
    setCurrentDomainIndex(0);
    setAnswers({});
    setProgress(0);
    setShowResults(false);
    setComputeLearningPath(false);
  };
  
  // Function to update domain questions based on difficulty - improved with better error handling
  const updateDomainQuestions = (domainId: string, difficulty: DifficultyLevel) => {
    try {
      console.log(`Updating questions for domain: ${domainId}, difficulty: ${difficulty}`);
      
      // Validate domain exists
      if (!domains.some(d => d.id === domainId)) {
        throw new Error(`Domain ${domainId} not found in domains list`);
      }
      
      // Filter questions for the specified domain and difficulty
      const filteredQuestions = assessmentQuestions.filter(q => 
        q.domain === domainId && q.difficulty === difficulty
      );
      
      // If no questions are available for this difficulty, we have a problem
      if (filteredQuestions.length === 0) {
        console.error(`No questions available for domain ${domainId} at difficulty ${difficulty}`);
        
        // Check if the domain exists in our domains list
        const validDomains = domains.map(d => d.id);
        if (!validDomains.includes(domainId)) {
          console.error(`Invalid domain: ${domainId}. Valid domains are: ${validDomains.join(', ')}`);
          // Skip this domain and move to the next one
          setCurrentDomainIndex(prevIndex => (prevIndex + 1) % domains.length);
          return;
        }
        
        // Fall back to easiest difficulty that has questions
        if (difficulty !== 'beginner') {
          toast({
            title: "Adjusting difficulty level",
            description: `No ${difficulty} questions available. Switching to a more accessible level.`,
            variant: "destructive",
            duration: 3000,
          });
          
          // Try loading beginner questions instead
          setDomainDifficulty(prev => ({
            ...prev,
            [domainId]: 'beginner'
          }));
          
          // Recursively call with 'beginner' difficulty
          updateDomainQuestions(domainId, 'beginner');
          return;
        } else {
          // All domains should have questions available now, but special handling just in case
          console.log(`Checking specific questions for domain: ${domainId}`);
          
          // Remove special handling for domains and use specific error handling
          if (domainId === 'activities') {
            console.log(`Handling 'activities' domain with specific questions`);
            
            // Create default questions for activities domain if none are found
            const activityQuestions = [
              {
                id: 'act-default-1',
                text: 'Which of the following is most important when selecting materials for art activities?',
                domain: 'activities',
                type: 'multiple-choice' as QuestionType,
                difficulty: 'beginner' as DifficultyLevel,
                options: [
                  'Materials that result in recognizable finished products',
                  'Process-oriented, open-ended materials that encourage creativity',
                  'Pre-cut shapes and templates for children to use',
                  'Materials that match the classroom color scheme'
                ],
                correctAnswer: 'Process-oriented, open-ended materials that encourage creativity',
                required: true
              },
              {
                id: 'act-default-2',
                text: 'How should outdoor activities be structured in a high-quality early childhood program?',
                domain: 'activities',
                type: 'multiple-choice' as QuestionType,
                difficulty: 'beginner' as DifficultyLevel,
                options: [
                  'As structured games with teacher direction',
                  'As free play time with minimal teacher involvement',
                  'As an extension of the learning environment with natural elements and open-ended materials',
                  'By bringing indoor activities outside on nice days'
                ],
                correctAnswer: 'As an extension of the learning environment with natural elements and open-ended materials',
                required: true
              }
            ];
            
            // Use our default questions by adding them to the assessment questions array
            const existingActivitiesQuestions = assessmentQuestions.filter(q => q.domain === 'activities');
            if (existingActivitiesQuestions.length === 0) {
              // Add our new questions to the assessment questions array
              assessmentQuestions.push(...activityQuestions);
            }
            
            // Set to beginner difficulty for this domain to ensure questions are found
            const newDomainDifficulty = {...domainDifficulty};
            newDomainDifficulty[domainId] = 'beginner';
            setDomainDifficulty(newDomainDifficulty);
            
            // Reset question index
            setCurrentQuestionIndex(0);
            return;
          }
          
          // Handle the other previously problematic domains as well
          if (domainId === 'space-furnishings') {
            console.log(`Handling 'space-furnishings' domain with specific questions`);
            
            const spaceFurnishingsQuestions = [
              {
                id: 'sf-default-1',
                text: 'What is an important consideration when arranging furniture in a preschool classroom?',
                domain: 'space-furnishings',
                type: 'multiple-choice' as QuestionType,
                difficulty: 'beginner' as DifficultyLevel,
                options: [
                  'Placing all furniture against walls to maximize open space', 
                  'Creating defined learning areas while allowing for supervision', 
                  'Using adult-sized furniture to prepare children for elementary school', 
                  'Minimizing furniture to reduce cleaning needs'
                ],
                correctAnswer: 'Creating defined learning areas while allowing for supervision',
                required: true
              },
              {
                id: 'sf-default-2',
                text: 'According to ECERS standards, which of the following is most important for an early childhood classroom?',
                domain: 'space-furnishings',
                type: 'multiple-choice' as QuestionType,
                difficulty: 'beginner' as DifficultyLevel,
                options: [
                  'Having matching decorative themes throughout all areas', 
                  'Displaying only perfect examples of children\'s work', 
                  'Providing child-sized furniture and fixtures', 
                  'Including as many learning materials as possible in each area'
                ],
                correctAnswer: 'Providing child-sized furniture and fixtures',
                required: true
              }
            ];
            
            // Use our default questions by adding them to the assessment questions array
            const existingSpaceFurnishingsQuestions = assessmentQuestions.filter(q => q.domain === 'space-furnishings');
            if (existingSpaceFurnishingsQuestions.length === 0) {
              // Add our new questions to the assessment questions array
              assessmentQuestions.push(...spaceFurnishingsQuestions);
            }
            
            // Set to beginner difficulty for this domain to ensure questions are found
            const newDomainDifficulty = {...domainDifficulty};
            newDomainDifficulty[domainId] = 'beginner';
            setDomainDifficulty(newDomainDifficulty);
            
            // Reset question index
            setCurrentQuestionIndex(0);
            return;
          }
          
          if (domainId === 'personal-care') {
            console.log(`Handling 'personal-care' domain with specific questions`);
            
            const personalCareQuestions = [
              {
                id: 'pcr-default-1',
                text: 'What is the most effective way to prevent the spread of illness in a preschool setting?',
                domain: 'personal-care',
                type: 'multiple-choice' as QuestionType,
                difficulty: 'beginner' as DifficultyLevel,
                options: [
                  'Sending home children at the first sign of a runny nose', 
                  'Regular handwashing by children and staff', 
                  'Using antibacterial soap for all cleaning tasks', 
                  'Keeping windows open regardless of weather'
                ],
                correctAnswer: 'Regular handwashing by children and staff',
                required: true
              },
              {
                id: 'pcr-default-2',
                text: 'How can teachers effectively promote self-care skills in preschoolers?',
                domain: 'personal-care',
                type: 'multiple-choice' as QuestionType,
                difficulty: 'beginner' as DifficultyLevel,
                options: [
                  'Complete care tasks for children to ensure they are done correctly', 
                  'Provide verbal step-by-step instructions without physical assistance', 
                  'Use peer modeling and gentle guidance, allowing adequate time for practice', 
                  'Implement rewards for children who complete self-care tasks quickly'
                ],
                correctAnswer: 'Use peer modeling and gentle guidance, allowing adequate time for practice',
                required: true
              }
            ];
            
            // Use our default questions by adding them to the assessment questions array
            const existingPersonalCareQuestions = assessmentQuestions.filter(q => q.domain === 'personal-care');
            if (existingPersonalCareQuestions.length === 0) {
              // Add our new questions to the assessment questions array
              assessmentQuestions.push(...personalCareQuestions);
            }
            
            // Set to beginner difficulty for this domain to ensure questions are found
            const newDomainDifficulty = {...domainDifficulty};
            newDomainDifficulty[domainId] = 'beginner';
            setDomainDifficulty(newDomainDifficulty);
            
            // Reset question index
            setCurrentQuestionIndex(0);
            return;
          }
          
          if (domainId === 'emotional-support') {
            console.log(`Handling 'emotional-support' domain with specific questions`);
            
            const emotionalSupportQuestions = [
              {
                id: 'es-default-1',
                text: 'Which approach best promotes positive emotional development in preschoolers?',
                domain: 'emotional-support',
                type: 'multiple-choice' as QuestionType,
                difficulty: 'beginner' as DifficultyLevel,
                options: [
                  'Consistently praising only perfect work',
                  'Creating a responsive, warm environment with clear expectations',
                  'Using behavior charts visible to the entire class',
                  'Focusing on academic skills over social-emotional development'
                ],
                correctAnswer: 'Creating a responsive, warm environment with clear expectations',
                required: true
              },
              {
                id: 'es-default-2',
                text: 'According to CLASS standards, which teaching practice best demonstrates high-quality emotional support?',
                domain: 'emotional-support',
                type: 'multiple-choice' as QuestionType,
                difficulty: 'beginner' as DifficultyLevel,
                options: [
                  'Following a rigid schedule to provide structure',
                  'Demonstrating awareness of and responsiveness to children\'s emotional needs',
                  'Maintaining a quiet, controlled classroom atmosphere',
                  'Setting high academic expectations for all students regardless of ability'
                ],
                correctAnswer: 'Demonstrating awareness of and responsiveness to children\'s emotional needs',
                required: true
              }
            ];
            
            // Use our default questions by adding them to the assessment questions array
            const existingEmotionalSupportQuestions = assessmentQuestions.filter(q => q.domain === 'emotional-support');
            if (existingEmotionalSupportQuestions.length === 0) {
              // Add our new questions to the assessment questions array
              assessmentQuestions.push(...emotionalSupportQuestions);
            }
            
            // Set to beginner difficulty for this domain to ensure questions are found
            const newDomainDifficulty = {...domainDifficulty};
            newDomainDifficulty[domainId] = 'beginner';
            setDomainDifficulty(newDomainDifficulty);
            
            // Reset question index
            setCurrentQuestionIndex(0);
            return;
          }
          
          if (domainId === 'classroom-organization') {
            console.log(`Handling 'classroom-organization' domain with specific questions`);
            
            const classroomOrgQuestions = [
              {
                id: 'co-default-1',
                text: 'Which approach is most effective for managing transitions between activities?',
                domain: 'classroom-organization',
                type: 'multiple-choice' as QuestionType,
                difficulty: 'beginner' as DifficultyLevel,
                options: [
                  'Having children wait quietly until everyone is ready',
                  'Using consistent signals and routines with clear expectations',
                  'Extending activities until all children naturally finish',
                  'Allowing each child to move to the next activity when they choose'
                ],
                correctAnswer: 'Using consistent signals and routines with clear expectations',
                required: true
              },
              {
                id: 'co-default-2',
                text: 'Which classroom organization strategy best promotes children\'s engagement?',
                domain: 'classroom-organization',
                type: 'multiple-choice' as QuestionType,
                difficulty: 'beginner' as DifficultyLevel,
                options: [
                  'Teacher-directed activities throughout most of the day',
                  'Well-defined interest areas with engaging, accessible materials',
                  'Having all materials available to children at all times',
                  'Rotating activities every 10-15 minutes to maintain interest'
                ],
                correctAnswer: 'Well-defined interest areas with engaging, accessible materials',
                required: true
              }
            ];
            
            // Use our default questions by adding them to the assessment questions array
            const existingClassroomOrgQuestions = assessmentQuestions.filter(q => q.domain === 'classroom-organization');
            if (existingClassroomOrgQuestions.length === 0) {
              // Add our new questions to the assessment questions array
              assessmentQuestions.push(...classroomOrgQuestions);
            }
            
            // Set to beginner difficulty for this domain to ensure questions are found
            const newDomainDifficulty = {...domainDifficulty};
            newDomainDifficulty[domainId] = 'beginner';
            setDomainDifficulty(newDomainDifficulty);
            
            // Reset question index
            setCurrentQuestionIndex(0);
            return;
          }
          
          if (domainId === 'instructional-support') {
            console.log(`Handling 'instructional-support' domain with specific questions`);
            
            const instructionalSupportQuestions = [
              {
                id: 'is-default-1',
                text: 'Which approach best supports children\'s cognitive development?',
                domain: 'instructional-support',
                type: 'multiple-choice' as QuestionType,
                difficulty: 'beginner' as DifficultyLevel,
                options: [
                  'Providing direct instruction for all academic content',
                  'Using open-ended questions and encouraging problem-solving',
                  'Following a standardized curriculum with minimal deviation',
                  'Having children complete worksheets to document learning'
                ],
                correctAnswer: 'Using open-ended questions and encouraging problem-solving',
                required: true
              },
              {
                id: 'is-default-2',
                text: 'How can teachers best extend children\'s learning during activities?',
                domain: 'instructional-support',
                type: 'multiple-choice' as QuestionType,
                difficulty: 'beginner' as DifficultyLevel,
                options: [
                  'Providing the correct answers when children are confused',
                  'Adding more materials to the activity',
                  'Asking questions that promote reasoning and making connections',
                  'Extending the time allowed for the activity'
                ],
                correctAnswer: 'Asking questions that promote reasoning and making connections',
                required: true
              }
            ];
            
            // Use our default questions by adding them to the assessment questions array
            const existingInstructionalSupportQuestions = assessmentQuestions.filter(q => q.domain === 'instructional-support');
            if (existingInstructionalSupportQuestions.length === 0) {
              // Add our new questions to the assessment questions array
              assessmentQuestions.push(...instructionalSupportQuestions);
            }
            
            // Set to beginner difficulty for this domain to ensure questions are found
            const newDomainDifficulty = {...domainDifficulty};
            newDomainDifficulty[domainId] = 'beginner';
            setDomainDifficulty(newDomainDifficulty);
            
            // Reset question index
            setCurrentQuestionIndex(0);
            return;
          }
          
          if (domainId === 'child-development') {
            console.log(`Handling 'child-development' domain with specific questions`);
            
            const childDevelopmentQuestions = [
              {
                id: 'cd-default-1',
                text: 'Which statement best describes typical cognitive development in 4-year-olds?',
                domain: 'child-development',
                type: 'multiple-choice' as QuestionType,
                difficulty: 'beginner' as DifficultyLevel,
                options: [
                  'They can understand abstract concepts like time and morality',
                  'They engage in symbolic play and are beginning to understand cause and effect',
                  'They have mastered conservation of number and volume',
                  'They can think hypothetically about multiple outcomes'
                ],
                correctAnswer: 'They engage in symbolic play and are beginning to understand cause and effect',
                required: true
              },
              {
                id: 'cd-default-2',
                text: 'Which factor has the most significant impact on early brain development?',
                domain: 'child-development',
                type: 'multiple-choice' as QuestionType,
                difficulty: 'beginner' as DifficultyLevel,
                options: [
                  'Genetics alone',
                  'Enriched physical environments with many toys',
                  'Responsive, nurturing relationships with caregivers',
                  'Early academic instruction'
                ],
                correctAnswer: 'Responsive, nurturing relationships with caregivers',
                required: true
              }
            ];
            
            // Use our default questions by adding them to the assessment questions array
            const existingChildDevelopmentQuestions = assessmentQuestions.filter(q => q.domain === 'child-development');
            if (existingChildDevelopmentQuestions.length === 0) {
              // Add our new questions to the assessment questions array
              assessmentQuestions.push(...childDevelopmentQuestions);
            }
            
            // Set to beginner difficulty for this domain to ensure questions are found
            const newDomainDifficulty = {...domainDifficulty};
            newDomainDifficulty[domainId] = 'beginner';
            setDomainDifficulty(newDomainDifficulty);
            
            // Reset question index
            setCurrentQuestionIndex(0);
            return;
          }
          
          if (domainId === 'language-reasoning') {
            console.log(`Handling 'language-reasoning' domain with specific questions`);
            
            const languageReasoningQuestions = [
              {
                id: 'lr-default-1',
                text: 'Which strategy best supports language development in preschoolers?',
                domain: 'language-reasoning',
                type: 'multiple-choice' as QuestionType,
                difficulty: 'beginner' as DifficultyLevel,
                options: [
                  'Correcting grammatical errors immediately',
                  'Using primarily simple sentences when speaking to children',
                  'Engaging in back-and-forth conversations throughout the day',
                  'Focusing on vocabulary flashcards and word drills'
                ],
                correctAnswer: 'Engaging in back-and-forth conversations throughout the day',
                required: true
              },
              {
                id: 'lr-default-2',
                text: 'How can teachers best support children\'s reasoning skills?',
                domain: 'language-reasoning',
                type: 'multiple-choice' as QuestionType,
                difficulty: 'beginner' as DifficultyLevel,
                options: [
                  'Providing the correct answers to problems',
                  'Asking open-ended questions that encourage prediction and analysis',
                  'Focusing on rote memorization of facts',
                  'Implementing more teacher-directed lessons'
                ],
                correctAnswer: 'Asking open-ended questions that encourage prediction and analysis',
                required: true
              }
            ];
            
            // Use our default questions by adding them to the assessment questions array
            const existingLanguageReasoningQuestions = assessmentQuestions.filter(q => q.domain === 'language-reasoning');
            if (existingLanguageReasoningQuestions.length === 0) {
              // Add our new questions to the assessment questions array
              assessmentQuestions.push(...languageReasoningQuestions);
            }
            
            // Set to beginner difficulty for this domain to ensure questions are found
            const newDomainDifficulty = {...domainDifficulty};
            newDomainDifficulty[domainId] = 'beginner';
            setDomainDifficulty(newDomainDifficulty);
            
            // Reset question index
            setCurrentQuestionIndex(0);
            return;
          }
          
          // This is a critical error - no beginner questions available and not a known problematic domain
          toast({
            title: "Error Loading Questions",
            description: "Could not find any questions for this topic. Please try another area.",
            variant: "destructive",
            duration: 5000,
          });
          return;
        }
      }
      
      // Check if we have enough questions for this difficulty level
      if (filteredQuestions.length < 3 && difficulty !== 'expert') {
        console.log(`Warning: Only ${filteredQuestions.length} ${difficulty} questions available for ${domainId}. Adding more questions would improve the experience.`);
      }
      
      // Log for debugging
      console.log(`Successfully loaded ${filteredQuestions.length} ${difficulty} questions for ${domainId}`);

      // Show a toast notification about advancing to a new difficulty level with appropriate messaging
      let message = '';
      switch(difficulty) {
        case 'beginner':
          message = 'Starting with basic foundational questions in this topic.';
          break;
        case 'intermediate':
          message = 'Great job! You\'ve unlocked more challenging questions in this topic.';
          break;
        case 'advanced':
          message = 'Impressive! You\'re now seeing advanced questions that require deeper knowledge.';
          break;
        case 'expert':
          message = 'Master level! These questions represent the highest level of expertise.';
          break;
      }
      
      // Ensure difficulty is a valid string before using charAt
      if (difficulty && typeof difficulty === 'string') {
        toast({
          title: `${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)} Level ${
            difficulty === 'beginner' ? '1' :
            difficulty === 'intermediate' ? '2' :
            difficulty === 'advanced' ? '3' : '4'
          }`,
          description: message,
          variant: "default",
          duration: 3000,
        });
      } else {
        // Fallback toast if difficulty is undefined or not a string
        toast({
          title: "Assessment Questions",
          description: message || "Loading assessment questions",
          variant: "default",
          duration: 3000,
        });
      }
      
      // Only update current question index if we're viewing this domain
      if (currentDomain === domainId) {
        // Reset to the first question of the new difficulty level
        setCurrentQuestionIndex(0);
      }
    } catch (error) {
      console.error(`Error updating domain questions for ${domainId} to ${difficulty}:`, error);
      
      // Fallback to beginner questions if there's an error with higher difficulty
      if (difficulty !== 'beginner') {
        toast({
          title: "Returning to simpler questions",
          description: "We encountered an issue with higher difficulty questions. Let's continue with more accessible content.",
          variant: "destructive",
          duration: 3000,
        });
        
        // If an error occurs with higher difficulties, go back to beginner
        setDomainDifficulty(prev => ({
          ...prev,
          [domainId]: 'beginner'
        }));
        
        // Try to load beginner questions
        setTimeout(() => {
          updateDomainQuestions(domainId, 'beginner');
        }, 300);
      } else {
        // Critical error that couldn't be recovered from
        toast({
          title: "Assessment Error",
          description: "Something went wrong with the assessment. Please refresh the page or try again later.",
          variant: "destructive",
          duration: 5000,
        });
      }
    }
  };
  
  // Get domain questions filtered by current difficulty
  const domainQuestions = assessmentQuestions.filter(
    q => q.domain === currentDomain && q.difficulty === domainDifficulty[currentDomain]
  );
  
  // Calculate overall progress (2 questions per domain)
  const totalQuestions = domains.length * 2;
  const overallProgress = Math.round((completedQuestions.length / totalQuestions) * 100);
  
  // Handle answer changes
  const handleAnswerChange = (questionId: string, value: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
  };
  
  // Function to adjust difficulty based on performance - Video game style
  const adjustDifficulty = (domain: string) => {
    const correct = correctByDomain[domain] || 0;
    const incorrect = incorrectByDomain[domain] || 0;
    const currentDifficulty = domainDifficulty[domain];
    const totalAttempts = correct + incorrect;
    
    // More gradual progression with additional requirements
    
    // Level 1 to Level 2 (beginner to intermediate)
    // Require at least 2 correct answers and a minimum of 3 total attempts
    if (currentDifficulty === 'beginner' && correct >= 2 && totalAttempts >= 3) {
      console.log(`LEVEL UP! ${domain} advanced to intermediate level (correct: ${correct}, attempts: ${totalAttempts})`);
      
      // Track beginner level performance for debugging
      console.log(`Tracking beginner performance in ${domain}: ${correct} correct, ${incorrect} incorrect`);
      
      toast({
        title: "LEVEL UP! 🎮",
        description: "You've unlocked Level 2 intermediate questions in this category!",
        variant: "default",
        duration: 3000,
      });
      
      setDomainDifficulty(prev => ({
        ...prev,
        [domain]: 'intermediate'
      }));
      setCorrectByDomain(prev => ({
        ...prev,
        [domain]: 0
      }));
      setIncorrectByDomain(prev => ({
        ...prev,
        [domain]: 0 
      }));
      
      try {
        // Load questions for the new difficulty level
        updateDomainQuestions(domain, 'intermediate');
      } catch (error) {
        console.error("Error loading intermediate questions:", error);
        toast({
          title: "Something went wrong",
          description: "We encountered an error loading the next level questions. Staying at current level.",
          variant: "destructive",
          duration: 3000,
        });
      }
      return;
    }
    
    // Level 2 to Level 3 (intermediate to advanced)
    // Require at least 2 correct answers and a minimum of 3 total attempts
    if (currentDifficulty === 'intermediate' && correct >= 2 && totalAttempts >= 3) {
      console.log(`LEVEL UP! ${domain} advanced to advanced level (correct: ${correct}, attempts: ${totalAttempts})`);
      
      // Track intermediate level performance for debugging
      console.log(`Tracking intermediate performance in ${domain}: ${correct} correct, ${incorrect} incorrect`);
      
      toast({
        title: "LEVEL UP! 🎮",
        description: "You've unlocked Level 3 advanced questions in this category!",
        variant: "default",
        duration: 3000,
      });
      
      setDomainDifficulty(prev => ({
        ...prev,
        [domain]: 'advanced'
      }));
      setCorrectByDomain(prev => ({
        ...prev,
        [domain]: 0
      }));
      setIncorrectByDomain(prev => ({
        ...prev,
        [domain]: 0 
      }));
      
      try {
        // Load questions for the new difficulty level
        updateDomainQuestions(domain, 'advanced');
      } catch (error) {
        console.error("Error loading advanced questions:", error);
        toast({
          title: "Something went wrong",
          description: "We encountered an error loading the next level questions. Staying at current level.",
          variant: "destructive",
          duration: 3000,
        });
      }
      return;
    }
    
    // Level 3 to Level 4 - Master Level (advanced to expert)
    // Require at least 3 correct answers and a minimum of 4 total attempts
    if (currentDifficulty === 'advanced' && correct >= 3 && totalAttempts >= 4) {
      console.log(`LEVEL UP TO MASTER! ${domain} advanced to expert/mastery level (correct: ${correct}, attempts: ${totalAttempts})`);
      
      // Track advanced level performance for debugging
      console.log(`Tracking advanced performance in ${domain}: ${correct} correct, ${incorrect} incorrect`);
      
      toast({
        title: "MASTER LEVEL UNLOCKED! 🏆",
        description: "You've reached the highest level! Expert mastery questions are now available.",
        variant: "default",
        duration: 3000,
      });
      
      setDomainDifficulty(prev => ({
        ...prev,
        [domain]: 'expert'
      }));
      setCorrectByDomain(prev => ({
        ...prev,
        [domain]: 0
      }));
      setIncorrectByDomain(prev => ({
        ...prev,
        [domain]: 0 
      }));
      
      try {
        // Load questions for the new difficulty level
        updateDomainQuestions(domain, 'expert');

        // Store max difficulty achieved for this domain
        // Using domain difficulty as the tracker for max difficulty achieved
        setDomainDifficulty(prev => ({
          ...prev,
          [domain]: 'expert'
        }));
      } catch (error) {
        console.error("Error loading expert questions:", error);
        toast({
          title: "Something went wrong",
          description: "We encountered an error loading the next level questions. Staying at current level.",
          variant: "destructive",
          duration: 3000,
        });
      }
      return;
    }
    
    // Domain completion check - expert level successfully completed with correct answers
    if (currentDifficulty === 'expert' && correct >= 2 && totalAttempts >= 3) {
      console.log(`Domain ${domain} COMPLETED at expert level! Moving to next domain.`);
      
      // Track expert level performance for debugging
      console.log(`Tracking expert performance in ${domain}: ${correct} correct, ${incorrect} incorrect`);
      
      // Mark current domain as mastered
      setDomainDifficulty(prev => ({
        ...prev,
        [domain]: 'expert'
      }));
      
      // Auto advance to next domain with user notification
      toast({
        title: "Domain Mastered! 🏆✨",
        description: `You've mastered ${domains.find(d => d.id === domain)?.name || domain}! Moving to the next category.`,
        variant: "default",
        duration: 3000,
      });
      
      // Move to next domain
      const nextDomainIndex = (currentDomainIndex + 1) % domains.length;
      setCurrentDomainIndex(nextDomainIndex);
      
      // Give the user a moment to see their achievement before moving on
      setTimeout(() => {
        // Reset counters for next domain
        const nextDomain = domains[nextDomainIndex].id;
        console.log(`Auto-advancing to domain: ${nextDomain} (index: ${nextDomainIndex})`);
        updateDomainQuestions(nextDomain, domainDifficulty[nextDomain] || 'beginner');
      }, 1500);
      
      return;
    }
    
    // Adjustment logic for handling incorrect answers - more forgiving in video game style
    
    // Only move back a level if user gets 2 incorrect answers in a row
    
    // Level 4 to Level 3 (expert to advanced)
    if (currentDifficulty === 'expert' && incorrect >= 2) {
      console.log(`Moving ${domain} back to Level 3 (advanced) due to incorrect answers`);
      
      toast({
        title: "Try Again! ⏪",
        description: "Let's review some Level 3 advanced questions first.",
        variant: "default",
        duration: 3000,
      });
      
      setDomainDifficulty(prev => ({
        ...prev,
        [domain]: 'advanced'
      }));
      setIncorrectByDomain(prev => ({
        ...prev,
        [domain]: 0
      }));
      // Load questions for the adjusted difficulty level
      updateDomainQuestions(domain, 'advanced');
      return;
    }
    
    // Level 3 to Level 2 (advanced to intermediate)
    if (currentDifficulty === 'advanced' && incorrect >= 2) {
      console.log(`Moving ${domain} back to Level 2 (intermediate) due to incorrect answers`);
      
      toast({
        title: "Let's Review! ⏪",
        description: "Let's practice with some Level 2 intermediate questions.",
        variant: "default",
        duration: 3000,
      });
      
      setDomainDifficulty(prev => ({
        ...prev,
        [domain]: 'intermediate'
      }));
      setIncorrectByDomain(prev => ({
        ...prev,
        [domain]: 0
      }));
      // Load questions for the adjusted difficulty level
      updateDomainQuestions(domain, 'intermediate');
      return;
    }
    
    // Level 2 to Level 1 (intermediate to beginner)
    if (currentDifficulty === 'intermediate' && incorrect >= 2) {
      console.log(`Moving ${domain} back to Level 1 (beginner) due to incorrect answers`);
      
      toast({
        title: "Back to Basics! ⏪",
        description: "Let's review the fundamentals with Level 1 questions.",
        variant: "default",
        duration: 3000,
      });
      
      setDomainDifficulty(prev => ({
        ...prev,
        [domain]: 'beginner'
      }));
      setIncorrectByDomain(prev => ({
        ...prev,
        [domain]: 0
      }));
      // Load questions for the adjusted difficulty level
      updateDomainQuestions(domain, 'beginner');
      return;
    }
    
    // Track performance for analytics
    console.log(`Tracking ${currentDifficulty} performance in ${domain}: ${correct} correct, ${incorrect} incorrect`);
  };
  
  // Handle domain navigation - enhanced with better error handling and question loading
  const handleDomainChange = (domainId: string) => {
    try {
      // Find the index of the domain in our domains array
      const newDomainIndex = domains.findIndex(d => d.id === domainId);
      
      // Validate that the domain exists
      if (newDomainIndex === -1) {
        console.error(`Domain with ID ${domainId} not found in domains list.`);
        toast({
          title: "Navigation Error",
          description: "Could not find the selected domain. Please try again.",
          variant: "destructive",
          duration: 3000
        });
        return;
      }
      
      console.log(`Navigating to domain: ${domainId} (index: ${newDomainIndex})`);
      
      // Clear any current feedback that might be showing
      setAnswerFeedback({
        shown: false,
        correct: false,
        explanation: ''
      });
      
      // Reset selected option
      setSelectedOption(null);
      
      // Update the current domain index
      setCurrentDomainIndex(newDomainIndex);
      
      // Reset to the first question in the new domain
      setCurrentQuestionIndex(0);
      
      // Load questions for the selected domain at their current difficulty level
      try {
        // Use a small timeout to ensure state updates have applied
        setTimeout(() => {
          const difficulty = domainDifficulty[domainId] || 'beginner';
          console.log(`Loading questions for ${domainId} at ${difficulty} difficulty`);
          updateDomainQuestions(domainId, difficulty);
        }, 100);
      } catch (error) {
        console.error(`Error loading questions for domain ${domainId}:`, error);
        toast({
          title: "Error Loading Questions",
          description: "There was a problem loading questions for this topic. Trying simpler questions instead.",
          variant: "destructive",
          duration: 3000
        });
        
        // Fall back to beginner questions
        setTimeout(() => {
          updateDomainQuestions(domainId, 'beginner');
        }, 300);
      }
    } catch (error) {
      console.error("Error navigating to domain:", error);
      toast({
        title: "Navigation Error",
        description: "Something went wrong when changing topics. Please try again.",
        variant: "destructive",
        duration: 3000
      });
    }
  };
  
  // Calculate domain progress
  const calculateDomainProgress = (domainId: string) => {
    // We want to show 2 questions per domain completed
    const domainCompleted = completedQuestions.filter(qId => {
      const q = assessmentQuestions.find(aq => aq.id === qId);
      return q && q.domain === domainId;
    }).length;
    return Math.min(100, Math.round((domainCompleted / 2) * 100));
  };
  
  // Check if the current question has been answered
  const isCurrentQuestionAnswered = () => {
    // Add more robust validation
    if (!domainQuestions || domainQuestions.length === 0) return false;
    if (currentQuestionIndex < 0 || currentQuestionIndex >= domainQuestions.length) return false;
    if (!domainQuestions[currentQuestionIndex]) return false;
    if (!domainQuestions[currentQuestionIndex].id) return false;
    
    return answers[domainQuestions[currentQuestionIndex].id] !== undefined;
  };
  
  // Check if we're on the last question of the last domain
  const isLastDomainLastQuestion = () => {
    // Add validation to prevent errors when checking for last domain/question
    if (!domains || domains.length === 0) return false;
    if (!domainQuestions || domainQuestions.length === 0) return false;
    
    const currentDomainIndex = domains.findIndex(d => d.id === currentDomain);
    if (currentDomainIndex === -1) return false; // Domain not found
    
    const isLastDomain = currentDomainIndex === domains.length - 1;
    const isLastQuestion = currentQuestionIndex === domainQuestions.length - 1;
    
    return isLastDomain && isLastQuestion;
  };
  
  // Submit assessment mutation
  const submitAssessmentMutation = useMutation({
    mutationFn: async (assessmentData: any) => {
      console.log("Submitting assessment data:", assessmentData);
      const response = await apiRequest("/api/assessments", {
        method: "POST",
        data: assessmentData
      });
      return response;
    },
    onSuccess: () => {
      // Calculate total correct answers
      const totalAnswers = Object.keys(answers).length;
      const correctAnswers = Object.keys(answers).filter(qId => {
        const question = assessmentQuestions.find(q => q.id === qId);
        return question && answers[qId] === question.correctAnswer;
      }).length;
      
      // Generate an encouraging, personalized message based on performance
      const generateEncouragingMessage = () => {
        // Calculate percentage correct
        const percentCorrect = Math.round((correctAnswers / totalAnswers) * 100);
        
        let message = '';
        
        // First part - always positive regardless of score
        const positiveReinforcement = [
          "Your dedication to children's growth is truly inspiring!",
          "The knowledge you've built so far shows your commitment to excellence.",
          "Your understanding of early childhood education principles is impressive.",
          "You're bringing valuable insights and skills to your teaching practice.",
          "Your passion for Building Chapter One into each child really shines through."
        ];
        
        // Random encouraging introduction
        message += positiveReinforcement[Math.floor(Math.random() * positiveReinforcement.length)] + " ";
        
        // Second part - specific to performance but still encouraging
        if (percentCorrect >= 80) {
          message += "Your exceptional grasp of the concepts will help you make a tremendous impact on your students. ";
        } else if (percentCorrect >= 60) {
          message += "You have a solid foundation that will serve your students well as you continue to grow. ";
        } else {
          message += "You're starting an exciting journey of growth that will transform your teaching practice. ";
        }
        
        // Third part - growth mindset message for everyone
        message += "Your personalized learning path builds on your unique strengths and helps you focus on areas for continued professional development. Ready to take your teaching to the next level?";
        
        return message;
      };
      
      // Show feedback with correct answer count and personalized message
      toast({
        title: "Assessment Completed",
        description: `Great job! You answered ${correctAnswers} out of ${totalAnswers} questions correctly. Your personalized learning path is now available.`,
        duration: 6000,
      });
      
      // Create a more detailed success dialog with encouragement
      toast({
        title: "Your Raising Arizona Teacher Journey",
        description: generateEncouragingMessage(),
        duration: 10000,
      });
      
      setLocation("/dashboard");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to submit assessment: ${error.message}`,
        variant: "destructive",
      });
    }
  });
  
  // Submit assessment
  const handleSubmitAssessment = () => {
    if (!user) return;
    
    // Prevent multiple submissions
    if (submitAssessmentMutation.isPending) return;
    
    // Confirm assessment is ready to be submitted
    if (!isLastDomainLastQuestion()) {
      toast({
        title: "Assessment In Progress",
        description: "Please complete all domains before submitting.",
        variant: "default",
      });
      return;
    }
    
    // Calculate scores by domain and max difficulty reached
    const domainScores: Record<string, {
      score: number,
      maxDifficulty: DifficultyLevel
    }> = {};
    
    // Calculate scores for each domain
    domains.forEach(domain => {
      const domainId = domain.id;
      const domainAnswers = Object.entries(answers).filter(([qId]) => {
        const question = assessmentQuestions.find(q => q.id === qId);
        return question && question.domain === domainId;
      });
      
      // Calculate correct answers rate
      const correctCount = domainAnswers.filter(([qId, answer]) => {
        const question = assessmentQuestions.find(q => q.id === qId);
        return question && answer === question.correctAnswer;
      }).length;
      
      const totalAnswers = domainAnswers.length;
      const score = totalAnswers > 0 ? Math.round((correctCount / totalAnswers) * 100) : 0;
      
      // Determine max difficulty reached
      const advancedAnswers = domainAnswers.filter(([qId]) => {
        const question = assessmentQuestions.find(q => q.id === qId);
        return question && question.difficulty === 'advanced';
      });
      
      const intermediateAnswers = domainAnswers.filter(([qId]) => {
        const question = assessmentQuestions.find(q => q.id === qId);
        return question && question.difficulty === 'intermediate';
      });
      
      // Check for expert-level questions first
      const expertAnswers = domainAnswers.filter(([qId]) => {
        const question = assessmentQuestions.find(q => q.id === qId);
        return question && question.difficulty === 'expert';
      });
      
      let maxDifficulty: DifficultyLevel = 'beginner';
      if (expertAnswers.length > 0) {
        maxDifficulty = 'expert';
      } else if (advancedAnswers.length > 0) {
        maxDifficulty = 'advanced';
      } else if (intermediateAnswers.length > 0) {
        maxDifficulty = 'intermediate';
      }
      
      domainScores[domainId] = {
        score,
        maxDifficulty
      };
    });
    
    // Determine strengths and growth areas
    const strengthThreshold = 70;
    const strengthAreas = Object.keys(domainScores).filter(
      domain => domainScores[domain].score >= strengthThreshold
    );
    
    const growthAreas = Object.keys(domainScores).filter(
      domain => domainScores[domain].score < strengthThreshold
    );
    
    // Calculate overall score
    const overallScore = Math.round(
      Object.values(domainScores).reduce((sum, domain) => sum + domain.score, 0) / 
      Object.values(domainScores).length
    );
    
    // Identify incorrect answers for each domain to help with recommendations
    const incorrectAnswers: Record<string, string[]> = {};
    Object.entries(answers).forEach(([questionId, answer]) => {
      const question = assessmentQuestions.find(q => q.id === questionId);
      if (question && answer !== question.correctAnswer) {
        const domain = question.domain;
        if (!incorrectAnswers[domain]) {
          incorrectAnswers[domain] = [];
        }
        incorrectAnswers[domain].push(questionId);
      }
    });
    
    // Define learning path item type to match the interface in PersonalizedLearningPath.tsx
    interface LearningPathItem {
      domainId: string;
      domainName: string;
      priority: 'high' | 'medium' | 'low' | 'suggested';
      recommendation: string;
      score?: number;
      level?: string;
      reason: string;
    }
    
    // Generate personalized learning path recommendations based on assessment results
    const generateLearningPath = () => {
      const learningPath: LearningPathItem[] = [];
      
      // First, focus on growth areas (domains with scores below threshold)
      growthAreas.forEach(domain => {
        const domainInfo = domains.find(d => d.id === domain);
        if (!domainInfo) return;
        
        // Get the domain difficulty level that was reached
        const difficulty = domainScores[domain].maxDifficulty;
        
        // Add appropriate learning modules based on performance
        if (difficulty === 'beginner') {
          // Add foundational modules for this domain
          learningPath.push({
            domainId: domain,
            domainName: domainInfo.name,
            priority: 'high',
            recommendation: `Start with foundational content in ${domainInfo.name}`,
            reason: 'Assessment shows this is an opportunity area that needs fundamental work'
          });
        } else if (difficulty === 'intermediate') {
          // Add intermediate modules for this domain
          learningPath.push({
            domainId: domain,
            domainName: domainInfo.name,
            priority: 'medium',
            recommendation: `Continue building skills in ${domainInfo.name} with intermediate content`,
            reason: 'You have basic understanding but need more practice with complex concepts'
          });
        } else if (difficulty === 'advanced') {
          // Advanced modules for fine-tuning knowledge
          learningPath.push({
            domainId: domain,
            domainName: domainInfo.name,
            priority: 'low',
            recommendation: `Refine your knowledge of ${domainInfo.name} with advanced content`,
            reason: 'You have strong knowledge but missed a few advanced concepts'
          });
        } else if (difficulty === 'expert') {
          // Expert/mastery modules for deepening specialized knowledge
          learningPath.push({
            domainId: domain,
            domainName: domainInfo.name,
            priority: 'low',
            recommendation: `Explore mastery-level content in ${domainInfo.name}, particularly attachment theory and trauma-informed practices`,
            reason: 'You demonstrate advanced knowledge but could benefit from deeper exploration of specialized concepts in this area'
          });
        }
      });
      
      // Then add recommendations for strength areas for continued growth
      strengthAreas.forEach(domain => {
        const domainInfo = domains.find(d => d.id === domain);
        if (!domainInfo) return;
        
        // Get the domain difficulty level that was reached
        const difficulty = domainScores[domain].maxDifficulty;
        
        if (difficulty === 'expert') {
          // For expert-level achievers, suggest mentorship and leadership
          learningPath.push({
            domainId: domain,
            domainName: domainInfo.name,
            priority: 'suggested',
            recommendation: `Consider becoming a mentor or lead trainer in ${domainInfo.name}`,
            reason: 'You demonstrated mastery-level understanding in this area, including advanced concepts in attachment theory and trauma-informed practices'
          });
        } else {
          // Add mastery modules for non-expert achievers
          learningPath.push({
            domainId: domain,
            domainName: domainInfo.name,
            priority: 'suggested',
            recommendation: `Consider mentor opportunities in ${domainInfo.name}`,
            reason: 'You demonstrated strong understanding in this area'
          });
        }
      });
      
      return learningPath;
    };
    
    // Generate the personalized learning path
    const personalizedLearningPath = generateLearningPath();
    
    // Submit assessment with personalized learning path
    submitAssessmentMutation.mutate({
      userId: user.id,
      overallScore,
      completed: true,
      results: answers,
      domainScores,
      strengthAreas,
      growthAreas,
      incorrectAnswers,
      assessmentType: "ITERS_ECERS_CLASS",
      personalizedLearningPath // Add the personalized learning path
    });
  };
  
  // Check if assessment can be submitted - at least 2 questions per domain
  const canSubmitAssessment = domains.every(domain => {
    const domainCompleted = completedQuestions.filter(qId => {
      const q = assessmentQuestions.find(aq => aq.id === qId);
      return q && q.domain === domain.id;
    }).length;
    return domainCompleted >= 2;
  });
  
  // Handle proceeding to next question
  const handleNextQuestion = () => {
    try {
      // Enhanced error checking - make sure we have a valid question
      if (!domainQuestions || domainQuestions.length === 0) {
        console.error("No questions available for the current domain/difficulty");
        toast({
          title: "No Questions Available",
          description: "There are no questions for this topic at the current difficulty level. Please try another topic.",
          variant: "destructive",
          duration: 3000
        });
        return;
      }
      
      if (currentQuestionIndex >= domainQuestions.length) {
        console.error(`Question index (${currentQuestionIndex}) is out of bounds for available questions (${domainQuestions.length})`);
        setCurrentQuestionIndex(0);
        toast({
          title: "Navigation Issue",
          description: "We had an issue finding your question. Starting from the beginning of this topic.",
          variant: "destructive",
          duration: 3000
        });
        return;
      }
      
      const currentQuestion = domainQuestions[currentQuestionIndex];
      
      // Additional validation that the question is properly formed
      if (!currentQuestion || !currentQuestion.text || !currentQuestion.id) {
        console.error("Invalid question object:", currentQuestion);
        toast({
          title: "Question Error",
          description: "There was an error with this question. Please try another topic.",
          variant: "destructive",
          duration: 3000
        });
        return;
      }
      
      // Check if question is required and not answered
      if (currentQuestion.required && !answers[currentQuestion.id]) {
        toast({
          title: "Required Question",
          description: "Please answer this question before continuing.",
          variant: "destructive"
        });
        return;
      }
      
      // Check if the answer is correct and provide feedback
      const isCorrect = answers[currentQuestion.id] === currentQuestion.correctAnswer;
      const currentDifficulty = domainDifficulty[currentDomain];
      
      // Update answer feedback to show to user - more engaging and practical
      setAnswerFeedback({
        shown: true,
        correct: isCorrect,
        explanation: currentQuestion.explanation || (isCorrect 
          ? "Great job! That's the right approach for our Raising Arizona kids." 
          : "Let's consider a different approach. In practice with our children: " + currentQuestion.correctAnswer)
      });
      
      // Add immediate toast feedback that's more engaging
      if (isCorrect) {
        toast({
          title: "⭐ That's perfect! ⭐",
          description: "You're using the right practical approach!",
          variant: "default",
          duration: 1500,
        });
      } else {
        toast({
          title: "Try a different approach",
          description: "Think about the hands-on technique that works best with children.",
          variant: "default",
          duration: 1500,
        });
      }
      
      // Update correct/incorrect counts
      if (isCorrect) {
        setCorrectByDomain(prev => ({
          ...prev,
          [currentDomain]: (prev[currentDomain] || 0) + 1
        }));
        
        // Check if we should offer to advance difficulty immediately
        // Fast-track users who are getting correct answers
        const correct = correctByDomain[currentDomain] || 0;
        const incorrect = incorrectByDomain[currentDomain] || 0;
        
        // Auto level-up like a video game - if they answered correctly, level up immediately
        if (currentDifficulty === 'beginner') {
          // Immediately level-up to intermediate - video game style
          toast({
            title: "🎮 LEVEL UP! 🎮",
            description: "You've unlocked Level 2! Moving to intermediate practice-based questions.",
            variant: "default",
            duration: 3000,
            className: "level-up-text"
          });
          
          // Audio feedback for level up (like a game)
          playLevelUpSound();
          
          // Apply the level up changes
          setDomainDifficulty(prev => ({
            ...prev,
            [currentDomain]: 'intermediate'
          }));
          setCorrectByDomain(prev => ({
            ...prev,
            [currentDomain]: 0
          }));
          // Reset current question index to start the new level
          setCurrentQuestionIndex(0);
          // Load intermediate questions
          updateDomainQuestions(currentDomain, 'intermediate');
        }
        // Auto level-up like a video game - intermediate to advanced
        else if (currentDifficulty === 'intermediate') {
          // Immediately level-up to advanced - video game style
          toast({
            title: "🎮 LEVEL UP! 🎮",
            description: "You've unlocked Level 3! Moving to advanced hands-on questions.",
            variant: "default",
            duration: 3000,
            className: "level-up-text"
          });
          
          // Audio feedback for level up (like a game)
          playLevelUpSound();
          
          // Apply the level up changes
          setDomainDifficulty(prev => ({
            ...prev,
            [currentDomain]: 'advanced'
          }));
          setCorrectByDomain(prev => ({
            ...prev,
            [currentDomain]: 0
          }));
          // Reset current question index to start the new level
          setCurrentQuestionIndex(0);
          // Load advanced questions
          updateDomainQuestions(currentDomain, 'advanced');
        }
        // Auto level-up like a video game - advanced to expert/mastery
        else if (currentDifficulty === 'advanced') {
          // Immediately level-up to expert/mastery level - video game style
          toast({
            title: "🏆 MASTER LEVEL UNLOCKED! 🏆",
            description: "You've reached MASTER LEVEL! These questions reflect expert teacher knowledge!",
            variant: "default",
            duration: 4000,
            className: "level-up-text"
          });
          
          // Audio feedback for master level (like achieving a major game milestone)
          playMasterLevelSound();
          
          // Apply the level up changes
          setDomainDifficulty(prev => ({
            ...prev,
            [currentDomain]: 'expert'
          }));
          setCorrectByDomain(prev => ({
            ...prev,
            [currentDomain]: 0
          }));
          // Reset current question index to start the new level
          setCurrentQuestionIndex(0);
          // Load expert questions
          updateDomainQuestions(currentDomain, 'expert');
        }
      } else {
        setIncorrectByDomain(prev => ({
          ...prev,
          [currentDomain]: (prev[currentDomain] || 0) + 1
        }));
      }
      
      // Add to completed questions list
      setCompletedQuestions(prev => [...prev, currentQuestion.id]);
      
      // Store state in variables to avoid async state issues
      const isLastQuestion = currentQuestionIndex >= domainQuestions.length - 1;
      const currentDomainIndex = domains.findIndex(d => d.id === currentDomain);
      const isLastDomain = currentDomainIndex >= domains.length - 1;
      
      // Adjust difficulty based on performance after answering
      // This needs to happen before we change questions/domains
      adjustDifficulty(currentDomain);
      
      // Get current state for difficulty and check if we're entering a new level
      const currentDiff = domainDifficulty[currentDomain];
      const isLevelingUp = 
        (currentDiff === 'beginner' || currentDiff === 'intermediate' || currentDiff === 'advanced') && 
        isCorrect;
      
      // Only auto-progress if we're not in a level-up situation
      if (!isLevelingUp) {
        // Give the user time to see the feedback before moving on
        setTimeout(() => {
          if (!isLastQuestion) {
            // Move to next question in current domain
            setCurrentQuestionIndex(prev => prev + 1);
          } else if (!isLastDomain) {
            // Move to next domain
            setCurrentDomainIndex(currentDomainIndex + 1);
            setCurrentQuestionIndex(0);
          } else {
            // We're at the very end - show a final toast
            toast({
              title: "✅ Assessment Complete! ✅",
              description: "Your results are being calculated. Please click the 'Finish Assessment' button to submit.",
              variant: "default",
              duration: 5000,
              className: "level-up-text"
            });
            
            // Make the submit button pulse to draw attention
            const submitButton = document.querySelector('.bg-green-600');
            if (submitButton) {
              submitButton.classList.add('animate-pulse');
            }
          }
        }, 1500);
      }
    } catch (error) {
      console.error("Error in handleNextQuestion:", error);
      toast({
        title: "Assessment Error",
        description: "Something went wrong when processing your answer. Please try a different topic.",
        variant: "destructive",
        duration: 3000
      });
      
      // Try to recover by moving to a different domain
      try {
        const currentDomainIndex = domains.findIndex(d => d.id === currentDomain);
        const nextDomainIndex = (currentDomainIndex + 1) % domains.length;
        setCurrentDomainIndex(nextDomainIndex);
        setCurrentQuestionIndex(0);
      } catch (recoveryError) {
        console.error("Failed to recover from error:", recoveryError);
      }
    }
  };
  
  // Function to proceed to the next question after viewing feedback
  const handleContinueAfterFeedback = () => {
    try {
      // Hide feedback
      setAnswerFeedback({
        shown: false,
        correct: false,
        explanation: ''
      });
      
      // Make sure we have valid domain questions
      if (!domainQuestions || domainQuestions.length === 0) {
        console.error("No questions available for feedback continuation");
        toast({
          title: "Navigation Error",
          description: "We couldn't find any questions. Please try another topic.",
          variant: "destructive",
          duration: 3000
        });
        return;
      }
      
      // Check if we need to move to next question or domain
      if (currentQuestionIndex < domainQuestions.length - 1) {
        // Move to next question in current domain/difficulty
        setCurrentQuestionIndex(prev => prev + 1);
      } else {
        // Check if we need to move to next domain
        const domainCompleted = completedQuestions.filter(qId => {
          const q = assessmentQuestions.find(aq => aq.id === qId);
          return q && q.domain === currentDomain;
        }).length;
        
        // If we've completed at least 1 question in this domain, move to the next domain
        if (domainCompleted >= 1) {
          if (currentDomainIndex < domains.length - 1) {
            // Move to next domain
            setCurrentDomainIndex(prev => prev + 1);
            setCurrentQuestionIndex(0);
            
            // Notify user they're moving to a new domain
            toast({
              title: "New Topic",
              description: `Moving to ${domains[currentDomainIndex + 1]?.name || 'next topic'}`,
              variant: "default",
              duration: 2000
            });
          } else {
            // We've reached the end of all domains
            toast({
              title: "All Topics Completed",
              description: "You've completed all topics in the assessment. Please submit your results.",
              variant: "default",
              duration: 3000
            });
          }
        }
      }
    } catch (error) {
      console.error("Error in handleContinueAfterFeedback:", error);
      toast({
        title: "Navigation Error",
        description: "Something went wrong when continuing. Trying to recover...",
        variant: "destructive",
        duration: 3000
      });
      
      // Try to recover by going back to the first domain/question
      try {
        setCurrentDomainIndex(0);
        setCurrentQuestionIndex(0);
      } catch (recoveryError) {
        console.error("Failed to recover from feedback error:", recoveryError);
      }
    }
  };
  
  // Render the current question - improved with better error handling
  const renderQuestion = () => {
    try {
      // Additional validation for domainQuestions
      if (!domainQuestions) {
        console.error("domainQuestions is undefined or null");
        return (
          <div className="p-6 border border-dashed rounded-lg bg-muted/50 text-center">
            <div className="mb-4 text-muted-foreground">
              <AlertCircle className="h-10 w-10 mx-auto mb-2 animate-pulse text-red-500" />
              <p className="font-medium">Error loading questions for this topic.</p>
            </div>
            <Button 
              onClick={() => {
                try {
                  // Try initializing the assessment again
                  initializeAssessment();
                  // Try a different domain if possible
                  if (domains && domains.length > 0) {
                    const safeIndex = (currentDomainIndex + 1) % domains.length;
                    setCurrentDomainIndex(safeIndex);
                  }
                } catch (error) {
                  console.error("Error during recovery:", error);
                  toast({
                    title: "Recovery Failed",
                    description: "Please refresh the page to start again.",
                    variant: "destructive"
                  });
                }
              }}
              variant="default"
              className="bg-primary hover:bg-primary/90"
            >
              Reset Assessment
            </Button>
          </div>
        );
      }
      
      // Handle case where no questions are loaded
      if (domainQuestions.length === 0) {
        return (
          <div className="p-6 border border-dashed rounded-lg bg-muted/50 text-center">
            <div className="mb-4 text-muted-foreground">
              <AlertCircle className="h-10 w-10 mx-auto mb-2 animate-pulse" />
              <p className="font-medium">No questions available for this topic at the current difficulty level.</p>
            </div>
            <Button 
              onClick={() => {
                try {
                  // Try switching back to beginner difficulty
                  setDomainDifficulty(prev => ({
                    ...prev,
                    [currentDomain]: 'beginner'
                  }));
                  
                  // Refresh questions
                  setTimeout(() => {
                    updateDomainQuestions(currentDomain, 'beginner');
                  }, 300);
                } catch (error) {
                  console.error("Error switching to beginner:", error);
                  toast({
                    title: "Error",
                    description: "Couldn't switch difficulty. Try a different topic.",
                    variant: "destructive"
                  });
                }
              }}
              variant="outline"
              className="mr-2"
            >
              Try Beginner Level
            </Button>
            <Button 
              onClick={() => {
                try {
                  // Try a different domain by advancing to the next one in the list
                  if (domains && domains.length > 0) {
                    const currentIndex = domains.findIndex(d => d.id === currentDomain);
                    if (currentIndex !== -1) {
                      const nextIndex = (currentIndex + 1) % domains.length;
                      handleDomainChange(domains[nextIndex].id);
                    } else {
                      // Fallback if current domain not found
                      setCurrentDomainIndex(0);
                      handleDomainChange(domains[0].id);
                    }
                  }
                } catch (error) {
                  console.error("Error switching domains:", error);
                  toast({
                    title: "Navigation Error",
                    description: "Please try refreshing the page.",
                    variant: "destructive"
                  });
                }
              }}
            >
              Try Another Topic
            </Button>
          </div>
        );
      }
      
      // Handle potential out of bounds index
      if (currentQuestionIndex < 0 || currentQuestionIndex >= domainQuestions.length) {
        console.error(`Question index ${currentQuestionIndex} out of bounds (only ${domainQuestions.length} questions available)`);
        
        // Auto-correct the index
        setCurrentQuestionIndex(0);
        
        return (
          <div className="p-4 border border-yellow-300 rounded-lg bg-yellow-50 mb-4">
            <p className="text-yellow-800 font-medium">Navigation Issue Detected</p>
            <p className="text-yellow-700 mb-2">Adjusting question selection...</p>
            <div className="w-full bg-yellow-200 h-2 rounded overflow-hidden">
              <div className="bg-yellow-500 h-full animate-pulse-slow w-2/3"></div>
            </div>
          </div>
        );
      }
      
      const question = domainQuestions[currentQuestionIndex];
      
      // Enhanced question validation
      if (!question) {
        console.error('Question is undefined at index', currentQuestionIndex);
        return (
          <div className="p-4 border border-red-300 rounded-lg bg-red-50">
            <p className="text-red-800 font-medium">Error Loading Question</p>
            <p className="text-red-700 mb-3">We couldn't find the question data.</p>
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={() => {
                  try {
                    // Try updating the questions again
                    const currentDiff = domainDifficulty[currentDomain] || 'beginner';
                    updateDomainQuestions(currentDomain, currentDiff);
                  } catch (error) {
                    console.error("Error reloading questions:", error);
                  }
                }}
                variant="outline"
                className="mr-2"
              >
                Retry Loading
              </Button>
              <Button
                onClick={() => {
                  try {
                    // Try a different domain if possible
                    if (domains && domains.length > 0) {
                      const nextDomainIndex = (currentDomainIndex + 1) % domains.length;
                      setCurrentDomainIndex(nextDomainIndex);
                      setCurrentQuestionIndex(0);
                    }
                  } catch (error) {
                    console.error("Error changing domain:", error);
                  }
                }}
                variant="default"
              >
                Try Different Topic
              </Button>
            </div>
          </div>
        );
      }
      
      // Additional validation for question properties
      if (!question.options || !Array.isArray(question.options) || question.options.length === 0) {
        console.error('Question missing options array:', question);
        return (
          <div className="p-4 border border-red-300 rounded-lg bg-red-50">
            <p className="text-red-800 font-medium">Invalid Question Format</p>
            <p className="text-red-700 mb-3">This question doesn't have proper answer options.</p>
            <Button
              onClick={() => {
                try {
                  // Skip to next question if possible
                  if (currentQuestionIndex < domainQuestions.length - 1) {
                    setCurrentQuestionIndex(currentQuestionIndex + 1);
                  } else {
                    // Try next domain
                    const nextDomainIndex = (currentDomainIndex + 1) % domains.length;
                    setCurrentDomainIndex(nextDomainIndex);
                    setCurrentQuestionIndex(0);
                  }
                } catch (error) {
                  console.error("Error skipping question:", error);
                }
              }}
              variant="default"
            >
              Skip This Question
            </Button>
          </div>
        );
      }
      
      // For this version, we only have multiple-choice questions
      return (
        <RadioGroup 
          value={answers[question.id] || ""} 
          onValueChange={(value) => handleAnswerChange(question.id, value)}
        >
          <div className="grid gap-4">
            {question.options.map((option, i) => (
              <div 
                key={i} 
                className={`border rounded-lg p-4 hover:bg-accent/20 transition-all duration-300 cursor-pointer float-in ${
                  answers[question.id] === option ? 'bg-accent/30 answer-selected shadow-sm' : ''
                }`}
                style={{ animationDelay: `${i * 0.15}s` }} /* Staggered animation for each option */
                onClick={() => handleAnswerChange(question.id, option)}
              >
                <div className="flex items-center space-x-3">
                  <RadioGroupItem id={`option-${i}`} value={option} />
                  <Label 
                    htmlFor={`option-${i}`} 
                    className="text-base font-medium leading-relaxed cursor-pointer"
                  >
                    {option}
                  </Label>
                </div>
              </div>
            ))}
          </div>
        </RadioGroup>
      );
    } catch (error) {
      console.error('Error rendering question:', error);
      
      // Comprehensive fallback UI for when rendering fails
      return (
        <div className="p-6 border border-red-300 rounded-lg bg-red-50 text-center">
          <div className="mb-4 text-red-800">
            <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
            <p className="font-medium">Something went wrong while displaying this question.</p>
            <p className="text-sm text-red-700 mt-1">We're trying to recover your assessment...</p>
          </div>
          <div className="flex flex-wrap gap-2 justify-center">
            <Button 
              onClick={() => {
                try {
                  // Reset to beginner difficulty for this domain
                  setDomainDifficulty(prev => ({
                    ...prev,
                    [currentDomain]: 'beginner'
                  }));
                  
                  // Reset to first question
                  setCurrentQuestionIndex(0);
                  
                  // Try to load beginner questions
                  updateDomainQuestions(currentDomain, 'beginner');
                  
                  toast({
                    title: "Resetting Questions",
                    description: "We've reset this topic to beginner level.",
                    variant: "default",
                    duration: 2000
                  });
                } catch (resetError) {
                  console.error("Failed to reset:", resetError);
                  toast({
                    title: "Reset Failed",
                    description: "Please try refreshing the page.",
                    variant: "destructive"
                  });
                }
              }}
              variant="outline"
              className="mr-2"
            >
              Reset Questions
            </Button>
            <Button 
              onClick={() => {
                try {
                  // Full assessment reset as a last resort
                  initializeAssessment();
                  setCurrentDomainIndex(0);
                  setCurrentQuestionIndex(0);
                  
                  toast({
                    title: "Assessment Reset",
                    description: "Starting over with a fresh assessment.",
                    variant: "default"
                  });
                } catch (fullResetError) {
                  console.error("Complete reset failed:", fullResetError);
                  toast({
                    title: "Reset Failed",
                    description: "Please refresh the page to start over.",
                    variant: "destructive"
                  });
                }
              }}
              variant="default"
            >
              Restart Assessment
            </Button>
          </div>
        </div>
      );
    }
  };
  
  return (
    <div className="min-h-screen bg-neutral-100">
      <Header />
      
      {/* Answer Feedback Overlay */}
      {answerFeedback.shown && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className={`bg-white p-6 rounded-lg shadow-lg max-w-md w-full animate-pop ${
            answerFeedback.correct ? 'border-l-8 border-green-500' : 'border-l-8 border-red-500'
          }`}>
            <h3 className={`text-xl font-bold mb-2 ${
              answerFeedback.correct ? 'text-green-600' : 'text-red-600'
            }`}>
              {answerFeedback.correct ? (
                <span className="inline-flex items-center">
                  <span className="animate-bounce-slow mr-2">🎮</span>
                  Correct!
                  <span className="animate-bounce-slow ml-2">⭐</span>
                </span>
              ) : (
                <span className="inline-flex items-center">
                  <span className="animate-shake mr-1">⚠️</span>
                  Incorrect
                </span>
              )}
            </h3>
            <p className="my-4 float-in">{answerFeedback.explanation}</p>
            <Button 
              className={`w-full ${answerFeedback.correct ? "animate-pulse-slow" : ""}`}
              onClick={handleContinueAfterFeedback}
            >
              Continue
            </Button>
          </div>
        </div>
      )}
      
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-center mb-2">Teacher Skills Assessment</h1>
        <p className="text-center text-muted-foreground mb-8">
          Based on ITERS/ECERS and CLASS standards for early childhood educators
        </p>
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Domain Navigation */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Assessment Areas</CardTitle>
                <CardDescription>
                  Overall Progress: {overallProgress}%
                </CardDescription>
                <Progress value={overallProgress} className="h-2" />
                
                {/* Take Assessment Again Button */}
                <div className="mt-4 pt-4 border-t">
                  <p className="text-xs text-muted-foreground mb-2">
                    Want to start a fresh assessment?
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      // Reset assessment state
                      setCurrentDomainIndex(0);
                      setAnswers({});
                      setCompletedQuestions([]);
                      setCurrentQuestionIndex(0);
                      
                      // Reset correct/incorrect counts
                      const resetCounts = {
                        'child-development': 0,
                        'curriculum-planning': 0, 
                        'social-emotional': 0,
                        'health-safety': 0,
                        'chapter-one': 0,
                        'mindful-teaching': 0
                      };
                      
                      setCorrectByDomain(resetCounts);
                      setIncorrectByDomain(resetCounts);
                      
                      // Reset difficulties
                      setDomainDifficulty({
                        'child-development': 'beginner',
                        'curriculum-planning': 'beginner', 
                        'social-emotional': 'beginner',
                        'health-safety': 'beginner',
                        'chapter-one': 'beginner',
                        'mindful-teaching': 'beginner'
                      });
                      
                      // Update questions for the first domain
                      updateDomainQuestions(domains[0].id, 'beginner');
                      
                      toast({
                        title: "Assessment Reset",
                        description: "You can now take the assessment again.",
                      });
                    }}
                  >
                    Take Assessment Again
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  {domains.map((domain, index) => {
                    const DomainIcon = domain.icon;
                    const domainProgress = calculateDomainProgress(domain.id);
                    const isActive = currentDomain === domain.id;
                    const isComplete = domainProgress === 100;
                    const difficulty = domainDifficulty[domain.id];
                    
                    // Get color based on difficulty
                    const difficultyColor = 
                      difficulty === 'beginner' ? 'text-green-500' : 
                      difficulty === 'intermediate' ? 'text-amber-500' : 
                      'text-red-500';
                    
                    return (
                      <button
                        key={index}
                        className={`w-full flex items-center justify-between p-3 rounded-md transition-all duration-300
                          ${isActive 
                            ? 'bg-primary text-primary-foreground shadow-md' 
                            : 'hover:bg-muted hover:scale-[1.02] transform'
                          } ${isComplete ? 'hover:border-green-400 border-2 border-transparent' : ''}
                          float-in`}
                        style={{ animationDelay: `${index * 0.1}s` }}
                        onClick={() => {
                          try {
                            console.log(`Clicked domain: ${domain.id}`);
                            
                            // Special handling for problematic domains
                            if (domain.id === 'emotional-support') {
                              // Extra safety for emotional-support domain since it seems to have issues
                              console.log("Applying special handling for emotional-support domain");
                              
                              // First reset any state that might be causing issues
                              setAnswerFeedback({
                                shown: false,
                                correct: false,
                                explanation: ''
                              });
                              
                              setSelectedOption(null);
                              
                              // Make sure we have questions for this domain
                              const domainHasQuestions = assessmentQuestions.some(q => 
                                q.domain === 'emotional-support' && q.difficulty === 'beginner'
                              );
                              
                              if (!domainHasQuestions) {
                                console.log("No questions found for emotional-support, setting up default questions");
                                
                                // Find the index in our domains array
                                const newDomainIndex = domains.findIndex(d => d.id === domain.id);
                                if (newDomainIndex !== -1) {
                                  setCurrentDomainIndex(newDomainIndex);
                                }
                                
                                // Reset to beginner difficulty
                                setDomainDifficulty(prev => ({
                                  ...prev,
                                  [domain.id]: 'beginner'
                                }));
                                
                                // Reset to first question
                                setCurrentQuestionIndex(0);
                                
                                // Load questions with a small delay to ensure state updates
                                setTimeout(() => {
                                  updateDomainQuestions(domain.id, 'beginner');
                                }, 300);
                              } else {
                                // Normal navigation if questions exist
                                handleDomainChange(domain.id);
                              }
                            } else {
                              // Normal domain navigation
                              handleDomainChange(domain.id);
                            }
                          } catch (err) {
                            console.error("Error in domain button click handler:", err);
                            toast({
                              title: "Navigation Error",
                              description: "Couldn't switch to that topic. Please try another one.",
                              variant: "destructive",
                              duration: 3000
                            });
                            
                            // Safety fallback - go back to first domain if needed
                            if (domains && domains.length > 0) {
                              const safeIndex = 0;
                              setCurrentDomainIndex(safeIndex);
                              setCurrentQuestionIndex(0);
                              
                              // Reset to beginner difficulty for the first domain
                              const safeDomain = domains[0].id;
                              setDomainDifficulty(prev => ({
                                ...prev,
                                [safeDomain]: 'beginner'
                              }));
                              
                              setTimeout(() => {
                                updateDomainQuestions(safeDomain, 'beginner');
                              }, 300);
                            }
                          }
                        }}
                        aria-label={`Select ${domain.name} assessment area`}
                        title={`Difficulty: ${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}`}
                      >
                        <div className="flex items-center">
                          <DomainIcon className={`mr-2 h-4 w-4 ${isActive ? 'animate-pulse text-white' : ''}`} />
                          <span>{domain.name}</span>
                          {isActive && <span className="ml-2 text-xs bg-white text-primary px-1 rounded animate-pulse">Active</span>}
                        </div>
                        <div className="flex items-center">
                          {isComplete && <Check className="h-4 w-4 mr-1" />}
                          <span className="text-xs">{domainProgress}%</span>
                          {/* Enhanced difficulty indicator */}
                          <div className="flex items-center ml-2" title={`Level ${
                            difficulty === 'beginner' ? '1' :
                            difficulty === 'intermediate' ? '2' :
                            difficulty === 'advanced' ? '3' : '4'
                          }`}>
                            <span className={`text-xs font-medium ${difficultyColor}`}>
                              {difficulty === 'beginner' && '●'}
                              {difficulty === 'intermediate' && '●●'}
                              {difficulty === 'advanced' && '●●●'}
                              {difficulty === 'expert' && '●●●●'}
                            </span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
            
            {/* Current Assessment Status */}
            <Card className="mt-4">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Current Assessment Level</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs text-muted-foreground">Domain:</span>
                    <div className="font-medium">{domains.find(d => d.id === currentDomain)?.name}</div>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">Difficulty:</span>
                    <div className={`font-medium ${
                      domainDifficulty[currentDomain] === 'beginner' ? 'text-green-500' : 
                      domainDifficulty[currentDomain] === 'intermediate' ? 'text-amber-500' : 
                      'text-red-500'
                    }`}>
                      {domainDifficulty[currentDomain] ? 
                        domainDifficulty[currentDomain].charAt(0).toUpperCase() + domainDifficulty[currentDomain].slice(1) 
                        : 'Beginner'}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Question Area */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>
                    {domains.find(d => d.id === currentDomain)?.name}
                  </CardTitle>
                  <Badge variant="outline" className={
                    (!domainDifficulty[currentDomain] || domainDifficulty[currentDomain] === 'beginner') ? 'bg-green-100 text-green-800 hover:bg-green-100' : 
                    domainDifficulty[currentDomain] === 'intermediate' ? 'bg-amber-100 text-amber-800 hover:bg-amber-100' : 
                    'bg-red-100 text-red-800 hover:bg-red-100'
                  }>
                    {domainDifficulty[currentDomain] || 'beginner'} level
                  </Badge>
                </div>
                <CardDescription>
                  {/* Add validation to prevent division by zero or NaN issues */}
                  Question {currentQuestionIndex + 1} of {domainQuestions ? domainQuestions.length : 0}
                </CardDescription>
                <Progress 
                  value={domainQuestions && domainQuestions.length > 0 
                    ? ((currentQuestionIndex + 1) / domainQuestions.length) * 100 
                    : 0} 
                  className="h-2" 
                />
              </CardHeader>
              
              <CardContent>
                {domainQuestions && domainQuestions.length > 0 ? (
                  <div className="space-y-6">
                    <div className="text-lg font-medium float-in">
                      {/* Add validation to prevent the "cannot read properties of undefined (reading 'text')" error */}
                      {domainQuestions[currentQuestionIndex] && domainQuestions[currentQuestionIndex].text
                        ? domainQuestions[currentQuestionIndex].text
                        : "Loading question..."}
                      {domainQuestions[currentQuestionIndex] && domainQuestions[currentQuestionIndex].required && (
                        <span className="text-destructive ml-1">*</span>
                      )}
                    </div>
                    
                    {renderQuestion()}
                  </div>
                ) : (
                  <div className="p-8 text-center">
                    <div className="text-4xl mb-4">✨</div>
                    <h3 className="text-lg font-medium mb-2">Great progress!</h3>
                    <p className="text-muted-foreground">
                      You've completed all the questions in this domain at the current difficulty level.
                      Please select another domain to continue your assessment.
                    </p>
                  </div>
                )}
              </CardContent>
              
              <CardFooter className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={() => {
                    if (currentQuestionIndex > 0) {
                      setCurrentQuestionIndex(currentQuestionIndex - 1);
                    } else {
                      toast({
                        title: "Already at first question",
                        description: "This is the first question in this topic.",
                        variant: "default",
                        duration: 1500
                      });
                    }
                  }}
                  disabled={currentQuestionIndex === 0 || !domainQuestions || domainQuestions.length === 0}
                >
                  Previous
                </Button>
                
                <div>
                  {/* Always show the Submit button on the final question of the last domain */}
                  {canSubmitAssessment && isLastDomainLastQuestion() && (
                    <Button
                      variant="default"
                      className="ml-2 bg-green-600 hover:bg-green-700 pulse-finish"
                      onClick={handleSubmitAssessment}
                      disabled={submitAssessmentMutation.isPending || !isCurrentQuestionAnswered()}
                    >
                      {submitAssessmentMutation.isPending ? "Submitting..." : "🏁 Finish Assessment"}
                    </Button>
                  )}
                  
                  {/* Show Next button unless we're on the final question of the last domain */}
                  {(!isLastDomainLastQuestion() || !canSubmitAssessment) && domainQuestions.length > 0 && (
                    <Button
                      variant="default"
                      className={isCurrentQuestionAnswered() ? "animate-pulse-slow" : ""}
                      onClick={handleNextQuestion}
                      disabled={!isCurrentQuestionAnswered() && domainQuestions && domainQuestions[currentQuestionIndex] && domainQuestions[currentQuestionIndex].required}
                    >
                      Next <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardFooter>
            </Card>
            
            {/* Assessment Completion Info */}
            {canSubmitAssessment && (
              <div className="mt-4 bg-accent/20 rounded-lg p-4 flex items-start">
                <div className="mr-2 mt-1 text-2xl">🎉</div>
                <div>
                  <h3 className="font-semibold">Ready to Complete Your Assessment</h3>
                  <p className="text-sm text-muted-foreground">
                    You've answered enough questions to complete your assessment! Click "Submit Assessment" 
                    to receive your personalized learning path based on your knowledge level.
                  </p>
                  <div className="text-xs mt-2 text-muted-foreground italic">
                    Note: Your answers help us determine which training modules will benefit you most. 
                    This assessment adapts to your knowledge level.
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}