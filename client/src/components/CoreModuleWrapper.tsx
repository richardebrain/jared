import { useState, useEffect } from "react";
import CoreSongExercise from "./CoreSongExercise";
import CoreValueDetail from "./CoreValueDetail";
import CoreValueQuiz from "./CoreValueQuiz";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Award, Music, BookOpen, FileQuestion } from "lucide-react";

interface CoreModuleWrapperProps {
  moduleContent: string | null;
  onContinue: () => void;
}

export default function CoreModuleWrapper({ moduleContent, onContinue }: CoreModuleWrapperProps) {
  const [currentStage, setCurrentStage] = useState<"intro" | "song-exercise" | "core-values-detail" | "quiz" | "completed">("intro");
  const [songExerciseCompleted, setSongExerciseCompleted] = useState(false);
  const [coreValuesDetailCompleted, setCoreValuesDetailCompleted] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  
  // Parse module content as HTML, with a fallback if content is null
  const contentHtml = { __html: moduleContent || '<p>Loading module content...</p>' } as { __html: string };
  
  const handleStartSongExercise = () => {
    setCurrentStage("song-exercise");
  };
  
  const handleSongExerciseComplete = (success: boolean) => {
    if (success) {
      setSongExerciseCompleted(true);
    }
  };
  
  const handleReturnFromSongExercise = () => {
    setCurrentStage("intro");
  };
  
  const handleStartCoreValuesDetail = () => {
    setCurrentStage("core-values-detail");
  };
  
  const handleCoreValuesDetailComplete = () => {
    setCoreValuesDetailCompleted(true);
    setCurrentStage("quiz");
  };
  
  const handleQuizComplete = () => {
    setQuizCompleted(true);
    setCurrentStage("completed");
  };
  
  const handleContinue = () => {
    onContinue();
  };
  
  // Calculate overall progress
  const getProgressPercentage = () => {
    if (currentStage === "intro") return 10;
    if (currentStage === "song-exercise") return songExerciseCompleted ? 30 : 20;
    if (currentStage === "core-values-detail") return coreValuesDetailCompleted ? 60 : 40;
    if (currentStage === "quiz") return quizCompleted ? 90 : 70;
    if (currentStage === "completed") return 100;
    return 0;
  };
  
  return (
    <div className="core-module-wrapper">
      {/* Progress indicator at the top */}
      <div className="mb-6">
        <div className="flex justify-between text-sm text-gray-500 mb-1">
          <span>CORE Values Training Progress</span>
          <span>{getProgressPercentage()}%</span>
        </div>
        <Progress value={getProgressPercentage()} className="h-2" />
      </div>
      
      {currentStage === "song-exercise" && (
        <div className="p-4 bg-white rounded-lg shadow">
          <CoreSongExercise onComplete={handleSongExerciseComplete} />
          
          {songExerciseCompleted && (
            <div className="mt-6 flex flex-col md:flex-row justify-between md:items-center gap-4">
              <div className="bg-green-50 p-3 rounded-lg border border-green-200 flex items-center">
                <Award className="h-6 w-6 text-green-500 mr-2" />
                <span className="text-green-800">
                  Great job identifying all 5 CORE values in the song!
                </span>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={handleReturnFromSongExercise}
                >
                  Go Back
                </Button>
                <Button 
                  onClick={handleStartCoreValuesDetail}
                  className="bg-indigo-600 hover:bg-indigo-700"
                >
                  Continue to CORE Values Detail
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
      
      {currentStage === "core-values-detail" && (
        <CoreValueDetail onComplete={handleCoreValuesDetailComplete} />
      )}
      
      {currentStage === "quiz" && (
        <CoreValueQuiz onComplete={handleQuizComplete} />
      )}
      
      {currentStage === "completed" && (
        <div className="text-center py-8">
          <div className="inline-block p-4 bg-yellow-50 rounded-full mb-4">
            <Award className="h-16 w-16 text-yellow-500" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Congratulations!</h2>
          <p className="text-lg mb-6">
            You've successfully completed Raising Arizona's CORE values training and quiz!
            You now have a deeper understanding of how to implement these values in your teaching practice.
          </p>
          
          <Button 
            onClick={handleContinue}
            size="lg"
            className="bg-green-600 hover:bg-green-700"
          >
            Complete Training
          </Button>
        </div>
      )}
      
      {currentStage === "intro" && (
        <>
          <div className="mb-8">
            <div dangerouslySetInnerHTML={contentHtml} />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-indigo-50 p-6 rounded-lg border border-indigo-100 shadow-sm hover:shadow-md transition">
              <div className="flex items-center mb-4">
                <div className="bg-indigo-100 p-2 rounded-full mr-3">
                  <Music className="h-5 w-5 text-indigo-600" />
                </div>
                <h3 className="font-bold text-lg">CORE Values Song Exercise</h3>
              </div>
              <p className="text-indigo-800 mb-4">
                Listen to our company song and identify the 5 CORE values mentioned in the lyrics. This interactive exercise helps you memorize our values through music.
              </p>
              <Button 
                onClick={handleStartSongExercise}
                variant="default"
                className={`${songExerciseCompleted ? 'bg-green-600 hover:bg-green-700' : 'bg-indigo-600 hover:bg-indigo-700'} w-full`}
              >
                {songExerciseCompleted ? 'Song Exercise Completed ✓' : 'Start Song Exercise'}
              </Button>
            </div>
            
            <div className="bg-purple-50 p-6 rounded-lg border border-purple-100 shadow-sm hover:shadow-md transition">
              <div className="flex items-center mb-4">
                <div className="bg-purple-100 p-2 rounded-full mr-3">
                  <BookOpen className="h-5 w-5 text-purple-600" />
                </div>
                <h3 className="font-bold text-lg">CORE Values Deep Dive</h3>
              </div>
              <p className="text-purple-800 mb-4">
                Explore each CORE value in depth with stories, examples, and reflection questions. Learn how to apply these values in your daily teaching practice.
              </p>
              <Button 
                onClick={handleStartCoreValuesDetail}
                variant="default"
                disabled={!songExerciseCompleted}
                className={`${coreValuesDetailCompleted 
                  ? 'bg-green-600 hover:bg-green-700' 
                  : songExerciseCompleted 
                    ? 'bg-purple-600 hover:bg-purple-700' 
                    : 'bg-gray-400'} w-full`}
              >
                {coreValuesDetailCompleted 
                  ? 'Values Exploration Completed ✓' 
                  : songExerciseCompleted 
                    ? 'Start Values Exploration' 
                    : 'Complete Song Exercise First'}
              </Button>
            </div>

            <div className="bg-amber-50 p-6 rounded-lg border border-amber-100 shadow-sm hover:shadow-md transition">
              <div className="flex items-center mb-4">
                <div className="bg-amber-100 p-2 rounded-full mr-3">
                  <FileQuestion className="h-5 w-5 text-amber-600" />
                </div>
                <h3 className="font-bold text-lg">CORE Values Knowledge Quiz</h3>
              </div>
              <p className="text-amber-800 mb-4">
                Test your understanding of Raising Arizona's CORE values with an interactive quiz featuring Nintendo-style sound effects and a second chance feature!
              </p>
              <Button 
                onClick={() => setCurrentStage("quiz")}
                variant="default"
                disabled={!coreValuesDetailCompleted}
                className={`${quizCompleted 
                  ? 'bg-green-600 hover:bg-green-700' 
                  : coreValuesDetailCompleted 
                    ? 'bg-amber-600 hover:bg-amber-700' 
                    : 'bg-gray-400'} w-full`}
              >
                {quizCompleted 
                  ? 'Quiz Completed ✓' 
                  : coreValuesDetailCompleted 
                    ? 'Start Knowledge Quiz' 
                    : 'Complete Values Exploration First'}
              </Button>
            </div>
          </div>
          
          <div className="mt-8 flex justify-end">
            <Button 
              onClick={handleContinue}
              disabled={!coreValuesDetailCompleted}
              size="lg"
              className={`${coreValuesDetailCompleted ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-400'}`}
            >
              {coreValuesDetailCompleted ? 'Continue to Quiz' : 'Complete All Activities First'}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}