import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, CheckCircle, Edit3, Save } from 'lucide-react';

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
}

export default function QuizSectionBuilder({ content, onContentChange, isEditing, onEditToggle }: QuizSectionBuilderProps) {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  useEffect(() => {
    // Handle different content formats from AI generation
    let aiContent: any = '';
    if (content?.blocks?.[0]?.content) {
      aiContent = content.blocks[0].content;
    } else if (content?.content) {
      aiContent = content.content;
    } else if (typeof content === 'string') {
      aiContent = content;
    }
    
    if (aiContent) {
      try {
        // Check if content is already structured as quiz questions array
        if (Array.isArray(aiContent)) {
          const structuredQuestions = aiContent.map((q: any, index: number) => ({
            id: `question-${index + 1}`,
            question: q.question || '',
            options: q.options || ['Option A', 'Option B', 'Option C', 'Option D'],
            correctAnswer: q.options ? q.options.findIndex((opt: string) => 
              opt === q.correct_answer || opt.includes(q.correct_answer?.replace(/^[A-D]\)\s*/, ''))
            ) : 0,
            explanation: q.explanation || ''
          }));
          setQuestions(structuredQuestions.length > 0 ? structuredQuestions : [createEmptyQuestion()]);
        } else if (typeof aiContent === 'string') {
          const parsedQuestions = parseAIContentToQuestions(aiContent);
          setQuestions(parsedQuestions.length > 0 ? parsedQuestions : [createEmptyQuestion()]);
        } else {
          setQuestions([createEmptyQuestion()]);
        }
      } catch (error) {
        console.error('Error parsing quiz content:', error);
        setQuestions([createEmptyQuestion()]);
      }
    } else {
      setQuestions([createEmptyQuestion()]);
    }
  }, [content]);

  const parseAIContentToQuestions = (aiContent: string): QuizQuestion[] => {
    const questions: QuizQuestion[] = [];
    
    try {
      // First try to parse as JSON if it looks like structured data
      if (aiContent.includes('{') && aiContent.includes('}')) {
        // Find the first complete JSON object
        let jsonStart = aiContent.indexOf('{');
        let braceCount = 0;
        let jsonEnd = -1;
        
        for (let i = jsonStart; i < aiContent.length; i++) {
          if (aiContent[i] === '{') braceCount++;
          if (aiContent[i] === '}') braceCount--;
          if (braceCount === 0) {
            jsonEnd = i;
            break;
          }
        }
        
        if (jsonEnd > jsonStart) {
          const jsonStr = aiContent.substring(jsonStart, jsonEnd + 1);
          try {
            const parsed = JSON.parse(jsonStr);
            if (parsed.questions && Array.isArray(parsed.questions)) {
              return parsed.questions.map((q: any, index: number) => ({
                id: `question-${index + 1}`,
                question: q.question || q.text || '',
                options: q.options || q.answers || ['Option A', 'Option B', 'Option C', 'Option D'],
                correctAnswer: q.correctAnswer || q.correct || 0,
                explanation: q.explanation || q.rationale || ''
              }));
            }
          } catch (jsonError) {
            console.warn('JSON parsing failed, falling back to text parsing');
          }
        }
      }
      
      // Fallback to text parsing
      const lines = aiContent.split('\n').filter(line => line.trim());
      let currentQuestion: Partial<QuizQuestion> = {};
      let currentOptions: string[] = [];
      let questionCount = 0;
      
      lines.forEach((line, index) => {
        const trimmedLine = line.trim();
        
        // Question patterns: "1.", "Question 1:", "Q1:", etc.
        const questionMatch = trimmedLine.match(/^(?:Question\s*)?(\d+)[.:]?\s*(.+)/i);
        if (questionMatch && !trimmedLine.match(/^[A-Da-d1-4][.)]/)) {
          // Save previous question if exists
          if (currentQuestion.question) {
            questions.push({
              id: `question-${questionCount}`,
              question: currentQuestion.question,
              options: currentOptions.length > 0 ? currentOptions : ['Option A', 'Option B', 'Option C', 'Option D'],
              correctAnswer: currentQuestion.correctAnswer || 0,
              explanation: currentQuestion.explanation || ''
            });
          }
          
          // Start new question
          questionCount++;
          currentQuestion = {
            question: questionMatch[2].trim(),
            correctAnswer: 0,
            explanation: ''
          };
          currentOptions = [];
          return;
        }
        
        // Option patterns: "A)", "a.", "1)", etc.
        const optionMatch = trimmedLine.match(/^([A-Da-d1-4])[.)]\s*(.+)/);
        if (optionMatch) {
          const optionText = optionMatch[2].trim();
          currentOptions.push(optionText);
          
          // Check if this is marked as correct
          if (optionText.includes('*') || trimmedLine.includes('**') || 
              trimmedLine.toLowerCase().includes('correct')) {
            currentQuestion.correctAnswer = currentOptions.length - 1;
          }
          return;
        }
        
        // Answer/explanation patterns
        if (trimmedLine.toLowerCase().includes('answer:') || 
            trimmedLine.toLowerCase().includes('correct:')) {
          const answerMatch = trimmedLine.match(/[A-Da-d1-4]/);
          if (answerMatch) {
            const letter = answerMatch[0].toUpperCase();
            currentQuestion.correctAnswer = letter.charCodeAt(0) - 65;
          }
        }
        
        if (trimmedLine.toLowerCase().includes('explanation:')) {
          currentQuestion.explanation = trimmedLine.replace(/explanation:?/i, '').trim();
        }
      });
      
      // Add the last question
      if (currentQuestion.question) {
        questions.push({
          id: `question-${questionCount}`,
          question: currentQuestion.question,
          options: currentOptions.length > 0 ? currentOptions : ['Option A', 'Option B', 'Option C', 'Option D'],
          correctAnswer: currentQuestion.correctAnswer || 0,
          explanation: currentQuestion.explanation || ''
        });
      }
      
    } catch (error) {
      console.error('Error parsing quiz content:', error);
    }
    
    return questions.length > 0 ? questions : [createEmptyQuestion()];
  };

  const createEmptyQuestion = (): QuizQuestion => ({
    id: `question-${Date.now()}`,
    question: '',
    options: ['', '', '', ''],
    correctAnswer: 0,
    explanation: ''
  });

  const addQuestion = () => {
    setQuestions(prev => [...prev, createEmptyQuestion()]);
  };

  const removeQuestion = (questionId: string) => {
    setQuestions(prev => prev.filter(q => q.id !== questionId));
  };

  const updateQuestion = (questionId: string, field: keyof QuizQuestion, value: any) => {
    setQuestions(prev => prev.map(q => 
      q.id === questionId ? { ...q, [field]: value } : q
    ));
  };

  const updateOption = (questionId: string, optionIndex: number, value: string) => {
    setQuestions(prev => prev.map(q => 
      q.id === questionId 
        ? { ...q, options: q.options.map((opt, i) => i === optionIndex ? value : opt) }
        : q
    ));
  };

  const saveChanges = () => {
    const updatedContent = {
      blocks: [{
        type: 'quiz',
        title: 'Quiz Section',
        content: JSON.stringify(questions),
        preview: `${questions.length} quiz questions ready`,
        questions: questions
      }]
    };
    onContentChange(updatedContent);
    onEditToggle();
  };

  if (!isEditing) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="secondary">Quiz</Badge>
            <span className="text-sm text-gray-600">{questions.length} questions</span>
          </div>
          <Button variant="outline" size="sm" onClick={onEditToggle}>
            <Edit3 className="h-4 w-4 mr-1" />
            Edit Quiz
          </Button>
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
                <RadioGroup value={question.correctAnswer.toString()} className="space-y-2">
                  {question.options.map((option, optionIndex) => (
                    <div key={optionIndex} className={`flex items-center space-x-2 p-2 rounded ${
                      optionIndex === question.correctAnswer ? 'bg-green-50 border border-green-200' : 'bg-gray-50'
                    }`}>
                      <RadioGroupItem value={optionIndex.toString()} />
                      <Label className="flex-1">{option}</Label>
                      {optionIndex === question.correctAnswer && (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      )}
                    </div>
                  ))}
                </RadioGroup>
                {question.explanation && (
                  <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded">
                    <div className="text-xs font-medium text-blue-700 mb-1">Explanation:</div>
                    <div className="text-sm text-blue-600">{question.explanation}</div>
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
          <p className="text-sm text-gray-600">Create and edit quiz questions</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onEditToggle}>Cancel</Button>
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
              <CardTitle className="text-base">Question {questionIndex + 1}</CardTitle>
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
              <Textarea
                id={`question-${question.id}`}
                value={question.question}
                onChange={(e) => updateQuestion(question.id, 'question', e.target.value)}
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
                      onChange={() => updateQuestion(question.id, 'correctAnswer', optionIndex)}
                      className="text-green-600"
                    />
                    <Input
                      value={option}
                      onChange={(e) => updateOption(question.id, optionIndex, e.target.value)}
                      placeholder={`Option ${String.fromCharCode(65 + optionIndex)}`}
                      className="flex-1"
                    />
                    <span className="text-xs text-gray-500 w-16">
                      {optionIndex === question.correctAnswer ? 'Correct' : ''}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor={`explanation-${question.id}`}>Explanation (Optional)</Label>
              <Textarea
                id={`explanation-${question.id}`}
                value={question.explanation || ''}
                onChange={(e) => updateQuestion(question.id, 'explanation', e.target.value)}
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