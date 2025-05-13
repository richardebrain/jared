import { useState } from "react";
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
import { AlertCircle, Award, Check, ChevronRight, ClipboardList, Star } from "lucide-react";

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

// Early childhood education domains
const domains = [
  { id: 'child-development', name: 'Child Development', icon: ClipboardList },
  { id: 'curriculum-planning', name: 'Curriculum & Planning', icon: Award },
  { id: 'social-emotional', name: 'Social-Emotional Learning', icon: Star },
  { id: 'health-safety', name: 'Health & Safety', icon: AlertCircle },
  { id: 'chapter-one', name: 'Building Chapter One', icon: Star },
  { id: 'mindful-teaching', name: 'Mindful Teaching', icon: ClipboardList },
];

// Define adaptive assessment questions with increasing difficulty
const assessmentQuestions: Question[] = [
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
  const [domainDifficulty, setDomainDifficulty] = useState<Record<string, DifficultyLevel>>({
    'child-development': 'beginner',
    'curriculum-planning': 'beginner', 
    'social-emotional': 'beginner',
    'health-safety': 'beginner',
    'chapter-one': 'beginner',     // Adding new domain for "Building Chapter One" framework
    'mindful-teaching': 'beginner' // Adding new domain for Raising Arizona mindful teaching approach
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
  
  // Function to update domain questions based on difficulty
  const updateDomainQuestions = (domainId: string, difficulty: DifficultyLevel) => {
    // Filter questions for the specified domain and difficulty
    const filteredQuestions = assessmentQuestions.filter(q => 
      q.domain === domainId && q.difficulty === difficulty
    );
    
    console.log(`Loading ${filteredQuestions.length} ${difficulty} questions for ${domainId}`);

    // Show a toast notification about advancing to a new difficulty level
    toast({
      title: `Advancing to ${difficulty} level`,
      description: `Based on your performance, you're now seeing ${difficulty} level questions in this topic.`,
      variant: "default",
      duration: 3000,
    });
    
    // Only update current question index if we're viewing this domain
    if (currentDomain === domainId) {
      // Reset to the first question of the new difficulty level
      setCurrentQuestionIndex(0);
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
  
  // Function to adjust difficulty based on performance
  const adjustDifficulty = (domain: string) => {
    const correct = correctByDomain[domain];
    const incorrect = incorrectByDomain[domain];
    const currentDifficulty = domainDifficulty[domain];
    
    // Calculate a performance ratio to determine if we should increase difficulty
    // Higher weight on correct answers to encourage advancement
    const totalAnswers = correct + incorrect;
    const correctRatio = totalAnswers > 0 ? correct / totalAnswers : 0;
    
    // Faster progression logic - directly skip to intermediate level with fewer questions
    
    // Quickly move to intermediate after just 1-2 correct answers at beginner level
    if (currentDifficulty === 'beginner' && (correct >= 1 && correctRatio >= 0.5)) {
      console.log(`Quickly advancing ${domain} to intermediate level (correct: ${correct}, ratio: ${correctRatio.toFixed(2)})`);
      
      // Open dialog to ask user if they want to try intermediate questions
      toast({
        title: "Moving to Intermediate Questions",
        description: "Based on your answers, we're advancing you to intermediate level questions in this category.",
        variant: "default",
        duration: 5000,
      });
      
      setDomainDifficulty(prev => ({
        ...prev,
        [domain]: 'intermediate'
      }));
      setCorrectByDomain(prev => ({
        ...prev,
        [domain]: 0
      }));
      // Load questions for the new difficulty level
      updateDomainQuestions(domain, 'intermediate');
      return;
    }
    
    // Quickly move to advanced after 2-3 correct answers at intermediate level
    if (currentDifficulty === 'intermediate' && (correct >= 2 && correctRatio >= 0.66)) {
      console.log(`Quickly advancing ${domain} to advanced level (correct: ${correct}, ratio: ${correctRatio.toFixed(2)})`);
      
      toast({
        title: "Moving to Advanced Questions",
        description: "Great job! You're now advancing to advanced level questions in this category.",
        variant: "default",
        duration: 5000,
      });
      
      setDomainDifficulty(prev => ({
        ...prev,
        [domain]: 'advanced'
      }));
      setCorrectByDomain(prev => ({
        ...prev,
        [domain]: 0
      }));
      // Load questions for the new difficulty level
      updateDomainQuestions(domain, 'advanced');
      return;
    }
    
    // Move to expert/mastery level after 2-3 correct answers at advanced level
    if (currentDifficulty === 'advanced' && (correct >= 2 && correctRatio >= 0.66)) {
      console.log(`Advancing ${domain} to mastery/expert level (correct: ${correct}, ratio: ${correctRatio.toFixed(2)})`);
      
      toast({
        title: "Ready for Mastery Level?",
        description: "You've mastered advanced questions. Would you like to try expert-level questions in this category?",
        variant: "default",
        duration: 5000,
      });
      
      setDomainDifficulty(prev => ({
        ...prev,
        [domain]: 'expert'
      }));
      setCorrectByDomain(prev => ({
        ...prev,
        [domain]: 0
      }));
      // Load questions for the new difficulty level
      updateDomainQuestions(domain, 'expert');
      return;
    }
    
    // Adjustment logic for handling incorrect answers
    
    // If struggling with expert level, move back to advanced
    // Moving users back from expert level if they struggle
    if (currentDifficulty === 'expert' && incorrect >= 2) {
      console.log(`Moving ${domain} back from expert/mastery to advanced level due to incorrect answers`);
      
      toast({
        title: "Adjusting Difficulty",
        description: "We're providing some advanced questions to better match your current knowledge level.",
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
    
    // Even track expert level performance for analytics
    if (currentDifficulty === 'expert') {
      console.log(`Tracking expert/mastery performance in ${domain}: ${correct} correct, ${incorrect} incorrect`);
    }
    
    // After just 1 incorrect answer at expert level, consider moving back to advanced
    if (currentDifficulty === 'expert' && incorrect >= 1) {
      console.log(`Moving ${domain} back from expert to advanced due to incorrect answers`);
      
      toast({
        title: "Adjusting Difficulty",
        description: "We're providing some advanced questions to better match your current knowledge level.",
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
    
    // If struggling with advanced, move back to intermediate
    if (currentDifficulty === 'advanced' && incorrect >= 2) {
      console.log(`Moving ${domain} back from advanced to intermediate due to incorrect answers`);
      
      toast({
        title: "Adjusting Difficulty",
        description: "We're providing some intermediate questions to better match your current knowledge level.",
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
    
    // If struggling with intermediate, move back to beginner
    if (currentDifficulty === 'intermediate' && incorrect >= 2) {
      console.log(`Moving ${domain} back from intermediate to beginner due to incorrect answers`);
      
      toast({
        title: "Adjusting Difficulty",
        description: "We're providing some foundational questions to ensure you have the basics covered.",
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
    
    // Track performance at advanced level for final assessment report
    if (currentDifficulty === 'advanced') {
      console.log(`Tracking advanced performance in ${domain}: ${correct} correct, ${incorrect} incorrect`);
    }
    
    // After 2 incorrect answers at advanced level, move to intermediate
    if (currentDifficulty === 'advanced' && incorrect >= 1) {
      setDomainDifficulty(prev => ({
        ...prev,
        [domain]: 'intermediate'
      }));
      setIncorrectByDomain(prev => ({
        ...prev,
        [domain]: 0
      }));
      return;
    }
    
    // After 2 incorrect answers at intermediate level, move to beginner
    if (currentDifficulty === 'intermediate' && incorrect >= 1) {
      setDomainDifficulty(prev => ({
        ...prev,
        [domain]: 'beginner'
      }));
      setIncorrectByDomain(prev => ({
        ...prev,
        [domain]: 0
      }));
      return;
    }
  };
  
  // Handle domain navigation
  const handleDomainChange = (domainId: string) => {
    const newDomainIndex = domains.findIndex(d => d.id === domainId);
    setCurrentDomainIndex(newDomainIndex);
    setCurrentQuestionIndex(0);
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
    if (!domainQuestions[currentQuestionIndex]) return false;
    return answers[domainQuestions[currentQuestionIndex].id] !== undefined;
  };
  
  // Submit assessment mutation
  const submitAssessmentMutation = useMutation({
    mutationFn: async (assessmentData: any) => {
      const response = await apiRequest("POST", "/api/assessments", assessmentData);
      return response.json();
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
      
      let maxDifficulty: DifficultyLevel = 'beginner';
      if (advancedAnswers.length > 0) {
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
    
    // Generate personalized learning path recommendations based on assessment results
    const generateLearningPath = () => {
      const learningPath = [];
      
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
            moduleType: 'foundational',
            reason: 'Assessment shows this is an opportunity area that needs fundamental work'
          });
        } else if (difficulty === 'intermediate') {
          // Add intermediate modules for this domain
          learningPath.push({
            domainId: domain,
            domainName: domainInfo.name,
            priority: 'medium',
            recommendation: `Continue building skills in ${domainInfo.name} with intermediate content`,
            moduleType: 'intermediate',
            reason: 'You have basic understanding but need more practice with complex concepts'
          });
        } else if (difficulty === 'advanced') {
          // Advanced modules for fine-tuning knowledge
          learningPath.push({
            domainId: domain,
            domainName: domainInfo.name,
            priority: 'low',
            recommendation: `Refine your knowledge of ${domainInfo.name} with advanced content`,
            moduleType: 'advanced',
            reason: 'You have strong knowledge but missed a few advanced concepts'
          });
        } else if (difficulty === 'expert') {
          // Expert/mastery modules for deepening specialized knowledge
          learningPath.push({
            domainId: domain,
            domainName: domainInfo.name,
            priority: 'specialized',
            recommendation: `Explore mastery-level content in ${domainInfo.name}, particularly attachment theory and trauma-informed practices`,
            moduleType: 'expert',
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
            moduleType: 'mentorship',
            reason: 'You demonstrated mastery-level understanding in this area, including advanced concepts in attachment theory and trauma-informed practices'
          });
        } else {
          // Add mastery modules for non-expert achievers
          learningPath.push({
            domainId: domain,
            domainName: domainInfo.name,
            priority: 'suggested',
            recommendation: `Consider mentor opportunities in ${domainInfo.name}`,
            moduleType: 'mastery',
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
    if (!domainQuestions[currentQuestionIndex]) return;
    
    const currentQuestion = domainQuestions[currentQuestionIndex];
    
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
    
    // Update answer feedback to show to user
    setAnswerFeedback({
      shown: true,
      correct: isCorrect,
      explanation: currentQuestion.explanation || (isCorrect 
        ? "Great job! That's the correct answer." 
        : "That's not quite right. The correct answer was: " + currentQuestion.correctAnswer)
    });
    
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
      
      // If they just answered the last beginner question correctly
      if (currentDifficulty === 'beginner' && 
          currentQuestionIndex === domainQuestions.length - 1 && 
          domainQuestions.length > 0) {
        // Offer to move to intermediate level directly
        toast({
          title: "Ready for Intermediate Questions?",
          description: "You're doing well! Would you like to try intermediate questions in this topic?",
          variant: "default",
          duration: 6000,
          action: (
            <Button 
              variant="default" 
              size="sm" 
              onClick={() => {
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
              }}
            >
              Yes, continue to intermediate
            </Button>
          ),
        });
      }
      // If they just answered the last intermediate question correctly
      else if (currentDifficulty === 'intermediate' && 
               currentQuestionIndex === domainQuestions.length - 1 && 
               domainQuestions.length > 0) {
        // Offer to move to advanced level directly
        toast({
          title: "Ready for Advanced Questions?",
          description: "You're showing mastery! Would you like to try advanced questions in this topic?",
          variant: "default",
          duration: 6000,
          action: (
            <Button 
              variant="default" 
              size="sm" 
              onClick={() => {
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
              }}
            >
              Yes, try advanced questions
            </Button>
          ),
        });
      }
      // If they just answered the last advanced question correctly
      else if (currentDifficulty === 'advanced' && 
               currentQuestionIndex === domainQuestions.length - 1 && 
               domainQuestions.length > 0) {
        // Offer to move to expert/mastery level
        toast({
          title: "Ready for Mastery Level?",
          description: "Impressive! Would you like to attempt mastery-level questions in this topic?",
          variant: "default",
          duration: 6000,
          action: (
            <Button 
              variant="default" 
              size="sm" 
              onClick={() => {
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
              }}
            >
              Yes, I'm ready for mastery level
            </Button>
          ),
        });
      }
    } else {
      setIncorrectByDomain(prev => ({
        ...prev,
        [currentDomain]: (prev[currentDomain] || 0) + 1
      }));
    }
    
    // Add to completed questions list
    setCompletedQuestions(prev => [...prev, currentQuestion.id]);
    
    // If not advancing to next level, move to next question or domain
    if (currentQuestionIndex < domainQuestions.length - 1) {
      // Move to next question in current domain
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      // Move to next domain or complete assessment
      const currentDomainIndex = domains.findIndex(d => d.id === currentDomain);
      
      if (currentDomainIndex < domains.length - 1) {
        // Move to next domain
        setCurrentDomain(domains[currentDomainIndex + 1].id);
        setCurrentQuestionIndex(0);
      } else {
        // Complete assessment
        handleSubmitAssessment();
      }
    }
    
    // Adjust difficulty based on performance after answering
    adjustDifficulty(currentDomain);
  };
  
  // Function to proceed to the next question after viewing feedback
  const handleContinueAfterFeedback = () => {
    // Hide feedback
    setAnswerFeedback({
      shown: false,
      correct: false,
      explanation: ''
    });
    
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
      
      // If we've completed at least 2 questions in this domain, move to the next domain
      if (domainCompleted >= 1) {
        if (currentDomainIndex < domains.length - 1) {
          // Move to next domain
          setCurrentDomainIndex(prev => prev + 1);
          setCurrentQuestionIndex(0);
        }
      }
    }
  };
  
  // Render the current question
  const renderQuestion = () => {
    if (domainQuestions.length === 0) return null;
    
    const question = domainQuestions[currentQuestionIndex];
    
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
              className="border rounded-lg p-4 hover:bg-accent/20 transition-colors cursor-pointer"
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
  };
  
  return (
    <div className="min-h-screen bg-neutral-100">
      <Header />
      
      {/* Answer Feedback Overlay */}
      {answerFeedback.shown && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className={`bg-white p-6 rounded-lg shadow-lg max-w-md w-full ${
            answerFeedback.correct ? 'border-l-8 border-green-500' : 'border-l-8 border-red-500'
          }`}>
            <h3 className={`text-xl font-bold ${
              answerFeedback.correct ? 'text-green-600' : 'text-red-600'
            }`}>
              {answerFeedback.correct ? 'Correct!' : 'Incorrect'}
            </h3>
            <p className="my-4">{answerFeedback.explanation}</p>
            <Button 
              className="w-full" 
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
                        className={`w-full flex items-center justify-between p-3 rounded-md transition-colors
                          ${isActive 
                            ? 'bg-primary text-primary-foreground' 
                            : 'hover:bg-muted'
                          }`}
                        onClick={() => handleDomainChange(domain.id)}
                      >
                        <div className="flex items-center">
                          <DomainIcon className="mr-2 h-4 w-4" />
                          <span>{domain.name}</span>
                        </div>
                        <div className="flex items-center">
                          {isComplete && <Check className="h-4 w-4 mr-1" />}
                          <span className="text-xs">{domainProgress}%</span>
                          {/* Show difficulty level with color indicator */}
                          {!isActive && <span className={`ml-1 text-xs ${difficultyColor}`}>●</span>}
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
                      {domainDifficulty[currentDomain].charAt(0).toUpperCase() + domainDifficulty[currentDomain].slice(1)}
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
                    domainDifficulty[currentDomain] === 'beginner' ? 'bg-green-100 text-green-800 hover:bg-green-100' : 
                    domainDifficulty[currentDomain] === 'intermediate' ? 'bg-amber-100 text-amber-800 hover:bg-amber-100' : 
                    'bg-red-100 text-red-800 hover:bg-red-100'
                  }>
                    {domainDifficulty[currentDomain]} level
                  </Badge>
                </div>
                <CardDescription>
                  Question {currentQuestionIndex + 1} of {domainQuestions.length}
                </CardDescription>
                <Progress 
                  value={((currentQuestionIndex + 1) / domainQuestions.length) * 100} 
                  className="h-2" 
                />
              </CardHeader>
              
              <CardContent>
                {domainQuestions.length > 0 ? (
                  <div className="space-y-6">
                    <div className="text-lg font-medium">
                      {domainQuestions[currentQuestionIndex].text}
                      {domainQuestions[currentQuestionIndex].required && (
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
                  onClick={() => setCurrentQuestionIndex(i => Math.max(0, i - 1))}
                  disabled={currentQuestionIndex === 0 || domainQuestions.length === 0}
                >
                  Previous
                </Button>
                
                <div>
                  {canSubmitAssessment && (
                    <Button
                      variant="default"
                      className="ml-2"
                      onClick={handleSubmitAssessment}
                      disabled={submitAssessmentMutation.isPending || !isCurrentQuestionAnswered()}
                    >
                      {submitAssessmentMutation.isPending ? "Submitting..." : "Submit Assessment"}
                    </Button>
                  )}
                  
                  {(!canSubmitAssessment || currentQuestionIndex < domainQuestions.length - 1) && domainQuestions.length > 0 && (
                    <Button
                      variant="default"
                      onClick={handleNextQuestion}
                      disabled={!isCurrentQuestionAnswered() && domainQuestions[currentQuestionIndex].required}
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