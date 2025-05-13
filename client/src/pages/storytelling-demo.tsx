import React, { useState } from 'react';
import StorytellingAnimation from '@/components/StorytellingAnimation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Book, Baby, Trees, School, Rocket } from 'lucide-react';

const StorytellingDemoPage = () => {
  const [showAnimation, setShowAnimation] = useState(false);
  const [currentPhase, setCurrentPhase] = useState<'introduction' | 'early-learning' | 'growth' | 'independence' | 'complete'>('introduction');

  const handleShowAnimation = (phase: typeof currentPhase) => {
    setCurrentPhase(phase);
    setShowAnimation(true);
  };

  return (
    <div className="container max-w-6xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-2">Child's Learning Journey Visualization</h1>
      <p className="text-lg text-gray-600 mb-8">
        This demonstration shows how we can visualize the impact of teaching on a child's developmental journey.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-16">
        <Card className="bg-blue-50 border-blue-200 hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center text-blue-700">
              <Book className="w-5 h-5 mr-2" />
              Opening Their Book
            </CardTitle>
            <CardDescription>First encounters</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              The first interactions that shape a child's trust and openness to learning.
            </p>
            <Button 
              onClick={() => handleShowAnimation('introduction')}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              Visualize
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-green-50 border-green-200 hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center text-green-700">
              <Baby className="w-5 h-5 mr-2" />
              First Chapters
            </CardTitle>
            <CardDescription>Early learning</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Children absorb words, emotions, and behaviors forming their first understandings.
            </p>
            <Button 
              onClick={() => handleShowAnimation('early-learning')}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              Visualize
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-amber-50 border-amber-200 hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center text-amber-700">
              <Tree className="w-5 h-5 mr-2" />
              Growing Narrative
            </CardTitle>
            <CardDescription>Developing skills</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              As children develop skills, their story evolves with characters, challenges, and triumphs.
            </p>
            <Button 
              onClick={() => handleShowAnimation('growth')}
              className="w-full bg-amber-600 hover:bg-amber-700"
            >
              Visualize
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-indigo-50 border-indigo-200 hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center text-indigo-700">
              <School className="w-5 h-5 mr-2" />
              Writing Their Own Pages
            </CardTitle>
            <CardDescription>Growing independence</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Children begin authoring parts of their own stories, using the foundations you've helped build.
            </p>
            <Button 
              onClick={() => handleShowAnimation('independence')}
              className="w-full bg-indigo-600 hover:bg-indigo-700"
            >
              Visualize
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-purple-50 border-purple-200 hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center text-purple-700">
              <Rocket className="w-5 h-5 mr-2" />
              Stories That Last a Lifetime
            </CardTitle>
            <CardDescription>Lifelong impact</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              The narratives formed in early childhood become the foundation for a lifetime of growth.
            </p>
            <Button 
              onClick={() => handleShowAnimation('complete')}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              Visualize
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle>How to Integrate This Animation</CardTitle>
          <CardDescription>Guidelines for using this storytelling overlay in training modules</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>
            The storytelling animation overlay visually emphasizes how each teaching practice shapes a child's
            developmental journey. It helps teachers understand the long-term impact of their daily interactions
            and approaches.
          </p>
          
          <h3 className="font-semibold text-lg">Recommended Uses:</h3>
          <ul className="list-disc pl-5 space-y-2">
            <li>Show at completion of key training segments to reinforce the "child's first chapter" theme</li>
            <li>Use during onboarding to establish the narrative-based approach to teaching</li>
            <li>Integrate with assessments to visualize how applying knowledge impacts a child's development</li>
            <li>Include in reflection exercises after completing practical classroom activities</li>
          </ul>
          
          <h3 className="font-semibold text-lg">Technical Integration:</h3>
          <p className="text-sm bg-gray-100 p-3 rounded font-mono">
            {`<StorytellingAnimation
  isVisible={showAnimation}
  phase="early-learning"
  onComplete={() => setShowAnimation(false)}
/>`}
          </p>
        </CardContent>
      </Card>

      {/* The actual animation component */}
      <StorytellingAnimation 
        isVisible={showAnimation}
        phase={currentPhase}
        onComplete={() => setShowAnimation(false)}
      />
    </div>
  );
};

export default StorytellingDemoPage;