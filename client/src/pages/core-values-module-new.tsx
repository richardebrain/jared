import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { LearningModule as LearningModuleType, UserProgress } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import Header from "@/components/Header";
import { StoryNarration } from "@/components/StoryNarration";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Play, Pause, SkipBack, Volume2 } from "lucide-react";

// Import audio files
import sunriseSongPath from "@assets/Sunrise paints the Glendale sky gold.mp3";
import commitmentRapPath from "@assets/_Commitment's Whistle-Stop Rap (Extended.mp3";

// Define lessons with unique ids
const lessons = [
  {
    id: 1,
    title: "Our CORE Values",
    duration: 5,
    type: "introduction",
  },
  {
    id: 2,
    title: "C - Consistency: Miss Rosa's Story",
    duration: 5,
    type: "story",
    hasAudio: true,
    voiceType: "female",
    voiceName: "Linda",
  },
  {
    id: 3,
    title: "O - Openness: Ms. Elena's Story",
    duration: 5,
    type: "story",
    hasAudio: true,
    voiceType: "female",
    voiceName: "Karen",
  },
  {
    id: 4,
    title: "P - Positive: Craig's Story",
    duration: 5,
    type: "story",
    hasAudio: true,
    voiceType: "male",
    voiceName: "Michael",
  },
  {
    id: 5,
    title: "R - Respect: CORE Values Song",
    duration: 5,
    type: "audio",
    audioPath: sunriseSongPath,
  },
  {
    id: 6,
    title: "E - Excellence: Fill in the Blanks",
    duration: 5,
    type: "interactive",
  },
  {
    id: 7,
    title: "Commitment's Whistle-Stop Rap",
    duration: 5,
    type: "audio",
    audioPath: commitmentRapPath,
  },
];

