import { useState } from "react";
import { useLocation } from "wouter";
import { ModernModuleViewer } from "@/components/ModernModuleViewer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Play, BookOpen, Award, Star, Trophy, Zap, Users, Clock, Target } from "lucide-react";
import Header from "@/components/Header";
import { motion } from "framer-motion";

// Sample module data with complete flow
const sampleModule = {
  id: 999,
  title: "Effective Classroom Transitions",
  description: "Master the art of smooth transitions between activities to maximize learning time and minimize disruptions.",
  duration: 25,
  category: "classroom-management",
  difficulty: "intermediate",
  content: JSON.stringify([
    {
      id: "intro",
      type: "text",
      title: "Understanding Classroom Transitions",
      duration: 3,
      content: `Classroom transitions are the bridge between activities that can make or break your daily flow. Research shows that effective transitions can save up to 20 minutes of instructional time per day.

In this module, you'll learn evidence-based strategies for creating smooth, purposeful transitions that keep children engaged and learning continues seamlessly.

Key benefits you'll gain:
• Reduced behavioral challenges during transition times
• Increased instructional time
• Better classroom atmosphere
• Improved student independence

Let's begin by understanding what makes transitions successful and how to implement them in your classroom.`,
      required: true
    },
    {
      id: "story",
      type: "story", 
      title: "Maria's Transition Challenge",
      duration: 4,
      content: `Maria had been teaching for three years, but transitions were still her biggest challenge. Every time she announced "clean-up time," chaos ensued. Children would run around, materials would be left scattered, and it took 10 minutes to get everyone settled for the next activity.

One morning, Maria watched as her colleague Ms. Jennifer effortlessly transitioned her class from centers to circle time. The children moved calmly, cleaned up thoroughly, and were ready to learn in just 3 minutes.

"What's your secret?" Maria asked during lunch.

Ms. Jennifer smiled. "It's all about clear expectations, consistent routines, and making transitions part of the learning experience rather than a break from it."

That afternoon, Maria implemented her first transition strategy: the "Transition Song." She chose a familiar tune and created lyrics about cleaning up and moving to the next activity. To her amazement, the children began singing along and following the routine naturally.

By the end of the week, Maria's transitions had transformed from chaotic interruptions into smooth, purposeful moments that actually enhanced the learning environment.`,
      required: true
    },
    {
      id: "flashcards",
      type: "flashcard",
      title: "Key Transition Terms",
      duration: 5,
      flashcards: [
        {
          term: "Transition Cue",
          definition: "A consistent signal (visual, auditory, or verbal) that alerts children to prepare for a change in activity or routine."
        },
        {
          term: "Transition Time",
          definition: "The period between the end of one activity and the full engagement in the next activity."
        },
        {
          term: "Clean-up Routine",
          definition: "A systematic approach to organizing materials and preparing the environment for the next activity."
        },
        {
          term: "Transition Song",
          definition: "A musical cue that provides rhythm and structure to help children move smoothly between activities."
        },
        {
          term: "Wait Time Strategy",
          definition: "Purposeful activities or routines that engage children who finish transitions early while others complete their tasks."
        },
        {
          term: "Visual Schedule",
          definition: "A pictorial representation of the day's activities that helps children anticipate and prepare for transitions."
        }
      ],
      required: true
    },
    {
      id: "strategies",
      type: "text",
      title: "Evidence-Based Transition Strategies",
      duration: 6,
      content: `Research from early childhood education experts reveals five key strategies that make transitions successful:

**1. Preparation and Warning**
Give children advance notice before transitions. Use timers, countdowns, or verbal warnings like "We have 5 more minutes of center time."

**2. Clear Expectations**
Establish and practice specific steps for each transition. Children should know exactly what to do, where to go, and how to get there.

**3. Consistent Routines**
Use the same signals, songs, or procedures each time. Consistency builds security and automaticity.

**4. Engagement During Transitions**
Keep children actively involved rather than waiting passively. Use finger plays, songs, or movement activities.

**5. Individual Support**
Recognize that some children need extra time or support. Have strategies ready for children who struggle with changes.

**Implementation Tips:**
• Practice transitions when children are calm and focused
• Start with one transition at a time rather than changing everything at once
• Use positive reinforcement when children follow transition procedures
• Adjust strategies based on your specific classroom needs and children's developmental levels

Remember: Effective transitions are taught, practiced, and refined over time. Be patient with yourself and your students as you develop these new routines.`,
      required: true
    },
    {
      id: "practical",
      type: "text", 
      title: "Practical Implementation Guide",
      duration: 4,
      content: `Now let's put theory into practice with specific transition techniques you can implement immediately:

**Morning Arrival Transition:**
• Create a visual checklist: hang up backpack, wash hands, find name tag, choose first activity
• Use a greeting song that includes each child's name
• Designate transition helpers to assist newcomers

**Activity-to-Activity Transitions:**
• Use a transition basket with small manipulatives for early finishers
• Implement the "Magic Five" - five specific steps for cleaning up any area
• Create movement transitions: "Walk like a butterfly to the reading corner"

**Cleanup Transitions:**
• Assign specific cleanup jobs to different children
• Use cleanup music with clear start and stop points
• Make it a game: "Can you put away all the red blocks before the song ends?"

**End-of-Day Transitions:**
• Reflect on the day with a closing circle
• Use a goodbye song that reinforces positive experiences
• Create a visual checklist for gathering belongings

**Special Situations:**
• Outdoor to indoor: Use a transitional activity like removing shoes together
• Before meals: Establish hand-washing routines and seating procedures
• Naptime: Create calming rituals with soft music and dimmed lights

Start with one transition type and gradually expand your repertoire as children master each routine.`,
      required: true
    },
    {
      id: "quiz",
      type: "quiz",
      title: "Transition Mastery Assessment",
      duration: 3,
      questions: [
        {
          question: "What is the most effective way to signal the beginning of a transition?",
          answers: [
            "Raise your voice to get attention",
            "Use a consistent visual or auditory cue",
            "Turn off the lights repeatedly", 
            "Clap your hands loudly"
          ],
          correctAnswer: 1,
          explanation: "Consistent cues help children anticipate and prepare for transitions, creating a sense of security and routine."
        },
        {
          question: "How much instructional time can effective transitions save per day?",
          answers: [
            "5 minutes",
            "10 minutes", 
            "Up to 20 minutes",
            "30 minutes"
          ],
          correctAnswer: 2,
          explanation: "Research shows that smooth transitions can save up to 20 minutes of instructional time daily by reducing disruptions and wait time."
        },
        {
          question: "What should you do for children who finish transitions early?",
          answers: [
            "Have them wait quietly",
            "Send them to help other children",
            "Provide purposeful engagement activities",
            "Let them choose any activity"
          ],
          correctAnswer: 2,
          explanation: "Wait time strategies keep early finishers engaged and prevent disruptions while other children complete their transitions."
        },
        {
          question: "When introducing new transition routines, you should:",
          answers: [
            "Change all transitions at once for consistency",
            "Implement one transition at a time",
            "Only practice during difficult times",
            "Expect immediate perfect execution"
          ],
          correctAnswer: 1,
          explanation: "Gradual implementation allows children to master one routine before learning another, reducing confusion and building success."
        },
        {
          question: "The most important element of successful transitions is:",
          answers: [
            "Having enough materials",
            "Children moving quickly",
            "Consistency and clear expectations", 
            "Adult supervision at all times"
          ],
          correctAnswer: 2,
          explanation: "Consistency and clear expectations provide the foundation for all successful transitions, helping children feel secure and confident."
        }
      ],
      required: true
    }
  ])
};

