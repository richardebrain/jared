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
  Shield,
  Send
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
  coreValuesConnection: string[];
  conversationScript: {
    openingLines: string[];
    listeningPrompts: string[];
    responseScenarios: Array<{
      teacherResponse: string;
      directorReply: string;
      followUpQuestion: string;
    }>;
    closingStatements: string[];
  };
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
  const [chatMessages, setChatMessages] = useState<Array<{role: 'user' | 'assistant', content: string}>>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
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

  const sendChatMessage = async () => {
    if (!chatInput.trim() || !generatedAdvice) return;
    
    const userMessage = chatInput.trim();
    setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsChatLoading(true);

    try {
      const response = await fetch('/api/ai-suggestion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: userMessage,
          type: 'empathy-coaching',
          context: {
            scenario: selectedScenario || customScenario,
            employee: employeeName,
            originalAdvice: generatedAdvice,
            userQuestion: userMessage,
            chatHistory: chatMessages.slice(-4) // Last 4 messages for context
          }
        })
      });

      if (!response.ok) throw new Error('Failed to get coaching response');
      
      const data = await response.json();
      setChatMessages(prev => [...prev, { role: 'assistant', content: data.content }]);
    } catch (error) {
      toast({
        title: "Chat Error",
        description: "Failed to get empathy coaching response. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsChatLoading(false);
    }
  };

  const initializeChat = () => {
    if (generatedAdvice && chatMessages.length === 0) {
      const scenarioName = COMMON_SCENARIOS.find(s => s.id === selectedScenario)?.label || customScenario;
      const welcomeMessage = `I'm here to help you implement the management plan for ${employeeName || 'your team member'}'s ${scenarioName.toLowerCase()} situation. I can provide empathy coaching, help you practice difficult conversations, or answer questions about applying the legendary leadership principles. What would you like to explore first?`;
      setChatMessages([{ role: 'assistant', content: welcomeMessage }]);
    }
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

      const scenarioSpecificGuidance = {
        tardiness: "Focus on understanding root causes like transportation issues, childcare challenges, or work-life balance struggles that ECE professionals often face due to demanding schedules and low pay.",
        burnout: "Address the emotional exhaustion unique to caring for young children all day, inadequate compensation for the level of responsibility, and the lack of recognition for the professional skills required in ECE.",
        performance: "Consider that performance issues in ECE often stem from lack of training in child development, classroom management challenges with young children, or overwhelming workloads.",
        communication: "ECE communication issues often involve difficult conversations with parents about child development, behavior concerns, or family dynamics that require specialized skills.",
        teamwork: "Team conflicts in preschools often arise from different philosophies about child-rearing, classroom management approaches, or stress from working in emotionally demanding environments.",
        attendance: "Attendance issues in ECE may be related to low wages forcing second jobs, own childcare challenges, or health issues from exposure to illnesses in the classroom.",
        motivation: "Low motivation in ECE often stems from feeling undervalued despite the importance of early childhood development, lack of career advancement opportunities, or emotional burnout.",
        training: "Training needs in ECE are often related to child development milestones, behavior guidance techniques, family engagement strategies, or documentation requirements."
      };

      const specificGuidance = scenarioSpecificGuidance[selectedScenario as keyof typeof scenarioSpecificGuidance] || "Consider the unique challenges and requirements of working with young children and their families.";

      const prompt = `You are the Perfect Manager AI, synthesizing the greatest leadership wisdom of all time. Channel the insights of:

🔥 **TONY ROBBINS**: Peak performance, state management, breakthrough strategies, human psychology
🤝 **DALE CARNEGIE**: How to Win Friends and Influence People, human relations mastery
📈 **STEPHEN COVEY**: 7 Habits of Highly Effective People, principle-centered leadership
💙 **BRENÉ BROWN**: Vulnerability-based leadership, courage, empathy, trust-building
🎯 **SIMON SINEK**: Start With Why, purpose-driven leadership, authentic communication
⚡ **ZIG ZIGLAR**: Motivation, positive thinking, goal achievement, helping others succeed

Apply these timeless principles to this specific early childhood education scenario:

**SCENARIO TYPE**: ${scenarioLabel}
**Employee**: ${employeeName || 'Team Member'} (${employeeRole || 'Preschool Teacher'})
**Situation**: ${scenarioDetails}
**ECE Context**: ${specificGuidance}

**LEADERSHIP PRINCIPLES TO APPLY**:
- Carnegie's "Begin with praise and honest appreciation"
- Covey's "Seek first to understand, then to be understood"
- Brown's vulnerability and empathy-first approach
- Robbins' state management and breakthrough questioning
- Sinek's purpose connection and "Start with Why"
- Ziglar's "You can have everything in life you want if you help others get what they want"

Transform this ${scenarioLabel.toLowerCase()} challenge into a breakthrough moment using proven leadership strategies. Create solutions that inspire, empower, and create lasting positive change.

Provide a comprehensive leadership plan for ${scenarioLabel.toLowerCase()} that synthesizes these expert approaches:

1. **Root Cause Analysis for ${scenarioLabel}**: Identify 4-6 specific underlying causes directly related to ${scenarioLabel.toLowerCase()} in ECE settings. Be specific to this scenario type - do not use generic causes.

2. **Immediate Actions for ${scenarioLabel}**: 4-5 concrete steps specifically designed to address ${scenarioLabel.toLowerCase()}. First action must demonstrate care and understanding.

3. **Long-term Strategies for ${scenarioLabel}**: 5-7 sustainable solutions specifically targeting ${scenarioLabel.toLowerCase()} prevention and resolution in preschool environments.

4. **ECE-Specific Resources for ${scenarioLabel}**: 6-10 targeted resources specifically helpful for ${scenarioLabel.toLowerCase()} (include NAEYC materials, specialized training, tools, templates, or support systems).

5. **SMART Goals for ${scenarioLabel} Improvement**: 2-3 measurable goals specifically focused on resolving ${scenarioLabel.toLowerCase()} while supporting teacher well-being.

6. **Motivation Techniques for ${scenarioLabel}**: 5-7 specific ways to inspire and motivate during ${scenarioLabel.toLowerCase()} situations, connecting to ECE passion and child development impact.

7. **Follow-up Plan for ${scenarioLabel}**: Specific timeline and check-in strategy designed for monitoring ${scenarioLabel.toLowerCase()} improvement.

8. **Prevention Strategies for ${scenarioLabel}**: Proactive measures specifically designed to prevent future ${scenarioLabel.toLowerCase()} incidents in ECE settings.

9. **Success Metrics for ${scenarioLabel}**: Specific, measurable indicators that ${scenarioLabel.toLowerCase()} is improving, including both professional and personal well-being measures.

10. **Core Values Connection for ${scenarioLabel}**: How addressing ${scenarioLabel.toLowerCase()} connects to fundamental ECE values and the teacher's calling to nurture children.

11. **Conversation Script for ${scenarioLabel}**: Provide a detailed conversation guide including:
    - 3-4 caring opening lines that show empathy and set a supportive tone
    - 4-5 listening prompts to encourage the teacher to share their perspective
    - 5-6 response scenarios with common teacher reactions and suggested director replies that inspire action and change
    - 3-4 positive closing statements that remind them "we get to write chapter one," it's a privilege to work with children, encourage mindful mornings, breathing, self-care, bringing their best energy, and that kids will love what they love

Include industry insights about why ECE professionals face unique challenges and how their work impacts child development. Reference the emotional labor involved in caring for young children and the need for leaders to model the care they want teachers to show children.

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
  "successMetrics": ["metric1", "metric2", ...],
  "coreValuesConnection": ["value1", "value2", ...],
  "conversationScript": {
    "openingLines": ["opening1", "opening2", ...],
    "listeningPrompts": ["prompt1", "prompt2", ...],
    "responseScenarios": [
      {
        "teacherResponse": "Teacher might say this...",
        "directorReply": "Director should respond with...",
        "followUpQuestion": "Then ask..."
      }
    ],
    "closingStatements": ["closing1", "closing2", ...]
  }
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
      
      console.log("Raw AI response:", data.content.substring(0, 500) + "...");
      
      let advice: ManagementAdvice;
      try {
        // Try to parse the JSON response
        const parsedAdvice = JSON.parse(data.content);
        console.log("Successfully parsed AI advice:", parsedAdvice.scenario);
        
        // Ensure conversationScript exists with minimal default structure
        advice = {
          ...parsedAdvice,
          conversationScript: parsedAdvice.conversationScript || {
            openingLines: ["I wanted to talk with you about something important."],
            listeningPrompts: ["Can you tell me more about that?"],
            responseScenarios: [{
              teacherResponse: "I'm doing fine.",
              directorReply: "I'm here to support you.",
              followUpQuestion: "How can I help?"
            }],
            closingStatements: ["Thank you for sharing with me."]
          }
        };
      } catch (e) {
        console.error("JSON parsing failed:", e);
        console.error("Raw content that failed to parse:", data.content);
        
        // If parsing fails, try to extract content between JSON markers
        let jsonContent = data.content;
        if (jsonContent.includes('```json')) {
          const start = jsonContent.indexOf('```json') + 7;
          const end = jsonContent.lastIndexOf('```');
          if (end > start) {
            jsonContent = jsonContent.substring(start, end).trim();
          }
        }
        
        try {
          const parsedAdvice = JSON.parse(jsonContent);
          console.log("Successfully parsed cleaned JSON:", parsedAdvice.scenario);
          advice = {
            ...parsedAdvice,
            conversationScript: parsedAdvice.conversationScript || {
              openingLines: ["I wanted to talk with you about something important."],
              listeningPrompts: ["Can you tell me more about that?"],
              responseScenarios: [{
                teacherResponse: "I'm doing fine.",
                directorReply: "I'm here to support you.",
                followUpQuestion: "How can I help?"
              }],
              closingStatements: ["Thank you for sharing with me."]
            }
          };
        } catch (e2) {
          console.error("All JSON parsing attempts failed - trying partial recovery");
          
          // Attempt to build a minimal response from the raw content
          const scenarioLabel = COMMON_SCENARIOS.find(s => s.id === selectedScenario)?.label || customScenario;
          
          // Extract any visible content from the truncated response
          let extractedContent = data.content;
          if (extractedContent.includes('rootCauses')) {
            try {
              // Try to extract just the root causes if they're visible
              const rootCausesMatch = extractedContent.match(/"rootCauses":\s*\[(.*?)\]/s);
              const rootCauses = rootCausesMatch ? 
                rootCausesMatch[1].split('",').map(cause => cause.replace(/"/g, '').trim()).filter(c => c) :
                [`Understanding the root causes of ${scenarioLabel.toLowerCase()} requires careful assessment and empathetic listening.`];
              
              advice = {
                scenario: scenarioLabel,
                rootCauses: rootCauses.slice(0, 4), // Take first 4 if we found them
                immediateActions: [
                  "Schedule a caring one-on-one conversation to understand their perspective",
                  "Apply Dale Carnegie's principle: Begin with praise and honest appreciation",
                  "Use Stephen Covey's approach: Seek first to understand, then to be understood",
                  "Show genuine care and empathy as Brené Brown teaches"
                ],
                longTermStrategies: [
                  "Implement Tony Robbins' breakthrough questioning to uncover core issues",
                  "Apply Simon Sinek's 'Start with Why' to reconnect with purpose",
                  "Use Zig Ziglar's approach: Help them achieve what they want",
                  "Create systematic support following Covey's effectiveness principles"
                ],
                resources: [
                  { title: "Leadership Conversation Guide", type: "template", description: "Based on Carnegie and Covey principles", priority: "high" },
                  { title: "Empathy-Based Feedback Framework", type: "training", description: "Brené Brown's vulnerable leadership approach", priority: "high" }
                ],
                goals: [
                  { title: "Restore Performance Excellence", description: "Using proven leadership principles", timeframe: "30-60 days", measurable: true, actionSteps: ["Apply breakthrough questioning", "Create support systems", "Monitor progress"] }
                ],
                motivationTechniques: [
                  "Connect work to higher purpose (Sinek's Why)",
                  "Celebrate small wins (Robbins' state management)",
                  "Show genuine appreciation (Carnegie's principles)",
                  "Build on strengths (Covey's effectiveness)"
                ],
                followUpPlan: [
                  "Weekly check-ins using empathetic listening",
                  "Apply continuous improvement principles",
                  "Monitor breakthrough moments"
                ],
                preventionStrategies: [
                  "Regular purpose connection conversations",
                  "Systematic appreciation practices",
                  "Proactive support systems"
                ],
                successMetrics: [
                  "Improved work quality indicators",
                  "Increased engagement and enthusiasm",
                  "Positive feedback from colleagues"
                ],
                coreValuesConnection: [
                  "Excellence in serving children through personal growth",
                  "Building relationships that matter",
                  "Creating positive impact through leadership"
                ],
                conversationScript: {
                  openingLines: [
                    "I want to start by recognizing all the wonderful things you bring to our children every day.",
                    "Your passion for early childhood education is something I truly value about you.",
                    "I'd love to understand how you're feeling about things and how I can better support you."
                  ],
                  listeningPrompts: [
                    "Help me understand your perspective on this.",
                    "What's been the most challenging part for you?",
                    "What would make the biggest difference in your day?",
                    "How can I better support you in your role?"
                  ],
                  responseScenarios: [
                    {
                      teacherResponse: "I'm struggling with classroom management lately.",
                      directorReply: "Thank you for sharing that with me. Classroom management is one of the most challenging skills, and it takes time to master. Let's work together to find strategies that feel authentic to you.",
                      followUpQuestion: "What specific situations feel most overwhelming to you?"
                    },
                    {
                      teacherResponse: "I feel like I'm not making a difference.",
                      directorReply: "I understand that feeling, and it takes courage to share that. Let me remind you why this work matters - we get to write chapter one of these children's educational stories. That's an incredible privilege.",
                      followUpQuestion: "What originally drew you to working with young children?"
                    }
                  ],
                  closingStatements: [
                    "Remember, we get to write chapter one with these children. What a privilege! Your authentic energy and passion make all the difference.",
                    "Take time for mindful mornings and self-care. You can't pour from an empty cup, and these children need your best self.",
                    "Kids will love what you love when you bring genuine enthusiasm. Let's work together to help you rediscover that spark."
                  ]
                }
              };
            } catch (extractError) {
              console.error("Content extraction also failed");
              toast({
                title: "Response Processing Error",
                description: "Unable to process AI response. Please try again with a shorter request.",
                variant: "destructive"
              });
              throw new Error("Failed to process AI response");
            }
          } else {
            toast({
              title: "Incomplete Response",
              description: "AI response was incomplete. Please try again.",
              variant: "destructive"
            });
            throw new Error("Incomplete AI response");
          }
        }
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

CORE VALUES CONNECTION
---------------------
${generatedAdvice.coreValuesConnection?.map((value, i) => `${i + 1}. ${value}`).join('\n') || 'Not specified'}
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

          <Tabs defaultValue="overview" className="w-full" onValueChange={(value) => {
            if (value === "coaching") {
              initializeChat();
            }
          }}>
            <TabsList className="grid w-full grid-cols-7">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="actions">Actions</TabsTrigger>
              <TabsTrigger value="goals">Goals</TabsTrigger>
              <TabsTrigger value="resources">Resources</TabsTrigger>
              <TabsTrigger value="script">Conversation Script</TabsTrigger>
              <TabsTrigger value="coaching">Empathy Coach</TabsTrigger>
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

            <TabsContent value="script" className="space-y-6">
              <div className="grid grid-cols-1 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MessageSquare className="h-5 w-5 text-purple-500" />
                      Conversation Script Guide
                    </CardTitle>
                    <CardDescription>Suggested talking points to inspire action and positive change</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    
                    {/* Opening Lines */}
                    <div>
                      <h4 className="font-semibold mb-3 text-purple-600">Opening Lines - Set a Caring Tone</h4>
                      <div className="space-y-2">
                        {generatedAdvice.conversationScript?.openingLines?.map((line, index) => (
                          <div key={index} className="p-3 bg-purple-50 rounded-lg border-l-4 border-purple-200">
                            <p className="text-sm italic">"{line}"</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Listening Prompts */}
                    <div>
                      <h4 className="font-semibold mb-3 text-blue-600">Listening Prompts - Encourage Sharing</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {generatedAdvice.conversationScript?.listeningPrompts?.map((prompt, index) => (
                          <div key={index} className="p-3 bg-blue-50 rounded-lg">
                            <p className="text-sm">• {prompt}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Response Scenarios */}
                    <div>
                      <h4 className="font-semibold mb-3 text-green-600">Response Scenarios - Inspire & Guide</h4>
                      <div className="space-y-4">
                        {generatedAdvice.conversationScript?.responseScenarios?.map((scenario, index) => (
                          <Card key={index} className="border-green-200">
                            <CardContent className="p-4">
                              <div className="space-y-3">
                                <div>
                                  <p className="text-xs font-semibold text-gray-500 mb-1">IF TEACHER SAYS:</p>
                                  <p className="text-sm bg-gray-100 p-2 rounded italic">"{scenario.teacherResponse}"</p>
                                </div>
                                <div>
                                  <p className="text-xs font-semibold text-green-600 mb-1">YOUR INSPIRING REPLY:</p>
                                  <p className="text-sm bg-green-50 p-3 rounded border-l-4 border-green-300">"{scenario.directorReply}"</p>
                                </div>
                                <div>
                                  <p className="text-xs font-semibold text-blue-600 mb-1">FOLLOW-UP QUESTION:</p>
                                  <p className="text-sm bg-blue-50 p-2 rounded">"{scenario.followUpQuestion}"</p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>

                    {/* Closing Statements */}
                    <div>
                      <h4 className="font-semibold mb-3 text-orange-600">Inspiring Closing Statements</h4>
                      <div className="space-y-2">
                        {generatedAdvice.conversationScript?.closingStatements?.map((statement, index) => (
                          <div key={index} className="p-4 bg-gradient-to-r from-orange-50 to-yellow-50 rounded-lg border-l-4 border-orange-300">
                            <p className="text-sm font-medium">"{statement}"</p>
                          </div>
                        ))}
                      </div>
                    </div>

                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="coaching" className="space-y-4">
              <Card className="h-[600px] flex flex-col">
                <CardHeader className="flex-shrink-0 bg-gradient-to-r from-pink-50 to-purple-50 border-b">
                  <CardTitle className="flex items-center gap-2">
                    <Heart className="h-5 w-5 text-pink-500" />
                    AI-Powered Empathy Coach
                  </CardTitle>
                  <CardDescription>
                    Ongoing support programmed with Brené Brown's wisdom on vulnerability, courage, and authentic leadership
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col p-0">
                  {/* Chat Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {chatMessages.map((message, index) => (
                      <div
                        key={index}
                        className={`flex ${
                          message.role === 'user' ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        <div
                          className={`max-w-[80%] rounded-lg p-3 ${
                            message.role === 'user'
                              ? 'bg-blue-500 text-white'
                              : 'bg-pink-50 text-slate-800 border border-pink-100'
                          }`}
                        >
                          {message.role === 'assistant' && (
                            <div className="flex items-center gap-2 mb-2">
                              <Heart className="h-4 w-4 text-pink-500" />
                              <span className="text-xs font-medium text-pink-600">Empathy Coach</span>
                            </div>
                          )}
                          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        </div>
                      </div>
                    ))}
                    {isChatLoading && (
                      <div className="flex justify-start">
                        <div className="bg-pink-50 border border-pink-100 rounded-lg p-3">
                          <div className="flex items-center gap-2">
                            <Heart className="h-4 w-4 text-pink-500 animate-pulse" />
                            <span className="text-sm text-pink-600">Reflecting with empathy...</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Chat Input */}
                  <div className="flex-shrink-0 border-t p-4">
                    <div className="flex gap-2">
                      <Input
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        placeholder="Share your thoughts, concerns, or questions about implementing this plan..."
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            sendChatMessage();
                          }
                        }}
                        disabled={isChatLoading}
                        className="flex-1"
                      />
                      <Button
                        onClick={sendChatMessage}
                        disabled={!chatInput.trim() || isChatLoading}
                        size="sm"
                        className="bg-pink-500 hover:bg-pink-600"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-slate-500 mt-2">
                      This coach embodies Brené Brown's approach to vulnerability-based leadership and empathetic communication
                    </p>
                  </div>
                </CardContent>
              </Card>
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

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Heart className="h-5 w-5 text-pink-500" />
                      Core Values Connection
                    </CardTitle>
                    <CardDescription>How this situation connects to fundamental ECE values</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {generatedAdvice.coreValuesConnection?.map((value, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <Heart className="h-4 w-4 text-pink-500 mt-0.5" />
                          <span className="text-sm">{value}</span>
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