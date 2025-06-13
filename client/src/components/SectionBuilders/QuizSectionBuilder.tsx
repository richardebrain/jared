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
    if (content?.blocks?.[0]?.content) {
      try {
        // Parse AI-generated content into quiz questions
        const aiContent = content.blocks[0].content;
        const parsedQuestions = parseAIContentToQuestions(aiContent);
        setQuestions(parsedQuestions);
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
    
    // Split content by question patterns
    const questionBlocks = aiContent.split(/(?:\d+\.|Question \d+:)/i).filter(block => block.trim());
    
    questionBlocks.forEach((block, index) => {
      const lines = block.trim().split('\n').filter(line => line.trim());
      if (lines.length === 0) return;
      
      const questionText = lines[0].trim();
      const options: string[] = [];
      let correctAnswer = 0;
      let explanation = '';
      
      // Extract options (A), B), a), b), 1), 2), etc.)
      lines.forEach((line, lineIndex) => {
        const optionMatch = line.match(/^[A-Da-d1-4][.)]\s*(.+)/);
        if (optionMatch) {
          options.push(optionMatch[1].trim());
        }
        
        // Look for correct answer indicators
        if (line.toLowerCase().includes('correct') || line.toLowerCase().includes('answer')) {
          const answerMatch = line.match(/[A-Da-d1-4]/);
          if (answerMatch) {
            const letter = answerMatch[0].toUpperCase();
            correctAnswer = letter.charCodeAt(0) - 65; // A=0, B=1, C=2, D=3
          }
        }
        
        // Look for explanations
        if (line.toLowerCase().includes('explanation') || line.toLowerCase().includes('because')) {
          explanation = line.replace(/explanation:?/i, '').trim();
        }
      });
      
      // If no options found, create default ones
      if (options.length === 0) {
        options.push('Option A', 'Option B', 'Option C', 'Option D');
      }
      
      questions.push({
        id: `question-${index + 1}`,
        question: questionText || `Question ${index + 1}`,
        options: options.slice(0, 4), // Limit to 4 options
        correctAnswer: Math.min(correctAnswer, options.length - 1),
        explanation
      });
    });
    
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