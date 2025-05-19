import Header from "@/components/Header";
import { useAuth } from "@/hooks/use-auth";
import BearAssistant from "@/components/BearAssistant";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Award, Heart, Star, CheckCircle, BookOpen, Youtube, Play } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function CoreValuesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentSection, setCurrentSection] = useState(0);
  const [completedSections, setCompletedSections] = useState<number[]>([]);
  const [moduleCompleted, setModuleCompleted] = useState(false);
  
  // Add points mutation
  const { mutate: addPoints } = useMutation({
    mutationFn: async (points: number) => {
      const response = await apiRequest("POST", "/api/users/add-points", { points });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      setModuleCompleted(true);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to award points: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Handle completion of the module
  const handleCompleteModule = () => {
    // Award 25 points for completing Raising Arizona's CORE
    addPoints(25);
    toast({
      title: "Training Completed!",
      description: "You've earned 25 XP points for completing Raising Arizona's CORE training!",
    });
  };
  
  // Core Values content sections
  const sections = [
    {
      id: "overview",
      title: "Raising Arizona's CORE",
      description: "Mandatory onboarding module covering Raising Arizona Preschool's Core Values, philosophy, and teaching approach. All teachers must complete this module as part of their orientation.",
      content: (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Welcome to Raising Arizona Preschool</h2>
            <p className="text-gray-700 mb-4">
              This flagship training module will introduce you to our school's core values and philosophy. 
              At Raising Arizona Preschool (RAP), we consider it our great privilege to teach the children of America.
            </p>
            
            <div className="aspect-video relative overflow-hidden rounded-lg bg-gray-100 mt-6">
              <div className="flex items-center justify-center h-full">
                <div className="text-center p-8 bg-blue-50 rounded-lg border border-blue-100 w-full">
                  <Youtube className="h-12 w-12 text-blue-500 mx-auto mb-3" />
                  <h3 className="text-lg font-bold mb-2">Raising Arizona Preschool Promotional Video</h3>
                  <p className="text-gray-600 mb-4">Watch this video to understand our school's mission and approach.</p>
                  <Button variant="outline" className="mx-auto">
                    <Play className="h-4 w-4 mr-2" />
                    Watch Video
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: "core-value-1",
      title: "Core Value 1: Be Consistent",
      icon: <Star className="h-6 w-6 text-blue-500" />,
      color: "bg-blue-500",
      description: "Children thrive in environments where they know what to expect.",
      content: (
        <Card className="border-blue-100">
          <CardHeader className="border-b border-blue-50 bg-blue-50">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                <Star className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <CardTitle className="text-blue-800">Be Consistent</CardTitle>
                <CardDescription>Creating security through reliable routines</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <p className="text-gray-700">
              Children thrive in environments where they know what to expect. Consistency in our routines, rules, and responses creates a sense of security that allows children to focus on learning and growing. When we are consistent, children develop trust in their environment and the adults who care for them.
            </p>
            
            <div className="bg-blue-50 p-5 rounded-lg border border-blue-100">
              <h4 className="font-bold text-blue-800 mb-3">Key Practices:</h4>
              <ul className="space-y-2">
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 mr-2 text-blue-600 flex-shrink-0 mt-0.5" />
                  <span>Maintaining predictable daily schedules and routines</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 mr-2 text-blue-600 flex-shrink-0 mt-0.5" />
                  <span>Enforcing classroom rules uniformly and fairly</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 mr-2 text-blue-600 flex-shrink-0 mt-0.5" />
                  <span>Following through on promises and commitments</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 mr-2 text-blue-600 flex-shrink-0 mt-0.5" />
                  <span>Providing clear expectations for behavior and learning</span>
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>
      )
    },
    {
      id: "core-value-2",
      title: "Core Value 2: Be Prepared",
      icon: <BookOpen className="h-6 w-6 text-amber-500" />,
      color: "bg-amber-500",
      description: "Effective teaching requires thoughtful preparation.",
      content: (
        <Card className="border-amber-100">
          <CardHeader className="border-b border-amber-50 bg-amber-50">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
                <BookOpen className="h-6 w-6 text-amber-500" />
              </div>
              <div>
                <CardTitle className="text-amber-800">Be Prepared</CardTitle>
                <CardDescription>Creating optimal conditions for learning</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <p className="text-gray-700">
              Effective teaching requires thoughtful preparation. When we come to school prepared with well-designed lesson plans, organized materials, and a clear understanding of each child's needs, we create optimal conditions for learning and growth. Preparation demonstrates our professionalism and commitment to excellence.
            </p>
            
            <div className="bg-amber-50 p-5 rounded-lg border border-amber-100">
              <h4 className="font-bold text-amber-800 mb-3">Essential Preparations:</h4>
              <ul className="space-y-2">
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 mr-2 text-amber-600 flex-shrink-0 mt-0.5" />
                  <span>Creating detailed weekly lesson plans aligned with learning objectives</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 mr-2 text-amber-600 flex-shrink-0 mt-0.5" />
                  <span>Preparing learning materials before children arrive</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 mr-2 text-amber-600 flex-shrink-0 mt-0.5" />
                  <span>Reviewing and reflecting on previous lessons to inform future planning</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 mr-2 text-amber-600 flex-shrink-0 mt-0.5" />
                  <span>Anticipating potential challenges and preparing appropriate responses</span>
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>
      )
    },
    {
      id: "core-value-3",
      title: "Core Value 3: Be Committed",
      icon: <Award className="h-6 w-6 text-purple-500" />,
      color: "bg-purple-500",
      description: "We are dedicated to each child's growth, development, and wellbeing.",
      content: (
        <Card className="border-purple-100">
          <CardHeader className="border-b border-purple-50 bg-purple-50">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                <Award className="h-6 w-6 text-purple-500" />
              </div>
              <div>
                <CardTitle className="text-purple-800">Be Committed</CardTitle>
                <CardDescription>Dedicated to children's success</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <p className="text-gray-700">
              Our commitment to early childhood education goes beyond simply doing a job. We are dedicated to each child's growth, development, and well-being. This commitment drives us to continue learning, improving our practices, and advocating for the best interests of children and families.
            </p>
            
            <div className="bg-purple-50 p-5 rounded-lg border border-purple-100">
              <h4 className="font-bold text-purple-800 mb-3">Demonstrations of Commitment:</h4>
              <ul className="space-y-2">
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 mr-2 text-purple-600 flex-shrink-0 mt-0.5" />
                  <span>Pursuing ongoing professional development</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 mr-2 text-purple-600 flex-shrink-0 mt-0.5" />
                  <span>Persisting with challenging children to help them succeed</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 mr-2 text-purple-600 flex-shrink-0 mt-0.5" />
                  <span>Going above and beyond minimum requirements</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 mr-2 text-purple-600 flex-shrink-0 mt-0.5" />
                  <span>Advocating for children's needs with families and colleagues</span>
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>
      )
    },
    {
      id: "core-value-4",
      title: "Core Value 4: Be Caring",
      icon: <Heart className="h-6 w-6 text-red-500" />,
      color: "bg-red-500",
      description: "Genuine care for children is at the heart of effective education.",
      content: (
        <Card className="border-red-100">
          <CardHeader className="border-b border-red-50 bg-red-50">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <Heart className="h-6 w-6 text-red-500" />
              </div>
              <div>
                <CardTitle className="text-red-800">Be Caring</CardTitle>
                <CardDescription>Creating a foundation of care and trust</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <p className="text-gray-700">
              At the heart of effective early childhood education is genuine care for children. We believe that children don't care what you know until they know that you care about them. Our compassionate, responsive relationships with children create the foundation for all learning and development.
            </p>
            
            <div className="bg-red-50 p-5 rounded-lg border border-red-100">
              <h4 className="font-bold text-red-800 mb-3">Ways We Show We Care:</h4>
              <ul className="space-y-2">
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 mr-2 text-red-600 flex-shrink-0 mt-0.5" />
                  <span>Greeting each child warmly by name every day</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 mr-2 text-red-600 flex-shrink-0 mt-0.5" />
                  <span>Listening attentively to children's thoughts, feelings, and ideas</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 mr-2 text-red-600 flex-shrink-0 mt-0.5" />
                  <span>Responding promptly and sensitively to children's needs</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 mr-2 text-red-600 flex-shrink-0 mt-0.5" />
                  <span>Celebrating each child's unique qualities and achievements</span>
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>
      )
    },
    {
      id: "core-value-5",
      title: "Core Value 5: Be Positive",
      icon: <Star className="h-6 w-6 text-green-500" />,
      color: "bg-green-500",
      description: "Our positive attitude sets the tone for the classroom environment.",
      content: (
        <Card className="border-green-100">
          <CardHeader className="border-b border-green-50 bg-green-50">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                <Star className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <CardTitle className="text-green-800">Be Positive</CardTitle>
                <CardDescription>Creating a joyful learning environment</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <p className="text-gray-700">
              Our positive attitude sets the tone for the entire classroom environment. When we approach challenges with optimism, model constructive problem-solving, and focus on children's strengths, we inspire them to develop resilience, confidence, and a lifelong love of learning.
            </p>
            
            <div className="bg-green-50 p-5 rounded-lg border border-green-100">
              <h4 className="font-bold text-green-800 mb-3">Positive Practices:</h4>
              <ul className="space-y-2">
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 mr-2 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>Using encouraging language that emphasizes effort and growth</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 mr-2 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>Modeling positive self-talk and constructive problem-solving</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 mr-2 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>Finding the good in every child, especially when facing challenges</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 mr-2 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>Creating a joyful, engaging learning environment</span>
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>
      )
    },
    {
      id: "quiz",
      title: "Knowledge Test",
      description: "Test your understanding of our core values",
      content: (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Ready to Test Your Knowledge?</h2>
            <p className="text-gray-700 mb-4">
              Now that you've reviewed our core values, it's time to test your understanding with a quiz. 
              Complete the quiz with 100% accuracy to earn your Raising Arizona's CORE certification, required for all staff.
            </p>
            <p className="text-gray-700 mb-6">
              Listen for the special Mario Kart sounds when you get answers correct!
            </p>
            
            <Button 
              className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 w-full"
              onClick={handleCompleteModule}
            >
              Start Quiz
            </Button>
          </div>
        </div>
      )
    }
  ];
  
  // Mark section as complete and move to next
  const completeSection = (index: number) => {
    if (!completedSections.includes(index)) {
      setCompletedSections([...completedSections, index]);
    }
    
    if (index < sections.length - 1) {
      setCurrentSection(index + 1);
    }
  };
  
  // Calculate progress
  const progress = Math.round((completedSections.length / sections.length) * 100);
  
  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col">
      <Header />
      
      <main className="flex-1 container max-w-7xl mx-auto p-4 md:p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Raising Arizona's CORE</h1>
          <p className="text-gray-600 mt-1">
            Our core values represent what we believe is most important in early childhood education
          </p>
        </div>
        
        {moduleCompleted ? (
          <div className="bg-white rounded-lg shadow p-8 text-center space-y-6">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800">Training Completed!</h2>
            <p className="text-gray-600">
              You've successfully completed the Raising Arizona's CORE training module and earned 25 XP points!
            </p>
            <div className="p-4 bg-amber-50 rounded-lg border border-amber-100 max-w-md mx-auto">
              <p className="text-amber-800">
                Remember to embody these five core values every day in your classroom:
                <span className="font-bold block mt-2">Be Consistent • Be Prepared • Be Committed • Be Caring • Be Positive</span>
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-3">
              <div className="bg-white rounded-lg shadow-sm mb-6 p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">Module Progress</span>
                  <span className="text-sm font-medium text-gray-700">{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
              
              {/* Current Section Content */}
              <div className="mb-6">
                {sections[currentSection].content}
              </div>
              
              {/* Navigation buttons */}
              <div className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={() => setCurrentSection(Math.max(0, currentSection - 1))}
                  disabled={currentSection === 0}
                >
                  Previous
                </Button>
                
                <Button
                  onClick={() => completeSection(currentSection)}
                  disabled={currentSection === sections.length - 1 && completedSections.includes(currentSection)}
                >
                  {currentSection < sections.length - 1 ? "Continue" : "Complete Module"}
                </Button>
              </div>
            </div>
            
            <div className="col-span-1">
              {/* Bear assistant */}
              <BearAssistant user={user} />
              
              {/* Navigation sidebar */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 mt-6 overflow-hidden">
                <div className="p-4 bg-blue-50 border-b border-blue-100">
                  <h3 className="font-bold text-blue-800">Module Contents</h3>
                </div>
                <div>
                  {sections.map((section, index) => (
                    <button
                      key={section.id}
                      onClick={() => setCurrentSection(index)}
                      className={`w-full text-left px-4 py-3 border-b border-gray-100 flex items-center hover:bg-gray-50 transition ${
                        currentSection === index ? "bg-blue-50" : ""
                      }`}
                    >
                      {completedSections.includes(index) ? (
                        <CheckCircle className="h-5 w-5 mr-2 text-green-500" />
                      ) : (
                        <div className="w-5 h-5 rounded-full border-2 border-gray-300 mr-2 flex-shrink-0"></div>
                      )}
                      <span className={completedSections.includes(index) ? "text-gray-700" : "text-gray-600"}>
                        {section.title}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Info card */}
              <div className="bg-white p-5 rounded-xl shadow-sm border border-neutral-200 mt-6">
                <h3 className="font-bold text-lg mb-2">About This Module</h3>
                <p className="text-neutral-600 text-sm">
                  This required training introduces you to the five core values of Raising Arizona Preschool. 
                  These values form the foundation of our approach to early childhood education.
                </p>
                
                <div className="mt-4 p-3 bg-amber-50 rounded-md border border-amber-100">
                  <p className="text-sm text-amber-800">
                    <span className="font-semibold block mb-1">Remember:</span>
                    Completion of this module awards 25 XP points and is required for all teachers!
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}