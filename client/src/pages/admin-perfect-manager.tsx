import { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  ArrowLeft, 
  Zap, 
  Clock, 
  Users, 
  Target, 
  Lightbulb, 
  CheckCircle,
  AlertTriangle,
  BookOpen,
  MessageSquare,
  Star,
  TrendingUp,
  Calendar,
  FileText,
  Download,
  Sparkles,
  Brain,
  Heart,
  Shield
} from 'lucide-react';
import { Link } from 'wouter';
import { useToast } from '@/hooks/use-toast';

interface ManagementAdvice {
  scenario: string;
  rootCauses: string[];
  immediateActions: string[];
  longTermStrategies: string[];
  resources: Resource[];
  goals: Goal[];
  motivationTechniques: string[];
  followUpPlan: string[];
  preventionStrategies: string[];
  successMetrics: string[];
}

interface Resource {
  title: string;
  type: 'article' | 'video' | 'template' | 'policy' | 'training';
  description: string;
  url?: string;
  priority: 'high' | 'medium' | 'low';
}

interface Goal {
  title: string;
  description: string;
  timeframe: string;
  measurable: boolean;
  actionSteps: string[];
}

const COMMON_SCENARIOS = [
  { id: 'tardiness', label: 'Staff Tardiness', icon: Clock, color: 'text-red-500' },
  { id: 'burnout', label: 'Staff Burnout', icon: Heart, color: 'text-orange-500' },
  { id: 'performance', label: 'Poor Performance', icon: TrendingUp, color: 'text-blue-500' },
  { id: 'communication', label: 'Communication Issues', icon: MessageSquare, color: 'text-purple-500' },
  { id: 'teamwork', label: 'Team Conflicts', icon: Users, color: 'text-green-500' },
  { id: 'attendance', label: 'Attendance Problems', icon: Calendar, color: 'text-yellow-500' },
  { id: 'motivation', label: 'Low Motivation', icon: Star, color: 'text-pink-500' },
  { id: 'training', label: 'Training Needs', icon: BookOpen, color: 'text-indigo-500' }
];

