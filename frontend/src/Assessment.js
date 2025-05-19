import React, { useState, useEffect } from "react";
import axios from "axios";

function Assessment() {
  const [step, setStep] = useState("start");
  const [assessmentId, setAssessmentId] = useState(null);
  const [history, setHistory] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [result, setResult] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(false);

  // Start assessment when component loads
  useEffect(() => {
    if (step === "start") {
      startAssessment();
    }
  }, [step]);

  // Start a new assessment
  const startAssessment = async () => {
    try {
      setLoading(true);
      // Use a placeholder user ID (would be from auth in a real app)
      const userId = 1;
      const response = await axios.post("/api/assessment/start", { user_id: userId });
      setAssessmentId(response.data.assessment_id);
      setStep("question");
      getNextQuestion([]);
    } catch (error) {
      console.error("Error starting assessment:", error);
    } finally {
      setLoading(false);
    }
  };

  // Get the next question
  const getNextQuestion = async (questionHistory) => {
    try {
      setLoading(true);
      if (!assessmentId) return;

      const response = await axios.post("/api/assessment/next", {
        assessment_id: assessmentId,
        history: questionHistory
      });
      
      setCurrentQuestion(response.data);
      setFeedback(null);
    } catch (error) {
      console.error("Error getting next question:", error);
    } finally {
      setLoading(false);
    }
  };

  // Submit an answer
  const submitAnswer = async (questionId, answer) => {
    try {
      setLoading(true);
      if (!assessmentId) return;

      // Record answer submission time
      const startTime = new Date();
      
      const response = await axios.post(`/api/assessment/answer?assessment_id=${assessmentId}`, {
        question_id: questionId,
        user_answer: answer,
        time_taken_ms: null // Could calculate based on question display time
      });

      // Update feedback
      setFeedback({
        correct: response.data.correct,
        explanation: response.data.explanation,
        correctAnswer: response.data.correct_answer,
        story: response.data.story
      });

      // Update history
      const updatedHistory = [...history, {
        question_id: questionId,
        domain: currentQuestion.domain,
        correct: response.data.correct,
        difficulty: currentQuestion.difficulty
      }];
      setHistory(updatedHistory);

      // Proceed if we've hit the limit (e.g., 20 questions)
      if (updatedHistory.length >= 20) {
        finishAssessment();
      }
    } catch (error) {
      console.error("Error submitting answer:", error);
    } finally {
      setLoading(false);
    }
  };

  // Complete the assessment
  const finishAssessment = async () => {
    try {
      setLoading(true);
      if (!assessmentId) return;

      const response = await axios.post(`/api/assessment/finish?assessment_id=${assessmentId}`);
      setResult(response.data);
      setStep("complete");
    } catch (error) {
      console.error("Error finishing assessment:", error);
    } finally {
      setLoading(false);
    }
  };

  // Continue to next question
  const continueToNextQuestion = () => {
    getNextQuestion(history);
  };

  // Render different assessment stages
  const renderContent = () => {
    if (loading && !currentQuestion) {
      return <div className="loading">Loading assessment...</div>;
    }

    switch (step) {
      case "start":
        return (
          <div className="start-screen">
            <h1>Early Childhood Education Assessment</h1>
            <p>This adaptive assessment will evaluate your knowledge in various ECE domains.</p>
            <button onClick={startAssessment} disabled={loading}>
              {loading ? "Starting..." : "Start Assessment"}
            </button>
          </div>
        );

      case "question":
        if (!currentQuestion) return <div>Loading question...</div>;

        return (
          <div className="question-container">
            <div className="progress-info">
              <span>Question {history.length + 1}</span>
              <span>Domain: {currentQuestion.domain}</span>
              <span>Difficulty: {currentQuestion.difficulty}/4</span>
            </div>

            <h2>{currentQuestion.question}</h2>

            <div className="options">
              {Object.entries(currentQuestion.options).map(([key, value]) => (
                <button
                  key={key}
                  onClick={() => submitAnswer(currentQuestion.id, key)}
                  disabled={loading || feedback}
                  className={feedback && feedback.correctAnswer === key ? "correct" : ""}
                >
                  {key}. {value}
                </button>
              ))}
            </div>

            {feedback && (
              <div className={`feedback ${feedback.correct ? "correct" : "incorrect"}`}>
                <h3>{feedback.correct ? "Correct!" : "Incorrect"}</h3>
                <p>{feedback.explanation}</p>
                {feedback.story && (
                  <div className="story">
                    <h4>Why This Matters:</h4>
                    <p>{feedback.story}</p>
                  </div>
                )}
                <button onClick={continueToNextQuestion}>Next Question</button>
              </div>
            )}
          </div>
        );

      case "complete":
        if (!result) return <div>Calculating results...</div>;

        return (
          <div className="results-container">
            <h1>Assessment Complete!</h1>
            
            <div className="score-summary">
              <p>
                You answered {result.questions_correct} out of {result.questions_asked} questions correctly.
              </p>
              <p>
                Your strongest domain: <strong>{result.strongest_domain}</strong>
              </p>
              <p>
                Area for growth: <strong>{result.weakest_domain}</strong>
              </p>
            </div>

            <h2>Your Domain Scores</h2>
            <div className="domain-scores">
              {Object.entries(result.domain_scores).map(([domain, score]) => (
                <div key={domain} className="domain-score">
                  <strong>{domain}:</strong> {score}%
                  <div className="score-bar">
                    <div className="score-fill" style={{ width: `${score}%` }}></div>
                  </div>
                </div>
              ))}
            </div>

            <h2>Your Personalized Learning Path</h2>
            <div className="learning-path">
              {Object.entries(result.learning_path).map(([domain, resources]) => (
                <div key={domain} className="domain-resources">
                  <h3>{domain}</h3>
                  <ul>
                    {resources.map((resource, index) => (
                      <li key={index}>{resource}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <button onClick={startAssessment}>Take Another Assessment</button>
          </div>
        );

      default:
        return <div>Something went wrong. Please refresh the page.</div>;
    }
  };

  return (
    <div className="assessment-container">
      {renderContent()}
    </div>
  );
}

export default Assessment;