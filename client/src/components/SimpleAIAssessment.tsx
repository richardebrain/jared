import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import ConfettiExplosion from 'react-confetti-explosion';
import { Separator } from "@/components/ui/separator";

// Question interface
interface Question {
  id: number;
  text: string;
  domain: string;
  difficulty: number;
  options: { id: string; text: string }[];
  correctAnswer: string;
  explanation: string;
  points: number;
}

// Component props
interface SimpleAIAssessmentProps {
  onComplete?: (score: number, totalPoints: number) => void;
  onCancel?: () => void;
  maxQuestions?: number;
}

// Pre-defined assessment questions
const assessmentQuestions: Question[] = [
  {
    id: 1,
    text: "Which of the following best describes an appropriate developmental expectation for a 3-year-old child?",
    domain: "Child Development",
    difficulty: 1,
    options: [
      { id: "A", text: "Reading simple three-letter words" },
      { id: "B", text: "Speaking in simple sentences and following two-step directions" },
      { id: "C", text: "Writing their first and last name" },
      { id: "D", text: "Tying their own shoes" }
    ],
    correctAnswer: "B",
    explanation: "At 3 years old, children typically speak in simple sentences of 3-4 words and can follow basic two-step directions. Reading words, writing names, and tying shoes are skills that develop later.",
    points: 10
  },
  {
    id: 2,
    text: "Which classroom arrangement best supports both quiet and active play for preschoolers?",
    domain: "Learning Environment",
    difficulty: 1,
    options: [
      { id: "A", text: "Arranging all activities around the perimeter of the room" },
      { id: "B", text: "Creating one large open space in the center for all activities" },
      { id: "C", text: "Dividing the room into well-defined interest centers with both noisy and quiet areas" },
      { id: "D", text: "Keeping all materials in cabinets until needed for specific activities" }
    ],
    correctAnswer: "C",
    explanation: "Dividing the classroom into well-defined interest centers allows for separation of noisy and quiet activities. This arrangement helps children understand behavior expectations in different areas and supports various types of play simultaneously.",
    points: 10
  },
  {
    id: 3,
    text: "What is the primary purpose of the 'Zone of Proximal Development' in early childhood education?",
    domain: "Educational Theory",
    difficulty: 2,
    options: [
      { id: "A", text: "To ensure children are always comfortable with learning activities" },
      { id: "B", text: "To identify the gap between what a child can do independently and what they can do with support" },
      { id: "C", text: "To group children with exactly the same abilities together" },
      { id: "D", text: "To keep children in their preferred learning areas" }
    ],
    correctAnswer: "B",
    explanation: "The Zone of Proximal Development (ZPD), a concept developed by Vygotsky, refers to the range of tasks that a child can perform with the guidance and assistance of adults or more skilled peers, but cannot yet accomplish independently. This concept is fundamental for scaffolding instruction.",
    points: 15
  },
  {
    id: 4,
    text: "Which approach is most appropriate when a preschooler is having difficulty sharing toys?",
    domain: "Social-Emotional Development",
    difficulty: 1,
    options: [
      { id: "A", text: "Immediately remove the toy and give it to another child" },
      { id: "B", text: "Ignore the behavior to avoid reinforcing it" },
      { id: "C", text: "Model sharing language and coach the child through the interaction" },
      { id: "D", text: "Tell the child they cannot play with any toys for the rest of the day" }
    ],
    correctAnswer: "C",
    explanation: "Modeling and coaching children through difficult social interactions helps them develop the language and skills they need to navigate similar situations in the future. This approach supports the development of social-emotional skills while respecting the child's feelings.",
    points: 10
  },
  {
    id: 5,
    text: "What is the primary benefit of incorporating open-ended materials in the preschool classroom?",
    domain: "Curriculum",
    difficulty: 1,
    options: [
      { id: "A", text: "They are usually less expensive than other materials" },
      { id: "B", text: "They encourage creativity, problem-solving, and can be used in multiple ways" },
      { id: "C", text: "They require less teacher supervision" },
      { id: "D", text: "They are easier to clean and maintain" }
    ],
    correctAnswer: "B",
    explanation: "Open-ended materials, such as blocks, clay, and fabric, can be used in countless ways and encourage children to think creatively, solve problems, and express their ideas in unique ways. These materials support divergent thinking and allow for differentiated learning experiences.",
    points: 10
  },
  {
    id: 6,
    text: "According to attachment theory, secure attachment in early childhood is most strongly associated with:",
    domain: "Social-Emotional Development",
    difficulty: 2,
    options: [
      { id: "A", text: "Independence from caregivers at an early age" },
      { id: "B", text: "Consistent, responsive caregiving that meets the child's needs" },
      { id: "C", text: "Strict discipline and clear boundaries" },
      { id: "D", text: "Allowing children to cry it out to build resilience" }
    ],
    correctAnswer: "B",
    explanation: "Secure attachment develops when caregivers consistently respond to a child's needs in sensitive and appropriate ways. This secure base allows children to explore their environment with confidence, knowing their caregiver will be there when needed. Secure attachment is associated with positive social-emotional development and better outcomes later in life.",
    points: 15
  },
  {
    id: 7,
    text: "Which observational assessment method provides the most detailed narrative of a child's behavior over time?",
    domain: "Assessment",
    difficulty: 2,
    options: [
      { id: "A", text: "Checklists" },
      { id: "B", text: "Rating scales" },
      { id: "C", text: "Running records" },
      { id: "D", text: "Time sampling" }
    ],
    correctAnswer: "C",
    explanation: "Running records provide a detailed, sequential account of a child's behavior during a specific time period. This method captures the context, interactions, and exact sequence of events, making it particularly valuable for understanding complex behaviors and interactions. Other methods like checklists and rating scales are more structured but provide less detailed information.",
    points: 15
  },
  {
    id: 8,
    text: "Which of the following is NOT considered a developmentally appropriate practice in early childhood education?",
    domain: "DAP",
    difficulty: 1,
    options: [
      { id: "A", text: "Providing choices within structured activities" },
      { id: "B", text: "Expecting all children of the same age to develop skills at the same rate" },
      { id: "C", text: "Adapting curriculum based on individual children's interests" },
      { id: "D", text: "Incorporating play-based learning opportunities" }
    ],
    correctAnswer: "B",
    explanation: "Developmentally Appropriate Practice recognizes that children develop at different rates, even when they are the same chronological age. Expecting all children to develop skills at the same rate contradicts this foundational principle. DAP emphasizes the importance of responding to individual differences in development and learning.",
    points: 10
  },
  {
    id: 9,
    text: "What is the primary purpose of implementing a project-based approach in early childhood education?",
    domain: "Curriculum",
    difficulty: 3,
    options: [
      { id: "A", text: "To make lesson planning easier for teachers" },
      { id: "B", text: "To ensure all academic standards are covered systematically" },
      { id: "C", text: "To engage children in in-depth investigation of topics of interest over an extended period" },
      { id: "D", text: "To reduce the amount of materials needed in the classroom" }
    ],
    correctAnswer: "C",
    explanation: "The project approach involves children in in-depth investigation of topics that interest them, usually over an extended period. This approach promotes deep learning, encourages children to make connections across content areas, and develops skills in research, collaboration, and communication. Projects typically emerge from children's questions and involve active investigation and representation of findings.",
    points: 20
  },
  {
    id: 10,
    text: "In the context of executive function skills, what is 'inhibitory control'?",
    domain: "Cognitive Development",
    difficulty: 3,
    options: [
      { id: "A", text: "The ability to remember multiple-step instructions" },
      { id: "B", text: "The ability to redirect attention as needed and resist distraction" },
      { id: "C", text: "The ability to adjust behavior based on different rules in different settings" },
      { id: "D", text: "The ability to understand that others have different thoughts and feelings" }
    ],
    correctAnswer: "B",
    explanation: "Inhibitory control is the ability to resist a strong inclination to do one thing and instead do what is most appropriate or needed. This includes resisting distractions, delaying gratification, and stopping an automatic response. It's one of the core executive function skills that develops during early childhood and is crucial for self-regulation and school readiness.",
    points: 20
  }
];

const SimpleAIAssessment: React.FC<SimpleAIAssessmentProps> = ({ 
  onComplete, 
  onCancel,
  maxQuestions = 5
}) => {
  // State variables
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [score, setScore] = useState(0);
  const [totalPoints, setTotalPoints] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isExploding, setIsExploding] = useState(false);

  // Use a subset of questions
  const [questions, setQuestions] = useState<Question[]>([]);

  // Set up the assessment questions
  useEffect(() => {
    // Shuffle the questions and select up to maxQuestions
    const shuffled = [...assessmentQuestions].sort(() => 0.5 - Math.random());
    setQuestions(shuffled.slice(0, maxQuestions));
    
    // Calculate total possible points
    const total = shuffled.slice(0, maxQuestions).reduce((sum, q) => sum + q.points, 0);
    setTotalPoints(total);
  }, [maxQuestions]);

  // Get current question
  const currentQuestion = questions[currentQuestionIndex];

  // Handle option selection
  const handleOptionChange = (optionId: string) => {
    if (!isSubmitted) {
      setSelectedOption(optionId);
    }
  };

  // Handle answer submission
  const handleSubmit = () => {
    if (!selectedOption || isSubmitted) return;

    const isAnswerCorrect = selectedOption === currentQuestion.correctAnswer;
    setIsCorrect(isAnswerCorrect);
    setIsSubmitted(true);

    if (isAnswerCorrect) {
      setScore(prevScore => prevScore + currentQuestion.points);
    }
  };

  // Handle moving to next question
  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prevIndex => prevIndex + 1);
      setSelectedOption(null);
      setIsSubmitted(false);
      setIsCorrect(false);
    } else {
      setIsCompleted(true);
      setIsExploding(true);
      
      // Call onComplete callback if provided
      if (onComplete) {
        onComplete(score, totalPoints);
      }
    }
  };

  // Calculate progress
  const progress = (currentQuestionIndex / questions.length) * 100;

  // Handle cancel
  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
  };

  if (!currentQuestion) {
    return (
      <div className="flex items-center justify-center p-6">
        <Card className="w-full max-w-3xl p-6">
          <h2 className="text-2xl font-bold mb-4">Loading Assessment...</h2>
        </Card>
      </div>
    );
  }

  if (isCompleted) {
    return (
      <div className="flex items-center justify-center p-6">
        <Card className="w-full max-w-3xl p-6 text-center">
          <div className="relative mb-4">
            {isExploding && (
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                <ConfettiExplosion />
              </div>
            )}
            <h2 className="text-3xl font-bold mb-2">Assessment Complete!</h2>
            <p className="text-xl mb-4">
              Your score: {score} out of {totalPoints} points
            </p>
            <p className="text-lg text-green-600 font-semibold mb-6">
              {score === totalPoints 
                ? "Perfect score! Amazing work!" 
                : score >= totalPoints * 0.8 
                  ? "Excellent work! You've shown great understanding!" 
                  : score >= totalPoints * 0.6 
                    ? "Good job! Keep learning and improving." 
                    : "You've completed the assessment. Keep studying to improve your score."}
            </p>
          </div>
          
          <Separator className="my-4" />
          
          <div className="text-left mb-8">
            <h3 className="text-xl font-semibold mb-3">Your Strengths:</h3>
            <ul className="list-disc pl-5 space-y-2">
              <li>Understanding of child development principles</li>
              <li>Knowledge of classroom management techniques</li>
            </ul>
            
            <h3 className="text-xl font-semibold mt-6 mb-3">Areas for Growth:</h3>
            <ul className="list-disc pl-5 space-y-2">
              <li>Advanced theoretical frameworks in ECE</li>
              <li>Assessment methodology for early learning</li>
            </ul>
          </div>
          
          <Button 
            onClick={handleCancel}
            className="w-full"
          >
            Return to Dashboard
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center p-6">
      <Card className="w-full max-w-3xl p-6">
        {/* Assessment Header */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-2xl font-bold">AI Assessment</h2>
            <span className="text-sm text-muted-foreground">
              Question {currentQuestionIndex + 1} of {questions.length}
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
        
        {/* Domain and Point Value */}
        <div className="flex justify-between items-center mb-4">
          <span className="text-sm font-medium bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
            {currentQuestion.domain}
          </span>
          <span className="text-sm font-medium bg-green-100 text-green-800 px-3 py-1 rounded-full">
            {currentQuestion.points} points
          </span>
        </div>
        
        {/* Question */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-4">{currentQuestion.text}</h3>
          
          <RadioGroup value={selectedOption || ""} className="space-y-3">
            {currentQuestion.options.map((option) => (
              <div 
                key={option.id}
                className={`flex items-center space-x-2 p-3 rounded-lg border ${
                  isSubmitted && option.id === currentQuestion.correctAnswer
                    ? 'bg-green-50 border-green-300'
                    : isSubmitted && option.id === selectedOption && option.id !== currentQuestion.correctAnswer
                    ? 'bg-red-50 border-red-300'
                    : 'hover:bg-gray-50'
                }`}
              >
                <RadioGroupItem 
                  value={option.id} 
                  id={`option-${option.id}`} 
                  onClick={() => handleOptionChange(option.id)}
                  disabled={isSubmitted}
                />
                <Label 
                  htmlFor={`option-${option.id}`} 
                  className="flex-1 cursor-pointer"
                >
                  {option.text}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>
        
        {/* Feedback Area */}
        {isSubmitted && (
          <div className={`mb-6 p-4 rounded-lg ${isCorrect ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            <h4 className={`font-bold ${isCorrect ? 'text-green-700' : 'text-red-700'} mb-2`}>
              {isCorrect ? 'Correct!' : 'Not quite right'}
            </h4>
            <p>{currentQuestion.explanation}</p>
          </div>
        )}
        
        {/* Action Buttons */}
        <div className="flex justify-between">
          <Button 
            variant="outline" 
            onClick={handleCancel}
          >
            Cancel
          </Button>
          
          {!isSubmitted ? (
            <Button 
              onClick={handleSubmit}
              disabled={!selectedOption}
            >
              Submit Answer
            </Button>
          ) : (
            <Button onClick={handleNext}>
              {currentQuestionIndex < questions.length - 1 ? 'Next Question' : 'See Results'}
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
};

export default SimpleAIAssessment;