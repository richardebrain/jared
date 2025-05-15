import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { 
  Heart, 
  Star, 
  Eye,
  Smile,
  Wind,
  Calendar, 
  CheckCircle, 
  Briefcase,
  Award, 
  BadgeCheck,
  ThumbsUp 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { 
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import {
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label";

// Define the core values with their details
const coreValues = [
  {
    id: "be-consistent",
    name: "Be Consistent",
    icon: <Star className="h-10 w-10 text-blue-500" />,
    color: "bg-blue-500",
    description: "We provide stable, predictable environments where children can thrive with consistent routines and expectations.",
    examples: [
      "Maintaining the same daily schedule for predictability",
      "Applying classroom rules fairly and consistently",
      "Being reliable with routines and transitions",
      "Following through on what we say we will do"
    ],
    quiz: [
      {
        question: "A child repeatedly tests boundaries by running indoors. What response best demonstrates the 'Be Consistent' value?",
        options: [
          {
            text: "Let it go sometimes when you're tired",
            correct: false
          },
          {
            text: "Remind the child of the walking rule and redirect them every time it happens",
            correct: true
          },
          {
            text: "Punish the child differently each time based on how disruptive it is",
            correct: false
          },
          {
            text: "Ignore it unless another teacher is watching",
            correct: false
          }
        ]
      }
    ]
  },
  {
    id: "be-prepared",
    name: "Be Prepared",
    icon: <Briefcase className="h-10 w-10 text-amber-500" />,
    color: "bg-amber-500",
    description: "We plan effectively and come ready to deliver excellent educational experiences for every child.",
    examples: [
      "Having lesson plans prepared in advance",
      "Setting up the classroom environment before children arrive",
      "Organizing materials for easy access during activities",
      "Anticipating potential challenges and having solutions ready"
    ],
    quiz: [
      {
        question: "Which action best demonstrates the 'Be Prepared' value in the classroom?",
        options: [
          {
            text: "Improvising activities on the spot when children seem bored",
            correct: false
          },
          {
            text: "Having backup activities ready in case planned lessons finish early or don't engage the children",
            correct: true
          },
          {
            text: "Asking another teacher for supplies when you run out during an art project",
            correct: false
          },
          {
            text: "Canceling an outdoor activity when weather doesn't cooperate",
            correct: false
          }
        ]
      }
    ]
  },
  {
    id: "be-committed",
    name: "Be Committed",
    icon: <Award className="h-10 w-10 text-purple-500" />,
    color: "bg-purple-500",
    description: "We demonstrate dedication to each child's growth and development with unwavering commitment.",
    examples: [
      "Seeking professional development to improve teaching skills",
      "Going the extra mile to support struggling children",
      "Maintaining enthusiasm and energy throughout the day",
      "Following through on individual learning goals for each child"
    ],
    quiz: [
      {
        question: "What action best demonstrates the 'Be Committed' value in early childhood education?",
        options: [
          {
            text: "Only focusing on the children who show the most potential",
            correct: false
          },
          {
            text: "Attending only mandatory training sessions",
            correct: false
          },
          {
            text: "Consistently tracking each child's progress and adjusting your approach to meet their unique needs",
            correct: true
          },
          {
            text: "Leaving precisely when your shift ends regardless of what's happening",
            correct: false
          }
        ]
      }
    ]
  },
  {
    id: "be-positive",
    name: "Be Positive",
    icon: <ThumbsUp className="h-10 w-10 text-green-500" />,
    color: "bg-green-500",
    description: "We maintain an optimistic attitude that inspires and encourages children.",
    examples: [
      "Using encouraging language and positive reinforcement",
      "Modeling optimistic problem-solving",
      "Celebrating efforts and accomplishments",
      "Finding teaching moments in mistakes"
    ],
    quiz: [
      {
        question: "How can you maintain a positive attitude during challenging days in the classroom?",
        options: [
          {
            text: "Focus on what's going wrong to fix the problems",
            correct: false
          },
          {
            text: "Take frequent breaks away from the children",
            correct: false
          },
          {
            text: "Look for small victories and practice gratitude for positive moments",
            correct: true
          },
          {
            text: "Just push through until the day ends",
            correct: false
          }
        ]
      }
    ]
  },
  {
    id: "be-caring",
    name: "Be Caring",
    icon: <Heart className="h-10 w-10 text-red-500" />,
    color: "bg-red-500",
    description: "We show genuine compassion and empathy for every child in our care.",
    examples: [
      "Taking time to listen to children's concerns and worries",
      "Offering comfort when children are upset or hurt",
      "Building relationships with every child in the classroom",
      "Showing patience and understanding with challenging behaviors"
    ],
    quiz: [
      {
        question: "A child in your class is crying because they miss their parent. Which response best demonstrates the 'Be Caring' value?",
        options: [
          {
            text: "Tell them to stop crying because their parent will be back soon",
            correct: false
          },
          {
            text: "Ignore the behavior so they learn independence",
            correct: false
          },
          {
            text: "Acknowledge their feelings, comfort them, and gently redirect to an engaging activity",
            correct: true
          },
          {
            text: "Call the parent immediately to come pick them up",
            correct: false
          }
        ]
      }
    ]
  }
];

// For auditory learners - rhymes for core values
const coreValueRhymes = {
  committed: `
    Committed to children every day,
    In our classroom, that's how we stay.
    Early to arrive, last to leave,
    The best for our students, that's what we believe.
  `,
  consistent: `
    Consistent and steady, that's our way,
    Same loving guidance, day by day.
    Routines that children can trust,
    For healthy development, it's a must.
  `,
  caring: `
    Caring hearts and gentle hands,
    Helping children understand.
    Comfort, kindness, and a smile,
    Make learning worthwhile!
  `,
  positive: `
    Positive thoughts, positive minds,
    In our classroom, you will find.
    Challenges faced with a hopeful view,
    Teaching children this value too!
  `,
  prepared: `
    Prepared for learning, prepared for fun,
    Ready for anything under the sun.
    Materials arranged, plans in place,
    We tackle each day with skill and grace!
  `
};

// Visual learning style highlights
const VisualHighlight = ({ children }: { children: React.ReactNode }) => (
  <span className="font-bold text-lg text-primary">{children}</span>
);

export function CoreValuesTraining() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentValueIndex, setCurrentValueIndex] = useState(0);
  const [quizStarted, setQuizStarted] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({});
  const [quizCompleted, setQuizCompleted] = useState(false);
  
  // Define the learner's style based on user preference or default to visual
  const learningStyle = user?.learningStyle?.preferred || "visual";
  
  const currentValue = coreValues[currentValueIndex];
  const quizQuestions = coreValues.flatMap(value => value.quiz);
  
  // Function to check quiz answers
  const checkAnswers = () => {
    let correctCount = 0;
    quizQuestions.forEach((question, index) => {
      const selectedAnswer = quizAnswers[`question-${index}`];
      const correctOption = question.options.find(opt => opt.correct);
      if (selectedAnswer === correctOption?.text) {
        correctCount++;
      }
    });
    
    const score = Math.round((correctCount / quizQuestions.length) * 100);
    setQuizCompleted(true);
    
    // Award points for completing the training
    if (user) {
      // Award 20 points for completing the core values training
      const pointsEarned = 20;
      addPoints(pointsEarned);
      
      toast({
        title: `Training Completed!`,
        description: `You scored ${score}% and earned ${pointsEarned} XP!`,
      });
    }
  };
  
  // Navigate between values
  const goToNextValue = () => {
    if (currentValueIndex < coreValues.length - 1) {
      setCurrentValueIndex(currentValueIndex + 1);
    } else {
      // When all values are reviewed, offer the quiz
      setQuizStarted(true);
    }
  };
  
  const goToPreviousValue = () => {
    if (currentValueIndex > 0) {
      setCurrentValueIndex(currentValueIndex - 1);
    }
  };
  
  // Add points mutation
  const { mutate: addPoints } = useMutation({
    mutationFn: async (points: number) => {
      const response = await apiRequest("POST", "/api/users/add-points", { points });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to award points: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Render content based on learning style
  const renderValueContent = (value: typeof coreValues[0]) => {
    if (learningStyle === "auditory") {
      // Auditory style - focus on rhymes and spoken content
      return (
        <div className="space-y-6">
          <div className="text-center">
            <div className={cn("w-20 h-20 mx-auto rounded-full flex items-center justify-center", value.color)}>
              {value.icon}
            </div>
            <h3 className="text-2xl font-bold mt-3">{value.name}</h3>
          </div>
          
          <div className="bg-blue-50 p-5 rounded-lg border border-blue-100">
            <h4 className="font-medium mb-2 flex items-center">
              <span className="mr-2">🎵</span> Core Value Rhyme:
            </h4>
            <p className="italic text-center p-4 text-blue-800 font-medium whitespace-pre-line">
              {coreValueRhymes[value.id as keyof typeof coreValueRhymes]}
            </p>
            <p className="text-sm text-blue-700 mt-2">Try tapping a beat while reading this rhyme aloud!</p>
          </div>
          
          <div>
            <h4 className="font-medium mb-2">What it means:</h4>
            <p>{value.description}</p>
          </div>
          
          <div>
            <h4 className="font-medium mb-2">Examples in action:</h4>
            <ul className="space-y-2">
              {value.examples.map((example, i) => (
                <li key={i} className="flex items-start">
                  <BadgeCheck className="h-5 w-5 mr-2 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>{example}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      );
    } else if (learningStyle === "visual") {
      // Visual style - focus on visual elements, icons, and highlighted text
      return (
        <div className="space-y-6">
          <div className="text-center">
            <div className={cn("w-20 h-20 mx-auto rounded-full flex items-center justify-center", value.color)}>
              {value.icon}
            </div>
            <h3 className="text-2xl font-bold mt-3">{value.name}</h3>
          </div>
          
          <div>
            <h4 className="font-medium mb-2">What it means:</h4>
            <p className="text-lg">
              {value.description.split(' ').map((word, i) => 
                i % 5 === 0 ? <VisualHighlight key={i}>{word} </VisualHighlight> : word + ' '
              )}
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            {value.examples.map((example, i) => (
              <div key={i} className={`p-4 rounded-lg border-2 ${i % 2 === 0 ? 'border-blue-300 bg-blue-50' : 'border-green-300 bg-green-50'}`}>
                <div className="flex justify-center mb-2">
                  {i % 4 === 0 && <Star className="h-6 w-6 text-yellow-500" />}
                  {i % 4 === 1 && <Heart className="h-6 w-6 text-red-500" />}
                  {i % 4 === 2 && <CheckCircle className="h-6 w-6 text-green-500" />}
                  {i % 4 === 3 && <Award className="h-6 w-6 text-purple-500" />}
                </div>
                <p className="text-center font-medium">{example}</p>
              </div>
            ))}
          </div>
        </div>
      );
    } else {
      // Default style - balanced approach
      return (
        <div className="space-y-6">
          <div className="text-center">
            <div className={cn("w-20 h-20 mx-auto rounded-full flex items-center justify-center", value.color)}>
              {value.icon}
            </div>
            <h3 className="text-2xl font-bold mt-3">{value.name}</h3>
          </div>
          
          <div>
            <h4 className="font-medium mb-2">What it means:</h4>
            <p>{value.description}</p>
          </div>
          
          <div>
            <h4 className="font-medium mb-2">Examples in action:</h4>
            <ul className="space-y-2">
              {value.examples.map((example, i) => (
                <li key={i} className="flex items-start">
                  <BadgeCheck className="h-5 w-5 mr-2 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>{example}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      );
    }
  };
  
  // Quiz section
  const renderQuiz = () => {
    if (quizCompleted) {
      return (
        <div className="text-center space-y-6">
          <div className="w-24 h-24 mx-auto bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="h-12 w-12 text-green-600" />
          </div>
          <h3 className="text-2xl font-bold">Core Values Training Complete!</h3>
          <p>Thank you for completing the Core Values training. Remember to embody these values every day at Raising Arizona Preschool.</p>
          
          <div className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-purple-100">
            <h4 className="font-bold text-lg mb-2">Your Raising Arizona Core Values:</h4>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mt-4">
              {coreValues.map(value => (
                <div key={value.id} className="text-center">
                  <div className={cn("w-12 h-12 mx-auto rounded-full flex items-center justify-center", value.color)}>
                    <div className="text-white text-xl">
                      {value.icon}
                    </div>
                  </div>
                  <p className="font-medium mt-2">{value.name}</p>
                </div>
              ))}
            </div>
          </div>
          
          <Button onClick={() => window.location.href = "/dashboard"} className="mt-4">
            Return to Dashboard
          </Button>
        </div>
      );
    }
    
    return (
      <div className="space-y-6">
        <div className="text-center mb-8">
          <h3 className="text-2xl font-bold">Core Values Assessment</h3>
          <p className="text-neutral-600">Test your understanding of our five core values.</p>
        </div>
        
        <div className="space-y-8">
          {quizQuestions.map((question, index) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle className="text-lg">Question {index + 1}</CardTitle>
                <CardDescription>{question.question}</CardDescription>
              </CardHeader>
              <CardContent>
                <RadioGroup 
                  value={quizAnswers[`question-${index}`] || ""} 
                  onValueChange={(value) => setQuizAnswers({...quizAnswers, [`question-${index}`]: value})}
                >
                  {question.options.map((option, optIndex) => (
                    <div key={optIndex} className="flex items-center space-x-2 mb-3">
                      <RadioGroupItem value={option.text} id={`q${index}-opt${optIndex}`} />
                      <Label htmlFor={`q${index}-opt${optIndex}`} className="cursor-pointer w-full">
                        {option.text}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </CardContent>
            </Card>
          ))}
        </div>
        
        <div className="flex justify-center mt-8">
          <Button 
            onClick={checkAnswers}
            disabled={Object.keys(quizAnswers).length < quizQuestions.length}
            size="lg"
            className="px-8"
          >
            Submit Assessment
          </Button>
        </div>
      </div>
    );
  };
  
  return (
    <div className="max-w-4xl mx-auto p-6">
      {!quizStarted ? (
        <div className="space-y-6">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-center mb-2">Raising Arizona Core Values</h2>
            <p className="text-center text-neutral-600">
              Our five core values guide everything we do at Raising Arizona Preschool.
            </p>
            
            <div className="mt-6 flex justify-center">
              <div className="bg-neutral-100 p-2 rounded-full flex">
                {coreValues.map((value, index) => (
                  <Badge 
                    key={value.id}
                    variant={currentValueIndex === index ? "default" : "outline"}
                    className="mx-1 cursor-pointer"
                    onClick={() => setCurrentValueIndex(index)}
                  >
                    {value.name}
                  </Badge>
                ))}
              </div>
            </div>
            
            <div className="mt-2">
              <Progress value={((currentValueIndex + 1) / coreValues.length) * 100} className="h-2" />
            </div>
          </div>
          
          <Card className="border-2 border-primary/20">
            <CardContent className="pt-6">
              {renderValueContent(currentValue)}
            </CardContent>
            <CardFooter className="flex justify-between border-t p-4">
              <Button 
                variant="outline" 
                onClick={goToPreviousValue}
                disabled={currentValueIndex === 0}
              >
                Previous
              </Button>
              <Button onClick={goToNextValue}>
                {currentValueIndex < coreValues.length - 1 ? "Next Value" : "Take Quiz"}
              </Button>
            </CardFooter>
          </Card>
          
          {/* Examples in practice - carousel */}
          <div className="mt-8">
            <h3 className="text-xl font-bold mb-4">Examples in Practice</h3>
            <Carousel className="w-full">
              <CarouselContent>
                {currentValue.examples.map((example, i) => (
                  <CarouselItem key={i} className="md:basis-1/2 lg:basis-1/3">
                    <div className="p-4">
                      <Card>
                        <CardContent className="flex flex-col items-center justify-center p-6">
                          <div className={cn("w-12 h-12 rounded-full flex items-center justify-center mb-4", currentValue.color)}>
                            {currentValue.icon}
                          </div>
                          <p className="text-center">{example}</p>
                        </CardContent>
                      </Card>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious />
              <CarouselNext />
            </Carousel>
          </div>
        </div>
      ) : (
        renderQuiz()
      )}
    </div>
  );
}