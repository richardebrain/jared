import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
  Brain, 
  Heart,
  Download,
  FileText,
  Target,
  MessageCircle,
  CheckCircle,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Lightbulb,
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

export default function PerfectManager() {
  const [situation, setSituation] = useState('');
  const [teacherName, setTeacherName] = useState('');
  const [employeeName, setEmployeeName] = useState('');
  const [context, setContext] = useState('');
  const [selectedScenario, setSelectedScenario] = useState('');
  const [generatedAdvice, setGeneratedAdvice] = useState<ManagementAdvice | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
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

  const playAudio = async (type: 'voice-boost' | 'reset') => {
    try {
      stopCurrentAudio();
      
      setIsAudioPlaying(true);
      setAudioType(type);

      const endpoint = type === 'voice-boost' ? '/api/voice/boost' : '/api/voice/reset';
      const response = await fetch(endpoint, { method: 'POST' });
      
      if (!response.ok) {
        throw new Error('Failed to generate audio');
      }
      
      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      
      setCurrentAudio(audio);
      
      audio.onended = () => {
        setIsAudioPlaying(false);
        setAudioType(null);
        setCurrentAudio(null);
        URL.revokeObjectURL(audioUrl);
      };
      
      audio.onerror = () => {
        setIsAudioPlaying(false);
        setAudioType(null);
        setCurrentAudio(null);
        URL.revokeObjectURL(audioUrl);
        toast({
          title: "Audio Error",
          description: "Failed to play audio. Please try again.",
          variant: "destructive",
        });
      };
      
      await audio.play();
      
    } catch (error) {
      console.error('Audio generation error:', error);
      setIsAudioPlaying(false);
      setAudioType(null);
      toast({
        title: "Audio Generation Failed",
        description: "Unable to generate audio at this time. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleGenerateAdvice = async () => {
    if (!situation.trim() && !selectedScenario) {
      toast({
        title: "Missing Information",
        description: "Please describe the situation or select a scenario type.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    
    try {
      const response = await fetch('/api/perfect-manager/advice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          situation: situation || selectedScenario,
          teacherName,
          context,
          scenario: selectedScenario
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate advice');
      }

      const advice = await response.json();
      setGeneratedAdvice(advice);
      
      // Scroll to results
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);

      toast({
        title: "Action Plan Generated!",
        description: "Your comprehensive leadership guidance is ready.",
      });
      
    } catch (error) {
      console.error('Error generating advice:', error);
      toast({
        title: "Generation Failed",
        description: "Unable to generate advice. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadDirectorGuide = async () => {
    if (!generatedAdvice) return;

    try {
      // Dynamic import of jsPDF
      const { jsPDF } = await import('jspdf');
      
      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.getWidth();
      const margin = 20;
      const maxLineWidth = pageWidth - (margin * 2);
      let yPosition = margin;

      // Helper function to add text with word wrapping
      const addText = (text: string, fontSize: number = 10, isBold: boolean = false, color: [number, number, number] = [0, 0, 0]) => {
        // Clean text to prevent PDF formatting issues
        const cleanText = text.replace(/[^\x20-\x7E\xA0-\xFF]/g, '').trim();
        if (!cleanText) return;
        
        pdf.setFontSize(fontSize);
        pdf.setTextColor(color[0], color[1], color[2]);
        if (isBold) {
          pdf.setFont(undefined, 'bold');
        } else {
          pdf.setFont(undefined, 'normal');
        }
        
        const lines = pdf.splitTextToSize(cleanText, maxLineWidth);
        lines.forEach((line: string) => {
          if (yPosition > pdf.internal.pageSize.getHeight() - margin) {
            pdf.addPage();
            yPosition = margin;
          }
          pdf.text(line, margin, yPosition);
          yPosition += fontSize * 0.8;
        });
        yPosition += 5; // Extra spacing after sections
      };

      // Add separator line
      const addSeparator = () => {
        pdf.setDrawColor(70, 130, 180); // Steel blue
        pdf.line(margin, yPosition, pageWidth - margin, yPosition);
        yPosition += 10;
      };

      // Header with branding
      pdf.setFillColor(70, 130, 180); // Steel blue background
      pdf.rect(0, 0, pageWidth, 30, 'F');
      pdf.setTextColor(255, 255, 255); // White text
      pdf.setFontSize(20);
      pdf.setFont(undefined, 'bold');
      pdf.text("DIRECTOR'S LEADERSHIP GUIDE", margin, 20);
      
      yPosition = 40;
      pdf.setTextColor(0, 0, 0); // Reset to black

      // Situation Overview
      addText(`Early Childhood Education Leadership Strategy`, 14, true, [70, 130, 180]);
      addText(`Generated: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`, 10);
      
      if (generatedAdvice.scenario) {
        addText(`Scenario Type: ${generatedAdvice.scenario}`, 12, true);
      }
      if (employeeName) {
        addText(`Team Member: ${employeeName}`, 12, true);
      }
      if (situation) {
        addText(`Specific Situation: ${situation}`, 11);
      }
      
      addSeparator();

      // Executive Leadership Summary
      addText("EXECUTIVE LEADERSHIP SUMMARY", 14, true, [70, 130, 180]);
      const summaryText = `This comprehensive leadership guide provides targeted strategies for addressing the specific situation described above. As an early childhood education director, you are stewarding both the professional growth of your staff and the sacred trust of families who rely on your leadership. This guide synthesizes proven leadership principles with ECE-specific expertise to help you navigate this challenge with wisdom, empathy, and effectiveness.`;
      addText(summaryText, 10);

      // Understanding the Root Causes
      addText("UNDERSTANDING THE ROOT CAUSES", 14, true, [70, 130, 180]);
      addText("Dig deeper than surface behaviors to address underlying factors:", 10);
      generatedAdvice.rootCauses?.forEach((cause: string, index: number) => {
        addText(`${index + 1}. ${cause}`, 10);
      });

      // Immediate Leadership Actions (Next 48-72 Hours)
      addText("IMMEDIATE LEADERSHIP ACTIONS", 14, true, [70, 130, 180]);
      addText("Priority steps to take within the next 48-72 hours:", 10);
      generatedAdvice.immediateActions?.forEach((action: string, index: number) => {
        addText(`□ ${action}`, 10);
      });

      // Conversation Framework
      addText("CONVERSATION FRAMEWORK", 14, true, [70, 130, 180]);
      addText("Structure your discussion with empathy and clear expectations:", 10);
      
      if (generatedAdvice.conversationScript?.openingLines) {
        addText("Opening Lines (Set caring, supportive tone):", 12, true);
        generatedAdvice.conversationScript.openingLines.forEach((line: string) => {
          addText(`• "${line}"`, 10);
        });
      }

      if (generatedAdvice.conversationScript?.listeningPrompts) {
        addText("Active Listening Prompts:", 12, true);
        generatedAdvice.conversationScript.listeningPrompts.forEach((prompt: string) => {
          addText(`• "${prompt}"`, 10);
        });
      }

      if (generatedAdvice.conversationScript?.closingStatements) {
        addText("Inspirational Closing Statements:", 12, true);
        generatedAdvice.conversationScript.closingStatements.forEach((statement: string) => {
          addText(`• "${statement}"`, 10);
        });
      }

      // Long-term Coaching Strategies
      addText("LONG-TERM COACHING STRATEGIES", 14, true, [70, 130, 180]);
      addText("Sustainable approaches for lasting professional growth:", 10);
      generatedAdvice.longTermStrategies?.forEach((strategy: string, index: number) => {
        addText(`${index + 1}. ${strategy}`, 10);
      });

      // Prevention & Proactive Measures
      if (generatedAdvice.preventionStrategies && generatedAdvice.preventionStrategies.length > 0) {
        addText("PREVENTION & PROACTIVE MEASURES", 14, true, [70, 130, 180]);
        addText("Systemic changes to prevent similar situations:", 10);
        generatedAdvice.preventionStrategies.forEach((strategy: string, index: number) => {
          addText(`${index + 1}. ${strategy}`, 10);
        });
      }

      // Follow-up and Accountability Plan
      addText("FOLLOW-UP & ACCOUNTABILITY PLAN", 14, true, [70, 130, 180]);
      addText("Structured timeline to ensure lasting change:", 10);
      generatedAdvice.followUpPlan?.forEach((item: string, index: number) => {
        const timeframe = index === 0 ? "Week 1" : index === 1 ? "Week 2" : index === 2 ? "Month 1" : `Follow-up ${index + 1}`;
        addText(`${timeframe}: ${item}`, 10);
      });

      // Success Metrics & Measurement
      if (generatedAdvice.successMetrics && generatedAdvice.successMetrics.length > 0) {
        addText("SUCCESS METRICS & MEASUREMENT", 14, true, [70, 130, 180]);
        addText("How to measure progress and success:", 10);
        generatedAdvice.successMetrics.forEach((metric: string, index: number) => {
          addText(`${index + 1}. ${metric}`, 10);
        });
      }

      // Leadership Reflection Questions
      addText("LEADERSHIP REFLECTION QUESTIONS", 14, true, [70, 130, 180]);
      addText("Questions to guide your approach and decision-making:", 10);
      const reflectionQuestions = [
        "How can I model the values and behaviors I want to see?",
        "What support does this team member need to succeed?",
        "How does this situation impact our children and families?",
        "What can I learn from this to improve my leadership?",
        "How can I turn this challenge into a growth opportunity?"
      ];
      reflectionQuestions.forEach((question, index) => {
        addText(`${index + 1}. ${question}`, 10);
      });

      // Inspirational Closing
      addText("REMEMBER YOUR SACRED MISSION", 14, true, [70, 130, 180]);
      const inspirationalText = `Leading in early childhood education means you're not just managing staff - you're nurturing the professionals who write "chapter one" in children's lives. Every difficult conversation, every coaching moment, every challenge you address ripples out to impact the children in your care. Approach this situation with the wisdom that your leadership matters, your empathy heals, and your commitment to excellence creates environments where both children and adults thrive. You have the privilege of leading in the most important work in the world.`;
      addText(inspirationalText, 10);

      // Generate specific filename
      const scenarioName = selectedScenario || 'leadership-situation';
      const employeeNameClean = employeeName ? employeeName.replace(/[^a-zA-Z0-9]/g, '') : 'TeamMember';
      const dateStr = new Date().toISOString().split('T')[0];
      const filename = `Directors-Guide-${scenarioName.replace(/\s+/g, '-')}-${employeeNameClean}-${dateStr}.pdf`;
      
      pdf.save(filename);

      toast({
        title: "Director's Leadership Guide Downloaded",
        description: "Your comprehensive PDF leadership guide has been saved with situation-specific strategies.",
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Download Failed",
        description: "Unable to generate PDF guide. Please try again.",
        variant: "destructive",
      });
    }
  };

  const downloadEmployeeChallenge = async () => {
    if (!generatedAdvice) return;

    try {
      const { jsPDF } = await import('jspdf');
      
      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.getWidth();
      const margin = 20;
      const maxLineWidth = pageWidth - (margin * 2);
      let yPosition = margin;

      const addText = (text: string, fontSize: number = 10, isBold: boolean = false, color: [number, number, number] = [0, 0, 0]) => {
        // Clean text to prevent PDF formatting issues
        const cleanText = text.replace(/[^\x20-\x7E\xA0-\xFF]/g, '').trim();
        if (!cleanText) return;
        
        pdf.setFontSize(fontSize);
        pdf.setTextColor(color[0], color[1], color[2]);
        if (isBold) {
          pdf.setFont(undefined, 'bold');
        } else {
          pdf.setFont(undefined, 'normal');
        }
        
        const lines = pdf.splitTextToSize(cleanText, maxLineWidth);
        lines.forEach((line: string) => {
          if (yPosition > pdf.internal.pageSize.getHeight() - margin) {
            pdf.addPage();
            yPosition = margin;
          }
          pdf.text(line, margin, yPosition);
          yPosition += fontSize * 0.8;
        });
        yPosition += 5;
      };

      const addReflectionBox = (height: number = 30) => {
        pdf.setDrawColor(200, 200, 200);
        pdf.rect(margin, yPosition, maxLineWidth, height);
        yPosition += height + 10;
      };

      // Header with inspirational design
      pdf.setFillColor(46, 125, 50);
      pdf.rect(0, 0, pageWidth, 35, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(20);
      pdf.setFont(undefined, 'bold');
      pdf.text("PROFESSIONAL GROWTH JOURNEY", margin, 20);
      pdf.setFontSize(12);
      pdf.text(`For ${employeeName || 'Team Member'}`, margin, 30);
      
      yPosition = 45;
      pdf.setTextColor(0, 0, 0);

      // Personal Welcome Message
      addText(`Dear ${employeeName || 'Team Member'},`, 12, true, [46, 125, 50]);
      const welcomeText = `This personalized growth plan has been created specifically for your professional development journey. As an early childhood educator, you have the privilege of writing "chapter one" in children's lives every single day. This plan is designed to support your growth while honoring the sacred work you do.`;
      addText(welcomeText, 10);

      // Growth Opportunity Overview
      addText("YOUR GROWTH OPPORTUNITY", 14, true, [46, 125, 50]);
      if (generatedAdvice.scenario) {
        addText(`Focus Area: ${generatedAdvice.scenario}`, 12, true);
      }
      if (situation) {
        addText(`Specific Situation: ${situation}`, 11);
      }
      addText(`Development Plan Created: ${new Date().toLocaleDateString()}`, 10);

      // Why This Matters
      addText("WHY THIS GROWTH MATTERS", 14, true, [46, 125, 50]);
      const whyText = `Every step you take in your professional growth directly impacts the children and families you serve. When you grow, they grow. When you improve, their experience improves. This isn't just about meeting expectations - it's about becoming the educator children deserve and families trust.`;
      addText(whyText, 10);

      // Self-Reflection Questions
      addText("REFLECTION QUESTIONS FOR YOU", 14, true, [46, 125, 50]);
      addText("Take time to thoughtfully consider these questions:", 10);
      
      const reflectionQuestions = [
        "What specific behaviors or situations would you like to improve in your role?",
        "What challenges are you currently facing that this growth plan could address?",
        "How do you think these changes could benefit the children in your care?",
        "What strengths do you already have that you can build upon?",
        "What kind of support would help you succeed in this growth journey?"
      ];

      reflectionQuestions.forEach((question, index) => {
        addText(`${index + 1}. ${question}`, 10);
        addReflectionBox(20);
      });

      // Your Development Goals
      if (generatedAdvice.goals && generatedAdvice.goals.length > 0) {
        addText("YOUR PERSONALIZED DEVELOPMENT GOALS", 14, true, [46, 125, 50]);
        addText("These goals have been crafted specifically for your growth:", 10);
        
        generatedAdvice.goals.forEach((goal: Goal, index: number) => {
          addText(`Goal ${index + 1}: ${goal.title}`, 12, true);
          addText(`Timeline: ${goal.timeframe}`, 10);
          addText(`What this means: ${goal.description}`, 10);
          
          if (goal.actionSteps && goal.actionSteps.length > 0) {
            addText("Your action steps:", 10, true);
            goal.actionSteps.forEach((step: string) => {
              addText(`□ ${step}`, 10);
            });
          }
          yPosition += 5;
        });
      }

      // Leadership Wisdom Section
      addText("WISDOM FROM LEGENDARY LEADERS", 14, true, [46, 125, 50]);
      const leadershipQuotes = [
        {
          leader: "Tony Robbins",
          quote: "Progress equals happiness. The secret to living is giving. Focus on where you want to go, not where you have been."
        },
        {
          leader: "Brené Brown", 
          quote: "Vulnerability is not winning or losing; it's having the courage to show up when you can't control the outcome."
        },
        {
          leader: "Simon Sinek",
          quote: "Leadership is not about being in charge. Leadership is about taking care of those in your charge."
        }
      ];

      leadershipQuotes.forEach(({ leader, quote }) => {
        addText(`${leader} reminds us:`, 11, true, [46, 125, 50]);
        addText(`"${quote}"`, 10);
        yPosition += 3;
      });

      // Core Values Connection
      if (generatedAdvice.coreValuesConnection && generatedAdvice.coreValuesConnection.length > 0) {
        addText("CONNECTING TO YOUR CORE VALUES", 14, true, [46, 125, 50]);
        addText("Remember what drives your passion for early childhood education:", 10);
        generatedAdvice.coreValuesConnection.forEach((connection: string) => {
          addText(`• ${connection}`, 10);
        });
      }

      // Success Strategies
      addText("STRATEGIES FOR YOUR SUCCESS", 14, true, [46, 125, 50]);
      const successStrategies = [
        "Start small: Focus on one improvement at a time",
        "Celebrate progress: Acknowledge every step forward",
        "Ask for help: Your director wants to support your growth",
        "Reflect daily: End each day by noting one thing that went well",
        "Stay connected to your 'why': Remember the children who depend on you"
      ];
      successStrategies.forEach((strategy, index) => {
        addText(`${index + 1}. ${strategy}`, 10);
      });

      // Personal Commitment Section
      addText("YOUR PERSONAL COMMITMENT", 14, true, [46, 125, 50]);
      addText("What are your thoughts on this growth opportunity?", 11, true);
      addReflectionBox(25);
      
      addText("What specific support do you need to succeed?", 11, true);
      addReflectionBox(25);
      
      addText("How will you measure your progress?", 11, true);
      addReflectionBox(25);
      
      addText("What is one thing you commit to doing differently starting tomorrow?", 11, true);
      addReflectionBox(25);

      // Inspirational Closing
      addText("REMEMBER: YOU ARE MAKING A DIFFERENCE", 14, true, [46, 125, 50]);
      const inspirationalText = `Every child who enters your classroom is forever changed by your care, your dedication, and your commitment to growth. You are not just an employee - you are a life-changer, a future-shaper, and a hope-builder. This growth plan is simply one more way to honor the incredible privilege you have of nurturing young minds and hearts. Thank you for choosing this sacred profession.`;
      addText(inspirationalText, 10);

      // Signature section
      yPosition += 10;
      addText("COMMITMENT:", 12, true);
      addText("I commit to working on these areas for professional growth and the benefit of the children in my care.", 10);
      yPosition += 15;
      addText("Teacher Signature: _________________________ Date: _____________", 10);
      yPosition += 10;
      addText("Director Signature: _________________________ Date: _____________", 10);

      // Generate specific filename
      const scenarioName = selectedScenario || 'professional-growth';
      const employeeNameClean = employeeName ? employeeName.replace(/[^a-zA-Z0-9]/g, '') : 'TeamMember';
      const dateStr = new Date().toISOString().split('T')[0];
      const filename = `Growth-Plan-${scenarioName.replace(/\s+/g, '-')}-${employeeNameClean}-${dateStr}.pdf`;
      
      pdf.save(filename);

      toast({
        title: "Professional Growth Plan Downloaded",
        description: "A personalized PDF development plan has been created for your team member.",
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Download Failed",
        description: "Unable to generate PDF growth plan. Please try again.",
        variant: "destructive",
      });
    }
  };

  const downloadAdvice = () => {
    if (!generatedAdvice) return;

    const content = `
PERFECT MANAGER - LEADERSHIP ADVICE REPORT
Generated: ${new Date().toLocaleString()}
${generatedAdvice.scenario ? `Scenario: ${generatedAdvice.scenario}` : ''}
${employeeName ? `Employee: ${employeeName}` : ''}

ROOT CAUSES:
${generatedAdvice.rootCauses?.map((cause: string, c: number) => `${c + 1}. ${cause}`).join('\n') || ''}

IMMEDIATE ACTIONS:
${generatedAdvice.immediateActions?.map((action: string, i: number) => `${i + 1}. ${action}`).join('\n') || ''}

LONG-TERM STRATEGIES:
${generatedAdvice.longTermStrategies?.map((strategy: string, i: number) => `${i + 1}. ${strategy}`).join('\n') || ''}

GOALS:
${generatedAdvice.goals?.map((goal: Goal, i: number) => `${i + 1}. ${goal.title} - ${goal.description} (${goal.timeframe})`).join('\n') || ''}

RESOURCES:
${generatedAdvice.resources?.map((resource: Resource, i: number) => `${i + 1}. ${resource.title} (${resource.type}) - ${resource.description}`).join('\n') || ''}

FOLLOW-UP PLAN:
${generatedAdvice.followUpPlan?.map((item: string, i: number) => `${i + 1}. ${item}`).join('\n') || ''}
    `.trim();

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `management-advice-${new Date().toISOString().split('T')[0]}.txt`;
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
        
        <div className="relative z-10 container mx-auto px-6 py-8">
          <div className="flex items-center justify-between mb-6">
            <Link href="/director-toolkit">
              <Button variant="ghost" className="text-white hover:bg-white/10">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Toolkit
              </Button>
            </Link>
          </div>
          
          <div className="text-center">
            <h1 className="text-5xl font-bold text-white mb-4 tracking-tight">
              Perfect Manager
            </h1>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto leading-relaxed">
              AI-powered leadership advisor for early childhood education directors
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 pb-16">
        {!activeOption && (
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Handle a Situation */}
            <Card 
              className="bg-white/95 backdrop-blur-sm border-0 shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105 group"
              onClick={() => setActiveOption('situation')}
            >
              <CardHeader className="text-center pb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Users className="h-10 w-10 text-white" />
                </div>
                <CardTitle className="text-2xl font-bold text-gray-800 mb-2">Handle a Situation</CardTitle>
                <CardDescription className="text-gray-600 leading-relaxed">
                  Get personalized leadership advice for challenging workplace situations with your teaching staff
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
                  Start Situational Coaching
                </Button>
              </CardContent>
            </Card>

            {/* Boost My Energy */}
            <Card 
              className="bg-white/95 backdrop-blur-sm border-0 shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105 group"
              onClick={() => setActiveOption('boost')}
            >
              <CardHeader className="text-center pb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Zap className="h-10 w-10 text-white" />
                </div>
                <CardTitle className="text-2xl font-bold text-gray-800 mb-2">Boost My Energy</CardTitle>
                <CardDescription className="text-gray-600 leading-relaxed">
                  Quick motivational support and mindfulness exercises for busy directors
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <Button className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white font-semibold px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
                  Boost My Energy
                </Button>
              </CardContent>
            </Card>

            {/* Browse Resources */}
            <Card 
              className="bg-white/95 backdrop-blur-sm border-0 shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105 group"
              onClick={() => setActiveOption('tools')}
            >
              <CardHeader className="text-center pb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Brain className="h-10 w-10 text-white" />
                </div>
                <CardTitle className="text-2xl font-bold text-gray-800 mb-2">Browse Resources</CardTitle>
                <CardDescription className="text-gray-600 leading-relaxed">
                  Access leadership templates, policies, and professional development materials
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
                  Browse Resources
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Situation Content */}
        {activeOption === 'situation' && (
          <div className="max-w-4xl mx-auto bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-bold text-gray-800">Situational Leadership Coach</h2>
              <Button 
                variant="outline" 
                onClick={() => setActiveOption(null)}
                className="text-gray-600 hover:text-gray-800"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Options
              </Button>
            </div>

            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="teacherName" className="text-lg font-semibold text-gray-700">Teacher/Employee Name</Label>
                  <Input
                    id="teacherName"
                    value={employeeName}
                    onChange={(e) => setEmployeeName(e.target.value)}
                    placeholder="Enter teacher's name"
                    className="mt-2 text-lg py-3"
                  />
                </div>
                <div>
                  <Label htmlFor="scenario" className="text-lg font-semibold text-gray-700">Situation Type</Label>
                  <Select value={selectedScenario} onValueChange={setSelectedScenario}>
                    <SelectTrigger className="mt-2 text-lg py-3">
                      <SelectValue placeholder="Select situation type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Chronic Tardiness">Chronic Tardiness</SelectItem>
                      <SelectItem value="Staff Burnout">Staff Burnout</SelectItem>
                      <SelectItem value="Poor Performance">Poor Performance</SelectItem>
                      <SelectItem value="Communication Issues">Communication Issues</SelectItem>
                      <SelectItem value="Lack of Motivation">Lack of Motivation</SelectItem>
                      <SelectItem value="Team Conflicts">Team Conflicts</SelectItem>
                      <SelectItem value="Attendance Problems">Attendance Problems</SelectItem>
                      <SelectItem value="Training Needs">Training Needs</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="situation" className="text-lg font-semibold text-gray-700">Describe the Situation</Label>
                <Textarea
                  id="situation"
                  value={situation}
                  onChange={(e) => setSituation(e.target.value)}
                  placeholder="Provide specific details about the situation you're facing..."
                  rows={4}
                  className="mt-2 text-lg"
                />
              </div>

              <div>
                <Label htmlFor="context" className="text-lg font-semibold text-gray-700">Additional Context (Optional)</Label>
                <Textarea
                  id="context"
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  placeholder="Any additional background information that might be helpful..."
                  rows={3}
                  className="mt-2 text-lg"
                />
              </div>

              <Button 
                onClick={handleGenerateAdvice}
                disabled={isGenerating}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-4 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
              >
                {isGenerating ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                    Generating Leadership Advice...
                  </div>
                ) : (
                  <>
                    <Brain className="h-5 w-5 mr-2" />
                    Generate Action Plan
                  </>
                )}
              </Button>
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

            <Tabs defaultValue="practice" className="w-full">
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
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <MessageCircle className="h-5 w-5 mr-2" />
                      Practice Your Conversation
                    </CardTitle>
                    <CardDescription>
                      Interactive chat to practice your leadership conversation before meeting with {employeeName || 'your team member'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Alert>
                      <Lightbulb className="h-4 w-4" />
                      <AlertDescription>
                        This feature will be available in the next update. Use the Conversation Script tab for detailed talking points.
                      </AlertDescription>
                    </Alert>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="overview" className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Root Causes Identified</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {generatedAdvice.rootCauses?.map((cause: string, i: number) => (
                          <li key={i} className="flex items-start">
                            <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-1 flex-shrink-0" />
                            <span className="text-gray-700">{cause}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Core Values Connection</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {generatedAdvice.coreValuesConnection?.map((connection: string, i: number) => (
                          <li key={i} className="flex items-start">
                            <Heart className="h-4 w-4 text-red-500 mr-2 mt-1 flex-shrink-0" />
                            <span className="text-gray-700">{connection}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="actions" className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-orange-600">Immediate Actions</CardTitle>
                      <CardDescription>Take these steps right away</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-3">
                        {generatedAdvice.immediateActions?.map((action: string, i: number) => (
                          <li key={i} className="flex items-start">
                            <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center mr-3 mt-1 flex-shrink-0">
                              <span className="text-orange-600 font-semibold text-sm">{i + 1}</span>
                            </div>
                            <span className="text-gray-700">{action}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-blue-600">Long-term Strategies</CardTitle>
                      <CardDescription>Sustainable approaches for lasting change</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-3">
                        {generatedAdvice.longTermStrategies?.map((strategy: string, i: number) => (
                          <li key={i} className="flex items-start">
                            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-3 mt-1 flex-shrink-0">
                              <span className="text-blue-600 font-semibold text-sm">{i + 1}</span>
                            </div>
                            <span className="text-gray-700">{strategy}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="goals" className="space-y-6">
                <div className="grid gap-6">
                  {generatedAdvice.goals?.map((goal: Goal, i: number) => (
                    <Card key={i}>
                      <CardHeader>
                        <CardTitle className="flex items-center">
                          <Target className="h-5 w-5 mr-2 text-green-600" />
                          {goal.title}
                        </CardTitle>
                        <CardDescription>
                          {goal.description} • Timeline: {goal.timeframe}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div>
                          <h4 className="font-semibold text-gray-800 mb-2">Action Steps:</h4>
                          <ul className="space-y-1">
                            {goal.actionSteps?.map((step: string, stepIndex: number) => (
                              <li key={stepIndex} className="flex items-start">
                                <CheckSquare className="h-4 w-4 text-gray-400 mr-2 mt-1 flex-shrink-0" />
                                <span className="text-gray-700">{step}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="resources" className="space-y-6">
                <div className="grid gap-4">
                  {generatedAdvice.resources?.map((resource: Resource, i: number) => (
                    <Card key={i}>
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold text-gray-800">{resource.title}</h3>
                            <p className="text-gray-600 text-sm mt-1">{resource.description}</p>
                            <div className="flex items-center mt-2">
                              <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                                resource.type === 'video' ? 'bg-red-100 text-red-800' :
                                resource.type === 'article' ? 'bg-blue-100 text-blue-800' :
                                resource.type === 'template' ? 'bg-green-100 text-green-800' :
                                resource.type === 'policy' ? 'bg-purple-100 text-purple-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {resource.type}
                              </span>
                              <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ml-2 ${
                                resource.priority === 'high' ? 'bg-red-100 text-red-800' :
                                resource.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {resource.priority} priority
                              </span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="script" className="space-y-6">
                <div className="grid gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-green-600">Opening Lines</CardTitle>
                      <CardDescription>Start your conversation with care and purpose</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {generatedAdvice.conversationScript?.openingLines?.map((line: string, i: number) => (
                          <li key={i} className="flex items-start">
                            <div className="w-2 h-2 bg-green-500 rounded-full mr-3 mt-2 flex-shrink-0"></div>
                            <span className="text-gray-700 italic">"{line}"</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-blue-600">Listening Prompts</CardTitle>
                      <CardDescription>Questions to encourage sharing and understanding</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {generatedAdvice.conversationScript?.listeningPrompts?.map((prompt: string, i: number) => (
                          <li key={i} className="flex items-start">
                            <div className="w-2 h-2 bg-blue-500 rounded-full mr-3 mt-2 flex-shrink-0"></div>
                            <span className="text-gray-700 italic">"{prompt}"</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-purple-600">Response Scenarios</CardTitle>
                      <CardDescription>How to respond to different teacher reactions</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {generatedAdvice.conversationScript?.responseScenarios?.map((scenario, i: number) => (
                          <div key={i} className="border-l-4 border-purple-200 pl-4 py-2">
                            <p className="text-gray-800 font-medium">If they say: "{scenario.teacherResponse}"</p>
                            <p className="text-purple-700 mt-1">You can respond: "{scenario.directorReply}"</p>
                            <p className="text-gray-600 text-sm mt-1">Follow up with: "{scenario.followUpQuestion}"</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-orange-600">Closing Statements</CardTitle>
                      <CardDescription>End with inspiration and clear next steps</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {generatedAdvice.conversationScript?.closingStatements?.map((statement: string, i: number) => (
                          <li key={i} className="flex items-start">
                            <div className="w-2 h-2 bg-orange-500 rounded-full mr-3 mt-2 flex-shrink-0"></div>
                            <span className="text-gray-700 italic">"{statement}"</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="followup" className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-indigo-600">Follow-up Plan</CardTitle>
                      <CardDescription>Structured approach to ongoing support</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-3">
                        {generatedAdvice.followUpPlan?.map((item: string, i: number) => (
                          <li key={i} className="flex items-start">
                            <Clock className="h-4 w-4 text-indigo-500 mr-2 mt-1 flex-shrink-0" />
                            <span className="text-gray-700">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-green-600">Success Metrics</CardTitle>
                      <CardDescription>How you'll know the plan is working</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {generatedAdvice.successMetrics?.map((metric: string, i: number) => (
                          <li key={i} className="flex items-start">
                            <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-1 flex-shrink-0" />
                            <span className="text-gray-700">{metric}</span>
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
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-4xl font-bold text-gray-800">Energy Boost Station</h2>
                <Button 
                  variant="outline" 
                  onClick={() => setActiveOption(null)}
                  className="text-gray-600 hover:text-gray-800"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Options
                </Button>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                <Card className="bg-white shadow-xl hover:shadow-2xl transition-shadow duration-300">
                  <CardHeader className="text-center">
                    <div className="w-20 h-20 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Zap className="h-10 w-10 text-white" />
                    </div>
                    <CardTitle className="text-2xl font-bold text-gray-800">Get Voice Boost</CardTitle>
                    <CardDescription className="text-gray-600">
                      Instant motivational message with professional voice guidance for ECE leadership
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="text-center space-y-4">
                    <Button 
                      onClick={() => playAudio('voice-boost')}
                      disabled={isAudioPlaying}
                      className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-semibold px-8 py-3 text-lg w-full"
                    >
                      {isAudioPlaying && audioType === 'voice-boost' ? (
                        <div className="flex items-center">
                          <div className="animate-pulse">
                            <Volume2 className="h-5 w-5 mr-2" />
                          </div>
                          Playing Voice Boost...
                        </div>
                      ) : (
                        <>
                          <Play className="h-5 w-5 mr-2" />
                          Get Voice Boost
                        </>
                      )}
                    </Button>
                    
                    {isAudioPlaying && audioType === 'voice-boost' && (
                      <Button 
                        onClick={stopCurrentAudio}
                        variant="outline"
                        className="w-full"
                      >
                        <Pause className="h-4 w-4 mr-2" />
                        Stop Audio
                      </Button>
                    )}
                    
                    <p className="text-sm text-gray-500">
                      Randomized motivational messages focusing on the sacred nature of early childhood education
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-white shadow-xl hover:shadow-2xl transition-shadow duration-300">
                  <CardHeader className="text-center">
                    <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Heart className="h-10 w-10 text-white" />
                    </div>
                    <CardTitle className="text-2xl font-bold text-gray-800">Start Reset</CardTitle>
                    <CardDescription className="text-gray-600">
                      3-minute guided breathing exercise with structured 4-6-6 breathing pattern
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="text-center space-y-4">
                    <Button 
                      onClick={() => playAudio('reset')}
                      disabled={isAudioPlaying}
                      className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold px-8 py-3 text-lg w-full"
                    >
                      {isAudioPlaying && audioType === 'reset' ? (
                        <div className="flex items-center">
                          <div className="animate-pulse">
                            <Volume2 className="h-5 w-5 mr-2" />
                          </div>
                          Playing Reset...
                        </div>
                      ) : (
                        <>
                          <Play className="h-5 w-5 mr-2" />
                          Start Reset
                        </>
                      )}
                    </Button>
                    
                    {isAudioPlaying && audioType === 'reset' && (
                      <Button 
                        onClick={stopCurrentAudio}
                        variant="outline"
                        className="w-full"
                      >
                        <Pause className="h-4 w-4 mr-2" />
                        Stop Reset
                      </Button>
                    )}
                    
                    <p className="text-sm text-gray-500">
                      Mindfulness and leadership centering for busy directors
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        )}

        {/* Tools Content */}
        {activeOption === 'tools' && (
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-4xl font-bold text-white">Leadership Resources</h2>
              <Button 
                variant="ghost" 
                onClick={() => setActiveOption(null)}
                className="text-white hover:bg-white/10"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Options
              </Button>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <Card className="bg-white/95 backdrop-blur-sm shadow-xl">
                <CardHeader>
                  <CardTitle>Policy Templates</CardTitle>
                  <CardDescription>Ready-to-use policies for your center</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">Access professional policy templates covering staff conduct, safety procedures, and operational guidelines.</p>
                </CardContent>
              </Card>

              <Card className="bg-white/95 backdrop-blur-sm shadow-xl">
                <CardHeader>
                  <CardTitle>Training Materials</CardTitle>
                  <CardDescription>Professional development resources</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">Comprehensive training modules for staff development, leadership skills, and early childhood best practices.</p>
                </CardContent>
              </Card>

              <Card className="bg-white/95 backdrop-blur-sm shadow-xl">
                <CardHeader>
                  <CardTitle>Assessment Tools</CardTitle>
                  <CardDescription>Staff evaluation and performance tracking</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">Structured assessment forms and performance review templates for effective staff evaluation.</p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}