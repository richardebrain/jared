import { useState, useEffect } from "react";
import CoreSongExercise from "./CoreSongExercise";
import { Button } from "@/components/ui/button";

interface CoreModuleWrapperProps {
  moduleContent: string | null;
  onContinue: () => void;
}

export default function CoreModuleWrapper({ moduleContent, onContinue }: CoreModuleWrapperProps) {
  const [showSongExercise, setShowSongExercise] = useState(false);
  const [songExerciseCompleted, setSongExerciseCompleted] = useState(false);
  
  // Parse module content as HTML
  const contentHtml = { __html: moduleContent };
  
  const handleSongExerciseClick = () => {
    setShowSongExercise(true);
  };
  
  const handleSongExerciseComplete = (success: boolean) => {
    if (success) {
      setSongExerciseCompleted(true);
    }
  };
  
  const handleContinue = () => {
    onContinue();
  };
  
  return (
    <div className="core-module-wrapper">
      {showSongExercise ? (
        <div className="p-4 bg-white rounded-lg shadow">
          <CoreSongExercise onComplete={handleSongExerciseComplete} />
          
          {songExerciseCompleted && (
            <div className="mt-4 flex justify-end">
              <Button onClick={() => setShowSongExercise(false)}>
                Return to Module
              </Button>
            </div>
          )}
        </div>
      ) : (
        <>
          <div dangerouslySetInnerHTML={contentHtml} />
          
          <div className="my-6 flex justify-center">
            <Button 
              onClick={handleSongExerciseClick}
              size="lg"
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              Start Core Values Song Exercise
            </Button>
          </div>
          
          <div className="mt-8 flex justify-end">
            <Button 
              onClick={handleContinue}
              size="lg"
              className="bg-green-600 hover:bg-green-700"
            >
              Continue to Quiz
            </Button>
          </div>
        </>
      )}
    </div>
  );
}