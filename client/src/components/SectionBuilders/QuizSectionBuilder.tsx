import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import VoiceInputTextarea from "@/components/VoiceInputTextarea";
import VoiceEnabledInput from "@/components/VoiceEnabledInput";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  Plus,
  Trash2,
  CheckCircle,
  Edit3,
  Save,
  RefreshCw,
} from "lucide-react";

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
}

interface QuizSectionBuilderProps {
  content: any;
  onContentChange: (content: any) => void;
  isEditing: boolean;
  onEditToggle: () => void;
  onRegenerateAI?: () => void;
}

export default function QuizSectionBuilder({
  content,
  onContentChange,
  isEditing,
  onEditToggle,
  onRegenerateAI,
}: QuizSectionBuilderProps) {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  useEffect(() => {
    console.log("content changed again", content);
    // Handle different content formats from AI generation
    let aiContent: any = "";
    if (content?.blocks?.[0]?.content) {
      aiContent = content.blocks[0].content;
    } else if (content?.content) {
      aiContent = content.content;
    } else if (typeof content === "string") {
      aiContent = content;
    }

    if (aiContent) {
      try {
        // Check if content is already structured as quiz questions array
        if (Array.isArray(aiContent)) {
          const structuredQuestions = aiContent.map(
            (q: any, index: number) => ({
              id: `question-${index + 1}`,
              question: q.question || "",
              options: q.options || [
                "Option A",
                "Option B",
                "Option C",
                "Option D",
              ],
              correctAnswer: q?.options
                ? q?.options?.find(
                    (opt: string, index: number) => index === q?.correctAnswer,
                  ) ? q?.correctAnswer  :  0
                : 0,
              explanation: q.explanation || "",
            }),
          );
          setQuestions(
            structuredQuestions.length > 0
              ? structuredQuestions
              : [createEmptyQuestion()],
          );
        } else if (typeof aiContent === "string") {
          const parsedQuestions = parseAIContentToQuestions(aiContent);
          setQuestions(
            parsedQuestions.length > 0
              ? parsedQuestions
              : [createEmptyQuestion()],
          );
        } else {
          setQuestions([createEmptyQuestion()]);
        }
      } catch (error) {
        console.error("Error parsing quiz content:", error);
        setQuestions([createEmptyQuestion()]);
      }
    } else {
      setQuestions([createEmptyQuestion()]);
    }
  }, [content]);

  const parseAIContentToQuestions = (aiContent: string): QuizQuestion[] => {
    try {
      const parsed = JSON.parse(aiContent);
      console.log(parsed, "parsed");

      if (!Array.isArray(parsed)) return [];

      const structuredQuestions = parsed.map((q: any, index: number) => ({
        id: q.id || `question-${index + 1}`,
        question: q.question || "",
        options: q.options || ["Option A", "Option B", "Option C", "Option D"],
        correctAnswer: q?.options
        ? q?.options?.find(
            (opt: string, index: number) => index === q?.correctAnswer,
          ) ? q?.correctAnswer  :  0
        : 0,
        explanation: q.explanation || "",
      }));
      return structuredQuestions.length > 0
        ? structuredQuestions
        : [createEmptyQuestion()];
    } catch (err) {
      console.error("Failed to parse AI content string:", err);
      return [];
    }
  };

  const createEmptyQuestion = (): QuizQuestion => ({
    id: `question-${Date.now()}`,
    question: "",
    options: ["", "", "", ""],
    correctAnswer: 0,
    explanation: "",
  });

  const addQuestion = () => {
    setQuestions((prev) => [...prev, createEmptyQuestion()]);
  };

  const removeQuestion = (questionId: string) => {
    setQuestions((prev) => prev.filter((q) => q.id !== questionId));
  };

  const updateQuestion = (
    questionId: string,
    field: keyof QuizQuestion,
    value: any,
  ) => {
    setQuestions((prev) =>
      prev.map((q) => (q.id === questionId ? { ...q, [field]: value } : q)),
    );
  };

  const updateOption = (
    questionId: string,
    optionIndex: number,
    value: string,
  ) => {
    setQuestions((prev) =>
      prev.map((q) =>
        q.id === questionId
          ? {
              ...q,
              options: q.options.map((opt, i) =>
                i === optionIndex ? value : opt,
              ),
            }
          : q,
      ),
    );
  };

  const saveChanges = () => {
    console.log(JSON.stringify(questions), "ssjjd");
    const goodQuestions = questions.filter(
      (q) => q.question.trim() && q.options.every((opt) => opt.trim()),
    );
    const updatedContent = {
      blocks: [
        {
          type: "quiz",
          title: "Quiz Section",
          content: JSON.stringify(goodQuestions),
          preview: `${goodQuestions.length} quiz questions ready`,
          questions: goodQuestions,
        },
      ],
    };
    onContentChange(updatedContent);
    onEditToggle();
  };
  console.log(questions, "questions");
  if (!isEditing) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="secondary">Quiz</Badge>
            <span className="text-sm text-gray-600">
              {questions.length} questions
            </span>
          </div>
          <div className="flex gap-2">
            {onRegenerateAI && (
              <Button variant="outline" size="sm" onClick={onRegenerateAI}>
                <RefreshCw className="h-4 w-4 mr-1" />
                Regenerate
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={onEditToggle}>
              <Edit3 className="h-4 w-4 mr-1" />
              Edit Quiz
            </Button>
          </div>
        </div>

        <div className="space-y-3">
          {questions.map((question, index) => (
            <Card key={question.id} className="border-l-4 border-l-blue-500">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-600 rounded-full text-sm font-medium">
                    {index + 1}
                  </span>
                  {question.question}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <RadioGroup
                  value={question.correctAnswer.toString()}
                  className="space-y-2"
                  disabled
                >
                  {question.options.map((option, index) => {
                    console.log(index, question.correctAnswer);
                    return (
                      <div
                        key={index}
                        className={`flex items-center space-x-2 p-2 rounded ${
                          index === question.correctAnswer
                            ? "bg-green-50 border border-green-200"
                            : "bg-gray-50"
                        }`}
                      >
                        <RadioGroupItem value={index.toString()} />
                        <Label className="flex-1">{option}</Label>
                        {index === question.correctAnswer && (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        )}
                      </div>
                    );
                  })}
                </RadioGroup>
                {question.explanation && (
                  <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded">
                    <div className="text-xs font-medium text-blue-700 mb-1">
                      Explanation:
                    </div>
                    <div className="text-sm text-blue-600">
                      {question.explanation}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Quiz Builder</h3>
          <p className="text-sm text-gray-600">
            Create and edit quiz questions
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onEditToggle}>
            Cancel
          </Button>
          <Button onClick={saveChanges}>
            <Save className="h-4 w-4 mr-1" />
            Save Quiz
          </Button>
        </div>
      </div>

      {questions.map((question, questionIndex) => (
        <Card key={question.id}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">
                Question {questionIndex + 1}
              </CardTitle>
              {questions.length > 1 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => removeQuestion(question.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor={`question-${question.id}`}>Question</Label>
              <VoiceInputTextarea
                value={question.question}
                onChange={(value) =>
                  updateQuestion(question.id, "question", value)
                }
                placeholder="Enter your question here..."
                className="mt-1"
              />
            </div>

            <div>
              <Label>Answer Options</Label>
              <div className="space-y-2 mt-2">
                {question.options.map((option, optionIndex) => (
                  <div key={optionIndex} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name={`correct-${question.id}`}
                      checked={question.correctAnswer === optionIndex}
                      onChange={() =>
                        updateQuestion(
                          question.id,
                          "correctAnswer",
                          optionIndex,
                        )
                      }
                      className="text-green-600"
                    />
                    <VoiceEnabledInput
                      value={option}
                      onChange={(value) =>
                        updateOption(question.id, optionIndex, value)
                      }
                      placeholder={`Option ${String.fromCharCode(65 + optionIndex)}`}
                      className="flex-1"
                    />
                    <span className="text-xs text-gray-500 w-16">
                      {optionIndex === question.correctAnswer ? "Correct" : ""}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor={`explanation-${question.id}`}>
                Explanation (Optional)
              </Label>
              <Textarea
                id={`explanation-${question.id}`}
                value={question.explanation || ""}
                onChange={(e) =>
                  updateQuestion(question.id, "explanation", e.target.value)
                }
                placeholder="Explain why this answer is correct..."
                className="mt-1"
                rows={2}
              />
            </div>
          </CardContent>
        </Card>
      ))}

      <Button onClick={addQuestion} variant="outline" className="w-full">
        <Plus className="h-4 w-4 mr-2" />
        Add Another Question
      </Button>
    </div>
  );
}