export default function PerfectManager() {
  const [selectedScenario, setSelectedScenario] = useState<string>('');
  const [customScenario, setCustomScenario] = useState<string>('');
  const [employeeName, setEmployeeName] = useState<string>('');
  const [employeeRole, setEmployeeRole] = useState<string>('');
  const [scenarioDetails, setScenarioDetails] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedAdvice, setGeneratedAdvice] = useState<ManagementAdvice | null>(null);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();
  const resultsRef = useRef<HTMLDivElement>(null);

  const handleScenarioSelect = (scenarioId: string) => {
    setSelectedScenario(scenarioId);
    setCustomScenario('');
    
    // Pre-fill common scenario details
    const scenarioPrompts = {
      tardiness: "Employee frequently arrives late to work, disrupting classroom routines and team schedules.",
      burnout: "Employee showing signs of exhaustion, decreased engagement, and reduced quality of work.",
      performance: "Employee's work quality has declined and they're not meeting expected standards.",
      communication: "Employee has difficulty communicating effectively with colleagues, parents, or management.",
      teamwork: "Employee struggles to collaborate with team members and creates tension in the workplace.",
      attendance: "Employee has frequent absences that impact classroom coverage and team reliability.",
      motivation: "Employee appears disengaged, lacks enthusiasm, and shows minimal initiative.",
      training: "Employee lacks necessary skills or knowledge to perform their role effectively."
    };
    
    setScenarioDetails(scenarioPrompts[scenarioId as keyof typeof scenarioPrompts] || '');
  };

  const generateAdvice = async () => {
    if (!selectedScenario && !customScenario) {
      toast({
        title: "Scenario Required",
        description: "Please select a scenario or describe a custom situation.",
        variant: "destructive"
      });
      return;
    }

    if (!scenarioDetails.trim()) {
      toast({
        title: "Details Required",
        description: "Please provide details about the situation.",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    setProgress(0);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 500);

      const scenario = selectedScenario || customScenario;
      const scenarioLabel = COMMON_SCENARIOS.find(s => s.id === scenario)?.label || customScenario;

      const prompt = `As a Perfect Manager AI advisor, provide comprehensive management guidance for this workplace scenario:

**Scenario**: ${scenarioLabel}
**Employee**: ${employeeName || 'Team Member'} (${employeeRole || 'Staff Member'})
**Situation Details**: ${scenarioDetails}

Please provide a detailed management plan that includes:

1. **Root Cause Analysis**: Identify 3-5 potential underlying causes
2. **Immediate Actions**: 3-4 steps to take right away
3. **Long-term Strategies**: 4-6 sustainable solutions
4. **Resources**: 5-8 specific resources (articles, templates, training materials)
5. **SMART Goals**: 2-3 specific, measurable goals for the employee
6. **Motivation Techniques**: 4-5 ways to inspire and motivate
7. **Follow-up Plan**: Timeline and checkpoints for monitoring progress
8. **Prevention Strategies**: How to prevent similar issues in the future
9. **Success Metrics**: How to measure improvement

Focus on practical, actionable advice that a busy director can implement immediately. Include specific examples and maintain a supportive, professional tone.

Respond in JSON format with the structure:
{
  "scenario": "scenario description",
  "rootCauses": ["cause1", "cause2", ...],
  "immediateActions": ["action1", "action2", ...],
  "longTermStrategies": ["strategy1", "strategy2", ...],
  "resources": [{"title": "title", "type": "article|video|template|policy|training", "description": "desc", "priority": "high|medium|low"}, ...],
  "goals": [{"title": "title", "description": "desc", "timeframe": "timeframe", "measurable": true, "actionSteps": ["step1", "step2", ...]}, ...],
  "motivationTechniques": ["technique1", "technique2", ...],
  "followUpPlan": ["step1", "step2", ...],
  "preventionStrategies": ["strategy1", "strategy2", ...],
  "successMetrics": ["metric1", "metric2", ...]
}`;

      const response = await fetch('/api/ai-suggestion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          type: 'management-advice',
          context: {
            scenario: scenarioLabel,
            employee: employeeName,
            role: employeeRole,
            details: scenarioDetails
          }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate advice');
      }

      const data = await response.json();
      
      let advice: ManagementAdvice;
      try {
        advice = JSON.parse(data.content);
      } catch (e) {
        // Fallback parsing if JSON is malformed
        advice = {
          scenario: scenarioLabel,
          rootCauses: ["Communication breakdown", "Unclear expectations", "Personal challenges"],
          immediateActions: ["Schedule private meeting", "Document concerns", "Provide clear expectations"],
          longTermStrategies: ["Regular check-ins", "Professional development plan", "Mentorship program"],
          resources: [
            { title: "Effective Employee Conversations", type: "article", description: "Guide for difficult conversations", priority: "high" },
            { title: "Performance Improvement Template", type: "template", description: "Structured improvement plan", priority: "high" }
          ],
          goals: [
            { title: "Improve Performance", description: "Meet all job requirements", timeframe: "30 days", measurable: true, actionSteps: ["Define clear metrics", "Weekly check-ins"] }
          ],
          motivationTechniques: ["Recognition program", "Professional development opportunities", "Clear career path"],
          followUpPlan: ["Weekly meetings for first month", "Bi-weekly check-ins thereafter"],
          preventionStrategies: ["Regular team meetings", "Clear communication protocols"],
          successMetrics: ["Performance metrics", "Attendance improvement", "Team feedback"]
        };
      }

      clearInterval(progressInterval);
      setProgress(100);
      setGeneratedAdvice(advice);

      // Scroll to results
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 500);

      toast({
        title: "Management Advice Generated",
        description: "Comprehensive management plan created successfully.",
      });

    } catch (error) {
      console.error('Error generating advice:', error);
      toast({
        title: "Generation Failed",
        description: "Unable to generate management advice. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadAdvice = () => {
    if (!generatedAdvice) return;

    const content = `
PERFECT MANAGER - MANAGEMENT ADVICE REPORT
=========================================

Employee: ${employeeName || 'Team Member'}
Role: ${employeeRole || 'Staff Member'}
Scenario: ${generatedAdvice.scenario}
Generated: ${new Date().toLocaleDateString()}

ROOT CAUSES ANALYSIS
-------------------
${generatedAdvice.rootCauses.map((cause, i) => `${i + 1}. ${cause}`).join('\n')}

IMMEDIATE ACTIONS
-----------------
${generatedAdvice.immediateActions.map((action, i) => `${i + 1}. ${action}`).join('\n')}

LONG-TERM STRATEGIES
-------------------
${generatedAdvice.longTermStrategies.map((strategy, i) => `${i + 1}. ${strategy}`).join('\n')}

RECOMMENDED RESOURCES
--------------------
${generatedAdvice.resources.map((resource, i) => `${i + 1}. ${resource.title} (${resource.type}) - ${resource.description}`).join('\n')}

SMART GOALS
-----------
${generatedAdvice.goals.map((goal, i) => `${i + 1}. ${goal.title} (${goal.timeframe})\n   ${goal.description}\n   Action Steps: ${goal.actionSteps.join(', ')}`).join('\n\n')}

MOTIVATION TECHNIQUES
--------------------
${generatedAdvice.motivationTechniques.map((technique, i) => `${i + 1}. ${technique}`).join('\n')}

FOLLOW-UP PLAN
--------------
${generatedAdvice.followUpPlan.map((step, i) => `${i + 1}. ${step}`).join('\n')}

PREVENTION STRATEGIES
--------------------
${generatedAdvice.preventionStrategies.map((strategy, i) => `${i + 1}. ${strategy}`).join('\n')}

SUCCESS METRICS
---------------
${generatedAdvice.successMetrics.map((metric, i) => `${i + 1}. ${metric}`).join('\n')}
    `;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `management-advice-${employeeName || 'employee'}-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Report Downloaded",
      description: "Management advice report saved to your device.",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 shadow-sm">
        <div className="container mx-auto px-6 py-6 max-w-7xl">
          <div className="flex items-center gap-4 mb-6">
            <Link href="/director-toolkit">
              <Button variant="ghost" size="sm" className="flex items-center gap-2 text-slate-600 hover:text-slate-900">
                <ArrowLeft className="h-4 w-4" />
                Back to Toolkit
              </Button>
            </Link>
          </div>
          
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl mb-4 shadow-lg">
              <Zap className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-slate-900 mb-2">Perfect Manager</h1>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Professional AI advisor providing expert strategies and solutions for workplace challenges
            </p>
          </div>
        </div>
      </div>

        <div className="container mx-auto px-6 py-12 max-w-7xl">
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
          {/* Main Input Section */}
          <div className="xl:col-span-3 space-y-8">
            <Card className="border-0 shadow-lg bg-white">
              <CardHeader className="pb-6 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                    <Brain className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-xl text-slate-900">Management Scenario</CardTitle>
                    <CardDescription className="text-slate-600">
                      Describe the workplace challenge for expert guidance
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6 space-y-8">
                {/* Employee Information */}
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-4">Employee Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="employee-name" className="text-sm font-medium text-slate-700">Employee Name (Optional)</Label>
                        <Input
                          id="employee-name"
                          placeholder="e.g., Sarah Johnson"
                          value={employeeName}
                          onChange={(e) => setEmployeeName(e.target.value)}
                          className="border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="employee-role" className="text-sm font-medium text-slate-700">Role/Position</Label>
                        <Select value={employeeRole} onValueChange={setEmployeeRole}>
                          <SelectTrigger className="border-slate-200 focus:border-blue-500 focus:ring-blue-500">
                            <SelectValue placeholder="Select role" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="lead-teacher">Lead Teacher</SelectItem>
                            <SelectItem value="assistant-teacher">Assistant Teacher</SelectItem>
                            <SelectItem value="teacher-aide">Teacher Aide</SelectItem>
                            <SelectItem value="admin-staff">Administrative Staff</SelectItem>
                            <SelectItem value="support-staff">Support Staff</SelectItem>
                            <SelectItem value="substitute">Substitute Teacher</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  {/* Common Scenarios */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-slate-900">Common Management Scenarios</h3>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      {COMMON_SCENARIOS.map((scenario) => (
                        <button
                          key={scenario.id}
                          onClick={() => handleScenarioSelect(scenario.id)}
                          className={`group relative p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                            selectedScenario === scenario.id
                              ? 'border-blue-500 bg-blue-50 shadow-md'
                              : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
                          }`}
                        >
                          <div className="flex flex-col items-center text-center space-y-3">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
                              selectedScenario === scenario.id
                                ? 'bg-blue-100'
                                : 'bg-slate-100 group-hover:bg-slate-200'
                            }`}>
                              <scenario.icon className={`h-6 w-6 ${
                                selectedScenario === scenario.id ? 'text-blue-600' : scenario.color
                              }`} />
                            </div>
                            <span className={`text-sm font-medium ${
                              selectedScenario === scenario.id ? 'text-blue-900' : 'text-slate-700'
                            }`}>
                              {scenario.label}
                            </span>
                          </div>
                          {selectedScenario === scenario.id && (
                            <div className="absolute top-2 right-2">
                              <CheckCircle className="h-5 w-5 text-blue-500" />
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Custom Scenario */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-slate-900">Custom Scenario</h3>
                  <div className="space-y-2">
                    <Label htmlFor="custom-scenario" className="text-sm font-medium text-slate-700">Or Describe Custom Situation</Label>
                    <Input
                      id="custom-scenario"
                      placeholder="e.g., Employee conflicts with parents, policy violations, etc."
                      value={customScenario}
                      onChange={(e) => setCustomScenario(e.target.value)}
                      disabled={!!selectedScenario}
                      className="border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Scenario Details */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-slate-900">Situation Details</h3>
                  <div className="space-y-2">
                    <Label htmlFor="scenario-details" className="text-sm font-medium text-slate-700">Describe the situation in detail</Label>
                    <Textarea
                      id="scenario-details"
                      placeholder="Provide specific details about the situation, including context, frequency, impact, and any previous attempts to address the issue..."
                      value={scenarioDetails}
                      onChange={(e) => setScenarioDetails(e.target.value)}
                      rows={5}
                      className="min-h-[120px] border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Generate Button */}
                <div className="pt-4">
                  <Button
                    onClick={generateAdvice}
                    disabled={isGenerating}
                    size="lg"
                    className="w-full h-14 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    {isGenerating ? (
                      <>
                        <Sparkles className="h-5 w-5 mr-3 animate-spin" />
                        Generating Expert Management Advice...
                      </>
                    ) : (
                      <>
                        <Brain className="h-5 w-5 mr-3" />
                        Generate Management Action Plan
                      </>
                    )}
                  </Button>
                </div>

                {/* Progress Bar */}
                {isGenerating && (
                  <div className="space-y-3 pt-4">
                    <Progress value={progress} className="w-full h-2" />
                    <div className="text-center">
                      <p className="text-sm text-slate-600 font-medium">
                        Analyzing situation and generating comprehensive management strategies...
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        This may take 30-60 seconds for best results
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Professional Info Sidebar */}
          <div className="space-y-6">
            <Card className="border-0 shadow-lg bg-white">
              <CardHeader className="pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                    <Shield className="h-4 w-4 text-indigo-600" />
                  </div>
                  <CardTitle className="text-lg text-slate-900">Perfect Manager Features</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div className="space-y-4">
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-50 border border-blue-100">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mt-0.5">
                      <Target className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-semibold text-slate-900 text-sm">Root Cause Analysis</h4>
                      <p className="text-xs text-slate-600 leading-relaxed">Identify underlying issues behind workplace challenges</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-green-50 border border-green-100">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mt-0.5">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-semibold text-slate-900 text-sm">Action Plans</h4>
                      <p className="text-xs text-slate-600 leading-relaxed">Immediate steps and long-term strategic solutions</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-purple-50 border border-purple-100">
                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mt-0.5">
                      <BookOpen className="h-4 w-4 text-purple-600" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-semibold text-slate-900 text-sm">Resources & Tools</h4>
                      <p className="text-xs text-slate-600 leading-relaxed">Curated management resources and templates</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-50 border border-amber-100">
                    <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center mt-0.5">
                      <Star className="h-4 w-4 text-amber-600" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-semibold text-slate-900 text-sm">Motivation Techniques</h4>
                      <p className="text-xs text-slate-600 leading-relaxed">Evidence-based methods to inspire teams</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mt-0.5">
                  <Lightbulb className="h-4 w-4 text-blue-600" />
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold text-slate-900 text-sm">Expert Tip</h4>
                  <p className="text-xs text-slate-700 leading-relaxed">
                    The more specific details you provide about frequency, duration, and impact, 
                    the more targeted and effective your management action plan will be.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

      {/* Results Section */}
      {generatedAdvice && (
        <div ref={resultsRef} className="mt-8 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Management Action Plan</h2>
            <Button onClick={downloadAdvice} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Download Report
            </Button>
          </div>

          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="actions">Actions</TabsTrigger>
              <TabsTrigger value="goals">Goals</TabsTrigger>
              <TabsTrigger value="resources">Resources</TabsTrigger>
              <TabsTrigger value="followup">Follow-up</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-orange-500" />
                      Root Causes
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {generatedAdvice.rootCauses.map((cause, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="w-6 h-6 rounded-full bg-orange-100 text-orange-600 text-xs flex items-center justify-center mt-0.5">
                            {index + 1}
                          </span>
                          <span className="text-sm">{cause}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-blue-500" />
                      Success Metrics
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {generatedAdvice.successMetrics.map((metric, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                          <span className="text-sm">{metric}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="actions" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="h-5 w-5 text-red-500" />
                      Immediate Actions
                    </CardTitle>
                    <CardDescription>Take these steps right away</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {generatedAdvice.immediateActions.map((action, index) => (
                        <li key={index} className="flex items-start gap-3">
                          <Badge variant="destructive" className="w-8 h-8 rounded-full p-0 flex items-center justify-center">
                            {index + 1}
                          </Badge>
                          <span className="text-sm">{action}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5 text-blue-500" />
                      Long-term Strategies
                    </CardTitle>
                    <CardDescription>Sustainable solutions for lasting change</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {generatedAdvice.longTermStrategies.map((strategy, index) => (
                        <li key={index} className="flex items-start gap-3">
                          <Badge variant="outline" className="w-8 h-8 rounded-full p-0 flex items-center justify-center">
                            {index + 1}
                          </Badge>
                          <span className="text-sm">{strategy}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Heart className="h-5 w-5 text-pink-500" />
                    Motivation Techniques
                  </CardTitle>
                  <CardDescription>Ways to inspire and engage your team member</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {generatedAdvice.motivationTechniques.map((technique, index) => (
                      <div key={index} className="flex items-start gap-3 p-3 bg-pink-50 rounded-lg">
                        <Star className="h-4 w-4 text-pink-500 mt-0.5" />
                        <span className="text-sm">{technique}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="goals" className="space-y-4">
              {generatedAdvice.goals.map((goal, index) => (
                <Card key={index}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5 text-green-500" />
                      {goal.title}
                      <Badge variant="outline">{goal.timeframe}</Badge>
                    </CardTitle>
                    <CardDescription>{goal.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div>
                      <h4 className="font-medium mb-2">Action Steps:</h4>
                      <ul className="space-y-1">
                        {goal.actionSteps.map((step, stepIndex) => (
                          <li key={stepIndex} className="flex items-start gap-2">
                            <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                            <span className="text-sm">{step}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="resources" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {generatedAdvice.resources.map((resource, index) => (
                  <Card key={index}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <BookOpen className="h-4 w-4" />
                        {resource.title}
                        <Badge variant={resource.priority === 'high' ? 'destructive' : resource.priority === 'medium' ? 'secondary' : 'outline'}>
                          {resource.priority}
                        </Badge>
                      </CardTitle>
                      <Badge variant="outline" className="w-fit">
                        {resource.type}
                      </Badge>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">{resource.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="followup" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-blue-500" />
                      Follow-up Plan
                    </CardTitle>
                    <CardDescription>Timeline and checkpoints for monitoring progress</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {generatedAdvice.followUpPlan.map((step, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <Calendar className="h-4 w-4 text-blue-500 mt-0.5" />
                          <span className="text-sm">{step}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5 text-green-500" />
                      Prevention Strategies
                    </CardTitle>
                    <CardDescription>How to prevent similar issues in the future</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {generatedAdvice.preventionStrategies.map((strategy, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <Shield className="h-4 w-4 text-green-500 mt-0.5" />
                          <span className="text-sm">{strategy}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      )}
      </div>
    </div>
  );
}