export default function ModuleFlowTest() {
  const [, setLocation] = useLocation();
  const [testStarted, setTestStarted] = useState(false);
  const [moduleCompleted, setModuleCompleted] = useState(false);
  const [finalScore, setFinalScore] = useState<number | null>(null);

  const handleModuleComplete = (result: { passed: boolean; score: number }) => {
    setModuleCompleted(true);
    setFinalScore(result.score);
  };

  if (!testStarted) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-4xl mx-auto p-6">
          <div className="mb-6">
            <Button
              onClick={() => setLocation("/")}
              variant="outline"
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
          </div>

          <Card className="mb-8">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-3xl font-bold text-gray-800">
                    Module Flow Test
                  </CardTitle>
                  <p className="text-gray-600 mt-2">
                    Experience the complete module flow with seamless section progression, 
                    interactive elements, and quiz validation requiring 80% to pass.
                  </p>
                </div>
                <Badge variant="secondary" className="text-lg px-4 py-2">
                  Demo Module
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-xl font-semibold mb-4">Module Features</h3>
                  <ul className="space-y-2 text-gray-700">
                    <li className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-blue-600" />
                      Interactive text sections with narration
                    </li>
                    <li className="flex items-center gap-2">
                      <Play className="h-4 w-4 text-green-600" />
                      Story section with ElevenLabs voice narration
                    </li>
                    <li className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-purple-600" />
                      Flashcard component with audio playback
                    </li>
                    <li className="flex items-center gap-2">
                      <Award className="h-4 w-4 text-orange-600" />
                      Quiz requiring 80% or higher to pass
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-4">Flow Requirements</h3>
                  <ul className="space-y-2 text-gray-700">
                    <li>• Sequential section progression</li>
                    <li>• All sections must be completed</li>
                    <li>• Quiz score must be 80% or higher</li>
                    <li>• Failed quiz resets entire module</li>
                    <li>• Audio narration available for text/story sections</li>
                    <li>• Progress tracking throughout</li>
                  </ul>
                </div>
              </div>

              <div className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-semibold text-blue-800 mb-2">
                  Test Module: "Effective Classroom Transitions"
                </h4>
                <p className="text-blue-700 text-sm mb-4">
                  This comprehensive module includes 6 sections covering theory, practical strategies, 
                  key terminology, and a final assessment. Experience how the enhanced module viewer 
                  creates a seamless learning flow with proper validation.
                </p>
                <div className="flex items-center gap-4">
                  <Badge variant="outline">25 minutes</Badge>
                  <Badge variant="outline">6 sections</Badge>
                  <Badge variant="outline">80% pass rate</Badge>
                </div>
              </div>

              <div className="mt-6 flex justify-center">
                <Button
                  onClick={() => setTestStarted(true)}
                  size="lg"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3"
                >
                  <Play className="h-5 w-5 mr-2" />
                  Start Module Test
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (moduleCompleted) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-4xl mx-auto p-6">
          <Card className="text-center">
            <CardContent className="pt-8">
              <Award className="h-16 w-16 text-green-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-green-800 mb-2">
                Module Completed Successfully!
              </h2>
              <p className="text-gray-600 mb-4">
                You've completed the "Effective Classroom Transitions" module with a score of {finalScore}%
              </p>
              
              <div className="flex justify-center gap-4 mt-6">
                <Button
                  onClick={() => {
                    setTestStarted(false);
                    setModuleCompleted(false);
                    setFinalScore(null);
                  }}
                  variant="outline"
                >
                  Test Again
                </Button>
                <Button
                  onClick={() => setLocation("/")}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Return to Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-6xl mx-auto p-6">
        <div className="mb-6">
          <Button
            onClick={() => setTestStarted(false)}
            variant="outline"
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Test Info
          </Button>
        </div>

        <ModernModuleViewer
          moduleId={sampleModule.id}
          onComplete={handleModuleComplete}
        />
      </div>
    </div>
  );
}