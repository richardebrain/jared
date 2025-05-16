import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from "recharts";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, Award, ChevronRight, ClipboardList, Download, RefreshCw, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useRouter } from "wouter";

type AssessmentScore = {
  category: string;
  score: number;
  level: 'beginner' | 'developing' | 'proficient' | 'accomplished' | 'mastery';
  description: string;
};

type AssessmentData = {
  id: number;
  userId: number;
  overallScore: number;
  completedAt: string;
  scores: AssessmentScore[];
  teacherLevel: string;
};

// Helper function to get the level name based on score
function getLevelName(score: number): 'beginner' | 'developing' | 'proficient' | 'accomplished' | 'mastery' {
  if (score >= 90) return 'mastery';
  if (score >= 75) return 'accomplished';
  if (score >= 60) return 'proficient';
  if (score >= 40) return 'developing';
  return 'beginner';
}

// Helper function to get the color for each level
function getLevelColor(level: string): string {
  switch (level) {
    case 'mastery': return '#22c55e'; // Green
    case 'accomplished': return '#3b82f6'; // Blue
    case 'proficient': return '#f59e0b'; // Amber
    case 'developing': return '#ec4899'; // Pink
    case 'beginner': return '#9333ea'; // Purple
    default: return '#6b7280'; // Gray
  }
}

// Description templates for each level
const levelDescriptions = {
  mastery: "Exceptional understanding, ready to mentor others",
  accomplished: "Strong capability, consistently effective application",
  proficient: "Solid understanding with consistent application",
  developing: "Growing understanding, needs practice for consistency",
  beginner: "Basic understanding, needs guidance and practice",
};

interface AssessmentResultsProps {
  assessmentData: AssessmentData;
  onStartReassessment: () => void;
}

