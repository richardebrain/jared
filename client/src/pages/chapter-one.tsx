import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useSimpleAuth } from '@/lib/simple-auth';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';
import Header from '@/components/Header';
import ChapterOneQuiz from '@/components/ChapterOneQuiz';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card } from '@/components/ui/card';
import { CardContent } from '@/components/ui/card';
import { CardDescription } from '@/components/ui/card';
import { CardFooter } from '@/components/ui/card';
import { CardHeader } from '@/components/ui/card';
import { CardTitle } from '@/components/ui/card';
import { Tabs } from '@/components/ui/tabs';
import { TabsContent } from '@/components/ui/tabs';
import { TabsList } from '@/components/ui/tabs';
import { TabsTrigger } from '@/components/ui/tabs';
import { 
  Book, 
  Brain, 
  Puzzle, 
  Heart, 
  Star, 
  MessageCircle, 
  Home, 
  Eye, 
  CheckCircle, 
  ArrowLeft, 
  ArrowRight 
} from 'lucide-react';

// Chapter One module ID should match the database
const CHAPTER_ONE_MODULE_ID = 34;

export default function ChapterOnePage() {
  const { user } = useSimpleAuth();
  const { toast } = useToast();
  const [_, navigate] = useLocation();
  
  const [currentSection, setCurrentSection] = useState(0);
  const [progress, setProgress] = useState(0);
  const [showQuiz, setShowQuiz] = useState(false);
  const [completed, setCompleted] = useState(false);

  // Fetch progress data if it exists
  const { data: userProgress = [] } = useQuery({
    queryKey: ['/api/progress'],
    enabled: !!user,
  });

  // Update progress mutation
  const updateProgressMutation = useMutation({
    mutationFn: async (data: {
      moduleId: number;
      progress: number;
      completed: boolean;
      pointsEarned?: number;
    }) => {
      return apiRequest('/api/progress', {
        method: 'POST',
        data,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/progress'] });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
    },
  });

  // Define sections of the module
  const sections = [
    {
      id: 'introduction',
      title: 'Introduction: The First Chapter',
      content: (
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-blue-50 to-green-50 p-6 rounded-lg border border-blue-100 mb-4">
            <h2 className="text-2xl font-bold text-blue-800 mb-3">Welcome to Chapter 1: Building a Human</h2>
            <p className="text-lg">
              As preschool teachers, we are writing the first chapter of children's lives. 
              This training will help you understand the science behind early childhood development 
              and your crucial role in shaping healthy brains and futures.
            </p>
          </div>
          
          <h3 className="text-xl font-semibold mt-6">Why This Matters</h3>
          <p>
            The early years of a child's life are a period of incredible brain development and 
            growth. Research in neuroscience, developmental psychology, and education has demonstrated 
            that what happens in these early years has a profound impact on a child's future.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
              <h4 className="font-semibold text-blue-700 flex items-center mb-2">
                <Brain className="mr-2 h-5 w-5 text-blue-500" /> Brain Development
              </h4>
              <p>90% of a child's brain develops by age 5. The quality of interactions, environment,
              and experiences during this time literally shapes the architecture of the developing brain.</p>
            </div>
            
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
              <h4 className="font-semibold text-purple-700 flex items-center mb-2">
                <Heart className="mr-2 h-5 w-5 text-purple-500" /> Attachment & Relationships
              </h4>
              <p>Secure, responsive relationships with adults are the foundation for all aspects
              of a child's healthy development, from emotional regulation to cognitive growth.</p>
            </div>
          </div>
          
          <p>
            In this module, we'll explore the fascinating science of early childhood development,
            trauma, attachment, and the powerful role that you—as a preschool teacher—play
            in shaping children's futures.
          </p>
          
          <div className="bg-amber-50 p-4 rounded-lg border border-amber-100 mt-6">
            <h4 className="font-semibold text-amber-700 mb-2">Learning Objectives:</h4>
            <ul className="list-disc pl-6 space-y-1">
              <li>Understand key concepts in early brain development and how early experiences shape neural pathways</li>
              <li>Recognize the impact of trauma on the developing brain and strategies to support affected children</li>
              <li>Learn the principles of attachment theory and how to foster secure relationships in the classroom</li>
              <li>Develop practical strategies to create brain-building interactions and environments</li>
              <li>Reflect on your unique role in writing the first chapter of children's lives</li>
            </ul>
          </div>
        </div>
      ),
      icon: <Book className="h-5 w-5" />
    },
    {
      id: 'brain-development',
      title: 'The Developing Brain',
      content: (
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-lg border border-green-100 mb-4">
            <h2 className="text-2xl font-bold text-green-800 mb-3">The Architecture of the Developing Brain</h2>
            <p className="text-lg">
              A child's brain undergoes an amazing period of development from birth to five—producing 
              more than a million neural connections each second, a pace never repeated again in life.
            </p>
          </div>
          
          <h3 className="text-xl font-semibold mt-6">Early Brain Development</h3>
          <p>
            The basic architecture of the brain is constructed through a process that begins before birth 
            and continues into adulthood. Like the construction of a home, the brain is built upon a strong 
            foundation, with early experiences literally shaping how the brain gets built.
          </p>
          
          <div className="my-6 bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
            <h4 className="font-semibold text-lg mb-3">Key Concepts in Brain Architecture</h4>
            
            <div className="space-y-4">
              <div className="flex items-start">
                <div className="bg-green-100 p-2 rounded-full mr-3 mt-1">
                  <Brain className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h5 className="font-medium text-green-800">Neural Connections</h5>
                  <p>In the first few years of life, 700-1,000 new neural connections form every second. These connections 
                  are pruned based on experience—connections that are used frequently grow stronger, while those rarely 
                  used are eliminated.</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="bg-blue-100 p-2 rounded-full mr-3 mt-1">
                  <Eye className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h5 className="font-medium text-blue-800">Sensitive Periods</h5>
                  <p>Different areas of the brain develop in a sequence of "sensitive periods" when they are especially 
                  receptive to certain types of experiences and learning. For example, the sensitive period for language 
                  development peaks around 5-6 years of age.</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="bg-purple-100 p-2 rounded-full mr-3 mt-1">
                  <Puzzle className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <h5 className="font-medium text-purple-800">Serve and Return</h5>
                  <p>When an infant or child babbles, gestures, or cries, and an adult responds appropriately, neural 
                  connections are built and strengthened. This "serve and return" interaction is fundamental to brain development.</p>
                </div>
              </div>
            </div>
          </div>
          
          <h3 className="text-xl font-semibold mt-6">Implications for the Classroom</h3>
          <p>
            Understanding brain development has profound implications for how we approach teaching and caregiving in early childhood settings.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
            <div className="bg-green-50 p-4 rounded-lg border border-green-100">
              <h4 className="font-semibold text-green-700 mb-2">What You Can Do:</h4>
              <ul className="list-disc pl-5 space-y-1">
                <li>Engage in responsive, back-and-forth interactions with each child</li>
                <li>Create a sensory-rich environment that stimulates multiple areas of the brain</li>
                <li>Provide opportunities for exploration and discovery</li>
                <li>Use language-rich interactions throughout the day</li>
                <li>Support emotional regulation through co-regulation</li>
              </ul>
            </div>
            
            <div className="bg-red-50 p-4 rounded-lg border border-red-100">
              <h4 className="font-semibold text-red-700 mb-2">What to Avoid:</h4>
              <ul className="list-disc pl-5 space-y-1">
                <li>Prolonged periods without adult-child interaction</li>
                <li>Highly stressful environments with unpredictable routines</li>
                <li>Ignoring attempts at communication (not "returning the serve")</li>
                <li>One-size-fits-all approaches that don't account for individual development</li>
                <li>Underestimating children's capacity for complex thinking</li>
              </ul>
            </div>
          </div>
          
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 mt-6">
            <p className="italic text-blue-800">
              "The brain is the only organ that's shaped almost entirely by experience after birth.
              During the early sensitive periods, everyday experiences literally shape the 
              physical architecture of the developing brain."
            </p>
            <p className="text-right text-sm mt-2">— Dr. Jack P. Shonkoff, Center on the Developing Child at Harvard University</p>
          </div>
        </div>
      ),
      icon: <Brain className="h-5 w-5" />
    },
    {
      id: 'trauma-impact',
      title: 'Understanding Trauma',
      content: (
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-lg border border-purple-100 mb-4">
            <h2 className="text-2xl font-bold text-purple-800 mb-3">The Impact of Trauma on Development</h2>
            <p className="text-lg">
              Adverse childhood experiences (ACEs) and trauma can disrupt healthy brain development, 
              but responsive relationships can buffer these effects and support resilience.
            </p>
          </div>
          
          <h3 className="text-xl font-semibold mt-6">Understanding Trauma in Early Childhood</h3>
          <p>
            Trauma occurs when a child experiences an event, series of events, or set of circumstances 
            that is physically or emotionally harmful and has lasting effects on their functioning and 
            wellbeing. For young children, trauma can include:
          </p>
          
          <ul className="list-disc pl-6 space-y-1 my-4">
            <li>Abuse or neglect</li>
            <li>Witnessing domestic violence</li>
            <li>Community violence</li>
            <li>Natural disasters</li>
            <li>Medical trauma</li>
            <li>Separation from caregivers</li>
            <li>Systemic racism and discrimination</li>
          </ul>
          
          <div className="my-6 bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
            <h4 className="font-semibold text-lg mb-3">How Trauma Affects the Developing Brain</h4>
            
            <div className="space-y-4">
              <div className="flex items-start">
                <div className="bg-red-100 p-2 rounded-full mr-3 mt-1">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-600">
                    <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
                  </svg>
                </div>
                <div>
                  <h5 className="font-medium text-red-800">Toxic Stress Response</h5>
                  <p>Prolonged activation of the stress response system in the absence of protective relationships
                  can lead to a toxic stress response, which disrupts brain architecture and affects multiple systems in the body.</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="bg-orange-100 p-2 rounded-full mr-3 mt-1">
                  <Brain className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <h5 className="font-medium text-orange-800">Changes in Brain Structure</h5>
                  <p>Trauma can lead to overdevelopment in areas of the brain that deal with fear and danger,
                  and underdevelopment in areas that handle complex thinking, emotional regulation, and memory.</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="bg-purple-100 p-2 rounded-full mr-3 mt-1">
                  <MessageCircle className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <h5 className="font-medium text-purple-800">Behavioral Manifestations</h5>
                  <p>Children who have experienced trauma may display behaviors that can be challenging in a classroom
                  setting, including hypervigilance, difficulty regulating emotions, problems with attention and focus,
                  or withdrawal.</p>
                </div>
              </div>
            </div>
          </div>
          
          <h3 className="text-xl font-semibold mt-6">Building Trauma-Sensitive Classrooms</h3>
          <p>
            Early childhood educators are in a unique position to help buffer the effects of trauma and
            foster resilience in young children.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-6">
            <div className="bg-green-50 p-4 rounded-lg border border-green-100">
              <h4 className="font-semibold text-green-700 mb-2">Safety & Predictability</h4>
              <ul className="list-disc pl-5 space-y-1">
                <li>Consistent routines and clear boundaries</li>
                <li>Visual schedules and preparation for transitions</li>
                <li>Safe places for regulation</li>
                <li>Trauma-sensitive physical environment</li>
              </ul>
            </div>
            
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
              <h4 className="font-semibold text-blue-700 mb-2">Relationships & Connection</h4>
              <ul className="list-disc pl-5 space-y-1">
                <li>Prioritize relationship-building</li>
                <li>Attune to children's emotional states</li>
                <li>Personal greetings and goodbyes</li>
                <li>Maintain connection during challenging behaviors</li>
              </ul>
            </div>
            
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
              <h4 className="font-semibold text-purple-700 mb-2">Skill Building</h4>
              <ul className="list-disc pl-5 space-y-1">
                <li>Teach emotional literacy</li>
                <li>Provide tools for self-regulation</li>
                <li>Scaffold social problem-solving</li>
                <li>Nurture executive function skills</li>
              </ul>
            </div>
          </div>
          
          <div className="bg-amber-50 p-4 rounded-lg border border-amber-100 mt-6">
            <p className="italic text-amber-800">
              "Children are not giving you a hard time. They are having a hard time. When we view behavior
              through this lens, we can respond with compassion rather than frustration."
            </p>
            <p className="text-right text-sm mt-2">— Dr. Mona Delahooke, Child Psychologist</p>
          </div>
        </div>
      ),
      icon: <Heart className="h-5 w-5" />
    },
    {
      id: 'attachment-theory',
      title: 'Attachment & Relationships',
      content: (
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-100 mb-4">
            <h2 className="text-2xl font-bold text-blue-800 mb-3">The Power of Attachment</h2>
            <p className="text-lg">
              Attachment is the emotional bond between a child and their caregivers that provides 
              the secure base from which they explore the world. As teachers, we become important
              attachment figures in children's lives.
            </p>
          </div>
          
          <h3 className="text-xl font-semibold mt-6">Attachment Theory: The Foundation</h3>
          <p>
            Attachment theory, developed by John Bowlby and expanded by Mary Ainsworth, has become one of
            the most well-researched and influential frameworks for understanding human development.
            It explains how the parent-child relationship emerges and influences subsequent development.
          </p>
          
          <div className="my-6 bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
            <h4 className="font-semibold text-lg mb-3">Key Concepts in Attachment Theory</h4>
            
            <div className="space-y-4">
              <div className="flex items-start">
                <div className="bg-blue-100 p-2 rounded-full mr-3 mt-1">
                  <Home className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h5 className="font-medium text-blue-800">Secure Base</h5>
                  <p>When a child has a secure attachment, they use their caregiver as a "secure base" from
                  which to explore. They know they can venture out and take risks, and return for comfort when needed.</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="bg-green-100 p-2 rounded-full mr-3 mt-1">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h5 className="font-medium text-green-800">Attachment Patterns</h5>
                  <p>Research has identified four main attachment patterns: secure, anxious-ambivalent,
                  anxious-avoidant, and disorganized. These patterns reflect how children have learned to manage
                  their need for connection based on caregiver responsiveness.</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="bg-purple-100 p-2 rounded-full mr-3 mt-1">
                  <Star className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <h5 className="font-medium text-purple-800">Internal Working Models</h5>
                  <p>Through repeated interactions with caregivers, children develop "internal working models"—mental
                  representations of themselves, others, and relationships that guide how they approach social interactions
                  throughout life.</p>
                </div>
              </div>
            </div>
          </div>
          
          <h3 className="text-xl font-semibold mt-6">Building Secure Attachments in the Classroom</h3>
          <p>
            As early childhood educators, we have the opportunity to provide secure attachment relationships
            for children in our care—either reinforcing existing secure attachments or offering a corrective
            experience for children with attachment difficulties.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
              <h4 className="font-semibold text-blue-700 mb-2">Strategies for Building Secure Attachments:</h4>
              <ul className="list-disc pl-5 space-y-2">
                <li><span className="font-medium">Responsive Caregiving</span>: Promptly and appropriately respond to children's physical and emotional needs</li>
                <li><span className="font-medium">Consistency</span>: Be a reliable and predictable presence in children's lives</li>
                <li><span className="font-medium">Attunement</span>: Pay close attention to children's cues and signals</li>
                <li><span className="font-medium">Emotional Availability</span>: Be present and engaged during interactions</li>
                <li><span className="font-medium">Repair</span>: Acknowledge mistakes and repair relational ruptures</li>
              </ul>
            </div>
            
            <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100">
              <h4 className="font-semibold text-indigo-700 mb-2">In Practice This Looks Like:</h4>
              <ul className="list-disc pl-5 space-y-2">
                <li>Greeting each child warmly by name every day</li>
                <li>Getting down to children's eye level during conversations</li>
                <li>Validating children's feelings: "I see you're feeling sad today"</li>
                <li>Following children's leads in play</li>
                <li>Providing comfort during distress</li>
                <li>Being physically and emotionally available during transitions</li>
                <li>Creating predictable routines and rituals</li>
              </ul>
            </div>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg border border-green-100 mt-6">
            <p className="italic text-green-800">
              "What matters most is not the specific activity or curriculum, but rather the quality
              of the relationship between the teacher and child. In that relationship lies the power
              to transform lives."
            </p>
            <p className="text-right text-sm mt-2">— Dr. Bruce Perry, Child Psychiatrist and Neuroscientist</p>
          </div>
        </div>
      ),
      icon: <Heart className="h-5 w-5" />
    },
    {
      id: 'writing-the-first-chapter',
      title: 'Your Role in Chapter One',
      content: (
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-6 rounded-lg border border-amber-100 mb-4">
            <h2 className="text-2xl font-bold text-amber-800 mb-3">Writing the First Chapter</h2>
            <p className="text-lg">
              As early childhood educators, we have the profound responsibility and privilege of helping to write
              the first chapter in children's life stories. The words, experiences, and relationships we create
              become part of their narrative.
            </p>
          </div>
          
          <h3 className="text-xl font-semibold mt-6">The Lasting Impact of Early Experiences</h3>
          <p>
            Research continues to confirm what many teachers intuitively understand: early experiences 
            have a profound and lasting impact on children's development, with effects that can extend well into adulthood.
          </p>
          
          <div className="my-6 bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
            <h4 className="font-semibold text-lg mb-3">Your Words Become Their Inner Voice</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h5 className="font-medium text-green-700">Words That Build</h5>
                <ul className="list-disc pl-5 space-y-1 text-green-800">
                  <li>"I believe in you."</li>
                  <li>"You can try again. Mistakes help us learn."</li>
                  <li>"I notice how hard you're working."</li>
                  <li>"Your ideas matter to me."</li>
                  <li>"I'm here for you when things are hard."</li>
                  <li>"You're an important part of our classroom."</li>
                </ul>
              </div>
              
              <div className="space-y-3">
                <h5 className="font-medium text-red-700">Words That Undermine</h5>
                <ul className="list-disc pl-5 space-y-1 text-red-800">
                  <li>"Why can't you be more like..."</li>
                  <li>"You're always causing problems."</li>
                  <li>"I've told you this a hundred times."</li>
                  <li>"You should know better."</li>
                  <li>"You're being a baby."</li>
                  <li>"Just stop crying."</li>
                </ul>
              </div>
            </div>
            
            <p className="mt-4 italic text-gray-600">
              "The words we speak to children become the internal dialogue they carry with them throughout life.
              Choose words that build rather than break, that encourage rather than discourage, that empower rather than diminish."
            </p>
          </div>
          
          <h3 className="text-xl font-semibold mt-6">Practical Strategies for Writing a Beautiful Chapter One</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-6">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
              <h4 className="font-semibold text-blue-700 mb-2">Narrate the Positive</h4>
              <p>Point out and describe the positive things you see in children. "I noticed how you helped your friend" or
              "You found a creative solution to that problem!"</p>
            </div>
            
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
              <h4 className="font-semibold text-purple-700 mb-2">Build Identity Through Language</h4>
              <p>Help children develop positive self-concepts through how you speak about them: "You're the kind of person who sticks with hard things"
              or "You have such interesting ideas."</p>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg border border-green-100">
              <h4 className="font-semibold text-green-700 mb-2">Create Rituals of Connection</h4>
              <p>Establish daily rituals that build relationships: special greetings, check-ins, gratitude practices,
              or celebratory moments that become part of your classroom culture.</p>
            </div>
          </div>
          
          <div className="my-6 bg-amber-50 p-5 rounded-lg border border-amber-200">
            <h4 className="font-semibold text-amber-800 mb-3">Your Commitment as a Chapter Writer</h4>
            <p className="mb-4">
              As a teacher at Raising Arizona Preschool, we invite you to make the following commitment to the
              children in your care:
            </p>
            
            <div className="bg-white p-4 rounded-lg border border-amber-100 italic text-amber-900">
              <p>
                "I commit to being a positive force in writing the first chapter of each child's life story.
                I will use words that build rather than break, create environments that nurture rather than stress,
                and establish relationships that empower rather than diminish. I recognize the profound impact of
                my role, and I embrace the responsibility of helping to shape the narrative of each child's future."
              </p>
            </div>
          </div>
          
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 mt-6">
            <p className="italic text-blue-800 font-medium">
              "Remember: A hundred years from now, it will not matter what kind of car you drove, what kind of house
              you lived in, how much money you had in your bank account, or what your clothes looked like. But the world
              may be a better place because you were important in the life of a child."
            </p>
            <p className="text-right text-sm mt-2">— Adapted from a quote by Forest Witcraft</p>
          </div>
        </div>
      ),
      icon: <Book className="h-5 w-5" />
    },
  ];

  // Initialize from user progress if available
  useEffect(() => {
    if (userProgress && Array.isArray(userProgress) && userProgress.length > 0) {
      const moduleProgress = userProgress.find((p: any) => p.moduleId === CHAPTER_ONE_MODULE_ID);
      
      if (moduleProgress) {
        // If module is 100% complete, set completed state
        if (moduleProgress.completed) {
          setCompleted(true);
          setProgress(100);
          // Show the last section by default for completed modules
          setCurrentSection(sections.length - 1);
        } 
        // If progress is at 90%, show the quiz
        else if (moduleProgress.progress >= 90 && moduleProgress.progress < 100) {
          setShowQuiz(true);
          setProgress(90);
        }
        // Otherwise, show appropriate section based on progress
        else if (moduleProgress.progress > 0) {
          // Calculate which section to show based on progress
          setProgress(moduleProgress.progress);
          const sectionIndex = Math.min(
            Math.floor((moduleProgress.progress / 100) * sections.length),
            sections.length - 1
          );
          setCurrentSection(sectionIndex);
        }
      }
    }
  }, [userProgress, sections.length]);

  // Handle moving to the next section
  const handleNextSection = () => {
    if (currentSection < sections.length - 1) {
      // Move to next section
      const newSectionIndex = currentSection + 1;
      setCurrentSection(newSectionIndex);
      
      // Calculate progress percentage
      const newProgress = Math.floor(((newSectionIndex + 1) / sections.length) * 100);
      setProgress(newProgress);
      
      // Update progress in the database
      updateProgressMutation.mutate({
        moduleId: CHAPTER_ONE_MODULE_ID,
        progress: newProgress,
        completed: false
      });
      
      window.scrollTo(0, 0);
    } else {
      // Show the quiz when reaching the end of content instead of starting a lesson
      setShowQuiz(true);
      
      // Mark 90% progress but not completed yet
      updateProgressMutation.mutate({
        moduleId: CHAPTER_ONE_MODULE_ID,
        progress: 90,
        completed: false
      });
      
      // Log to confirm quiz is being shown
      console.log("Showing Chapter One quiz");
    }
  };

  // Handle module completion after quiz
  const handleQuizComplete = (score: number) => {
    // Module is considered complete when the quiz is done
    setCompleted(true);
    
    // The quiz component already updates the progress to 100%
    setProgress(100);
    
    // Award points based on quiz performance (80% required for full 20 points)
    const pointsAwarded = score >= 80 ? 20 : 10; // Full points for passing with 80%+, half otherwise
    
    toast({
      title: score >= 80 ? "Congratulations!" : "Module Completed",
      description: score >= 80 
        ? `You've earned ${pointsAwarded} points for successfully completing Chapter 1: Building a Human.` 
        : `You've earned ${pointsAwarded} points. Review the content and try the quiz again for a score of 80% or higher to earn full points.`,
      variant: score >= 80 ? "default" : "destructive",
    });
    
    // Log quiz completion for debugging
    console.log(`Chapter One quiz completed with score: ${score}, awarded ${pointsAwarded} points`);
    
    // After a delay, return to dashboard
    setTimeout(() => {
      navigate('/');
    }, 3000);
  };

  // Handle going back to previous section
  const handlePrevSection = () => {
    if (currentSection > 0) {
      setCurrentSection(currentSection - 1);
    }
  };

  // If showing the quiz - This should take priority over other page states
  if (showQuiz) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
        <Header />
        <div className="container py-8">
          <div className="mb-6">
            <Button variant="ghost" onClick={() => {
              setShowQuiz(false);
              // Go back to the last section
              setCurrentSection(sections.length - 1);
            }} className="flex items-center">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Module
            </Button>
          </div>
          
          <ChapterOneQuiz moduleId={CHAPTER_ONE_MODULE_ID} onComplete={handleQuizComplete} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <Header />
      <div className="container py-8">
        <div className="mb-6">
          <Button variant="ghost" onClick={() => navigate('/')} className="flex items-center">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
          </Button>
        </div>
        
        <div className="flex flex-col md:flex-row gap-6">
          {/* Main content area */}
          <div className="flex-1">
            <div className="mb-6">
              <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
                Chapter 1: Building a Human
              </h1>
              <p className="text-gray-600 max-w-3xl">
                Explore the science of early childhood development and your crucial role in shaping children's futures.
              </p>
            </div>
            
            <Card className="mb-6">
              <CardHeader className="pb-3">
                <CardTitle>{sections[currentSection].title}</CardTitle>
                <CardDescription>
                  Section {currentSection + 1} of {sections.length}
                </CardDescription>
                <Progress value={progress} className="h-2 mt-2" />
              </CardHeader>
              <CardContent>
                {sections[currentSection].content}
              </CardContent>
              <CardFooter className="flex justify-between pt-2 border-t">
                <Button 
                  variant="outline" 
                  onClick={handlePrevSection}
                  disabled={currentSection === 0}
                >
                  Previous Section
                </Button>
                <Button onClick={handleNextSection}>
                  {currentSection < sections.length - 1 ? "Next Section" : "Take Quiz"}
                </Button>
              </CardFooter>
            </Card>
          </div>
          
          {/* Sidebar */}
          <div className="w-full md:w-80 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Module Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <Progress value={progress} className="h-4 mb-4" />
                <p className="text-sm text-center text-gray-500 mb-4">{progress}% Complete</p>
                
                <div className="space-y-1">
                  {sections.map((section, index) => (
                    <div 
                      key={section.id}
                      className={`flex items-center p-2 rounded-md ${
                        index === currentSection 
                          ? "bg-blue-100 text-blue-800" 
                          : index < currentSection 
                            ? "bg-green-50 text-green-800"
                            : "bg-gray-50 text-gray-500"
                      }`}
                    >
                      <div className={`mr-3 flex-shrink-0 ${
                        index < currentSection ? "text-green-600" : 
                        index === currentSection ? "text-blue-600" : "text-gray-400"
                      }`}>
                        {index < currentSection ? (
                          <CheckCircle className="h-5 w-5" />
                        ) : section.icon}
                      </div>
                      <span className={`text-sm ${
                        index < currentSection ? "font-medium" : ""
                      }`}>
                        {section.title}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Completion Reward</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Star className="h-8 w-8 text-amber-600" />
                </div>
                <p className="text-sm mb-2">Complete this module to earn:</p>
                <p className="text-xl font-bold text-amber-600">20 XP Points</p>
                <p className="text-xs text-gray-500 mt-1">
                  Required for all Raising Arizona teachers
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}