export default function CoreValuesModuleNew() {
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  
  // Module state
  const [currentLessonId, setCurrentLessonId] = useState(1);
  const [progress, setProgress] = useState(0);
  
  // Audio state
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioCompleted, setAudioCompleted] = useState(false);
  
  // Speech synthesis for story narration
  const [narrationPlaying, setNarrationPlaying] = useState(false);
  const synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
  
  // Exercise state
  const [answers, setAnswers] = useState({
    p1: "",
    p2: "",
    c1: "",
    c2: "",
    c3: ""
  });
  const [exerciseCompleted, setExerciseCompleted] = useState(false);
  
  // Get module data
  const { data: module, isLoading: isModuleLoading } = useQuery<LearningModuleType>({
    queryKey: ['/api/modules', 33],
    queryFn: async () => {
      return await apiRequest('/api/modules/33');
    },
  });
  
  // Get user progress
  const { data: progressData, isLoading: isProgressLoading } = useQuery<UserProgress[]>({
    queryKey: ["/api/progress"],
  });
  
  // Update progress when lessons are completed
  const { mutate: updateProgress, isPending } = useMutation({
    mutationFn: async (data: { moduleId: number; progress: number; completed: boolean }) => {
      return await apiRequest("/api/progress", { method: "POST", data });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/progress"] });
      
      toast({
        title: "Progress updated",
        description: "Your learning progress has been saved.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update progress",
        description: error.message || "There was an error saving your progress.",
        variant: "destructive",
      });
    },
  });
  
  // Initialize user progress from DB
  useEffect(() => {
    if (progressData && module) {
      const moduleProgress = progressData.find(p => p.moduleId === module.id);
      if (moduleProgress) {
        setProgress(moduleProgress.progress);
        
        // If there's progress, set the current lesson
        if (moduleProgress.progress > 0) {
          const lessonsPerProgressPercent = lessons.length / 100;
          const completedLessons = Math.floor(moduleProgress.progress * lessonsPerProgressPercent);
          
          // If all lessons are completed, show the first lesson
          if (completedLessons >= lessons.length) {
            setCurrentLessonId(1);
          } 
          // Otherwise set to the next uncompleted lesson
          else {
            setCurrentLessonId(completedLessons + 1);
          }
        }
      }
    }
  }, [progressData, module]);
  
  // Audio controls
  const togglePlayPause = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    
    setIsPlaying(!isPlaying);
  };
  
  const resetAudio = () => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = 0;
    if (!isPlaying) {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };
  
  // Handle audio ended event
  const handleAudioEnded = () => {
    setIsPlaying(false);
    setAudioCompleted(true);
  };

  // We've removed the old narrateText function as it's been replaced with the StoryNarration component
  
  // Check fill in the blanks answers
  const checkCoreAnswers = () => {
    const correctAnswers = {
      p1: "prepared",
      p2: "positive",
      c1: "caring",
      c2: "committed",
      c3: "consistent"
    };
    
    const allCorrect = 
      answers.p1.toLowerCase().includes(correctAnswers.p1) &&
      answers.p2.toLowerCase().includes(correctAnswers.p2) &&
      answers.c1.toLowerCase().includes(correctAnswers.c1) &&
      answers.c2.toLowerCase().includes(correctAnswers.c2) &&
      answers.c3.toLowerCase().includes(correctAnswers.c3);
    
    if (allCorrect) {
      toast({
        title: "Excellent work!",
        description: "You've correctly identified all the CORE values of Raising Arizona!",
      });
      setExerciseCompleted(true);
    } else {
      toast({
        title: "Try again",
        description: "Some of your answers need correction. Remember our 5 core values!",
        variant: "destructive",
      });
    }
  };
  
  // Continue to next lesson
  const continueToNextLesson = () => {
    if (!module) return;
    
    // Calculate progress percentage based on completed lessons
    const progressIncrement = 100 / lessons.length;
    const newProgress = Math.min(100, progress + progressIncrement);
    
    // Check if this is the last lesson
    const isLastLesson = currentLessonId === lessons.length;
    
    // Update progress in database
    updateProgress({
      moduleId: module.id,
      progress: newProgress,
      completed: isLastLesson,
    });
    
    // If not the last lesson, proceed to next lesson
    if (!isLastLesson) {
      setCurrentLessonId(prev => prev + 1);
      
      // Reset states for next lesson
      setAudioCompleted(false);
      setExerciseCompleted(false);
      
      // Reset audio when lesson changes
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        setIsPlaying(false);
      }

      // Cancel any ongoing narration
      if (narrationPlaying) {
        synth?.cancel();
        setNarrationPlaying(false);
      }
    } else {
      // Navigate to dashboard if module is completed
      toast({
        title: "Congratulations!",
        description: "You've completed the CORE Values module!",
      });
    }
    
    // Update progress state
    setProgress(newProgress);
  };
  
  // Get the current lesson
  const currentLesson = lessons.find(lesson => lesson.id === currentLessonId);
  
  // Is the continue button enabled?
  const canContinue = () => {
    if (!currentLesson) return false;
    
    if (currentLesson.type === 'audio') {
      return audioCompleted;
    } else if (currentLesson.id === 6) { // Fill in the blanks exercise
      return exerciseCompleted;
    }
    
    return true;
  };
  
  // Loading state
  if (isModuleLoading || isProgressLoading) {
    return (
      <div className="container h-screen flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full"></div>
          <p className="text-muted-foreground">Loading module content...</p>
        </div>
      </div>
    );
  }
  
  // Error state
  if (!module) {
    return (
      <div className="container py-8">
        <Button onClick={() => setLocation('/dashboard')} variant="ghost" className="mb-8">
          <i className="ri-arrow-left-line mr-2"></i>
          Back to Dashboard
        </Button>
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold mb-2">Module Not Found</h2>
          <p className="text-muted-foreground mb-6">The requested module could not be loaded.</p>
          <Button onClick={() => setLocation('/dashboard')}>Return to Dashboard</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      
      <main className="container flex-1 py-6">
        <Button 
          onClick={() => setLocation('/dashboard')} 
          variant="ghost" 
          className="mb-6"
        >
          <i className="ri-arrow-left-line mr-2"></i>
          Back to Dashboard
        </Button>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl">{module.title}</CardTitle>
                    <CardDescription>{module.description}</CardDescription>
                  </div>
                  <div className="bg-primary bg-opacity-10 text-primary px-3 py-1 rounded-full text-sm font-medium">
                    {module.difficulty}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="mb-6">
                  <div className="flex justify-between mb-2 text-sm">
                    <span>Your progress</span>
                    <span className="font-semibold">{Math.round(progress)}%</span>
                  </div>
                  <Progress value={progress} />
                </div>
                
                <Tabs defaultValue="content">
                  <TabsList className="w-full mb-4">
                    <TabsTrigger value="content" className="flex-1">Lesson Content</TabsTrigger>
                    <TabsTrigger value="overview" className="flex-1">Module Overview</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="content">
                    {currentLesson && (
                      <div>
                        <div className="bg-card p-4 rounded-lg mb-6">
                          <h3 className="text-xl font-heading font-bold mb-2">
                            {currentLesson.title}
                          </h3>
                          <div className="flex items-center text-sm text-muted-foreground mb-4">
                            <i className="ri-time-line mr-2"></i>
                            <span>{currentLesson.duration} minutes</span>
                            <i className="ri-file-list-line ml-4 mr-2"></i>
                            <span>{currentLesson.type}</span>
                          </div>
                          
                          <div className="mb-8">
                            <h4 className="font-heading font-semibold mb-3">Lesson Content</h4>
                            <div className="lesson-content">
                              {/* Lesson 1: Our CORE Values */}
                              {currentLesson.id === 1 && (
                                <>
                                  <h3 className="text-xl font-semibold mb-4">CORE Values at Raising Arizona</h3>
                                  <p className="mb-4">Our CORE values guide everything we do at Raising Arizona Preschool. These fundamental principles help create a nurturing environment where children and staff can thrive together.</p>
                                  
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                                      <h4 className="font-bold text-blue-700 mb-2">P - Prepared</h4>
                                      <p>We come to work ready with the knowledge, materials, and mindset to create exceptional learning experiences for every child in our care.</p>
                                    </div>
                                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                                      <h4 className="font-bold text-green-700 mb-2">P - Positive</h4>
                                      <p>We maintain an optimistic attitude that creates an uplifting environment where children and colleagues feel valued and inspired.</p>
                                    </div>
                                    <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                                      <h4 className="font-bold text-purple-700 mb-2">C - Caring</h4>
                                      <p>We approach each child with warmth, empathy and genuine concern for their well-being, creating a nurturing foundation for growth.</p>
                                    </div>
                                    <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                                      <h4 className="font-bold text-amber-700 mb-2">C - Committed</h4>
                                      <p>We dedicate ourselves to the success of each child, our team, and the school community with unwavering determination and reliability.</p>
                                    </div>
                                    <div className="bg-rose-50 p-4 rounded-lg border border-rose-200">
                                      <h4 className="font-bold text-rose-700 mb-2">C - Consistent</h4>
                                      <p>We provide dependable routines, expectations, and care that create a secure foundation for children to explore and thrive.</p>
                                    </div>
                                  </div>
                                </>
                              )}
                              
                              {/* Lesson 2: Miss Rosa's Story */}
                              {currentLesson.id === 2 && (
                                <>
                                  <h3 className="text-xl font-semibold mb-3">Consistency: Miss Rosa's Unbroken Circle</h3>
                                  <div className="flex justify-between items-center mb-2">
                                    <p className="text-sm text-gray-500 italic">A story about the power of consistency</p>
                                    <StoryNarration
                                      storyId="rosa-story"
                                      voiceType="female"
                                    />
                                  </div>
                                  <div className="bg-gray-50 p-5 rounded-lg border border-gray-200 mb-6" id="rosa-story">
                                    <p className="italic text-gray-700 mb-4">From the very first morning, Lila clung to the classroom door, eyes wide with worry. Her home was always shifting—new houses, new faces—but here, every sunrise brought Miss Rosa's familiar smile. Each day, Miss Rosa knelt beside Lila, gently brushing a stray curl from her forehead. "You're safe here, Lila," she whispered, "and I'm not going anywhere."</p>
                                    
                                    <p className="italic text-gray-700 mb-4">Miss Rosa wasn't just a teacher—she was a steady presence in each child's life. She learned the exact way Mason folded his favorite blanket at nap time, and she hummed Sophia's favorite tune whenever tears welled up. At snack time, she remembered who loved grapes and who preferred carrots. These small details wove a deep web of trust: the children knew she saw them, truly saw them.</p>
                                    
                                    <p className="italic text-gray-700 mb-4"><span className="font-semibold">The Turning Point:</span><br />
                                    One rainy Tuesday, the classroom buzzed with nervous energy. It was craft day, and every child came with scissors, glue sticks, and construction paper. Lila's hands trembled as she approached the art table—today was "Family Collage," and she had no picture of "family" to share. Her heart pounded; she backed away, tears brimming.</p>
                                    
                                    <p className="italic text-gray-700 mb-4">Miss Rosa noticed immediately. She knelt beside Lila and whispered, "Let's make a different kind of family—the one we've built here." Together, they cut out images of the classroom: the reading nook where Lila curled up each morning; the cubby where her backpack hung; the small table where she ate lunch with friends. In each corner of the collage, Miss Rosa pasted a tiny photo of herself—smiling, waving, reading—all the ways she showed up for Lila every day.</p>
                                    
                                    <p className="italic text-gray-700 mb-4">For three years, Miss Rosa remained Lila's unshakable anchor. She was there when Lila first read a sentence aloud. She was there when Lila lost her first tooth. She was there when Lila's newest foster home didn't work out, and she welcomed Lila back with the same warm smile after a two-week absence.</p>
                                    
                                    <p className="italic text-gray-700 mb-4"><span className="font-semibold">The Lasting Impact:</span><br />
                                    On graduation day, kindergarten-bound children darted about in colorful caps made from construction paper. Lila approached Miss Rosa, clutching a small envelope. Inside was the Family Collage, worn at the edges from being carried and unfolded countless times. Miss Rosa fought back tears.</p>
                                    
                                    <p className="italic text-gray-700 mb-4">"You kept this?" she asked. Lila nodded, pointing to all the little photos of Miss Rosa scattered through her school memories.</p>
                                    
                                    <p className="italic text-gray-700 mb-4">"You were always there," Lila said simply. "Just like you promised."</p>
                                    
                                    <p className="italic text-gray-700">Fifteen years later, Miss Rosa received a college graduation announcement in the mail. Tucked inside was a note from Lila, now grown. "You showed me what consistency meant," she wrote. "I became a teacher because of you."</p>
                                  </div>
                                </>
                              )}
                              
                              {/* Lesson 3: Ms. Elena's Story */}
                              {currentLesson.id === 3 && (
                                <>
                                  <h3 className="text-xl font-semibold mb-3">Openness: Ms. Elena's Whispered Promise</h3>
                                  <div className="flex justify-between items-center mb-2">
                                    <p className="text-sm text-gray-500 italic">A story about commitment in teaching</p>
                                    <StoryNarration
                                      storyId="elena-story"
                                      voiceType="female"
                                    />
                                  </div>
                                  <div className="bg-gray-50 p-5 rounded-lg border border-gray-200 mb-6" id="elena-story">
                                    <p className="italic text-gray-700 mb-4">Tiny footsteps echoed in the cubby-lined hallway as four-year-old Javier approached Ms. Elena. His words tumbled out in a mix of Spanish and English, a jumble of sounds that many teachers might dismiss with a gentle but perplexed smile. But Ms. Elena had made a commitment—every child would be heard, truly heard, in her classroom.</p>
                                    
                                    <p className="italic text-gray-700 mb-4">While other preschool teachers sometimes defaulted to "slow down" or "use your words," Ms. Elena knelt down, her eyes level with Javier's, and listened with her whole self. When his dual-language description finally wound down, she responded in both languages, validating his experience and his heritage simultaneously.</p>
                                    
                                    <p className="italic text-gray-700 mb-4"><span className="font-semibold">Her Secret:</span><br />
                                    Each night, Ms. Elena practiced Spanish vocabulary specific to the next day's activities. She wasn't fluent—far from it—but she was committed. Other teachers watched in quiet amazement as children like Javier, once silent observers, blossomed into classroom leaders.</p>
                                    
                                    <p className="italic text-gray-700 mb-4">She committed not just to the children but to their families too. When Javier's grandmother came to pick him up—her English halting, her nervousness evident—Ms. Elena greeted her with prepared Spanish phrases and a genuine embrace. "Gracias por compartir a Javier con nosotros," she said carefully. Thank you for sharing Javier with us.</p>
                                    
                                    <p className="italic text-gray-700 mb-4">The grandmother's eyes filled with tears. Later, she confided through a translator, "In three years of bringing children to American schools, Ms. Elena is the first teacher who tried to talk to me in my language."</p>
                                    
                                    <p className="italic text-gray-700 mb-4"><span className="font-semibold">The Turning Point:</span><br />
                                    One Monday morning, Javier arrived clutching a handmade book—Spanish words painstakingly transcribed by his grandmother, illustrated in crayon by Javier himself. "It's for you to learn more Spanish," he announced proudly. The classroom fell silent as Ms. Elena carefully accepted the precious gift.</p>
                                    
                                    <p className="italic text-gray-700 mb-4">"I'll practice every word," she promised, a commitment that would require late nights and countless repetitions.</p>
                                    
                                    <p className="italic text-gray-700 mb-4">That afternoon, during circle time, she stunned the children by reading a simple story from Javier's book. Her pronunciation wasn't perfect, but her commitment was. Javier sat taller than he ever had before.</p>
                                    
                                    <p className="italic text-gray-700">Years later, when Javier returned as a high school volunteer to read to her preschoolers, Ms. Elena pulled out that same worn book. "I kept my promise," she said simply. And in that moment, Javier understood what true commitment meant—showing up, trying your hardest, and keeping your word, even when no one expects you to.</p>
                                  </div>
                                </>
                              )}
                              
                              {/* Lesson 4: Craig's Story */}
                              {currentLesson.id === 4 && (
                                <>
                                  <h3 className="text-xl font-semibold mb-3">Positivity: Craig's Transformation Story</h3>
                                  <div className="flex justify-between items-center mb-2">
                                    <p className="text-sm text-gray-500 italic">A story about finding the positive in every child</p>
                                    <StoryNarration
                                      storyId="craig-story"
                                      voiceType="male"
                                    />
                                  </div>
                                  <div className="bg-gray-50 p-5 rounded-lg border border-gray-200 mb-6" id="craig-story">
                                    <p className="mb-4">When Craig first walked into our school-age room, he carried more pain than a five-year-old should ever know. He'd been expelled from preschool after preschool, labeled "too disruptive," "too loud," "too much." Our teachers—exhausted and underpaid—felt they were fighting a losing battle.</p>
                                    
                                    <p className="mb-4">Yet one gray Monday, our team made a promise: we would look for something good in Craig, no matter how small.</p>
                                    
                                    <p className="mb-4"><span className="font-semibold">Day 1:</span> The only thing positive we spotted was his bright red shirt. We smiled and shouted, "Cool shirt, Craig!" A tiny flicker of pride in his eyes.</p>
                                    
                                    <p className="mb-4"><span className="font-semibold">Week 2:</span> He helped a classmate pick up spilled crayons. We cheered his kindness, and Craig's back straightened just a bit.</p>
                                    
                                    <p className="mb-4"><span className="font-semibold">Month 1:</span> During story time, Craig asked to read aloud. His voice shook—but we clapped so loudly his face broke into a grin.</p>
                                    
                                    <p className="mb-4">Every "win" was a victory lap: a calm moment, a helpful gesture, a brave attempt. Some days our list of positives was laughably short—"He shared one block," "He said please," or simply "He put his book away." But we stuck with it, and each tiny spark built momentum.</p>
                                    
                                    <p className="mb-4"><span className="font-semibold">The Day That Changed Everything:</span><br />
                                    During art class, a younger child began to cry. Without hesitation, Craig rose from his seat and knelt beside her. Gently, he offered her his paintbrush and said, "It's okay. We can share." In that instant, the entire room fell silent. Craig had discovered a new way to get attention— not by acting out, but by caring for others.</p>
                                    
                                    <p className="mb-4">He became our unofficial "line leader," proudly guiding friends down the hallway. At circle time, teachers leaned in, watchful: this was the same boy who once barreled into tantrums, now offering tissues to classmates who sniffled.</p>
                                    
                                    <p className="mb-4"><span className="font-semibold">The Pinnacle Moment:</span><br />
                                    A few years later, I received an invitation to Craig's wedding. In that elegant ceremony, he stood tall in a sharp suit—no longer the boy in the red shirt, but a man shaped by kindness and consistency. When I hugged him at the reception, he whispered, "I still remember you cheering for my red shirt." I realized then that our daily commitment—finding good, praising small steps—had rewritten his story forever.</p>
                                    
                                    <p className="italic text-gray-700">Craig's journey taught me that slow, steady encouragement can turn even the toughest beginnings into bright futures. And as Raising Arizona's CORE Values practice continues, we remember that for every Craig out there, the smallest act of belief can become the cornerstone of a lifetime.</p>
                                  </div>
                                </>
                              )}
                              
                              {/* Lesson 5: CORE Values Song */}
                              {currentLesson.id === 5 && (
                                <>
                                  <h3 className="text-xl font-semibold mb-3">Respect: Sunrise Song</h3>
                                  <div className="bg-orange-50 p-4 rounded-lg border border-orange-200 mb-4">
                                    <audio 
                                      ref={audioRef}
                                      src={sunriseSongPath}
                                      onEnded={handleAudioEnded}
                                      className="hidden"
                                    />
                                    
                                    <div className="flex items-center justify-center mb-4">
                                      <Button
                                        onClick={togglePlayPause}
                                        variant="outline"
                                        size="icon"
                                        className="mr-2 h-12 w-12 rounded-full"
                                      >
                                        {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6 ml-1" />}
                                      </Button>
                                      
                                      <Button
                                        onClick={resetAudio}
                                        variant="outline"
                                        size="icon"
                                        className="h-12 w-12 rounded-full"
                                      >
                                        <SkipBack className="h-5 w-5" />
                                      </Button>
                                    </div>
                                    
                                    <p className="text-center text-orange-700 font-medium">Sunrise Paints the Glendale Sky</p>
                                  </div>
                                  
                                  <p className="text-sm text-gray-600 mb-3">Please listen to the full song to continue. This melody captures the spirit of respect we cultivate at Raising Arizona.</p>
                                </>
                              )}
                              
                              {/* Lesson 6: Fill in the Blanks Exercise */}
                              {currentLesson.id === 6 && (
                                <>
                                  <h3 className="text-xl font-semibold mb-4">Excellence: CORE Values Review</h3>
                                  <p className="mb-4">Let's review what we've learned about our CORE values. Fill in the blanks with the correct values:</p>
                                  
                                  <div className="bg-gray-50 p-5 rounded-lg border border-gray-200 mb-6">
                                    <div className="mb-4">
                                      <label className="block text-sm font-medium mb-2">
                                        The "P" values in our CORE values stand for:
                                      </label>
                                      <div className="flex gap-2 mb-2">
                                        <span className="py-2 px-3 bg-gray-100 rounded-md">P = </span>
                                        <input 
                                          type="text" 
                                          value={answers.p1}
                                          onChange={(e) => setAnswers(prev => ({ ...prev, p1: e.target.value }))}
                                          className="flex-1 p-2 border rounded-md" 
                                          placeholder="Enter first P value"
                                        />
                                      </div>
                                      <div className="flex gap-2">
                                        <span className="py-2 px-3 bg-gray-100 rounded-md">P = </span>
                                        <input 
                                          type="text" 
                                          value={answers.p2}
                                          onChange={(e) => setAnswers(prev => ({ ...prev, p2: e.target.value }))}
                                          className="flex-1 p-2 border rounded-md" 
                                          placeholder="Enter second P value"
                                        />
                                      </div>
                                    </div>
                                    
                                    <div className="mb-4">
                                      <label className="block text-sm font-medium mb-2">
                                        The "C" values in our CORE values stand for:
                                      </label>
                                      <div className="flex gap-2 mb-2">
                                        <span className="py-2 px-3 bg-gray-100 rounded-md">C = </span>
                                        <input 
                                          type="text" 
                                          value={answers.c1}
                                          onChange={(e) => setAnswers(prev => ({ ...prev, c1: e.target.value }))}
                                          className="flex-1 p-2 border rounded-md" 
                                          placeholder="Enter first C value"
                                        />
                                      </div>
                                      <div className="flex gap-2 mb-2">
                                        <span className="py-2 px-3 bg-gray-100 rounded-md">C = </span>
                                        <input 
                                          type="text" 
                                          value={answers.c2}
                                          onChange={(e) => setAnswers(prev => ({ ...prev, c2: e.target.value }))}
                                          className="flex-1 p-2 border rounded-md" 
                                          placeholder="Enter second C value"
                                        />
                                      </div>
                                      <div className="flex gap-2">
                                        <span className="py-2 px-3 bg-gray-100 rounded-md">C = </span>
                                        <input 
                                          type="text" 
                                          value={answers.c3}
                                          onChange={(e) => setAnswers(prev => ({ ...prev, c3: e.target.value }))}
                                          className="flex-1 p-2 border rounded-md" 
                                          placeholder="Enter third C value"
                                        />
                                      </div>
                                    </div>
                                    
                                    <Button 
                                      onClick={checkCoreAnswers}
                                      disabled={exerciseCompleted}
                                    >
                                      {exerciseCompleted ? "Completed!" : "Check Answers"}
                                    </Button>
                                  </div>
                                </>
                              )}
                              
                              {/* Lesson 7: Commitment's Whistle-Stop Rap */}
                              {currentLesson.id === 7 && (
                                <>
                                  <h3 className="text-xl font-semibold mb-3">Commitment's Whistle-Stop Rap</h3>
                                  <div className="bg-red-50 p-4 rounded-lg border border-red-200 mb-4">
                                    <audio 
                                      ref={audioRef}
                                      src={commitmentRapPath}
                                      onEnded={handleAudioEnded}
                                      className="hidden"
                                    />
                                    
                                    <div className="flex items-center justify-center mb-4">
                                      <Button
                                        onClick={togglePlayPause}
                                        variant="outline"
                                        size="icon"
                                        className="mr-2 h-12 w-12 rounded-full"
                                      >
                                        {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6 ml-1" />}
                                      </Button>
                                      
                                      <Button
                                        onClick={resetAudio}
                                        variant="outline"
                                        size="icon"
                                        className="h-12 w-12 rounded-full"
                                      >
                                        <SkipBack className="h-5 w-5" />
                                      </Button>
                                    </div>
                                    
                                    <p className="text-center text-red-700 font-medium">Listen to the Commitment's Whistle-Stop Rap!</p>
                                  </div>
                                  
                                  <p className="text-sm text-gray-600 mb-3">Please listen to the full rap before continuing to the final section.</p>
                                </>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex justify-end">
                            <Button 
                              onClick={continueToNextLesson}
                              disabled={!canContinue() || isPending}
                              className="w-full sm:w-auto"
                            >
                              {isPending ? (
                                <>
                                  <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                                  Saving Progress...
                                </>
                              ) : currentLessonId === lessons.length ? (
                                "Complete Module"
                              ) : (
                                "Continue to Next Lesson"
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="overview">
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">About This Module</h3>
                      <p>{module.description}</p>
                      
                      <div className="pt-4">
                        <h3 className="text-lg font-semibold mb-3">Module Lessons</h3>
                        <div className="space-y-2">
                          {lessons.map((lesson, index) => (
                            <div 
                              key={lesson.id}
                              className={`p-3 rounded-lg border ${currentLessonId === lesson.id ? 'border-primary bg-primary/5' : 'border-border'}`}
                            >
                              <div className="flex justify-between items-center">
                                <div>
                                  <span className="font-medium">{index + 1}. {lesson.title}</span>
                                  <div className="text-sm text-muted-foreground flex gap-3 mt-1">
                                    <span>{lesson.duration} min</span>
                                    <span>{lesson.type}</span>
                                  </div>
                                </div>
                                
                                {currentLessonId > lesson.id && (
                                  <div className="h-6 w-6 rounded-full bg-green-100 flex items-center justify-center">
                                    <i className="ri-check-line text-green-600"></i>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
          
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Module Resources</CardTitle>
                <CardDescription>Additional materials to enhance learning</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <a 
                    href="/resources/core-values-poster.html" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="block p-3 border rounded-lg hover:bg-accent transition-colors"
                  >
                    <h4 className="font-medium">CORE Values Poster</h4>
                    <p className="text-sm text-muted-foreground">Printable poster for your classroom</p>
                  </a>
                  
                  <a 
                    href="/resources/guided-reflections.html" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="block p-3 border rounded-lg hover:bg-accent transition-colors"
                  >
                    <h4 className="font-medium">Guided Reflections</h4>
                    <p className="text-sm text-muted-foreground">Questions to deepen understanding</p>
                  </a>
                  
                  <a 
                    href="/resources/implementation-guide.html" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="block p-3 border rounded-lg hover:bg-accent transition-colors"
                  >
                    <h4 className="font-medium">Implementation Guide</h4>
                    <p className="text-sm text-muted-foreground">How to apply CORE values daily</p>
                  </a>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}