export default function AssessmentResults({ assessmentData, onStartReassessment }: AssessmentResultsProps) {
  const [, navigate] = useRouter();
  const [activeTab, setActiveTab] = useState<'graph' | 'details' | 'learning-path'>('graph');
  
  // Sort scores by category for consistent display
  const sortedScores = [...assessmentData.scores].sort((a, b) => a.category.localeCompare(b.category));

  // Format data for the bar chart
  const chartData = sortedScores.map(score => ({
    name: score.category,
    score: score.score,
    fill: getLevelColor(score.level),
  }));
  
  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col md:flex-row gap-4 items-start justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Your Assessment Results</h2>
          <p className="text-muted-foreground">
            Completed on {new Date(assessmentData.completedAt).toLocaleDateString()}
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            className="flex items-center gap-2"
            onClick={onStartReassessment}
          >
            <RefreshCw className="h-4 w-4" />
            Take Assessment Again
          </Button>
          
          <Button 
            variant="outline" 
            className="flex items-center gap-2"
            onClick={() => {
              // Create downloadable report
              const data = JSON.stringify(assessmentData, null, 2);
              const blob = new Blob([data], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `assessment-results-${new Date().toISOString().split('T')[0]}.json`;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
            }}
          >
            <Download className="h-4 w-4" />
            Download Report
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="col-span-1 md:col-span-3">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle>Assessment Profile</CardTitle>
              <div>
                <Badge 
                  variant="outline"
                  className="flex items-center gap-1 text-md font-bold border-2"
                  style={{ 
                    borderColor: getLevelColor(getLevelName(assessmentData.overallScore)),
                    color: getLevelColor(getLevelName(assessmentData.overallScore)),
                  }}
                >
                  <Award className="h-4 w-4" />
                  {assessmentData.teacherLevel}
                </Badge>
              </div>
            </div>
            <CardDescription>
              Your overall score is {assessmentData.overallScore}%
            </CardDescription>
          </CardHeader>
          
          <div className="flex border-b px-4">
            <Button
              variant={activeTab === 'graph' ? 'default' : 'ghost'}
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
              data-state={activeTab === 'graph' ? 'active' : 'inactive'}
              onClick={() => setActiveTab('graph')}
            >
              Skill Graph
            </Button>
            <Button
              variant={activeTab === 'details' ? 'default' : 'ghost'}
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
              data-state={activeTab === 'details' ? 'active' : 'inactive'}
              onClick={() => setActiveTab('details')}
            >
              Detailed Breakdown
            </Button>
            <Button
              variant={activeTab === 'learning-path' ? 'default' : 'ghost'}
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
              data-state={activeTab === 'learning-path' ? 'active' : 'inactive'}
              onClick={() => setActiveTab('learning-path')}
            >
              Learning Path Development
            </Button>
          </div>
          
          <CardContent className="pt-6">
            {activeTab === 'graph' && (
              <div className="space-y-6">
                <div className="w-full h-[450px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={chartData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 120 }}
                      barSize={25}
                    >
                      <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                      <XAxis 
                        dataKey="name" 
                        angle={-45} 
                        textAnchor="end" 
                        height={120} 
                        interval={0}
                        tick={{ fontSize: 12 }}
                      />
                      <YAxis 
                        domain={[0, 100]} 
                        tickCount={6}
                        tickFormatter={(value) => `${value}%`}
                      />
                      <Tooltip 
                        formatter={(value) => [`${value}%`, 'Score']}
                        cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }}
                        contentStyle={{ 
                          borderRadius: '8px', 
                          border: '1px solid #e2e8f0',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }}
                      />
                      <Legend 
                        wrapperStyle={{ paddingTop: '10px' }}
                      />
                      <Bar 
                        dataKey="score" 
                        name="Skill Level" 
                        radius={[4, 4, 0, 0]}
                        isAnimationActive={true}
                        animationDuration={1500}
                      />
                      {/* Reference lines for each level */}
                      <ReferenceLine y={90} stroke="#22c55e" strokeDasharray="3 3" label={{ value: 'Mastery', position: 'insideTopRight', fill: '#22c55e', fontSize: 12 }} />
                      <ReferenceLine y={75} stroke="#3b82f6" strokeDasharray="3 3" label={{ value: 'Accomplished', position: 'insideTopRight', fill: '#3b82f6', fontSize: 12 }} />
                      <ReferenceLine y={60} stroke="#f59e0b" strokeDasharray="3 3" label={{ value: 'Proficient', position: 'insideTopRight', fill: '#f59e0b', fontSize: 12 }} />
                      <ReferenceLine y={40} stroke="#ec4899" strokeDasharray="3 3" label={{ value: 'Developing', position: 'insideTopRight', fill: '#ec4899', fontSize: 12 }} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                
                <div className="overflow-x-auto">
                  <div className="min-w-max flex justify-center space-x-4 py-3 px-4 bg-muted/30 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getLevelColor('mastery') }} />
                      <span className="text-sm font-medium">Mastery (90-100%)</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getLevelColor('accomplished') }} />
                      <span className="text-sm font-medium">Accomplished (75-89%)</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getLevelColor('proficient') }} />
                      <span className="text-sm font-medium">Proficient (60-74%)</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getLevelColor('developing') }} />
                      <span className="text-sm font-medium">Developing (40-59%)</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getLevelColor('beginner') }} />
                      <span className="text-sm font-medium">Beginner (0-39%)</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {activeTab === 'details' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Detailed Assessment Breakdown</h3>
                  <p className="text-sm text-muted-foreground">Showing all 18 categories and your proficiency level</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {sortedScores.map((score) => (
                    <div 
                      key={score.category} 
                      className="flex flex-col space-y-3 p-5 border rounded-lg shadow-sm hover:shadow-md transition-shadow"
                      style={{ 
                        borderLeft: `4px solid ${getLevelColor(score.level)}`,
                      }}
                    >
                      <div className="flex justify-between items-center gap-2">
                        <h3 className="font-semibold text-md">{score.category}</h3>
                        <Badge 
                          variant="outline"
                          className="px-3 py-1 text-xs font-bold"
                          style={{ 
                            color: getLevelColor(score.level),
                            borderColor: getLevelColor(score.level),
                            backgroundColor: `${getLevelColor(score.level)}10`
                          }}
                        >
                          {score.level.charAt(0).toUpperCase() + score.level.slice(1)}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <div className="w-full bg-secondary/30 rounded-full h-3">
                          <div 
                            className="h-3 rounded-full transition-all duration-1000 ease-out" 
                            style={{ 
                              width: `${score.score}%`,
                              backgroundColor: getLevelColor(score.level)
                            }}
                          />
                        </div>
                        <span className="text-sm font-medium w-12 text-right">{score.score}%</span>
                      </div>
                      
                      <div className="flex gap-2 items-start">
                        <div className="w-2 h-2 rounded-full mt-1.5" style={{ 
                          backgroundColor: score.score >= 70 ? '#22c55e' : '#f59e0b'
                        }}></div>
                        <p className="text-sm text-muted-foreground flex-1">{score.description}</p>
                      </div>
                      
                      <div className="flex justify-between items-center mt-2 pt-2 border-t border-dashed">
                        <div className="text-xs text-muted-foreground">
                          {score.score >= 80 ? (
                            <span className="flex items-center text-green-600">
                              <div className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1"></div>
                              Strength area
                            </span>
                          ) : score.score < 70 ? (
                            <span className="flex items-center text-red-600">
                              <div className="w-1.5 h-1.5 rounded-full bg-red-500 mr-1"></div>
                              Growth area
                            </span>
                          ) : (
                            <span className="flex items-center text-blue-600">
                              <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mr-1"></div>
                              Developing area
                            </span>
                          )}
                        </div>
                        {score.score < 70 && (
                          <div className="text-xs px-2 py-1 rounded-full bg-amber-100 text-amber-800">
                            Learning priority
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {activeTab === 'learning-path' && (
              <div className="space-y-6">
                <div className="rounded-lg border p-4 bg-muted/50">
                  <h3 className="text-lg font-semibold mb-2">How Your Learning Path is Developed</h3>
                  <p className="mb-4">
                    Your personalized learning path is automatically generated based on your assessment results. Here's how it works:
                  </p>
                  
                  <div className="space-y-4">
                    <div className="flex gap-3">
                      <div className="mt-1">
                        <div className="bg-primary text-primary-foreground w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold">1</div>
                      </div>
                      <div>
                        <h4 className="font-semibold">Assessment Analysis</h4>
                        <p className="text-sm text-muted-foreground">
                          Your responses to all 18 categories are analyzed to identify your current knowledge level in each area.
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex gap-3">
                      <div className="mt-1">
                        <div className="bg-primary text-primary-foreground w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold">2</div>
                      </div>
                      <div>
                        <h4 className="font-semibold">Growth Areas Identification</h4>
                        <p className="text-sm text-muted-foreground">
                          Categories where your scores fall below 70% are prioritized as growth areas that need immediate focus.
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex gap-3">
                      <div className="mt-1">
                        <div className="bg-primary text-primary-foreground w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold">3</div>
                      </div>
                      <div>
                        <h4 className="font-semibold">Strength Recognition</h4>
                        <p className="text-sm text-muted-foreground">
                          Categories where you scored above 80% are considered strengths and are used to build confidence while supporting growth areas.
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex gap-3">
                      <div className="mt-1">
                        <div className="bg-primary text-primary-foreground w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold">4</div>
                      </div>
                      <div>
                        <h4 className="font-semibold">Module Matching</h4>
                        <p className="text-sm text-muted-foreground">
                          The system matches your growth areas with relevant learning modules, balancing beginner, intermediate, and advanced content.
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex gap-3">
                      <div className="mt-1">
                        <div className="bg-primary text-primary-foreground w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold">5</div>
                      </div>
                      <div>
                        <h4 className="font-semibold">Learning Sequence</h4>
                        <p className="text-sm text-muted-foreground">
                          Modules are arranged in an optimal sequence, with fundamental knowledge preceding more advanced topics for best retention.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <Separator className="my-4" />
                  
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-semibold">Ready to see your personalized path?</h4>
                      <p className="text-sm text-muted-foreground">Your custom learning journey awaits.</p>
                    </div>
                    <Button 
                      className="flex items-center gap-1"
                      onClick={() => navigate('/dashboard')}
                    >
                      View Learning Path <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        
        <div className="col-span-1 space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Level Breakdown</CardTitle>
              <CardDescription>Understanding your assessment levels</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-4">
                <div className="flex items-start gap-2">
                  <div className="w-3 h-3 rounded-full mt-1.5" style={{ backgroundColor: getLevelColor('mastery') }} />
                  <div>
                    <h4 className="font-semibold">Mastery (90-100%)</h4>
                    <p className="text-xs text-muted-foreground">{levelDescriptions.mastery}</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-2">
                  <div className="w-3 h-3 rounded-full mt-1.5" style={{ backgroundColor: getLevelColor('accomplished') }} />
                  <div>
                    <h4 className="font-semibold">Accomplished (75-89%)</h4>
                    <p className="text-xs text-muted-foreground">{levelDescriptions.accomplished}</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-2">
                  <div className="w-3 h-3 rounded-full mt-1.5" style={{ backgroundColor: getLevelColor('proficient') }} />
                  <div>
                    <h4 className="font-semibold">Proficient (60-74%)</h4>
                    <p className="text-xs text-muted-foreground">{levelDescriptions.proficient}</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-2">
                  <div className="w-3 h-3 rounded-full mt-1.5" style={{ backgroundColor: getLevelColor('developing') }} />
                  <div>
                    <h4 className="font-semibold">Developing (40-59%)</h4>
                    <p className="text-xs text-muted-foreground">{levelDescriptions.developing}</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-2">
                  <div className="w-3 h-3 rounded-full mt-1.5" style={{ backgroundColor: getLevelColor('beginner') }} />
                  <div>
                    <h4 className="font-semibold">Beginner (0-39%)</h4>
                    <p className="text-xs text-muted-foreground">{levelDescriptions.beginner}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>What's Next?</CardTitle>
              <CardDescription>Your development journey</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-4">
                <div className="flex items-start gap-2">
                  <div className="p-1 bg-muted rounded-full">
                    <ClipboardList className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold">Review Your Results</h4>
                    <p className="text-xs text-muted-foreground">Understand your strengths and growth areas</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-2">
                  <div className="p-1 bg-muted rounded-full">
                    <Star className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold">Start Recommended Modules</h4>
                    <p className="text-xs text-muted-foreground">Begin with modules addressing your growth areas</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-2">
                  <div className="p-1 bg-muted rounded-full">
                    <Award className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold">Track Your Progress</h4>
                    <p className="text-xs text-muted-foreground">Monitor your development on the dashboard</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-2">
                  <div className="p-1 bg-muted rounded-full">
                    <AlertCircle className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold">Reassess Periodically</h4>
                    <p className="text-xs text-muted-foreground">Take the assessment again after completing modules</p>
                  </div>
                </div>
                
                <Separator className="my-2" />
                
                <Button 
                  className="w-full flex items-center justify-center gap-2"
                  onClick={() => navigate('/dashboard')}
                >
                  Go to Dashboard
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}