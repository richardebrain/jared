import React, { useState } from 'react';
import { useParams, useLocation } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { LearningModule, UserProgress, User } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Clock, Check, Heart, Star, Zap, ArrowLeft, Trophy, Award, Coins, ChevronLeft, ChevronRight, CheckCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Confetti } from '@/components/ui/confetti';
import { CelebrationOverlay } from '@/components/CelebrationOverlay';
import { cn } from '@/lib/utils';
import { Spinner } from '@/components/ui/spinner';
import { VideoResources } from '@/components/VideoResources';
import { InteractiveQuiz } from '@/components/InteractiveQuiz';
import { MemoryMatchGame } from '@/components/MemoryMatchGame';

export default function MicroModuleView() {
  const [location, setLocation] = useLocation();
  const params = useParams();
  const moduleId = parseInt(params.id as string);
  const [showConfetti, setShowConfetti] = useState(false);
  const [keyTakeaways, setKeyTakeaways] = useState<string[]>([]);
  const [completedStep, setCompletedStep] = useState<number>(0);
  const [pointsEarned, setPointsEarned] = useState<number>(0);
  
  // Points for micro module (5 min) = 5 points
  // This is a good balance - 1 point per minute ensures fairness across all module sizes
  const MICRO_MODULE_POINTS = 5;
  
  // Fetch the module data
  const { data: module, isLoading: isLoadingModule } = useQuery<LearningModule>({
    queryKey: [`/api/modules/${moduleId}`],
  });
  
  // Fetch user's progress for this module
  const { data: progress, isLoading: isLoadingProgress } = useQuery<UserProgress>({
    queryKey: [`/api/progress/${moduleId}`],
  });
  
  // Fetch user data for points tracking
  const { data: user, isLoading: isLoadingUser } = useQuery<User>({
    queryKey: ['/api/auth/me'],
  });
  
  // Update progress mutation with points tracking
  const updateProgressMutation = useMutation({
    mutationFn: async (data: { progress: number, completed: boolean, pointsEarned?: number }) => {
      console.log("Calling progress API with data:", { ...data, moduleId });
      try {
        if (!moduleId || moduleId <= 0) {
          throw new Error("Invalid module ID for progress update");
        }
        
        return await apiRequest('/api/progress', {
          method: 'POST',
          data: { ...data, moduleId }
        });
      } catch (error) {
        console.error("Error in updateProgressMutation.mutationFn:", error);
        throw error; // Re-throw to trigger onError
      }
    },
    onSuccess: (data) => {
      console.log("Update progress success:", data);
      // Invalidate both progress and user queries to refresh points
      queryClient.invalidateQueries({ queryKey: [`/api/progress/${moduleId}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/progress'] });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
    },
    onError: (error) => {
      console.error("Error in updateProgressMutation:", error);
      toast({
        title: "Progress Update Failed",
        description: "We couldn't save your progress. Please try again.",
        variant: "destructive"
      });
    }
  });
  
  // Update user points mutation
  const updateUserPointsMutation = useMutation({
    mutationFn: async (points: number) => {
      console.log("Adding points:", points);
      try {
        return await apiRequest('/api/users/add-points', {
          method: 'POST',
          data: { points }
        });
      } catch (error) {
        console.error('Error adding points:', error);
        // Return a fallback response to prevent unhandled rejections
        return { success: false, message: 'Could not add points at this time' };
      }
    },
    onSuccess: (data) => {
      console.log("Points update response:", data);
      if (data.success) {
        console.log("Points updated successfully");
        queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      } else {
        console.warn("Points update returned unsuccessful:", data);
      }
    },
    onError: (error) => {
      console.error('Error in points mutation:', error);
      toast({
        title: "Could not update points",
        description: "Your progress was saved, but we couldn't update your points.",
        variant: "destructive"
      });
    }
  });

  // State for Perplexity-generated content
  const [perplexityContent, setPerplexityContent] = useState<{
    coreConcept: string,
    practicalApplication: string,
    videoResources: string[],
    interactiveElement: string,
    quizQuestions?: {
      question: string,
      options: string[],
      correctAnswer: number,
      correctExplanation?: string,
      incorrectExplanation?: string
    }[],
    isLoading: boolean
  }>({
    coreConcept: "",
    practicalApplication: "",
    videoResources: [
      "https://www.youtube.com/embed/ckZt33Ymbpg",  // Vanderbilt IRIS Center on Positive Behavior Support
      "https://www.youtube.com/embed/4PSRP98mtJY",  // PBS Teachers video on positive classroom environments
      "https://www.youtube.com/embed/HQT6u-tFKZ4"   // Head Start video on Positive Teacher-Child Interactions
    ],
    interactiveElement: "",
    quizQuestions: [],
    isLoading: false
  });
  
  // Add state for the active step in the lesson
  const [currentStep, setCurrentStep] = useState(0);
  const [showFinalAssessment, setShowFinalAssessment] = useState(false);
  const [finalAssessmentPassed, setFinalAssessmentPassed] = useState(false);
  
  // Function to get default videos based on module type
  const getDefaultVideosForModule = (moduleId: number): string[] => {
    // Default videos for common module categories
    const moduleCategory = module?.category?.toLowerCase() || '';
    
    // Active Listening videos
    if (moduleId === 1 || moduleId === 15 || moduleCategory.includes('listen') || moduleCategory.includes('communication')) {
      return [
        "https://www.youtube.com/embed/ZwSHAIb_qO8", // Active Listening Techniques
        "https://www.youtube.com/embed/5oP2__wXQ9U", // Effective Listening in Classroom
        "https://www.youtube.com/embed/3_dAkDsBQyk"  // Communication Skills
      ];
    }
    
    // Empathy videos
    if (moduleId === 2 || moduleId === 16 || moduleCategory.includes('empathy') || moduleCategory.includes('emotion')) {
      return [
        "https://www.youtube.com/embed/9_1Rt1R4xbM", // Teaching Empathy
        "https://www.youtube.com/embed/aU3QfyqvHk8", // Building Empathy
        "https://www.youtube.com/embed/cTOhzcSYMlM"  // Social-Emotional Skills
      ];
    }
    
    // Mindfulness videos
    if (moduleCategory.includes('mindful') || moduleCategory.includes('morning')) {
      return [
        "https://www.youtube.com/embed/O29e4rRMrV4", // Mindfulness for Kids
        "https://www.youtube.com/embed/2zMbdQU-nQs", // Morning Meditation
        "https://www.youtube.com/embed/uwWdK887mE0"  // Mindful Mornings
      ];
    }
    
    // Inclusion videos
    if (moduleCategory.includes('inclus') || moduleCategory.includes('divers')) {
      return [
        "https://www.youtube.com/embed/AGMLnvVFkOA", // Inclusion in ECE 
        "https://www.youtube.com/embed/sQuM5e0QGLg", // Diversity in Classroom
        "https://www.youtube.com/embed/0MF2Qxepoj8"  // Creating Inclusive Environment
      ];
    }
    
    // Behavior Management videos
    if (moduleCategory.includes('behav') || moduleCategory.includes('manag')) {
      return [
        "https://www.youtube.com/embed/ckZt33Ymbpg", // Positive Behavior Support
        "https://www.youtube.com/embed/4PSRP98mtJY", // Positive Classroom
        "https://www.youtube.com/embed/HQT6u-tFKZ4"  // Teacher-Child Interactions
      ];
    }
    
    // STEM videos
    if (moduleCategory.includes('stem') || moduleCategory.includes('science') || moduleCategory.includes('math')) {
      return [
        "https://www.youtube.com/embed/D8Q8EZ6IryM", // STEM Activities
        "https://www.youtube.com/embed/6X-vObPOAeE", // Teaching Math Concepts
        "https://www.youtube.com/embed/RI6_xQqHI94"  // Science Exploration
      ];
    }
    
    // Family Engagement videos
    if (moduleCategory.includes('family') || moduleCategory.includes('parent')) {
      return [
        "https://www.youtube.com/embed/caWIhWtn5vA", // Family Engagement
        "https://www.youtube.com/embed/EgzJvT5x_vw", // Parent Communication
        "https://www.youtube.com/embed/nuYt8Kf37OM"  // Family Partnerships
      ];
    }
    
    // Default videos for general ECE topics
    return [
      "https://www.youtube.com/embed/ckZt33Ymbpg", // Positive Behavior Support
      "https://www.youtube.com/embed/4PSRP98mtJY", // Positive Classroom Environment
      "https://www.youtube.com/embed/HQT6u-tFKZ4"  // Teacher-Child Interactions
    ];
  };
  
  // Get default quiz questions appropriate for each module topic
  const getDefaultQuizQuestions = (moduleId: number) => {
    switch(moduleId) {
      // Positive Attitude module
      case 18:
        return [
          {
            question: "What is one benefit of maintaining a positive attitude in the classroom?",
            options: [
              "It reduces the need for planning activities",
              "It creates a supportive environment that fosters learning",
              "It eliminates all behavioral challenges",
              "It replaces the need for structured routines"
            ],
            correctAnswer: 1,
            correctExplanation: "You're right! A positive attitude helps create a warm, supportive classroom where children feel safe to learn and grow.",
            incorrectExplanation: "Actually, a positive attitude creates a supportive learning environment. Children learn better when they feel good about being in class."
          },
          {
            question: "What can you do to show a positive attitude at work?",
            options: [
              "Only talk about the good things that happen",
              "Avoid children who are having a bad day",
              "Greet each child by name with a smile",
              "Keep to yourself during challenging moments"
            ],
            correctAnswer: 2,
            correctExplanation: "Great job! Greeting each child with a smile and using their name shows you care about them as individuals.",
            incorrectExplanation: "The best way to show a positive attitude is by greeting each child by name with a smile. This helps them feel welcome and valued."
          },
          {
            question: "How does a teacher's attitude affect children?",
            options: [
              "It has no effect on how children behave",
              "It only affects children who are paying attention",
              "Children mirror the emotional tone set by teachers",
              "It only matters during difficult situations"
            ],
            correctAnswer: 2,
            correctExplanation: "That's correct! Children pick up on and often mirror the emotional tone you set. Your positive attitude creates a positive classroom.",
            incorrectExplanation: "Children actually mirror the emotional tone set by teachers. Your attitude has a big impact on how children feel and behave."
          }
        ];
      
      // Active Listening with Children
      case 19:
        return [
          {
            question: "Why is active listening important for preschool teachers?",
            options: [
              "It reduces the need to plan activities",
              "It helps children feel valued and understood",
              "It eliminates all behavioral problems",
              "It's only needed for children with special needs"
            ],
            correctAnswer: 1,
            correctExplanation: "That's right! Active listening shows children that their thoughts and feelings matter, building trust and emotional safety.",
            incorrectExplanation: "Active listening helps all children feel valued and understood, which builds trust and strengthens your relationships with them."
          },
          {
            question: "Which is an example of active listening with preschoolers?",
            options: [
              "Continuing to set up an activity while a child talks to you",
              "Nodding while thinking about your lunch break",
              "Getting down to the child's eye level and responding to what they say",
              "Telling the child you'll listen later when you're not busy"
            ],
            correctAnswer: 2,
            correctExplanation: "Excellent! Getting down to the child's level and engaging with what they're saying shows true active listening.",
            incorrectExplanation: "Active listening requires your full attention. Getting down to the child's eye level and responding to what they say shows you're truly listening."
          },
          {
            question: "What can happen when teachers consistently practice active listening?",
            options: [
              "Children stop trying to talk to teachers",
              "Children learn that their thoughts and feelings matter",
              "Children become too dependent on teacher attention",
              "Classroom management becomes more difficult"
            ],
            correctAnswer: 1,
            correctExplanation: "You got it! When we consistently listen actively to children, they learn that their thoughts and feelings are important.",
            incorrectExplanation: "When teachers listen actively, children learn that their thoughts and feelings matter, which builds their confidence and communication skills."
          }
        ];
      
      // Patience in Practice
      case 20:
        return [
          {
            question: "Why is patience especially important in early childhood education?",
            options: [
              "Because it makes the day go faster",
              "Because young children are still developing self-regulation",
              "Because it eliminates the need for classroom rules",
              "Because it's only needed for challenging children"
            ],
            correctAnswer: 1,
            correctExplanation: "That's correct! Young children are still developing self-regulation skills and need patient adults to guide them through this process.",
            incorrectExplanation: "Patience is crucial because young children are still developing self-regulation skills and learn these skills from watching patient adults."
          },
          {
            question: "What can you do when you feel your patience running low?",
            options: [
              "Tell the children they need to behave better",
              "Take a few deep breaths and remind yourself that learning takes time",
              "Give the children a worksheet to keep them quiet",
              "Ask your director to discipline the children"
            ],
            correctAnswer: 1,
            correctExplanation: "Great job! Taking deep breaths and reminding yourself that learning is a process helps restore your patience.",
            incorrectExplanation: "When your patience is running low, take deep breaths and remind yourself that learning takes time. This helps you reset and respond calmly."
          },
          {
            question: "How does teacher patience affect children's learning?",
            options: [
              "It has no effect on learning outcomes",
              "It only matters for children with special needs",
              "It creates a safe space where children feel comfortable taking risks",
              "It makes children dependent on teacher help"
            ],
            correctAnswer: 2,
            correctExplanation: "Exactly! When teachers are patient, children feel safe to try new things and make mistakes, which is essential for learning.",
            incorrectExplanation: "Teacher patience creates a safe environment where children feel comfortable taking risks and making mistakes, which is how they learn best."
          }
        ];
      
      // Empathy: Walking in Tiny Shoes
      case 21:
        return [
          {
            question: "What does it mean to practice empathy with young children?",
            options: [
              "Always giving children what they want",
              "Understanding and respecting children's perspectives and feelings",
              "Feeling sorry for children when they're upset",
              "Teaching children to always share their toys"
            ],
            correctAnswer: 1,
            correctExplanation: "That's right! Empathy means trying to understand situations from the child's perspective and respecting their feelings.",
            incorrectExplanation: "Empathy involves understanding and respecting children's perspectives and feelings, even when their reactions seem different from what we expect."
          },
          {
            question: "Why is teacher empathy important in early childhood education?",
            options: [
              "It replaces the need for classroom rules",
              "It's only necessary for children with behavioral challenges",
              "It helps children develop their own empathy and emotional skills",
              "It makes children less emotional"
            ],
            correctAnswer: 2,
            correctExplanation: "Excellent! When teachers model empathy, children learn to recognize and respect others' feelings too.",
            incorrectExplanation: "Teacher empathy helps children develop their own empathy and emotional intelligence. Children learn these skills by experiencing them from adults."
          },
          {
            question: "Which is an example of showing empathy to a preschooler?",
            options: [
              "Telling them to stop crying because they're fine",
              "Saying \"I understand you're feeling sad about your mom leaving. It's okay to feel sad.\"",
              "Distracting them with a toy when they're upset",
              "Explaining that their feelings aren't logical"
            ],
            correctAnswer: 1,
            correctExplanation: "You got it! Acknowledging the child's feelings and validating that it's okay to feel that way shows true empathy.",
            incorrectExplanation: "Empathy involves acknowledging feelings without judgment. Saying \"I understand you're feeling sad\" validates the child's emotional experience."
          }
        ];
        
      // Creativity as a Core Value
      case 22:
        return [
          {
            question: "Why is creativity important in early childhood education?",
            options: [
              "It's only important for artistic children",
              "It develops problem-solving skills and innovative thinking",
              "It's just for fun and doesn't affect learning",
              "It's only needed during art time"
            ],
            correctAnswer: 1,
            correctExplanation: "That's correct! Creativity builds crucial skills like problem-solving, critical thinking, and innovation that benefit all learning.",
            incorrectExplanation: "Creativity is vital for developing problem-solving skills and innovative thinking - abilities that help children in all areas of learning."
          },
          {
            question: "How can teachers nurture creativity in the classroom?",
            options: [
              "By providing only one right way to complete activities",
              "By always showing a perfect model of the finished product",
              "By asking open-ended questions and providing varied materials",
              "By focusing only on academic skills"
            ],
            correctAnswer: 2,
            correctExplanation: "Excellent! Open-ended questions and varied materials allow children to explore, experiment, and express their unique ideas.",
            incorrectExplanation: "Teachers nurture creativity by asking open-ended questions and providing varied materials that allow for exploration and different solutions."
          },
          {
            question: "What happens when teachers value and model creativity?",
            options: [
              "Children become less interested in academic subjects",
              "Children learn there are many ways to solve problems",
              "Classroom management becomes harder",
              "Children only want to do art activities"
            ],
            correctAnswer: 1,
            correctExplanation: "You got it! When teachers value creativity, children learn to think flexibly and understand there are multiple approaches to solving problems.",
            incorrectExplanation: "When teachers value creativity, children learn there are many ways to solve problems, which builds confidence and cognitive flexibility."
          }
        ];
        
      // Default generic questions as fallback
      default:
        return [
          {
            question: "What is one key benefit of professional development for early childhood educators?",
            options: [
              "It reduces the number of hours teachers need to work",
              "It helps teachers learn new strategies to support children's development",
              "It eliminates the need for classroom planning",
              "It's only important for new teachers"
            ],
            correctAnswer: 1,
            correctExplanation: "That's right! Professional development gives teachers new tools and strategies to better support children's learning and growth.",
            incorrectExplanation: "Professional development is valuable because it helps teachers learn new strategies to support children's development and stay current with best practices."
          },
          {
            question: "Why is ongoing learning important in early childhood education?",
            options: [
              "Because teaching techniques never change",
              "Because it's only required for certification",
              "Because research and best practices continue to evolve",
              "Because it's only important for lead teachers"
            ],
            correctAnswer: 2,
            correctExplanation: "Exactly! The field of early childhood education is always evolving with new research and insights, so ongoing learning keeps your practice current.",
            incorrectExplanation: "Ongoing learning is important because research and best practices in early childhood education continue to evolve. This helps you provide the best care possible."
          },
          {
            question: "How does teacher growth affect children's experiences?",
            options: [
              "It has no direct impact on children",
              "It only affects children with special needs",
              "It improves the quality of interactions and learning opportunities",
              "It only matters for academic subjects"
            ],
            correctAnswer: 2,
            correctExplanation: "You got it! When teachers continue to learn and grow, they provide better quality interactions and more meaningful learning experiences.",
            incorrectExplanation: "Teacher growth directly improves the quality of interactions and learning opportunities for children. Your development benefits their development!"
          }
        ];
    }
  };

  // Get module-specific prompts based on ID
  const getModulePrompts = (moduleId: number): { conceptPrompt: string, applicationPrompt: string } => {
    // Default prompts
    let conceptPrompt = "Create a concise educational paragraph (max 150 words) about this early childhood education topic. Include a practical tip.";
    let applicationPrompt = "Provide 3 practical techniques (max 150 words total) that early childhood educators can implement immediately. Each technique should be 1-2 sentences and very actionable.";
    
    switch(moduleId) {
      // Positive Attitude module
      case 18:
        conceptPrompt = `Create a concise educational paragraph (max 150 words) about maintaining a positive attitude in early childhood education. Focus on how a teacher's positive attitude impacts children's learning and emotional development. Use a warm, encouraging tone and include one practical tip.`;
        applicationPrompt = `Provide 3 practical techniques (max 150 words total) for early childhood educators to maintain a positive attitude during challenging moments in the classroom. Each technique should be 1-2 sentences and very actionable.`;
        break;
      
      // Active Listening with Children
      case 19:
        conceptPrompt = `Create a concise educational paragraph (max 150 words) about active listening with preschool children. Explain why it's important for building trust and emotional safety, and include one practical tip.`;
        applicationPrompt = `Provide 3 practical active listening techniques (max 150 words total) for preschool teachers to use when communicating with young children. Each technique should be 1-2 sentences and very actionable.`;
        break;
      
      // Patience in Practice
      case 20:
        conceptPrompt = `Create a concise educational paragraph (max 150 words) about developing patience in high-stress classroom situations with preschoolers. Focus on the benefits for both teachers and children, and include one practical tip.`;
        applicationPrompt = `Provide 3 practical techniques (max 150 words total) for early childhood educators to maintain patience during challenging moments. Each technique should be 1-2 sentences and very simple to implement.`;
        break;
      
      // Empathy: Walking in Tiny Shoes
      case 21:
        conceptPrompt = `Create a concise educational paragraph (max 150 words) about developing deeper empathy by understanding situations from a child's perspective. Explain why this is crucial for early childhood educators and include one practical tip.`;
        applicationPrompt = `Provide 3 practical empathy-building techniques (max 150 words total) for preschool teachers to better understand children's perspectives. Each technique should be 1-2 sentences and very actionable.`;
        break;
        
      // Creativity as a Core Value
      case 22:
        conceptPrompt = `Create a concise educational paragraph (max 150 words) about nurturing and modeling creativity as a fundamental value in early childhood education. Explain its importance for child development and include one practical tip.`;
        applicationPrompt = `Provide 3 practical techniques (max 150 words total) for early childhood educators to foster creativity in their classroom daily. Each technique should be 1-2 sentences and very actionable.`;
        break;
        
      // Quick Transition Techniques
      case 23:
        conceptPrompt = `Create a concise educational paragraph (max 150 words) about the importance of smooth transitions between classroom activities for preschoolers. Explain why transitions can be challenging and include one practical tip.`;
        applicationPrompt = `Provide 3 effective techniques (max 150 words total) for early childhood educators to smoothly transition young children between classroom activities. Each technique should be 1-2 sentences and very actionable.`;
        break;
        
      // Mindful Morning Greeting
      case 24:
        conceptPrompt = `Create a concise educational paragraph (max 150 words) about starting each day with an intentional, mindful greeting ritual in preschool. Explain how this sets a positive tone for the day and include one practical tip.`;
        applicationPrompt = `Provide 3 different mindful morning greeting rituals (max 150 words total) for preschool teachers to use with their class. Each ritual should be 1-2 sentences and very simple to implement.`;
        break;
        
      // Safety First: 5-Minute Checklist
      case 25:
        conceptPrompt = `Create a concise educational paragraph (max 150 words) about the importance of classroom safety protocols in early childhood education. Focus on why consistent safety checks matter and include one practical tip.`;
        applicationPrompt = `Provide a 3-point safety checklist (max 150 words total) that early childhood educators can quickly use daily. Each checklist item should be 1-2 sentences and cover a different aspect of classroom safety.`;
        break;
    }
    
    return { conceptPrompt, applicationPrompt };
  };

  // Generate content for micro modules using Perplexity
  React.useEffect(() => {
    if (module && module.duration <= 5) { // Only for micro modules (5 min or less)
      setPerplexityContent(prev => ({ ...prev, isLoading: true }));
      
      const { conceptPrompt, applicationPrompt } = getModulePrompts(module.id);
      
      try {
        console.log("Generating lesson content for module:", module.id, module.title);
        
        // Generate core concept content using enhanced apiRequest
        apiRequest('/api/perplexity/generate', {
          method: 'POST',
          data: { prompt: conceptPrompt }
        })
        .then(data => {
          console.log("Core concept response received:", data);
          setPerplexityContent(prev => ({ 
            ...prev, 
            coreConcept: data.content,
            isLoading: false
            // Leave other content intact
          }));
        })
        .catch(err => {
          console.error("Error fetching concept from Perplexity:", err);
          setPerplexityContent(prev => ({ 
            ...prev, 
            coreConcept: "A positive attitude is contagious in the classroom. When teachers approach each day with optimism and enthusiasm, children absorb this energy and feel more secure and motivated to learn. Studies show that positive teacher-child interactions lead to better cognitive and social-emotional outcomes.",
            isLoading: false
          }));
          toast({
            title: "Content Generation Issue",
            description: "We had trouble generating custom content for this lesson. Default content has been loaded.",
            variant: "destructive"
          });
        });
        
        // Generate practical application content using enhanced apiRequest
        apiRequest('/api/perplexity/generate', {
          method: 'POST',
          data: { prompt: applicationPrompt }
        })
        .then(data => {
          console.log("Practical application response received:", data);
          setPerplexityContent(prev => ({ 
            ...prev, 
            practicalApplication: data.content,
            isLoading: false
          }));
        })
        .catch(err => {
          console.error("Error fetching application content from Perplexity:", err);
          setPerplexityContent(prev => ({ 
            ...prev, 
            practicalApplication: "1. Start each day with a personal positive affirmation and share one thing you're excited about with your class.\n\n2. Use the 'pause and breathe' technique when feeling frustrated - take three deep breaths before responding to challenging behavior.\n\n3. Keep a small notebook to jot down positive moments throughout the day, creating a resource of joy to reflect on during difficult times.",
            isLoading: false
          }));
        });
        
        // Generate video resources based on the module topic
        const videoPrompt = `Please provide 3 YouTube video IDs (just the ID, not the full URL) for educational videos about "${module.title || module.category || 'early childhood education'}" that would be helpful for preschool teachers. Focus on high-quality content from reputable educational sources. Format as a simple list of IDs, each on a new line. Example response format: "ckZt33Ymbpg\n4PSRP98mtJY\nHQT6u-tFKZ4"`;
        
        apiRequest('/api/perplexity/generate', {
          method: 'POST',
          data: { prompt: videoPrompt }
        })
        .then(data => {
          console.log("Video resources response received:", data);
          
          // Parse video IDs from the response
          const videoIds = data.content
            .split('\n')
            .map(line => line.trim())
            .filter(id => id && id.length > 0 && id.length <= 20) // Basic validation for video IDs
            .map(id => {
              // Extract just the ID if full URLs were returned
              if (id.includes('youtube.com') || id.includes('youtu.be')) {
                const match = id.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
                return match ? match[1] : null;
              }
              return id;
            })
            .filter(Boolean)
            .slice(0, 3); // Take up to 3 videos
            
          // Format as embed URLs
          const videoUrls = videoIds.map(id => `https://www.youtube.com/embed/${id}`);
          
          console.log("Processed video URLs:", videoUrls);
          
          if (videoUrls.length > 0) {
            setPerplexityContent(prev => ({
              ...prev,
              videoResources: videoUrls
            }));
          } else {
            // If no valid video IDs, use default videos based on module type
            setPerplexityContent(prev => ({
              ...prev,
              videoResources: getDefaultVideosForModule(module.id)
            }));
          }
        })
        .catch(err => {
          console.error("Error fetching video resources from Perplexity:", err);
          // Use default videos based on module type
          setPerplexityContent(prev => ({
            ...prev,
            videoResources: getDefaultVideosForModule(module.id)
          }));
        });
      } catch (error) {
        console.error("Unexpected error in content generation:", error);
        setPerplexityContent(prev => ({ 
          ...prev, 
          coreConcept: "A positive attitude creates a supportive learning environment. Your energy and enthusiasm set the tone for the day and influence how children engage with activities and each other.",
          practicalApplication: "1. Begin each day by greeting each child individually with a smile and using their name.\n\n2. Create a 'gratitude corner' where you and children can share daily moments of appreciation.\n\n3. Use positive language that focuses on what children should do rather than what they shouldn't do.",
          videoResources: getDefaultVideosForModule(module?.id || 0),
          interactiveElement: "<div class='interactive-activity'><h4>Reflect and Respond</h4><p>Think about a recent challenging situation with a child. How might you approach it differently with a more positive mindset?</p><textarea placeholder='Type your reflection here...' rows='3' class='w-full p-2 border rounded-md'></textarea><button class='mt-2 px-4 py-2 bg-primary text-white rounded-md'>Save for later</button></div>",
          quizQuestions: getDefaultQuizQuestions(module.id),
          isLoading: false
        }));
      }
    }
  }, [module]);

  // Simplified content for micro modules - 4 steps including interactive content
  const getStepContent = (step: number): { title: string, content: string } => {
    // Default return in case of missing data
    const defaultContent = { 
      title: "Loading...", 
      content: "Content is being prepared. Please wait a moment." 
    };
    
    // Return default if module is not loaded
    if (!module) {
      return defaultContent;
    }
    
    // Check if we have a micro-module (5 min or less)
    if (module.duration && module.duration <= 5) {
      let stepTitles = ["Quick Introduction", "Core Concept", "Practical Techniques", "Interactive Learning"];
      
      // Customize step titles for certain module types
      if (module.id === 18) { 
        stepTitles[1] = "The Power of Positivity"; 
      } else if (module.id === 19) { 
        stepTitles[1] = "Effective Listening Skills"; 
      } else if (module.id === 20) { 
        stepTitles[1] = "Patience Strategies"; 
      } else if (module.id === 21) { 
        stepTitles[1] = "Understanding Child Perspectives"; 
      } else if (module.id === 22) { 
        stepTitles[1] = "Nurturing Creativity"; 
      } else if (module.id === 23) { 
        stepTitles[1] = "Smooth Transitions"; 
      } else if (module.id === 24) { 
        stepTitles[1] = "Morning Mindfulness"; 
      } else if (module.id === 25) { 
        stepTitles[1] = "Safety Protocol"; 
      }
      
      // Return appropriate content based on step
      switch(step) {
        case 0:
          return {
            title: stepTitles[0],
            content: module?.description || ""
          };
        case 1:
          return {
            title: stepTitles[1],
            content: perplexityContent.isLoading 
              ? "Loading personalized content..." 
              : perplexityContent.coreConcept || "A positive attitude is contagious in the classroom. When teachers approach each day with optimism and enthusiasm, children absorb this energy and feel more secure and motivated to learn. Studies show that positive teacher-child interactions lead to better cognitive and social-emotional outcomes."
          };
        case 2:
          return {
            title: stepTitles[2],
            content: perplexityContent.isLoading 
              ? "Loading personalized content..." 
              : perplexityContent.practicalApplication || "1. Start each day with a personal positive affirmation and share one thing you're excited about with your class.\n\n2. Use the 'pause and breathe' technique when feeling frustrated - take three deep breaths before responding to challenging behavior.\n\n3. Keep a small notebook to jot down positive moments throughout the day, creating a resource of joy to reflect on during difficult times."
          };
        case 3:
          return {
            title: stepTitles[3],
            content: "Complete these activities to check your understanding and solidify your learning."
          };
        default:
          return {
            title: "Error",
            content: "Content not found"
          };
      }
    }
    
    // Default content for non-micro modules or fallback
    const defaultSteps = [
      {
        title: "Quick Introduction",
        content: module?.description || ""
      },
      {
        title: "Core Concept",
        content: "This is where the core concept of the module is presented in a concise, focused way."
      },
      {
        title: "Practical Application",
        content: "A brief, actionable takeaway that can be immediately applied in your classroom."
      }
    ];
    
    return defaultSteps[step] || defaultSteps[0];
  };
  
  // Only generate steps when module is loaded
  const steps = module ? [0, 1, 2, 3].map(step => getStepContent(step)) : [
    { title: "Loading...", content: "Loading module content..." },
    { title: "Loading...", content: "Loading module content..." },
    { title: "Loading...", content: "Loading module content..." },
    { title: "Loading...", content: "Loading module content..." }
  ];

  // Default key takeaways based on module category
  React.useEffect(() => {
    if (module) {
      switch (module.category) {
        case 'core-values':
          setKeyTakeaways([
            "Embody this value daily in your classroom interactions",
            "Model the behavior you wish to see in children",
            "Reflect on how this value enhances your teaching practice"
          ]);
          break;
        case 'mindful-mornings':
          setKeyTakeaways([
            "Start each day with this practice for best results",
            "Use this technique when children seem stressed or unfocused",
            "Practice this yourself before sharing with your class"
          ]);
          break;
        case 'classroom-management':
          setKeyTakeaways([
            "Implement this strategy consistently for best results",
            "Adjust the approach based on individual children's needs",
            "Use visual cues to reinforce this technique"
          ]);
          break;
        default:
          setKeyTakeaways([
            "Apply this concept in your classroom tomorrow",
            "Share this idea with a colleague for feedback",
            "Reflect on how this impacts your teaching"
          ]);
      }
    }
  }, [module]);

  // Function to generate final assessment questions based on module type
  const getFinalAssessmentQuestions = (moduleId: number) => {
    // Questions for the different module types (3 questions per assessment)
    switch (moduleId) {
      // Active Listening
      case 19:
        return [
          {
            question: "What is the primary goal of active listening?",
            options: [
              "To speak more clearly",
              "To understand and acknowledge the speaker's message and feelings",
              "To respond with your own similar experiences",
              "To solve the speaker's problems"
            ],
            correctAnswer: 1,
            correctExplanation: "Correct! Active listening focuses on truly understanding what the speaker is communicating, both the message and the emotions behind it.",
            incorrectExplanation: "Active listening is primarily about understanding the speaker's message and feelings, not just formulating a response."
          },
          {
            question: "Which technique is NOT part of active listening?",
            options: [
              "Maintaining eye contact",
              "Asking clarifying questions",
              "Interrupting with your own ideas",
              "Paraphrasing what you heard"
            ],
            correctAnswer: 2,
            correctExplanation: "Correct! Interrupting the speaker with your own ideas prevents you from truly hearing their message, which goes against active listening principles.",
            incorrectExplanation: "Interrupting with your own ideas disrupts the speaker and prevents genuine active listening."
          },
          {
            question: "Why is active listening particularly important in early childhood education?",
            options: [
              "It helps children develop their own listening skills",
              "It reduces the need for classroom rules",
              "It prevents children from speaking too much",
              "It makes classroom management easier"
            ],
            correctAnswer: 0,
            correctExplanation: "Correct! When teachers model active listening, children learn to use these skills themselves, improving communication throughout the classroom.",
            incorrectExplanation: "Children learn by example - when teachers demonstrate active listening, children develop these important skills themselves."
          }
        ];
        
      // Self Care for Teachers 
      case 28:
        return [
          {
            question: "Why is self-care particularly important for early childhood educators?",
            options: [
              "It's required by licensing regulations",
              "It helps prevent burnout and compassion fatigue",
              "It improves salary negotiations",
              "It's only needed during difficult times of year"
            ],
            correctAnswer: 1,
            correctExplanation: "Correct! Self-care helps prevent burnout and compassion fatigue, which are common in the emotionally demanding field of early childhood education.",
            incorrectExplanation: "Self-care is essential for early childhood educators to prevent burnout and compassion fatigue, allowing them to be present and effective for their students."
          },
          {
            question: "Which of these is an example of a healthy boundary for teachers?",
            options: [
              "Giving parents your personal cell phone number for 24/7 access",
              "Taking work home every weekend",
              "Setting specific hours for parent communication",
              "Skipping lunch breaks to help students"
            ],
            correctAnswer: 2,
            correctExplanation: "Correct! Setting specific hours for parent communication is a healthy boundary that respects your personal time while still being accessible professionally.",
            incorrectExplanation: "Setting specific hours for parent communication creates a healthy boundary that respects your personal time while maintaining professional availability."
          },
          {
            question: "What is one physical self-care practice that teachers can incorporate daily?",
            options: [
              "Skipping meals to grade papers",
              "Taking brief movement breaks throughout the day",
              "Consuming extra caffeine to stay alert",
              "Postponing restroom breaks until after school"
            ],
            correctAnswer: 1,
            correctExplanation: "Correct! Taking brief movement breaks throughout the day is a practical physical self-care strategy that helps reduce stress and prevent physical strain.",
            incorrectExplanation: "Movement breaks throughout the day are important for physical self-care, helping to reduce stress and prevent physical strain from static positions."
          }
        ];
      
      // Default case for other modules
      default:
        return [
          {
            question: "What teaching approach best supports children's development in early childhood education?",
            options: [
              "Direct instruction only",
              "Free play with no guidance",
              "A balance of play-based learning and intentional teaching",
              "Academic worksheets"
            ],
            correctAnswer: 2,
            correctExplanation: "Correct! Research shows that a balance of play-based learning and intentional teaching best supports children's development.",
            incorrectExplanation: "A balance of play-based learning and intentional teaching is most effective for early childhood development, allowing for both discovery and guidance."
          },
          {
            question: "How does a child-centered classroom benefit learning?",
            options: [
              "It eliminates the need for teacher planning",
              "It focuses exclusively on academic skills",
              "It respects children's interests and promotes engagement",
              "It reduces the importance of social-emotional development"
            ],
            correctAnswer: 2,
            correctExplanation: "Correct! Child-centered classrooms respect children's interests and natural curiosity, which increases engagement and deeper learning.",
            incorrectExplanation: "Child-centered classrooms respect children's interests and promote engagement, making learning more meaningful and effective."
          },
          {
            question: "What is a key principle of developmentally appropriate practice?",
            options: [
              "Treating all children the same regardless of age",
              "Understanding and respecting children's developmental stages",
              "Accelerating academic skills above all else",
              "Focusing primarily on preparing children for standardized tests"
            ],
            correctAnswer: 1,
            correctExplanation: "Correct! Developmentally appropriate practice requires understanding children's developmental stages and tailoring experiences accordingly.",
            incorrectExplanation: "Developmentally appropriate practice means understanding and respecting children's developmental stages and needs."
          }
        ];
    }
  };
  
  const handleCompleteModule = () => {
    // Instead of immediately completing the module, show the final assessment
    setShowFinalAssessment(true);
  };
  
  // Function to handle the final assessment completion
  const handleFinalAssessmentComplete = (score: number) => {
    // If they got at least 2 out of 3 questions right (67%), consider it passed
    const passed = score >= 67;
    setFinalAssessmentPassed(passed);
    
    // Add pointsEarned to the progress update
    const pointsToAdd = MICRO_MODULE_POINTS;
    setPointsEarned(pointsToAdd);
    
    // Always mark as completed, regardless of assessment score
    updateProgressMutation.mutate({ 
      progress: 100, 
      completed: true,
      pointsEarned: pointsToAdd
    }, {
      onSuccess: () => {
        setShowConfetti(true);
        
        // Also update user points directly
        try {
          updateUserPointsMutation.mutate(pointsToAdd, {
            onSuccess: () => {
              toast({
                title: passed ? "🎉 Micro Module Completed!" : "Module Completed",
                description: passed 
                  ? `Great job! You've earned ${pointsToAdd} points for completing this micro module!`
                  : `You've completed this module. Consider reviewing the material again to improve your understanding.`,
                action: (
                  <Button 
                    onClick={() => setLocation('/dashboard')} 
                    variant="outline" 
                    className="mt-2 flex items-center"
                  >
                    <ChevronLeft className="mr-2 h-4 w-4" /> 
                    Back to Dashboard
                  </Button>
                )
              });
            },
            onError: (error) => {
              console.error("Failed to update points:", error);
              toast({
                title: "Module Completed",
                description: "Your progress was saved, but we couldn't update your points. Please try again later.",
                variant: "destructive",
                action: (
                  <Button 
                    onClick={() => setLocation('/dashboard')} 
                    variant="outline" 
                    className="mt-2 flex items-center"
                  >
                    <ChevronLeft className="mr-2 h-4 w-4" /> 
                    Back to Dashboard
                  </Button>
                )
              });
            }
          });
        } catch (error) {
          console.error("Error in updateUserPointsMutation:", error);
          toast({
            title: "Module Completed",
            description: "Your progress was saved, but we couldn't update your points. Please try again later.",
            variant: "destructive",
            action: (
              <Button 
                onClick={() => setLocation('/dashboard')} 
                variant="outline" 
                className="mt-2 flex items-center"
              >
                <ChevronLeft className="mr-2 h-4 w-4" /> 
                Back to Dashboard
              </Button>
            )
          });
        }
      }
    });
  };

  const handleNextStep = () => {
    if (completedStep < steps.length - 1) {
      // Increment the step first
      const newStep = completedStep + 1;
      setCompletedStep(newStep);
      
      // Calculate progress percentage - ensure it's exactly 100% on last step
      let progressValue;
      if (newStep >= steps.length - 1) {
        progressValue = 100; // Set to exactly 100% on last step
      } else {
        // Use ceiling instead of floor to avoid showing less than 100% on completion
        progressValue = Math.ceil((newStep / (steps.length - 1)) * 100);
        // Cap at 99% until final step to ensure 100% only shown when fully completed
        progressValue = Math.min(progressValue, 99);
      }
      
      console.log("Updating progress:", { 
        step: newStep, 
        totalSteps: steps.length, 
        progressValue, 
        moduleId 
      });
      
      // Safeguard check for moduleId
      if (!moduleId || isNaN(moduleId)) {
        console.error("Invalid moduleId:", moduleId);
        toast({
          title: "Error Starting Lesson",
          description: "There was a problem identifying this lesson. Please go back and try again.",
          variant: "destructive"
        });
        return;
      }
      
      // Wrap the mutation in a try-catch to prevent any unhandled errors
      try {
        updateProgressMutation.mutate({ 
          progress: progressValue, 
          completed: progressValue === 100
        }, {
          onSuccess: (data) => {
            console.log("Progress update successful:", data);
          },
          onError: (error) => {
            console.error("Error updating progress:", error);
            // Revert the step if progress update fails
            setCompletedStep(completedStep);
            
            toast({
              title: "Progress Update Failed",
              description: "We couldn't save your progress. Please try again.",
              variant: "destructive"
            });
          }
        });
      } catch (error) {
        console.error("Error in handleNextStep:", error);
        // Revert the step if there's an error
        setCompletedStep(completedStep);
        
        toast({
          title: "Progress Update Failed",
          description: "An unexpected error occurred. Please try again.",
          variant: "destructive"
        });
      }
    } else {
      handleCompleteModule();
    }
  };
  
  if (isLoadingModule || isLoadingProgress) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <p className="mt-4 text-muted-foreground">Loading micro module...</p>
      </div>
    );
  }

  if (!module) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <p className="text-xl font-semibold">Module not found</p>
        <Button onClick={() => setLocation('/modules')} variant="outline" className="mt-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Modules
        </Button>
      </div>
    );
  }

  const currentProgress = progress?.progress || 0;
  const isCompleted = progress?.completed || false;

  return (
    <div className="container py-6">
      {showConfetti && (
        <CelebrationOverlay 
          pointsEarned={pointsEarned} 
          onClose={() => setShowConfetti(false)} 
        />
      )}
      
      {/* Points Tracking Header */}
      <div className="bg-gradient-to-r from-green-50 to-amber-50 p-4 rounded-lg mb-4 shadow-sm border border-amber-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="bg-white p-2 rounded-full shadow-sm">
              <Award className="h-6 w-6 text-amber-500" />
            </div>
            <div className="ml-3">
              <h2 className="font-bold text-lg">Points System</h2>
              <p className="text-sm text-muted-foreground">1 point per minute = fair rewards for all modules</p>
            </div>
          </div>
          
          <div className="flex items-center bg-white px-4 py-2 rounded-full shadow-sm">
            <Coins className="h-5 w-5 text-amber-500 mr-2" />
            <div>
              <span className="font-bold text-lg">{user?.points || 0}</span>
              <span className="text-muted-foreground ml-1">points total</span>
            </div>
            {pointsEarned > 0 && (
              <div className="ml-2 bg-green-100 px-2 py-1 rounded-full text-green-700 text-xs font-semibold animate-pulse">
                +{pointsEarned} earned
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="flex items-center mb-6">
        <Button onClick={() => setLocation('/modules')} variant="outline" className="mr-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Modules
        </Button>
        <h1 className="text-2xl font-bold">{module?.title || 'Loading module...'}</h1>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <Clock className="h-5 w-5 mr-2 text-rose-500" />
                  <CardTitle className="text-xl">
                    {steps[completedStep]?.title || "Learning Content"}
                  </CardTitle>
                </div>
                <span className="bg-rose-100 text-rose-800 text-xs font-medium px-2.5 py-1 rounded-full">
                  {module?.duration || '5'} min
                </span>
              </div>
              <CardDescription>
                {module?.category ? module.category.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') : 'Loading category'} • {module?.difficulty ? module.difficulty.charAt(0).toUpperCase() + module.difficulty.slice(1) : 'Beginner'}
              </CardDescription>
            </CardHeader>
            <CardContent className="py-4">
              <div className="mb-6">
                <Progress value={currentProgress} className="h-2" />
                <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                  <span>Progress</span>
                  <span>{currentProgress}%</span>
                </div>
              </div>
              
              {completedStep === 3 ? (
                // Interactive Step - Games, Videos, and Quiz
                <div className="space-y-6">
                  <div className="text-lg mb-6">
                    {steps[completedStep]?.content || "Loading content..."}
                  </div>
                  
                  {perplexityContent.quizQuestions && perplexityContent.quizQuestions.length > 0 && (
                    <InteractiveQuiz 
                      questions={perplexityContent.quizQuestions}
                      onComplete={(score) => {
                        // Add extra points for perfect score
                        if (score === perplexityContent.quizQuestions.length) {
                          setPointsEarned(prev => prev + 5);
                        }
                      }}
                    />
                  )}
                  
                  <MemoryMatchGame 
                    title="Match Concepts & Responses"
                    moduleName={module?.title || ''}
                    onComplete={() => {
                      // Trigger confetti when the memory game is completed
                      setShowConfetti(true);
                      setTimeout(() => setShowConfetti(false), 3000);
                    }}
                  />
                  
                  {perplexityContent.videoResources && perplexityContent.videoResources.length > 0 && (
                    <VideoResources
                      videoUrls={perplexityContent.videoResources}
                      moduleName={module?.title || 'Learning Resources'}
                    />
                  )}
                  
                  <div className="flex justify-center mt-8">
                    <Button 
                      onClick={() => setLocation('/dashboard')} 
                      variant="default" 
                      size="lg"
                      className="flex items-center"
                    >
                      <ChevronLeft className="mr-2 h-5 w-5" /> 
                      Back to Dashboard
                    </Button>
                  </div>
                </div>
              ) : (
                // Regular text content for steps 0-2
                <div className="text-lg mb-6">
                  {steps[completedStep]?.content || "Loading content..."}
                </div>
              )}
              
              {completedStep === 3 && keyTakeaways.length > 0 && (
                <Card className="bg-green-50 border-green-200 mb-6">
                  <CardHeader className="py-3">
                    <CardTitle className="text-lg flex items-center">
                      <Star className="h-5 w-5 text-amber-500 mr-2" />
                      Key Takeaways
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {keyTakeaways.map((takeaway, index) => (
                        <li key={index} className="flex items-start">
                          <Check className="h-5 w-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                          <span>{takeaway}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </CardContent>
            <CardFooter className="pt-0 flex justify-between">
              {isCompleted ? (
                <Button className="w-full" disabled>
                  <Check className="mr-2 h-4 w-4" />
                  Completed
                </Button>
              ) : (
                <Button 
                  className="w-full" 
                  onClick={handleNextStep}
                  disabled={updateProgressMutation.isPending}
                >
                  {completedStep < steps.length - 1 ? (
                    <>Next Step</>
                  ) : (
                    <>
                      <Trophy className="mr-2 h-4 w-4" />
                      Complete Module
                    </>
                  )}
                </Button>
              )}
            </CardFooter>
          </Card>
        </div>
        
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <Zap className="h-5 w-5 text-yellow-500 mr-2" />
                Quick Info
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium mb-1">Time Required</h3>
                  <p className="text-sm text-muted-foreground">
                    Just {module.duration} minutes - perfect for a busy day!
                  </p>
                </div>
                
                <div>
                  <h3 className="font-medium mb-1">Why This Matters</h3>
                  <p className="text-sm text-muted-foreground">
                    This micro module focuses on an essential skill that can immediately improve your classroom experience.
                  </p>
                </div>
                
                <div>
                  <h3 className="font-medium mb-1">Best For</h3>
                  <p className="text-sm text-muted-foreground">
                    Teachers looking to quickly refresh their knowledge or learn a focused concept during breaks.
                  </p>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full" onClick={() => setLocation('/modules')}>
                <Heart className="mr-2 h-4 w-4 text-red-500" />
                Browse More Modules
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}