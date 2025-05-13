import { useState } from "react";
import { Clock, ArrowRight, CheckCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Link } from "wouter";

// Define mini-lesson types
interface MiniLesson {
  id: number;
  title: string;
  description: string;
  duration: number; // in minutes
  category: string;
  completed?: boolean;
}

export function MiniLessons() {
  // These would be fetched from an API in a real implementation
  const [miniLessons] = useState<MiniLesson[]>([
    {
      id: 1,
      title: "Quick Transition Techniques",
      description: "Learn 5 effective ways to transition between activities while keeping children engaged",
      duration: 5,
      category: "classroom-management",
      completed: false
    },
    {
      id: 2,
      title: "Coping Strategy of the Day",
      description: "Teach children the 'Turtle Technique' for managing big emotions",
      duration: 7,
      category: "social-emotional",
      completed: false
    },
    {
      id: 3,
      title: "Mindful Moment Script",
      description: "A 3-minute guided mindfulness exercise to use during morning circle",
      duration: 3,
      category: "mindful-mornings",
      completed: true
    }
  ]);

  // Categories with their corresponding colors
  const categoryColors: Record<string, { bg: string, text: string, border: string }> = {
    'classroom-management': { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-200' },
    'social-emotional': { bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-200' },
    'mindful-mornings': { bg: 'bg-emerald-100', text: 'text-emerald-800', border: 'border-emerald-200' },
    'health-safety': { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-200' },
    'family-engagement': { bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-200' },
    'curriculum-planning': { bg: 'bg-indigo-100', text: 'text-indigo-800', border: 'border-indigo-200' }
  };

  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Clock className="h-5 w-5 mr-2 text-primary" />
            <CardTitle className="text-lg">Quick Mini-Lessons</CardTitle>
          </div>
          <Link href="/mini-lessons">
            <Badge variant="outline" className="hover:bg-muted cursor-pointer">
              View All
            </Badge>
          </Link>
        </div>
        <CardDescription>
          5-10 minute activities for when you have a short break
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {miniLessons.map((lesson) => {
            const categoryStyle = categoryColors[lesson.category] || 
              { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-200' };
            
            return (
              <div 
                key={lesson.id}
                className={`border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition ${lesson.completed ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-200'}`}
              >
                <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <Badge 
                      variant="outline" 
                      className={`${categoryStyle.bg} ${categoryStyle.text} ${categoryStyle.border} text-xs`}
                    >
                      {lesson.category.split('-').map(word => 
                        word.charAt(0).toUpperCase() + word.slice(1)
                      ).join(' ')}
                    </Badge>
                    <div className="flex items-center text-gray-500 text-xs">
                      <Clock className="h-3 w-3 mr-1" />
                      <span>{lesson.duration} min</span>
                    </div>
                  </div>
                  
                  <h3 className="font-medium mb-1">
                    {lesson.title}
                    {lesson.completed && <CheckCircle className="inline-block ml-1 h-4 w-4 text-green-500" />}
                  </h3>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {lesson.description}
                  </p>
                  
                  <Button 
                    variant={lesson.completed ? "outline" : "default"} 
                    size="sm"
                    className="w-full"
                  >
                    {lesson.completed ? 'Review Lesson' : 'Start Lesson'}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}