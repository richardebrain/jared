/**
 * EnhancedAssessment Component
 * This component renders the enhanced assessment experience using the FastAPI backend
 */
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  startAssessment,
  getNextQuestion,
  submitAnswer,
  finishAssessment,
  AssessmentQuestion,
  AnswerResult,
  AssessmentHistoryItem,
  LearningPath
} from '../services/assessmentService';

// Sound effects for correct and incorrect answers
import correctSoundSrc from '../assets/sounds/correct-answer.mp3';
import incorrectSoundSrc from '../assets/sounds/incorrect-answer.mp3';

// Define component props
interface EnhancedAssessmentProps {
  userId: number;
  onCompleted?: (results: LearningPath) => void;
}

// Main component
const EnhancedAssessment: React.FC<EnhancedAssessmentProps> = ({ userId, onCompleted }) => {
  // State variables
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [assessmentId, setAssessmentId] = useState<number | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<AssessmentQuestion | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [answerResult, setAnswerResult] = useState<AnswerResult | null>(null);
  const [history, setHistory] = useState<AssessmentHistoryItem[]>([]);
  const [showingResult, setShowingResult] = useState(false);
  const [assessmentComplete, setAssessmentComplete] = useState(false);
  const [learningPath, setLearningPath] = useState<LearningPath | null>(null);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [loadingNextQuestion, setLoadingNextQuestion] = useState(false);
  
  // Sound effect references
  const correctSound = new Audio(correctSoundSrc);
  const incorrectSound = new Audio(incorrectSoundSrc);
  
  const navigate = useNavigate();

  // Start assessment on component mount
  useEffect(() => {
    const initAssessment = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Start a new assessment
        const newAssessmentId = await startAssessment(userId);
        setAssessmentId(newAssessmentId);
        
        // Get the first question
        await loadNextQuestion(newAssessmentId, []);
      } catch (err) {
        console.error('Error initializing assessment:', err);
        setError('Failed to start assessment. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    
    initAssessment();
  }, [userId]);

  // Function to load the next question
  const loadNextQuestion = async (id: number, questionHistory: AssessmentHistoryItem[]) => {
    try {
      setLoadingNextQuestion(true);
      setSelectedAnswer(null);
      setAnswerResult(null);
      setShowingResult(false);
      
      const question = await getNextQuestion(id, questionHistory);
      
      // If no question is returned, the assessment is complete
      if (!question) {
        setAssessmentComplete(true);
        const results = await finishAssessment(id);
        setLearningPath(results);
        if (onCompleted) {
          onCompleted(results);
        }
        return;
      }
      
      setCurrentQuestion(question);
      setStartTime(Date.now());
    } catch (err) {
      console.error('Error loading next question:', err);
      setError('Failed to load the next question. Please try again.');
    } finally {
      setLoadingNextQuestion(false);
    }
  };

  // Function to handle answer submission
  const handleAnswerSubmit = async () => {
    if (!assessmentId || !currentQuestion || !selectedAnswer) return;
    
    try {
      setIsLoading(true);
      
      // Calculate time taken to answer
      const timeTakenMs = startTime ? Date.now() - startTime : undefined;
      
      // Submit the answer
      const result = await submitAnswer(assessmentId, {
        question_id: currentQuestion.id,
        user_answer: selectedAnswer,
        time_taken_ms: timeTakenMs
      });
      
      // Play sound based on result
      if (result.is_correct) {
        correctSound.play();
      } else {
        incorrectSound.play();
      }
      
      setAnswerResult(result);
      setShowingResult(true);
      
      // Update history
      const historyItem: AssessmentHistoryItem = {
        question_id: currentQuestion.id,
        domain: currentQuestion.domain,
        correct: result.is_correct,
        difficulty: currentQuestion.difficulty
      };
      
      const updatedHistory = [...history, historyItem];
      setHistory(updatedHistory);
    } catch (err) {
      console.error('Error submitting answer:', err);
      setError('Failed to submit your answer. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Function to proceed to the next question
  const handleNextQuestion = () => {
    if (!assessmentId) return;
    loadNextQuestion(assessmentId, history);
  };

  // Function to finish the assessment early
  const handleFinishEarly = async () => {
    if (!assessmentId) return;
    
    try {
      setIsLoading(true);
      const results = await finishAssessment(assessmentId);
      setLearningPath(results);
      setAssessmentComplete(true);
      if (onCompleted) {
        onCompleted(results);
      }
    } catch (err) {
      console.error('Error finishing assessment:', err);
      setError('Failed to finish assessment. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Function to view assessment results
  const handleViewResults = () => {
    navigate('/assessment-results', { state: { learningPath } });
  };

  // Render loading state
  if (isLoading && !currentQuestion) {
    return (
      <div className="flex flex-col items-center justify-center p-6 min-h-[50vh]">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-lg">Loading assessment...</p>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
        <h2 className="text-xl font-semibold text-red-700 mb-2">Error</h2>
        <p className="text-red-600">{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  // Render assessment complete state
  if (assessmentComplete) {
    return (
      <div className="p-6 bg-gradient-to-br from-green-50 to-blue-50 rounded-lg border border-green-200">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-6 text-green-700">
            Assessment Complete! 🎉
          </h2>
          
          {learningPath && (
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="mb-6">
                <h3 className="text-xl font-semibold mb-2">Your Performance</h3>
                <p className="mb-1">
                  <span className="font-medium">Questions answered:</span> {learningPath.questions_asked}
                </p>
                <p className="mb-1">
                  <span className="font-medium">Correct answers:</span> {learningPath.questions_correct}
                </p>
                <p className="mb-1">
                  <span className="font-medium">Score:</span> {Math.round((learningPath.questions_correct / Math.max(1, learningPath.questions_asked)) * 100)}%
                </p>
              </div>
              
              <div className="mb-6">
                <h3 className="text-xl font-semibold mb-2">Your Strengths</h3>
                <p className="mb-1">
                  <span className="font-medium">Strongest domain:</span> {learningPath.strongest_domain}
                </p>
                <div className="h-2 bg-gray-200 rounded-full mt-2 mb-4">
                  <div 
                    className="h-full bg-green-500 rounded-full" 
                    style={{ width: `${learningPath.domain_scores[learningPath.strongest_domain] * 100}%` }}
                  ></div>
                </div>
              </div>
              
              <div className="mb-6">
                <h3 className="text-xl font-semibold mb-2">Areas for Growth</h3>
                <p className="mb-1">
                  <span className="font-medium">Area to focus on:</span> {learningPath.weakest_domain}
                </p>
                <div className="h-2 bg-gray-200 rounded-full mt-2 mb-4">
                  <div 
                    className="h-full bg-yellow-500 rounded-full" 
                    style={{ width: `${learningPath.domain_scores[learningPath.weakest_domain] * 100}%` }}
                  ></div>
                </div>
              </div>
              
              <div className="mb-6">
                <h3 className="text-xl font-semibold mb-2">Recommended Training</h3>
                <ul className="list-disc list-inside space-y-1">
                  {learningPath.learning_path.recommended_modules?.map((module, index) => (
                    <li key={index} className="text-blue-600">{module}</li>
                  ))}
                </ul>
              </div>
              
              <div className="flex justify-center mt-8">
                <button
                  onClick={handleViewResults}
                  className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                  View Detailed Results
                </button>
              </div>
            </div>
          )}
          
          <div className="mt-6 text-center">
            <Link 
              to="/dashboard" 
              className="text-blue-600 hover:text-blue-800 transition-colors"
            >
              Return to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Render current question
  return (
    <div className="p-4 md:p-6 bg-white rounded-lg shadow">
      {currentQuestion && (
        <div>
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <span className="text-sm font-medium text-gray-500">
                Domain: {currentQuestion.domain}
              </span>
              <span className="text-sm font-medium px-2 py-1 bg-blue-100 text-blue-800 rounded">
                Difficulty: {currentQuestion.difficulty}/4
              </span>
            </div>
            
            <h2 className="text-xl font-bold mb-6">{currentQuestion.question}</h2>
            
            <div className="space-y-3">
              {Object.entries(currentQuestion.options).map(([key, value]) => (
                <div 
                  key={key}
                  onClick={() => !showingResult && setSelectedAnswer(key)}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedAnswer === key 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                  } ${
                    showingResult && answerResult 
                      ? answerResult.correct_answer === key
                        ? 'border-green-500 bg-green-50'
                        : selectedAnswer === key && selectedAnswer !== answerResult.correct_answer
                          ? 'border-red-500 bg-red-50'
                          : ''
                      : ''
                  }`}
                >
                  <div className="flex items-start">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-200 text-gray-700 mr-3">
                      {key}
                    </span>
                    <p>{value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {showingResult && answerResult && (
            <div className={`p-4 rounded-lg mt-6 ${
              answerResult.is_correct ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
            }`}>
              <h3 className={`text-lg font-semibold mb-2 ${
                answerResult.is_correct ? 'text-green-700' : 'text-red-700'
              }`}>
                {answerResult.is_correct 
                  ? 'Correct! Great job!' 
                  : `Incorrect. The correct answer is ${answerResult.correct_answer}.`
                }
              </h3>
              <p className="mb-4">{answerResult.explanation}</p>
              
              {answerResult.extended_content && (
                <div className="mt-4">
                  <h4 className="font-medium mb-2">Learn More:</h4>
                  {answerResult.extended_content.science_behind_it && (
                    <div className="mb-3">
                      <h5 className="font-medium text-blue-700">The Science Behind It:</h5>
                      <p>{answerResult.extended_content.science_behind_it}</p>
                    </div>
                  )}
                  {answerResult.extended_content.practical_application && (
                    <div className="mb-3">
                      <h5 className="font-medium text-green-700">Practical Application:</h5>
                      <p>{answerResult.extended_content.practical_application}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          
          <div className="mt-6 flex justify-between">
            <button
              onClick={handleFinishEarly}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              disabled={showingResult || loadingNextQuestion}
            >
              Finish Early
            </button>
            
            {!showingResult ? (
              <button
                onClick={handleAnswerSubmit}
                disabled={!selectedAnswer || loadingNextQuestion}
                className={`px-6 py-2 rounded-lg font-medium ${
                  selectedAnswer && !loadingNextQuestion
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                } transition-colors`}
              >
                Submit Answer
              </button>
            ) : (
              <button
                onClick={handleNextQuestion}
                disabled={loadingNextQuestion}
                className={`px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors ${
                  loadingNextQuestion ? 'opacity-70 cursor-wait' : ''
                }`}
              >
                {loadingNextQuestion ? 'Loading...' : 'Next Question'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedAssessment;