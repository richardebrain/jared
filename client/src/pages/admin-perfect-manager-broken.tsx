import React, { useState, useRef } from 'react';
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
  Mic,
  Play,
  Pause,
  Shield,
  Send,
  MessageCircle,
  Sun,
  Wind,
  Trophy,
  CheckSquare
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

// Conversation starter prompts for different scenarios
const getConversationStarters = (scenario: string): string[] => {
  const starters = {
    'Chronic Tardiness': [
      "I keep getting to work late and I know it's affecting the classroom",
      "Traffic has been terrible lately, that's why I'm always running behind",
      "I'm sorry I was late again today, I'll try to do better",
      "My childcare situation makes it hard to get here on time"
    ],
    'Staff Burnout': [
      "I'm not happy here, all the teachers are lazy",
      "I feel exhausted all the time and don't enjoy teaching anymore",
      "This job is way harder than I expected when I started",
      "I don't think I'm cut out for working with young children"
    ],
    'Poor Performance': [
      "I don't understand why my lesson plans keep getting rejected",
      "The kids just won't listen to me no matter what I try",
      "I feel like I'm failing as a teacher",
      "Other teachers seem to have it all figured out, but I don't"
    ],
    'Communication Issues': [
      "Parents keep complaining about things that aren't my fault",
      "I don't know how to talk to some of these difficult parents",
      "My teammates never include me in their conversations",
      "I feel like nobody listens to my ideas during meetings"
    ],
    'Lack of Motivation': [
      "I used to love this job but now it feels like just going through the motions",
      "I don't see the point in all these activities and lesson plans",
      "The kids are happy enough just playing, why do we need so much structure?",
      "I'm thinking about looking for a different career"
    ],
    'Team Conflicts': [
      "Sarah never helps with cleanup and it's not fair",
      "I feel like I'm doing all the work while others slack off",
      "The other teachers talk about me behind my back",
      "We can't agree on anything as a team"
    ],
    'Attendance Problems': [
      "I called in sick because I just couldn't face coming in today",
      "My family emergencies keep coming up and I have to miss work",
      "I know I've been absent a lot but things at home are complicated",
      "I don't feel appreciated here so sometimes I just don't come"
    ],
    'Training Needs': [
      "I never learned how to handle behavior problems in my training",
      "I feel lost when it comes to lesson planning for different age groups",
      "Nobody taught me how to work with children with special needs",
      "I wish I knew more about child development theories"
    ]
  };
  
  return starters[scenario] || [
    "I'm having some challenges in my role",
    "I wanted to talk to you about something that's been bothering me",
    "I'm not sure how to handle this situation",
    "I feel like I need some guidance"
  ];
};

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
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [audioType, setAudioType] = useState<'voice-boost' | 'reset' | null>(null);
  const [activeOption, setActiveOption] = useState<'situation' | 'boost' | 'tools' | null>(null);
  const { toast } = useToast();
  const resultsRef = useRef<HTMLDivElement>(null);

  // Audio control functions
  const stopCurrentAudio = () => {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
      setCurrentAudio(null);
      setIsAudioPlaying(false);
      setAudioType(null);
    }
  };

  const toggleAudioPlayback = () => {
    if (currentAudio) {
      if (isAudioPlaying) {
        currentAudio.pause();
        setIsAudioPlaying(false);
      } else {
        currentAudio.play();
        setIsAudioPlaying(true);
      }
    }
  };





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

  const downloadDirectorGuide = () => {
    if (!generatedAdvice) return;

    const content = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Director's Leadership Guide</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; margin: 40px; color: #333; }
        .header { text-align: center; border-bottom: 3px solid #2563eb; padding-bottom: 20px; margin-bottom: 30px; }
        .header h1 { color: #2563eb; margin: 0; font-size: 28px; }
        .header p { color: #666; margin: 5px 0; }
        .section { margin-bottom: 30px; page-break-inside: avoid; }
        .section h2 { color: #1e40af; border-left: 4px solid #2563eb; padding-left: 15px; margin-bottom: 15px; }
        .checkbox-item { display: flex; align-items: flex-start; margin-bottom: 12px; }
        .checkbox { width: 18px; height: 18px; border: 2px solid #2563eb; margin-right: 10px; flex-shrink: 0; margin-top: 2px; }
        .item-text { flex: 1; }
        .approach-box { border: 2px solid #7c3aed; border-radius: 8px; padding: 20px; margin-bottom: 20px; background: #faf5ff; }
        .approach-title { font-weight: bold; color: #6b21a8; margin-bottom: 10px; font-size: 16px; }
        .practical-action { background: #e0f2fe; border-left: 4px solid #0284c7; padding: 15px; margin: 10px 0; }
        .script-box { background: #f0f9ff; border: 1px solid #0ea5e9; border-radius: 8px; padding: 20px; margin: 15px 0; }
        .script-title { font-weight: bold; color: #0369a1; margin-bottom: 10px; }
        .footer { margin-top: 40px; text-align: center; color: #666; font-size: 12px; }
        @media print { .section { page-break-inside: avoid; } }
    </style>
</head>
<body>
    <div class="header">
        <h1>DIRECTOR'S LEADERSHIP GUIDE</h1>
        <p><strong>Situation:</strong> ${generatedAdvice.scenario}</p>
        <p><strong>Employee:</strong> ${employeeName || 'Team Member'} | <strong>Role:</strong> ${employeeRole || 'Staff Member'}</p>
        <p><strong>Generated:</strong> ${new Date().toLocaleDateString()}</p>
    </div>

    <div class="section">
        <h2>LEADERSHIP APPROACH BREAKDOWN</h2>
        ${generatedAdvice.motivationTechniques.map(technique => {
          // Extract the approach type and practical application
          const parts = technique.split(':');
          const approachType = parts[0] || 'Leadership Principle';
          const description = parts[1] || technique;
          
          return `
            <div class="approach-box">
                <div class="approach-title">${approachType.trim()}</div>
                <div class="practical-action">
                    <strong>How to Apply:</strong> ${description.trim()}
                </div>
            </div>
          `;
        }).join('')}
    </div>

    <div class="section">
        <h2>ROOT CAUSE ANALYSIS</h2>
        <p><em>Understanding the deeper issues behind the surface behavior:</em></p>
        ${generatedAdvice.rootCauses.map((cause, index) => `
            <div class="practical-action">
                <strong>${index + 1}.</strong> ${cause}
            </div>
        `).join('')}
    </div>

    <div class="section">
        <h2>IMMEDIATE ACTIONABLE STEPS</h2>
        <p><em>What to do in the next 1-2 weeks:</em></p>
        ${generatedAdvice.immediateActions.map(action => `
            <div class="checkbox-item">
                <div class="checkbox"></div>
                <div class="item-text">${action}</div>
            </div>
        `).join('')}
    </div>

    <div class="section">
        <h2>LONG-TERM DEVELOPMENT STRATEGY</h2>
        <p><em>Building sustainable change over 30-90 days:</em></p>
        ${generatedAdvice.longTermStrategies.map(strategy => `
            <div class="checkbox-item">
                <div class="checkbox"></div>
                <div class="item-text">${strategy}</div>
            </div>
        `).join('')}
    </div>

    <div class="section">
        <h2>CONVERSATION SCRIPTS & TALKING POINTS</h2>
        <div class="script-box">
            <div class="script-title">Opening the Conversation</div>
            <p>"${employeeName || 'Team member'}, I wanted to talk with you because I care about your success and the impact you have on our children. I've noticed some patterns around ${generatedAdvice.scenario.toLowerCase()}, and I want to understand how I can better support you."</p>
        </div>
        
        <div class="script-box">
            <div class="script-title">Active Listening Prompts</div>
            <ul>
                <li>"Help me understand what's been happening from your perspective..."</li>
                <li>"What challenges are you facing that I might not be aware of?"</li>
                <li>"What would make the biggest difference in helping you succeed?"</li>
            </ul>
        </div>

        <div class="script-box">
            <div class="script-title">Setting Expectations with Empathy</div>
            <p>"I believe in your potential and your calling to shape young minds. The work we do matters - we're writing chapter one in these children's lives. I need to see some changes in ${generatedAdvice.scenario.toLowerCase()}, and I want to work together to make that happen."</p>
        </div>

        <div class="script-box">
            <div class="script-title">Closing with Support</div>
            <p>"Remember, kids will love what you love. When you're at your best, they feel it. I'm committed to helping you get there. What questions do you have about moving forward?"</p>
        </div>
    </div>

    <div class="section">
        <h2>FOLLOW-UP ACCOUNTABILITY</h2>
        ${generatedAdvice.followUpPlan.map(item => `
            <div class="checkbox-item">
                <div class="checkbox"></div>
                <div class="item-text">${item}</div>
            </div>
        `).join('')}
    </div>

    <div class="section">
        <h2>RECOMMENDED RESOURCES</h2>
        ${generatedAdvice.resources.map(resource => `
            <div style="margin-bottom: 15px; padding: 10px; border-left: 3px solid #10b981;">
                <strong>${resource.title}</strong> (${resource.type}) - Priority: ${resource.priority.toUpperCase()}<br>
                <em>${resource.description}</em>
            </div>
        `).join('')}
    </div>

    <div class="footer">
        <p>Generated by Perfect Manager Leadership Tool | ${new Date().toLocaleDateString()}</p>
        <p><strong>CONFIDENTIAL:</strong> For director use only - leadership guidance and coaching notes</p>
    </div>
</body>
</html>`;

    // Create blob and download
    const blob = new Blob([content], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Director-Guide-${employeeName || 'Team-Member'}-${new Date().toISOString().split('T')[0]}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "Director's Guide Downloaded",
      description: "Your detailed leadership guide has been saved. This contains your coaching strategies and conversation scripts.",
    });
  };

  const downloadEmployeeChallenge = () => {
    if (!generatedAdvice) return;

    const scenarioTypes = {
      'Chronic Tardiness': 'Punctuality & Reliability',
      'Staff Burnout': 'Energy & Wellness',
      'Poor Performance': 'Professional Excellence',
      'Communication Issues': 'Communication & Teamwork',
      'Lack of Motivation': 'Passion & Purpose',
      'Team Conflicts': 'Collaboration & Harmony',
      'Attendance Problems': 'Commitment & Consistency',
      'Training Needs': 'Growth & Development'
    };

    const challengeTitle = scenarioTypes[selectedScenario] || 'Professional Growth';

    const content = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Challenge for ${employeeName || 'Team Member'}</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.8; margin: 40px; color: #333; }
        .header { text-align: center; border-bottom: 3px solid #10b981; padding-bottom: 20px; margin-bottom: 40px; }
        .header h1 { color: #10b981; margin: 0; font-size: 32px; }
        .header h2 { color: #047857; margin: 10px 0; font-size: 24px; }
        .section { margin-bottom: 40px; page-break-inside: avoid; }
        .section h2 { color: #047857; border-left: 4px solid #10b981; padding-left: 15px; margin-bottom: 20px; font-size: 20px; }
        .goal-box { border: 2px solid #10b981; border-radius: 12px; padding: 25px; margin-bottom: 25px; background: #f0fdf4; }
        .goal-title { font-weight: bold; color: #047857; margin-bottom: 15px; font-size: 18px; }
        .reflection-box { border: 1px solid #d1d5db; border-radius: 8px; padding: 25px; margin: 20px 0; min-height: 120px; background: #fafafa; }
        .reflection-title { font-weight: bold; margin-bottom: 15px; color: #374151; font-size: 16px; }
        .challenge-item { background: #e0f2fe; border-left: 4px solid #0284c7; padding: 20px; margin: 15px 0; border-radius: 6px; }
        .signature-area { margin-top: 50px; }
        .signature-line { border-bottom: 2px solid #000; width: 300px; margin-top: 30px; }
        .date-line { border-bottom: 2px solid #000; width: 200px; margin-top: 15px; }
        .footer { margin-top: 50px; text-align: center; color: #666; font-size: 14px; }
        .inspiration { background: #fef3c7; border: 2px solid #f59e0b; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center; }
        .inspiration p { font-style: italic; color: #92400e; margin: 0; font-size: 16px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Challenge for ${employeeName || 'Team Member'}</h1>
        <h2>${challengeTitle}</h2>
        <p style="color: #666; font-size: 16px;">Personal Growth & Professional Development Plan</p>
        <p style="color: #666;">Date: ${new Date().toLocaleDateString()}</p>
    </div>

    <div class="inspiration">
        <p>"We get to write chapter one in these children's lives. That's not just a job - that's a sacred calling. You have the power to plant seeds that will grow for a lifetime."</p>
    </div>

    <div class="section">
        <h2>MY GROWTH CHALLENGES</h2>
        <p style="margin-bottom: 25px; font-size: 16px;"><em>These challenges are designed to help me become the teacher I'm meant to be:</em></p>
        ${generatedAdvice.goals.map(goal => `
            <div class="goal-box">
                <div class="goal-title">${goal.title}</div>
                <p><strong>What this means for me:</strong> ${goal.description}</p>
                <p><strong>My action steps:</strong></p>
                <ul>
                    ${goal.actionSteps.map(step => `<li>${step}</li>`).join('')}
                </ul>
                <div style="margin-top: 20px;">
                    <strong>How I'll measure my success:</strong><br>
                    <div style="border-bottom: 1px solid #ccc; margin-top: 10px; height: 30px;"></div>
                    <div style="border-bottom: 1px solid #ccc; margin-top: 10px; height: 30px;"></div>
                </div>
                <div style="margin-top: 20px;">
                    <strong>Target completion date:</strong>
                    <div style="border-bottom: 1px solid #ccc; width: 200px; margin-top: 10px; height: 30px; display: inline-block;"></div>
                </div>
            </div>
        `).join('')}
    </div>

    <div class="section">
        <h2>SELF-REFLECTION</h2>
        <div class="reflection-box">
            <div class="reflection-title">What strengths do I bring to my classroom every day?</div>
            <div style="height: 80px;"></div>
        </div>
        <div class="reflection-box">
            <div class="reflection-title">What challenges have been holding me back from being my best?</div>
            <div style="height: 80px;"></div>
        </div>
        <div class="reflection-box">
            <div class="reflection-title">How will achieving these goals impact the children I teach?</div>
            <div style="height: 80px;"></div>
        </div>
        <div class="reflection-box">
            <div class="reflection-title">What support do I need from my director and team to succeed?</div>
            <div style="height: 80px;"></div>
        </div>
    </div>

    <div class="section">
        <h2>MY PERSONAL MOTIVATION</h2>
        <div class="reflection-box">
            <div class="reflection-title">Why did I choose to work with children? What brings me joy in teaching?</div>
            <div style="height: 100px;"></div>
        </div>
        <div class="reflection-box">
            <div class="reflection-title">How do I want to be remembered by the children and families I serve?</div>
            <div style="height: 100px;"></div>
        </div>
    </div>

    <div class="section">
        <h2>MY COMMITMENT TO GROWTH</h2>
        <div class="challenge-item">
            <p style="margin: 0; font-size: 16px;"><strong>I understand that:</strong> Growth requires stepping outside my comfort zone, and I'm ready to embrace these challenges with an open heart and mind.</p>
        </div>
        <div class="challenge-item">
            <p style="margin: 0; font-size: 16px;"><strong>I commit to:</strong> Taking ownership of my professional development and actively working toward these goals with dedication and persistence.</p>
        </div>
        <div class="challenge-item">
            <p style="margin: 0; font-size: 16px;"><strong>I believe that:</strong> Every child deserves my very best, and by growing as a professional, I'm honoring their potential and my calling as an educator.</p>
        </div>
    </div>

    <div class="signature-area">
        <p style="font-size: 16px; margin-bottom: 30px;">By signing below, I acknowledge that I have read and understand these growth challenges and commit to working toward these goals.</p>
        
        <div style="margin-top: 40px;">
            <strong>Employee Signature:</strong> 
            <div class="signature-line"></div>
            <div style="margin-top: 10px;">Date: <span class="date-line"></span></div>
        </div>
        
        <div style="margin-top: 40px;">
            <strong>Director Signature:</strong> 
            <div class="signature-line"></div>
            <div style="margin-top: 10px;">Date: <span class="date-line"></span></div>
        </div>
    </div>

    <div class="footer">
        <p><strong>Remember:</strong> "Kids will love what you love. When you bring your authentic passion and energy, they feel it and flourish."</p>
        <p>Generated by Perfect Manager Leadership Tool | ${new Date().toLocaleDateString()}</p>
    </div>
</body>
</html>`;

    // Create blob and download
    const blob = new Blob([content], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Challenge-for-${employeeName || 'Team-Member'}-${new Date().toISOString().split('T')[0]}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "Employee Challenge Downloaded",
      description: "The personalized challenge document for your team member has been saved.",
    });
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
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900">
      {/* Header */}
      <div className="relative">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-32 w-80 h-80 bg-blue-400 rounded-full opacity-10 blur-3xl"></div>
          <div className="absolute -bottom-40 -left-32 w-80 h-80 bg-purple-400 rounded-full opacity-10 blur-3xl"></div>
        </div>
        
        <div className="relative container mx-auto px-6 py-8">
          <div className="flex items-center gap-4 mb-8">
            <Link href="/director-toolkit">
              <Button variant="ghost" size="sm" className="flex items-center gap-2 text-white/80 hover:text-white hover:bg-white/10">
                <ArrowLeft className="h-4 w-4" />
                Back to Toolkit
              </Button>
            </Link>
          </div>
          
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-3xl mb-8 shadow-2xl">
              <Heart className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-5xl font-bold text-white mb-6">Good morning, Leader</h1>
            <p className="text-2xl text-blue-100 max-w-3xl mx-auto leading-relaxed mb-12">
              What challenge can we help you lead through today?
            </p>
            
            {/* Director's Creed */}
            <div className="max-w-4xl mx-auto p-8 bg-white/10 backdrop-blur-sm rounded-3xl border border-white/20">
              <p className="text-blue-100 italic text-lg leading-relaxed">
                "You are not just managing a center. You are shaping lives.<br/>
                You are not just handling staff—you are cultivating potential.<br/>
                You are a coach, a builder, a mentor, and a mirror."
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Three Main Options */}
      <div className="container mx-auto px-6 py-16 max-w-6xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Option A: Handle a Situation */}
          <Card className="group border-0 shadow-2xl bg-white hover:shadow-3xl transition-all duration-500 hover:-translate-y-2 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 group-hover:from-blue-500/10 group-hover:to-purple-500/10 transition-all duration-500 pointer-events-none"></div>
            <CardContent className="relative p-8 text-center space-y-6">
              <div className="w-20 h-20 mx-auto bg-gradient-to-br from-blue-500 to-blue-600 rounded-3xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300">
                <MessageSquare className="h-10 w-10 text-white" />
              </div>
              
              <div className="space-y-3">
                <h3 className="text-2xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors">Handle a Situation</h3>
                <p className="text-slate-600 leading-relaxed">
                  Get AI-powered leadership coaching for real workplace challenges
                </p>
              </div>
              
              <div className="space-y-2 text-sm text-slate-500">
                <div className="flex items-center justify-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Quick 2-3 sentence diagnosis</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>3 coaching steps with scripts</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Goal setting & follow-up</span>
                </div>
              </div>
              
              <Button 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('Situational Coaching button clicked!');
                  setActiveOption('situation');
                }}
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
              >
                Start Situational Coaching
              </Button>
            </CardContent>
          </Card>

          {/* Option B: Boost Me */}
          <Card className="group border-0 shadow-2xl bg-white hover:shadow-3xl transition-all duration-500 hover:-translate-y-2 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-red-500/5 group-hover:from-orange-500/10 group-hover:to-red-500/10 transition-all duration-500 pointer-events-none"></div>
            <CardContent className="relative p-8 text-center space-y-6">
              <div className="w-20 h-20 mx-auto bg-gradient-to-br from-orange-500 to-red-500 rounded-3xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300">
                <Zap className="h-10 w-10 text-white" />
              </div>
              
              <div className="space-y-3">
                <h3 className="text-2xl font-bold text-slate-900 group-hover:text-orange-600 transition-colors">Boost Me</h3>
                <p className="text-slate-600 leading-relaxed">
                  Quick motivation and energy reset for your leadership mindset
                </p>
              </div>
              
              <div className="space-y-2 text-sm text-slate-500">
                <div className="flex items-center justify-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>30-60 second voice clips</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Breathing exercises</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Daily mantras</span>
                </div>
              </div>
              
              <Button 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('Boost My Energy button clicked!');
                  setActiveOption('boost');
                }}
                className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
              >
                Boost My Energy
              </Button>
            </CardContent>
          </Card>

          {/* Option C: Tools & Training */}
          <Card className="group border-0 shadow-2xl bg-white hover:shadow-3xl transition-all duration-500 hover:-translate-y-2 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-indigo-500/5 group-hover:from-purple-500/10 group-hover:to-indigo-500/10 transition-all duration-500 pointer-events-none"></div>
            <CardContent className="relative p-8 text-center space-y-6">
              <div className="w-20 h-20 mx-auto bg-gradient-to-br from-purple-500 to-indigo-500 rounded-3xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300">
                <BookOpen className="h-10 w-10 text-white" />
              </div>
              
              <div className="space-y-3">
                <h3 className="text-2xl font-bold text-slate-900 group-hover:text-purple-600 transition-colors">Tools & Training</h3>
                <p className="text-slate-600 leading-relaxed">
                  Printable resources and micro-training for leadership skills
                </p>
              </div>
              
              <div className="space-y-2 text-sm text-slate-500">
                <div className="flex items-center justify-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>One-page strategies</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Conversation scripts</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Observation checklists</span>
                </div>
              </div>
              
              <Button 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('Browse Resources button clicked!');
                  setActiveOption('tools');
                }}
                className="w-full bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white font-semibold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
              >
                Browse Resources
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>



      {/* Conditional Content Based on Active Option */}
      {activeOption === 'situation' && (
        <div className="bg-white py-16">
          <div className="container mx-auto px-6 max-w-4xl">
            <Card className="border-0 shadow-lg bg-white">
              <CardHeader className="pb-6 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                    <Brain className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-xl text-slate-900">Situation Library</CardTitle>
                    <CardDescription className="text-slate-600">
                      Select a common management scenario for expert guidance
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
      )}

      {/* Boost Me Content */}
      {activeOption === 'boost' && (
        <div className="bg-gradient-to-br from-orange-50 to-red-50 py-16">
          <div className="container mx-auto px-6 max-w-4xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-slate-900 mb-4">Instant Leadership Boost</h2>
              <p className="text-lg text-slate-600">Quick energy reset and motivation for today's challenges</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Card className="p-8 text-center hover:shadow-lg transition-shadow">
                <div className="w-16 h-16 mx-auto bg-orange-100 rounded-full flex items-center justify-center mb-6">
                  <Mic className="h-8 w-8 text-orange-600" />
                </div>
                <h3 className="text-xl font-semibold mb-4">Voice Boost</h3>
                <p className="text-slate-600 mb-6">60-second motivational message tailored to your leadership journey</p>
                <Button 
                  onClick={async (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('Get Voice Boost button clicked!');
                    
                    try {
                      // Generate motivational voice message
                      const motivationalMessages = [
                        "You are making a profound difference in children's lives every single day. Your leadership creates the foundation for their future success.",
                        "Remember, you're not just managing a classroom - you're nurturing the next generation. Your energy and passion directly impact their growth.",
                        "Every challenge you face today is shaping you into a stronger leader. Children need your authentic energy and caring presence.",
                        "You have the power to turn any difficult situation into a learning opportunity. Trust your instincts and lead with your heart.",
                        "Your work matters more than you know. The love and structure you provide creates lasting impact in young lives."
                      ];
                      
                      const randomMessage = motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)];
                      
                      const response = await fetch('/api/voice/generate', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          text: randomMessage,
                          voiceType: 'friendly-female',
                          settings: {
                            stability: 0.8,
                            similarityBoost: 0.9,
                            style: 0.2,
                            useSpeakerBoost: true
                          }
                        })
                      });
                      
                      if (response.ok) {
                        const audioBlob = await response.blob();
                        const audioUrl = URL.createObjectURL(audioBlob);
                        const audio = new Audio(audioUrl);
                        await audio.play();
                        
                        // Show the message text as well
                        alert(`Voice Boost: "${randomMessage}"`);
                      } else {
                        alert('Voice boost temporarily unavailable. Please try again later.');
                      }
                    } catch (error) {
                      console.error('Voice boost error:', error);
                      alert('Voice boost temporarily unavailable. Please try again later.');
                    }
                  }}
                  className="w-full bg-orange-500 hover:bg-orange-600"
                >
                  <Play className="h-4 w-4 mr-2" />
                  Get Voice Boost
                </Button>
              </Card>
              
              <Card className="p-8 text-center hover:shadow-lg transition-shadow">
                <div className="w-16 h-16 mx-auto bg-blue-100 rounded-full flex items-center justify-center mb-6">
                  <Heart className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold mb-4">Mindful Reset</h3>
                <p className="text-slate-600 mb-6">3-minute breathing exercise to center your leadership presence</p>
                <Button 
                  onClick={async (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('Start Reset button clicked!');
                    
                    // If audio is already playing, toggle playback
                    if (currentAudio && audioType === 'reset') {
                      toggleAudioPlayback();
                      return;
                    }
                    
                    // Stop any currently playing audio
                    stopCurrentAudio();
                    
                    try {
                      // Generate guided breathing exercise
                      const breathingScript = `Welcome to your mindful reset. Find a comfortable position and close your eyes if you feel comfortable doing so. 
                      
                      We'll do three deep breaths together. 
                      
                      First breath: Breathe in slowly for four counts... one, two, three, four. Hold for two... one, two. Now breathe out slowly for six counts... one, two, three, four, five, six.
                      
                      Second breath: In for four... one, two, three, four. Hold... one, two. Out for six... one, two, three, four, five, six.
                      
                      Final breath: In for four... one, two, three, four. Hold... one, two. Out for six... one, two, three, four, five, six.
                      
                      Take a moment to notice how you feel. You are centered, grounded, and ready to lead with clarity and compassion. When you're ready, open your eyes.`;
                      
                      const response = await fetch('/api/voice/generate', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          text: breathingScript,
                          voiceType: 'friendly-female',
                          settings: {
                            stability: 0.9,
                            similarityBoost: 0.8,
                            style: 0.1,
                            useSpeakerBoost: true
                          }
                        })
                      });
                      
                      if (response.ok) {
                        const audioBlob = await response.blob();
                        const audioUrl = URL.createObjectURL(audioBlob);
                        const audio = new Audio(audioUrl);
                        
                        // Set up audio event listeners
                        audio.addEventListener('play', () => setIsAudioPlaying(true));
                        audio.addEventListener('pause', () => setIsAudioPlaying(false));
                        audio.addEventListener('ended', () => {
                          setCurrentAudio(null);
                          setIsAudioPlaying(false);
                          setAudioType(null);
                        });
                        
                        setCurrentAudio(audio);
                        setAudioType('reset');
                        await audio.play();
                        
                        // Show visual guidance as well
                        alert('Starting 3-minute mindful reset. You can pause and resume using the button.');
                      } else {
                        alert('Mindful reset temporarily unavailable. Please try again later.');
                      }
                    } catch (error) {
                      console.error('Mindful reset error:', error);
                      alert('Mindful reset temporarily unavailable. Please try again later.');
                    }
                  }}
                  className="w-full bg-blue-500 hover:bg-blue-600"
                >
                  {currentAudio && audioType === 'reset' ? (
                    isAudioPlaying ? (
                      <>
                        <Pause className="h-4 w-4 mr-2" />
                        Pause Reset
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 mr-2" />
                        Resume Reset
                      </>
                    )
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Start Reset
                    </>
                  )}
                </Button>
              </Card>
            </div>
            
            <div className="mt-12 p-8 bg-white rounded-2xl shadow-lg">
              <h3 className="text-xl font-semibold text-center mb-6">Today's Leadership Mantra</h3>
              <blockquote className="text-center text-2xl font-medium text-slate-700 italic">
                "Calm is contagious. Your presence shapes the room."
              </blockquote>
            </div>
          </div>
        </div>
      )}

      {/* Tools & Training Content */}
      {activeOption === 'tools' && (
        <div className="bg-gradient-to-br from-purple-50 to-indigo-50 py-16">
          <div className="container mx-auto px-6 max-w-6xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-slate-900 mb-4">Leadership Tools & Resources</h2>
              <p className="text-lg text-slate-600">Practical, printable resources for effective childcare leadership</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* One-Page Strategies */}
              <Card className="p-6 hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                  <FileText className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="text-lg font-semibold mb-3">Giving Feedback</h3>
                <p className="text-slate-600 text-sm mb-4">One-page guide for constructive conversations with staff</p>
                <Button variant="outline" size="sm" className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </Button>
              </Card>
              
              <Card className="p-6 hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold mb-3">Leading Meetings</h3>
                <p className="text-slate-600 text-sm mb-4">5-minute staff huddle template and agenda builder</p>
                <Button variant="outline" size="sm" className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </Button>
              </Card>
              
              <Card className="p-6 hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                  <MessageSquare className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold mb-3">Conflict Scripts</h3>
                <p className="text-slate-600 text-sm mb-4">Ready-to-use phrases for difficult conversations</p>
                <Button variant="outline" size="sm" className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </Button>
              </Card>
              
              <Card className="p-6 hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mb-4">
                  <Star className="h-6 w-6 text-yellow-600" />
                </div>
                <h3 className="text-lg font-semibold mb-3">Daily Affirmations</h3>
                <p className="text-slate-600 text-sm mb-4">30 leadership affirmations for confidence building</p>
                <Button variant="outline" size="sm" className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </Button>
              </Card>
              
              <Card className="p-6 hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                  <Heart className="h-6 w-6 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold mb-3">Stress Regulation</h3>
                <p className="text-slate-600 text-sm mb-4">Quick techniques for managing leadership pressure</p>
                <Button variant="outline" size="sm" className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </Button>
              </Card>
              
              <Card className="p-6 hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
                  <Shield className="h-6 w-6 text-indigo-600" />
                </div>
                <h3 className="text-lg font-semibold mb-3">Burnout Prevention</h3>
                <p className="text-slate-600 text-sm mb-4">Mini break rituals and self-care strategies</p>
                <Button variant="outline" size="sm" className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </Button>
              </Card>
            </div>
          </div>
        </div>
      )}

      {/* Results Section */}
      {generatedAdvice && (
        <div ref={resultsRef} className="mt-8 space-y-8">
          {/* Prominent Download Section */}
          <div className="bg-gradient-to-r from-blue-50 to-green-50 border-2 border-blue-200 rounded-xl p-8">
            <div className="text-center mb-6">
              <h2 className="text-3xl font-bold text-gray-800 mb-2">🎯 Your Action Plan is Ready!</h2>
              <p className="text-lg text-gray-600">Download your complete leadership toolkit with two specialized documents:</p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <Card className="border-2 border-blue-300 bg-white shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader className="text-center pb-4">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <FileText className="h-8 w-8 text-blue-600" />
                  </div>
                  <CardTitle className="text-xl text-blue-700">Director's Leadership Guide</CardTitle>
                  <CardDescription className="text-gray-600">
                    Detailed coaching strategies, conversation scripts, and actionable leadership approaches
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                  <Button 
                    onClick={downloadDirectorGuide} 
                    className="bg-blue-600 hover:bg-blue-700 text-white w-full py-3 text-lg font-semibold"
                    size="lg"
                  >
                    <Download className="h-5 w-5 mr-2" />
                    Download Director's Guide
                  </Button>
                  <p className="text-sm text-gray-500 mt-2">For your leadership preparation and coaching notes</p>
                </CardContent>
              </Card>

              <Card className="border-2 border-green-300 bg-white shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader className="text-center pb-4">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Target className="h-8 w-8 text-green-600" />
                  </div>
                  <CardTitle className="text-xl text-green-700">Challenge for {employeeName || 'Employee'}</CardTitle>
                  <CardDescription className="text-gray-600">
                    Professional growth document with self-reflection spaces and goal-setting framework
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                  <Button 
                    onClick={downloadEmployeeChallenge} 
                    className="bg-green-600 hover:bg-green-700 text-white w-full py-3 text-lg font-semibold"
                    size="lg"
                  >
                    <Download className="h-5 w-5 mr-2" />
                    Download Employee Challenge
                  </Button>
                  <p className="text-sm text-gray-500 mt-2">For your one-on-one meeting and goal setting</p>
                </CardContent>
              </Card>
            </div>

            <div className="text-center">
              <p className="text-gray-700 mb-4">
                <strong>Next Steps:</strong> Use the Director's Guide to prepare for your conversation, then share the Challenge document with your team member during your meeting.
              </p>
              <Button onClick={downloadAdvice} variant="outline" className="text-gray-600 border-gray-300">
                <FileText className="h-4 w-4 mr-2" />
                Also Download Text Summary
              </Button>
            </div>
          </div>

          {/* Explore Deeper Section */}
          <div className="border-t pt-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4 text-center">
              📚 Explore Deeper Pieces of Your Plan
            </h3>
            <p className="text-gray-600 text-center mb-6">
              Practice your conversation skills and get additional insights with these interactive tools:
            </p>
          </div>

          <Tabs defaultValue="practice" className="w-full" onValueChange={(value) => {
            if (value === "practice") {
              initializeChat();
            }
          }}>
            <TabsList className="grid w-full grid-cols-7">
              <TabsTrigger value="practice">Practice Conversation</TabsTrigger>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="actions">Actions</TabsTrigger>
              <TabsTrigger value="goals">Goals</TabsTrigger>
              <TabsTrigger value="resources">Resources</TabsTrigger>
              <TabsTrigger value="script">Conversation Script</TabsTrigger>
              <TabsTrigger value="followup">Follow-up</TabsTrigger>
            </TabsList>

            <TabsContent value="practice" className="space-y-6">
              <div className="bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-100 rounded-xl p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                    <Users className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="flex-1 space-y-3">
                    <h3 className="text-xl font-bold text-slate-900">Practice Your Conversation with {employeeName || 'Your Employee'}</h3>
                    <p className="text-slate-700 leading-relaxed">
                      Practice the upcoming conversation by role-playing both perspectives. Share what you think {employeeName || 'the employee'} might say or how they might react, 
                      and get coached responses that blend Tony Robbins' inspirational energy, Simon Sinek's intellectual clarity, and Brené Brown's vulnerable authenticity.
                    </p>
                  </div>
                </div>
              </div>

              {/* Conversation Starter Prompts */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                  <MessageCircle className="h-4 w-4" />
                  Professional Conversation Practice Examples
                </h4>
                <p className="text-xs text-blue-700 mb-3">
                  Practice empathetic responses that acknowledge the sacred nature of teaching while maintaining professional standards and finding win-win solutions.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {getConversationStarters(selectedScenario).map((starter, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setChatInput(starter);
                        // Focus the chat input
                        setTimeout(() => {
                          const chatInput = document.querySelector('textarea[placeholder*="Share what you think"]');
                          if (chatInput) chatInput.focus();
                        }, 100);
                      }}
                      className="text-left p-3 bg-white border border-blue-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors text-sm text-blue-800"
                    >
                      "{starter}"
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <MessageSquare className="h-5 w-5 text-blue-500" />
                        Role-Playing Practice Session
                      </CardTitle>
                      <CardDescription>
                        Practice your conversation by sharing what you think {employeeName || 'the employee'} might say or how you're feeling about this situation
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="h-96 border border-slate-200 rounded-lg p-4 overflow-y-auto bg-white">
                          {chatMessages.length === 0 ? (
                            <div className="h-full flex items-center justify-center">
                              <div className="text-center space-y-3">
                                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto">
                                  <Heart className="h-8 w-8 text-purple-600" />
                                </div>
                                <div className="space-y-2">
                                  <h4 className="font-semibold text-slate-900">Ready to Practice?</h4>
                                  <p className="text-sm text-slate-600 max-w-md">
                                    Share what you think {employeeName || 'the employee'} might say, or express your own concerns about this conversation. 
                                    Get guidance using Brené Brown's empathetic approach combined with wisdom from all legendary leaders.
                                  </p>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-4">
                              {chatMessages.map((message, index) => (
                                <div
                                  key={index}
                                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                  <div
                                    className={`max-w-[80%] p-3 rounded-lg ${
                                      message.role === 'user'
                                        ? 'bg-blue-500 text-white'
                                        : 'bg-purple-50 text-slate-800 border border-purple-100'
                                    }`}
                                  >
                                    <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                                  </div>
                                </div>
                              ))}
                              {isChatLoading && (
                                <div className="flex justify-start">
                                  <div className="bg-purple-50 border border-purple-100 p-3 rounded-lg">
                                    <div className="flex items-center gap-2">
                                      <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
                                      <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                      <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                      <span className="text-sm text-purple-600 ml-2">Coaching you...</span>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        
                        <div className="flex gap-2">
                          <Input
                            value={chatInput}
                            onChange={(e) => setChatInput(e.target.value)}
                            placeholder="Share what you think they might say, or express your concerns..."
                            onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendChatMessage()}
                            disabled={isChatLoading}
                            className="flex-1"
                          />
                          <Button 
                            onClick={sendChatMessage} 
                            disabled={!chatInput.trim() || isChatLoading}
                            className="bg-purple-600 hover:bg-purple-700"
                          >
                            <Send className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Practice Tips</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-3">
                        <div className="flex items-start gap-3">
                          <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mt-0.5">
                            <span className="text-xs font-semibold text-blue-600">1</span>
                          </div>
                          <div className="space-y-1">
                            <h5 className="font-medium text-sm">Play the Employee</h5>
                            <p className="text-xs text-slate-600">Share what you think {employeeName || 'they'} might say or how they might react</p>
                          </div>
                        </div>
                        
                        <div className="flex items-start gap-3">
                          <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center mt-0.5">
                            <span className="text-xs font-semibold text-purple-600">2</span>
                          </div>
                          <div className="space-y-1">
                            <h5 className="font-medium text-sm">Express Your Concerns</h5>
                            <p className="text-xs text-slate-600">Share your worries about the conversation</p>
                          </div>
                        </div>
                        
                        <div className="flex items-start gap-3">
                          <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mt-0.5">
                            <span className="text-xs font-semibold text-green-600">3</span>
                          </div>
                          <div className="space-y-1">
                            <h5 className="font-medium text-sm">Get Coached Responses</h5>
                            <p className="text-xs text-slate-600">Receive authentic guidance using legendary leadership wisdom</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="space-y-3">
                    <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <Heart className="h-5 w-5 text-amber-600 mt-0.5" />
                        <div className="space-y-2">
                          <h5 className="font-semibold text-amber-900 text-sm">Brené Brown's Approach</h5>
                          <p className="text-xs text-amber-800 leading-relaxed">
                            "Vulnerability is not winning or losing; it's having the courage to show up when you can't control the outcome."
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-100 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <Zap className="h-5 w-5 text-blue-600 mt-0.5" />
                        <div className="space-y-2">
                          <h5 className="font-semibold text-blue-900 text-sm">Tony Robbins' Energy</h5>
                          <p className="text-xs text-blue-800 leading-relaxed">
                            "Progress equals happiness. The quality of your life is the quality of your relationships."
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-slate-50 to-gray-50 border border-slate-100 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <Target className="h-5 w-5 text-slate-600 mt-0.5" />
                        <div className="space-y-2">
                          <h5 className="font-semibold text-slate-900 text-sm">Simon Sinek's Clarity</h5>
                          <p className="text-xs text-slate-800 leading-relaxed">
                            "Leadership is not about being in charge. It's about taking care of those in your charge."
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

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

            <TabsContent value="resources" className="space-y-4 pb-24">
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
              <div className="h-24"></div>
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

      {/* Boost Me Content */}
      {activeOption === 'boost' && (
        <div className="bg-gradient-to-br from-orange-50 to-red-50 py-16">
          <div className="container mx-auto px-6 max-w-6xl">
            <Card className="border-0 shadow-2xl bg-white">
              <CardHeader className="pb-6 border-b border-slate-100 bg-gradient-to-r from-orange-50 to-red-50">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-500 rounded-3xl flex items-center justify-center shadow-lg">
                    <Zap className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-3xl font-bold text-slate-900">Instant Energy Boost</CardTitle>
                    <CardDescription className="text-lg text-slate-600 mt-2">
                      Quick motivation and energy recharge for directors
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-8">
                <Tabs defaultValue="motivation" className="w-full">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="motivation">Daily Motivation</TabsTrigger>
                    <TabsTrigger value="affirmations">Affirmations</TabsTrigger>
                    <TabsTrigger value="breathwork">Breathwork</TabsTrigger>
                    <TabsTrigger value="quick-wins">Quick Wins</TabsTrigger>
                  </TabsList>

                  <TabsContent value="motivation" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2 text-blue-800">
                            <Star className="h-5 w-5" />
                            Today's Leadership Wisdom
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <blockquote className="text-lg italic text-blue-700 mb-4">
                            "You get to write chapter one in children's lives. That's not just a job - that's a sacred calling... and yes, chapter one includes explaining why someone put Play-Doh in the fish tank."
                          </blockquote>
                          <p className="text-sm text-blue-600">
                            Every challenge you face as a director is shaping the foundation of young minds. Your leadership creates ripples that extend far beyond the classroom (and hopefully don't involve actual water ripples from mysterious spills).
                          </p>
                        </CardContent>
                      </Card>

                      <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2 text-green-800">
                            <Heart className="h-5 w-5" />
                            Your Why Reminder
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            <div className="flex items-center gap-2">
                              <CheckCircle className="h-4 w-4 text-green-500" />
                              <span className="text-sm">You're building tomorrow's leaders (even if today's leader refuses to share the blocks)</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <CheckCircle className="h-4 w-4 text-green-500" />
                              <span className="text-sm">Families trust you with their most precious gifts (and their most creative excuses for being late)</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <CheckCircle className="h-4 w-4 text-green-500" />
                              <span className="text-sm">Your staff look to you for guidance and inspiration (and someone to fix the printer)</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <CheckCircle className="h-4 w-4 text-green-500" />
                              <span className="text-sm">Every day you create positive change (despite the glitter explosions)</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
                      <CardContent className="pt-6">
                        <div className="text-center space-y-4">
                          <h3 className="text-2xl font-bold text-purple-800">Your Leadership Superpower</h3>
                          <p className="text-lg text-purple-700">
                            Remember: Children will love what you love. When your team sees your passion for their growth, 
                            they'll bring that same energy to the children. Your enthusiasm is contagious!
                          </p>
                          <Button 
                            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-8 py-3"
                            onClick={() => {
                              // Add motivational sound effect or celebration animation
                              window.navigator?.vibrate?.(100);
                            }}
                          >
                            <Sparkles className="h-4 w-4 mr-2" />
                            I'm Ready to Lead with Heart!
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="affirmations" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {[
                        "I am exactly where I need to be to make a difference (even if that's ankle-deep in art supplies)",
                        "My leadership creates a foundation of love and learning (and occasionally, controlled chaos)",
                        "I have the strength to guide my team through any challenge (including mysterious sticky substances)",
                        "Every difficult conversation is an opportunity for growth (and practice in diplomatic language)",
                        "I trust my experience and wisdom to make good decisions (especially about snack time emergencies)",
                        "My care for children and families drives everything I do (except maybe coffee consumption - that's pure survival)"
                      ].map((affirmation, index) => (
                        <Card key={index} className="bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200 hover:shadow-lg transition-all duration-300">
                          <CardContent className="pt-4">
                            <div className="text-center space-y-2">
                              <div className="w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center mx-auto">
                                <Sun className="h-4 w-4 text-yellow-800" />
                              </div>
                              <p className="font-medium text-yellow-800">"{affirmation}"</p>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="breathwork" className="space-y-6">
                    <Card className="bg-gradient-to-br from-teal-50 to-cyan-50 border-teal-200">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-teal-800">
                          <Wind className="h-5 w-5" />
                          Mindful Breathing for Directors
                        </CardTitle>
                        <CardDescription className="text-teal-600">
                          Take 2 minutes to center yourself before your next meeting or difficult conversation
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="bg-white rounded-lg p-4 border border-teal-100">
                          <h4 className="font-semibold text-teal-800 mb-2">4-7-8 Breathing Technique</h4>
                          <ol className="list-decimal list-inside space-y-1 text-sm text-teal-700">
                            <li>Inhale through your nose for 4 counts</li>
                            <li>Hold your breath for 7 counts</li>
                            <li>Exhale through your mouth for 8 counts</li>
                            <li>Repeat 3-4 cycles</li>
                          </ol>
                        </div>
                        
                        <div className="bg-white rounded-lg p-4 border border-teal-100">
                          <h4 className="font-semibold text-teal-800 mb-2">Heart-Centered Breathing</h4>
                          <p className="text-sm text-teal-700">
                            Place one hand on your heart. As you breathe, think: "I lead with love and wisdom. 
                            My calm presence helps others find their calm."
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="quick-wins" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {[
                        { title: "Send an Appreciation Text", description: "Text one staff member something you noticed them doing well today (beyond just surviving snack time)", icon: MessageCircle, color: "blue" },
                        { title: "Walk Through Classrooms", description: "Take a 5-minute walk to connect with children and observe the magic happening (and possibly solve the case of the missing scissors)", icon: Users, color: "green" },
                        { title: "Update Your Vision Board", description: "Add one image or quote that reminds you why you chose this work (coffee quotes count)", icon: Target, color: "purple" },
                        { title: "Share a Success Story", description: "Tell someone about a recent win at your school - celebrate progress! (Even if it's just making it through Monday)", icon: Trophy, color: "yellow" },
                        { title: "Practice Gratitude", description: "Write down 3 things that went well today, no matter how small (including functional toilets)", icon: Heart, color: "pink" },
                        { title: "Plan Something Fun", description: "Schedule one enjoyable activity for your team this week (pizza delivery counts as team building)", icon: Calendar, color: "indigo" }
                      ].map((win, index) => (
                        <Card key={index} className={`bg-gradient-to-br from-${win.color}-50 to-${win.color}-100 border-${win.color}-200 hover:shadow-lg transition-all duration-300`}>
                          <CardContent className="pt-4">
                            <div className="text-center space-y-3">
                              <div className={`w-12 h-12 bg-${win.color}-400 rounded-full flex items-center justify-center mx-auto`}>
                                <win.icon className={`h-6 w-6 text-${win.color}-800`} />
                              </div>
                              <h4 className={`font-semibold text-${win.color}-800`}>{win.title}</h4>
                              <p className={`text-xs text-${win.color}-700`}>{win.description}</p>
                              <Button 
                                size="sm" 
                                className={`bg-${win.color}-500 hover:bg-${win.color}-600 text-white`}
                                onClick={() => {
                                  // Mark as completed
                                  window.navigator?.vibrate?.(50);
                                }}
                              >
                                Do This Now
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Tools & Training Content */}
      {activeOption === 'tools' && (
        <div className="bg-gradient-to-br from-purple-50 to-indigo-50 py-16">
          <div className="container mx-auto px-6 max-w-6xl">
            <Card className="border-0 shadow-2xl bg-white">
              <CardHeader className="pb-6 border-b border-slate-100 bg-gradient-to-r from-purple-50 to-indigo-50">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-3xl flex items-center justify-center shadow-lg">
                    <BookOpen className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-3xl font-bold text-slate-900">Tools & Training</CardTitle>
                    <CardDescription className="text-lg text-slate-600 mt-2">
                      Downloadable resources and micro-training for leadership excellence
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-8">
                <Tabs defaultValue="templates" className="w-full">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="templates">One-Page Tools</TabsTrigger>
                    <TabsTrigger value="scripts">Conversation Scripts</TabsTrigger>
                    <TabsTrigger value="checklists">Observation Tools</TabsTrigger>
                    <TabsTrigger value="training">Micro-Training</TabsTrigger>
                  </TabsList>

                  <TabsContent value="templates" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {[
                        { title: "Difficult Conversation Framework", description: "Step-by-step guide for challenging discussions", pages: "1 page", color: "blue" },
                        { title: "Performance Improvement Plan", description: "Template for supporting struggling staff", pages: "2 pages", color: "green" },
                        { title: "New Employee Onboarding", description: "Welcome checklist and first-week guide", pages: "1 page", color: "purple" },
                        { title: "Parent Communication Scripts", description: "Professional responses for common situations", pages: "2 pages", color: "indigo" },
                        { title: "Team Meeting Agenda Builder", description: "Engaging formats for productive meetings", pages: "1 page", color: "pink" },
                        { title: "Crisis Management Checklist", description: "Emergency response and communication", pages: "1 page", color: "red" }
                      ].map((tool, index) => (
                        <Card key={index} className="hover:shadow-lg transition-all duration-300 border-2 border-gray-100 hover:border-purple-200">
                          <CardContent className="pt-4">
                            <div className="space-y-3">
                              <div className="flex items-start justify-between">
                                <FileText className="h-8 w-8 text-purple-500" />
                                <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">{tool.pages}</span>
                              </div>
                              <h4 className="font-semibold text-gray-800">{tool.title}</h4>
                              <p className="text-sm text-gray-600">{tool.description}</p>
                              <Button 
                                size="sm" 
                                className="w-full bg-purple-500 hover:bg-purple-600 text-white"
                                onClick={() => {
                                  // Download functionality would go here
                                  alert(`Downloading: ${tool.title}`);
                                }}
                              >
                                <Download className="h-4 w-4 mr-2" />
                                Download PDF
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="scripts" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2 text-blue-800">
                            <MessageCircle className="h-5 w-5" />
                            Conflict Resolution Scripts
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="bg-white rounded-lg p-4 border border-blue-100">
                            <h5 className="font-semibold text-blue-800 mb-2">Opening Lines</h5>
                            <ul className="text-sm text-blue-700 space-y-1">
                              <li>"I value your perspective and want to understand..."</li>
                              <li>"Help me see this from your point of view..."</li>
                              <li>"I care about finding a solution that works for everyone..."</li>
                            </ul>
                          </div>
                          <Button className="w-full bg-blue-500 hover:bg-blue-600 text-white">
                            <Download className="h-4 w-4 mr-2" />
                            Download Full Script Set
                          </Button>
                        </CardContent>
                      </Card>

                      <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2 text-green-800">
                            <Users className="h-5 w-5" />
                            Feedback & Coaching Scripts
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="bg-white rounded-lg p-4 border border-green-100">
                            <h5 className="font-semibold text-green-800 mb-2">Growth-Focused Phrases</h5>
                            <ul className="text-sm text-green-700 space-y-1">
                              <li>"I've noticed your strength in... and I'm wondering..."</li>
                              <li>"What would success look like for you in this area?"</li>
                              <li>"How can I better support your professional growth?"</li>
                            </ul>
                          </div>
                          <Button className="w-full bg-green-500 hover:bg-green-600 text-white">
                            <Download className="h-4 w-4 mr-2" />
                            Download Coaching Scripts
                          </Button>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>

                  <TabsContent value="checklists" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {[
                        {
                          title: "Classroom Observation Checklist",
                          description: "Comprehensive tool for meaningful classroom visits",
                          items: ["Environment & Safety", "Teacher-Child Interactions", "Learning Activities", "Behavior Management"],
                          color: "purple"
                        },
                        {
                          title: "New Teacher Evaluation",
                          description: "90-day assessment framework for new hires",
                          items: ["Week 1-30: Basics", "Week 31-60: Growth", "Week 61-90: Mastery", "Goal Setting"],
                          color: "indigo"
                        }
                      ].map((checklist, index) => (
                        <Card key={index} className={`bg-gradient-to-br from-${checklist.color}-50 to-${checklist.color}-100 border-${checklist.color}-200`}>
                          <CardHeader>
                            <CardTitle className={`flex items-center gap-2 text-${checklist.color}-800`}>
                              <CheckSquare className="h-5 w-5" />
                              {checklist.title}
                            </CardTitle>
                            <CardDescription className={`text-${checklist.color}-600`}>
                              {checklist.description}
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="space-y-2">
                              {checklist.items.map((item, itemIndex) => (
                                <div key={itemIndex} className="flex items-center gap-2">
                                  <CheckCircle className={`h-4 w-4 text-${checklist.color}-500`} />
                                  <span className={`text-sm text-${checklist.color}-700`}>{item}</span>
                                </div>
                              ))}
                            </div>
                            <Button className={`w-full bg-${checklist.color}-500 hover:bg-${checklist.color}-600 text-white`}>
                              <Download className="h-4 w-4 mr-2" />
                              Download Checklist
                            </Button>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="training" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {[
                        { title: "Emotional Intelligence for Leaders", duration: "5 min", description: "Quick EQ assessment and tips", icon: Heart },
                        { title: "Conflict Resolution Basics", duration: "7 min", description: "De-escalation techniques that work", icon: Shield },
                        { title: "Giving Effective Feedback", duration: "6 min", description: "The sandwich method and beyond", icon: MessageSquare },
                        { title: "Building Team Culture", duration: "8 min", description: "Creating belonging and engagement", icon: Users },
                        { title: "Stress Management for Directors", duration: "5 min", description: "Self-care isn't selfish", icon: Zap },
                        { title: "Leading Through Change", duration: "7 min", description: "Guiding teams through transitions", icon: Target }
                      ].map((training, index) => (
                        <Card key={index} className="hover:shadow-lg transition-all duration-300 border-2 border-gray-100 hover:border-indigo-200">
                          <CardContent className="pt-4">
                            <div className="space-y-3">
                              <div className="flex items-start justify-between">
                                <training.icon className="h-8 w-8 text-indigo-500" />
                                <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full">{training.duration}</span>
                              </div>
                              <h4 className="font-semibold text-gray-800">{training.title}</h4>
                              <p className="text-sm text-gray-600">{training.description}</p>
                              <Button 
                                size="sm" 
                                className="w-full bg-indigo-500 hover:bg-indigo-600 text-white"
                                onClick={() => {
                                  // Launch micro-training module
                                  alert(`Starting: ${training.title}`);
                                }}
                              >
                                <Play className="h-4 w-4 mr-2" />
                                Start Training
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}