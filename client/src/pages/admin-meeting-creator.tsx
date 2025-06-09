import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import VoiceInputTextarea from '@/components/VoiceInputTextarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { 
  Calendar, 
  Clock, 
  Users, 
  Lightbulb, 
  Target, 
  CheckSquare, 
  ArrowLeft,
  Wand2,
  Download,
  Copy,
  Share,
  Sparkles,
  FileText,
  Mail,
  Zap,
  Award,
  Eye
} from 'lucide-react';
import { Link } from 'wouter';

interface MeetingAgenda {
  title: string;
  date: string;
  duration: string;
  attendees: string[];
  objectives: string[];
  icebreakers: {
    name: string;
    description: string;
    timeNeeded: string;
    materials: string[];
    instructions: string;
  }[];
  agenda: {
    item: string;
    timeAllocation: string;
    presenter: string;
    description: string;
    activity?: string;
  }[];
  discussionTopics: {
    topic: string;
    purpose: string;
    timeLimit: string;
    facilitationTips?: string;
  }[];
  activities: {
    name: string;
    type: string;
    description: string;
    timeNeeded: string;
    materials: string[];
    instructions: string;
    learningGoal: string;
  }[];
  handouts: {
    title: string;
    type: string;
    content: string;
    purpose: string;
  }[];
  actionItems: {
    task: string;
    assignee: string;
    deadline: string;
    priority: 'High' | 'Medium' | 'Low';
  }[];
  followUpPlanning: string;
  energizers: {
    name: string;
    when: string;
    howTo: string;
    timeNeeded: string;
  }[];
  takeaways: string[];
}

export default function AdminMeetingCreator() {
  const { toast } = useToast();
  const [generatedAgenda, setGeneratedAgenda] = useState<MeetingAgenda | null>(null);
  const [formData, setFormData] = useState({
    meetingType: '',
    duration: '',
    attendeeCount: '',
    primaryFocus: '',
    specificTopics: '',
    challenges: '',
    goals: '',
    previousMeetingNotes: ''
  });

  const generateAgenda = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await fetch('/api/ai-suggestions/generate-meeting-agenda', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate meeting agenda');
      }
      
      const result = await response.json();
      console.log('Direct fetch response:', result);
      return result;
    },
    onSuccess: (aiAgenda) => {
      console.log('AI agenda response:', aiAgenda);
      
      // Handle case where AI response might be wrapped in additional structure
      const actualAgenda = aiAgenda?.data || aiAgenda;
      console.log('Processed agenda data:', actualAgenda);
      
      // Convert AI response format to frontend MeetingAgenda format
      const convertedAgenda: MeetingAgenda = {
        title: actualAgenda.title || "Staff Meeting",
        date: new Date().toLocaleDateString('en-US', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        }),
        duration: actualAgenda.totalDuration || formData.duration,
        attendees: ["Teaching Staff", "Directors", "Administrators"],
        objectives: actualAgenda.takeaways || ["Improve team collaboration", "Address key challenges", "Plan next steps"],
        icebreakers: actualAgenda.energizers?.map((energizer: any) => ({
          name: energizer.name,
          description: energizer.howTo,
          timeNeeded: energizer.timeNeeded,
          materials: ["None required"],
          instructions: energizer.howTo
        })) || [],
        agenda: actualAgenda.agendaItems?.map((item: any) => ({
          item: item.title,
          timeAllocation: item.duration,
          presenter: item.facilitator || "Director",
          description: item.description
        })) || [],
        discussionTopics: actualAgenda.agendaItems?.filter((item: any) => item.type === 'discussion').map((item: any) => ({
          topic: item.title,
          purpose: item.description,
          timeLimit: item.duration,
          facilitationTips: item.discussionQuestions?.join('; ') || "Encourage participation from all team members"
        })) || [],
        activities: actualAgenda.agendaItems?.filter((item: any) => item.type === 'activity').map((item: any) => ({
          name: item.title,
          type: "Interactive Learning",
          description: item.description,
          timeNeeded: item.duration,
          materials: item.materials || [],
          instructions: item.description,
          learningGoal: "Enhance professional development and team collaboration"
        })) || [],
        handouts: [{
          title: "Meeting Summary",
          type: "Reference Sheet",
          content: actualAgenda.overview || "Key points and action items from today's meeting",
          purpose: "Quick reference for follow-up actions"
        }],
        actionItems: actualAgenda.actionItems || [],
        followUpPlanning: actualAgenda.followUpPlanning || "Next meeting will review progress on action items",
        energizers: actualAgenda.energizers || [],
        takeaways: actualAgenda.takeaways || ["Continue supporting each other", "Focus on children's success", "Maintain open communication"]
      };
      
      setGeneratedAgenda(convertedAgenda);
      toast({
        title: "Meeting agenda generated successfully!",
        description: "Your AI-powered staff meeting agenda is ready to use."
      });
    },
    onError: (error) => {
      console.error('Meeting generation error:', error);
      toast({
        title: "Generation failed",
        description: "There was an error generating your meeting agenda. Please try again.",
        variant: "destructive"
      });
    }
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleGenerate = () => {
    if (!formData.meetingType || !formData.duration || !formData.primaryFocus) {
      toast({
        title: "Missing information",
        description: "Please fill in the meeting type, duration, and primary focus.",
        variant: "destructive"
      });
      return;
    }
    generateAgenda.mutate(formData);
  };

  const handleShowSample = () => {
    // Show a sample agenda while waiting for API configuration
    const sampleAgenda: MeetingAgenda = {
      title: "Monthly Staff Development Meeting",
      date: new Date().toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }),
      duration: "90 minutes",
      attendees: ["Lead Teachers", "Assistant Teachers", "Director", "Special Education Coordinator"],
      objectives: [
        "Review and discuss new classroom management strategies",
        "Share successful teaching techniques from the past month",
        "Plan upcoming parent engagement activities",
        "Address any challenges and collaborate on solutions"
      ],
      icebreakers: [
        {
          name: "Teaching Moment Spotlight",
          description: "Each participant shares one magical teaching moment from the past month",
          timeNeeded: "10 minutes",
          materials: ["None required"],
          instructions: "Form a circle and have each person share a brief story about a special moment with a child that made them smile or feel proud. Keep stories to 1-2 minutes each."
        }
      ],
      agenda: [
        {
          item: "Welcome & Check-in",
          timeAllocation: "10 minutes",
          presenter: "Director",
          description: "Welcome everyone and quick personal check-ins"
        },
        {
          item: "Classroom Success Stories",
          timeAllocation: "20 minutes", 
          presenter: "All Staff",
          description: "Share positive developments and student achievements",
          activity: "Round-robin sharing with appreciation circle"
        },
        {
          item: "Professional Development Focus",
          timeAllocation: "30 minutes",
          presenter: "Lead Teacher",
          description: "Interactive workshop on positive behavior support strategies"
        },
        {
          item: "Planning & Coordination",
          timeAllocation: "20 minutes",
          presenter: "Director",
          description: "Upcoming events, schedule changes, and action items"
        }
      ],
      discussionTopics: [
        {
          topic: "Implementing New Behavior Support Techniques",
          purpose: "Collaborative problem-solving and skill sharing",
          timeLimit: "15 minutes",
          facilitationTips: "Use the parking lot method for complex issues that need follow-up"
        },
        {
          topic: "Parent Communication Strategies", 
          purpose: "Improve family engagement and partnership",
          timeLimit: "10 minutes",
          facilitationTips: "Focus on positive communication examples and templates"
        }
      ],
      activities: [
        {
          name: "Behavior Support Strategy Workshop",
          type: "Interactive Learning",
          description: "Practice positive behavior support techniques through role-playing and case studies",
          timeNeeded: "25 minutes",
          materials: ["Scenario cards", "Behavior support strategy handouts", "Flip chart paper"],
          instructions: "Break into small groups of 3-4. Each group receives a behavior scenario to work through using the new support strategies. Groups will present their approach to the larger team.",
          learningGoal: "Increase confidence and consistency in applying positive behavior support across all classrooms"
        }
      ],
      handouts: [
        {
          title: "Positive Behavior Support Quick Reference Guide",
          type: "Reference Sheet", 
          content: "**Key Strategies:**\n\n1. **Prevention First** - Set clear expectations and routines\n2. **Positive Reinforcement** - Catch children being good\n3. **Redirect & Teach** - Guide toward appropriate behavior\n4. **Stay Calm** - Model emotional regulation\n5. **Consistent Follow-through** - Apply strategies fairly across all children\n\n**Remember:** Every behavior is communication. Our job is to understand what the child is trying to tell us and teach them better ways to express their needs.",
          purpose: "Quick reference for daily behavior support decisions"
        }
      ],
      actionItems: [
        {
          task: "Implement new behavior charts in each classroom",
          assignee: "All Teachers",
          deadline: "Next Friday",
          priority: "High" as const
        },
        {
          task: "Schedule individual coaching sessions with new staff",
          assignee: "Director",
          deadline: "Within 2 weeks", 
          priority: "Medium" as const
        }
      ],
      followUpPlanning: "Next meeting will focus on reviewing the implementation of behavior support strategies and sharing results. We'll also begin planning for the spring parent conference preparations.",
      energizers: [
        {
          name: "Gratitude Popcorn",
          when: "When energy feels low",
          howTo: "Anyone can call out something they're grateful for about working with children. Others can 'pop' in with quick additions.",
          timeNeeded: "2-3 minutes"
        }
      ],
      takeaways: [
        "Consistent positive behavior support benefits both children and teachers",
        "Small changes in our approach can lead to big improvements in classroom climate", 
        "We're all learning together - collaboration makes us stronger",
        "Every child deserves patience, understanding, and multiple chances to succeed"
      ]
    };
    
    setGeneratedAgenda(sampleAgenda);
    toast({
      title: "Sample agenda loaded",
      description: "This shows what the AI will generate once the API is configured."
    });
  };

  const copyToClipboard = async () => {
    if (!generatedAgenda) return;
    
    const agendaText = formatAgendaAsText(generatedAgenda);
    await navigator.clipboard.writeText(agendaText);
    toast({
      title: "Copied to clipboard",
      description: "Meeting agenda has been copied to your clipboard."
    });
  };

  const formatAgendaAsText = (agenda: MeetingAgenda): string => {
    return `
STAFF MEETING AGENDA
${agenda.title}
Date: ${agenda.date}
Duration: ${agenda.duration}

OBJECTIVES:
${agenda.objectives.map(obj => `• ${obj}`).join('\n')}

AGENDA:
${agenda.agenda.map((item, i) => `${i + 1}. ${item.item} (${item.timeAllocation}) - ${item.presenter}`).join('\n')}

DISCUSSION TOPICS:
${agenda.discussionTopics.map(topic => `• ${topic.topic} (${topic.timeLimit})`).join('\n')}

ACTION ITEMS:
${agenda.actionItems.map(action => `• ${action.task} - ${action.assignee} (Due: ${action.deadline})`).join('\n')}

FOLLOW-UP:
${agenda.followUpPlanning}
    `.trim();
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/director-toolkit">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Toolkit
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">AI Staff Meeting Creator</h1>
          <p className="text-muted-foreground">Generate engaging and productive staff meeting agendas with AI assistance</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Form */}
        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wand2 className="h-5 w-5 text-purple-600" />
              Meeting Details
            </CardTitle>
            <CardDescription>
              Provide information about your upcoming staff meeting to generate a customized agenda
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="meetingType">Meeting Type</Label>
                <Select value={formData.meetingType} onValueChange={(value) => handleInputChange('meetingType', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">Weekly Team Meeting</SelectItem>
                    <SelectItem value="monthly">Monthly All-Staff</SelectItem>
                    <SelectItem value="training">Professional Development</SelectItem>
                    <SelectItem value="planning">Curriculum Planning</SelectItem>
                    <SelectItem value="policy">Policy & Procedures</SelectItem>
                    <SelectItem value="emergency">Emergency Meeting</SelectItem>
                    <SelectItem value="celebration">Team Celebration</SelectItem>
                    <SelectItem value="evaluation">Performance Review</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="duration">Duration</Label>
                <Select value={formData.duration} onValueChange={(value) => handleInputChange('duration', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select duration" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 minutes</SelectItem>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="45">45 minutes</SelectItem>
                    <SelectItem value="60">1 hour</SelectItem>
                    <SelectItem value="90">1.5 hours</SelectItem>
                    <SelectItem value="120">2 hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="attendeeCount">Expected Attendees</Label>
              <Input
                id="attendeeCount"
                placeholder="e.g., 8 teachers, 2 assistants, 1 director"
                value={formData.attendeeCount}
                onChange={(e) => handleInputChange('attendeeCount', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="primaryFocus">Primary Focus/Objective</Label>
              <VoiceInputTextarea
                value={formData.primaryFocus}
                onChange={(value) => handleInputChange('primaryFocus', value)}
                placeholder="What is the main goal of this meeting? (e.g., discuss new curriculum implementation, address parent feedback, plan upcoming events)"
              />
            </div>

            <div>
              <Label htmlFor="specificTopics">Specific Topics to Cover</Label>
              <VoiceInputTextarea
                value={formData.specificTopics}
                onChange={(value) => handleInputChange('specificTopics', value)}
                placeholder="List any specific topics, announcements, or issues to address (optional)"
              />
            </div>

            <div>
              <Label htmlFor="challenges">Current Challenges/Issues</Label>
              <VoiceInputTextarea
                value={formData.challenges}
                onChange={(value) => handleInputChange('challenges', value)}
                placeholder="Any current challenges the team is facing that should be addressed? (optional)"
                minHeight="min-h-[100px]"
              />
            </div>

            <div>
              <Label htmlFor="goals">Upcoming Goals/Milestones</Label>
              <VoiceInputTextarea
                value={formData.goals}
                onChange={(value) => handleInputChange('goals', value)}
                placeholder="Any upcoming goals, deadlines, or milestones to discuss? (optional)"
                minHeight="min-h-[100px]"
              />
            </div>

            <div>
              <Label htmlFor="previousMeetingNotes">Previous Meeting Follow-up</Label>
              <VoiceInputTextarea
                value={formData.previousMeetingNotes}
                onChange={(value) => handleInputChange('previousMeetingNotes', value)}
                placeholder="Any action items or topics from the previous meeting to follow up on? (optional)"
                minHeight="min-h-[100px]"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Button 
                onClick={handleGenerate} 
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                disabled={generateAgenda.isPending}
              >
                {generateAgenda.isPending ? (
                  <>
                    <Sparkles className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Wand2 className="h-4 w-4 mr-2" />
                    Generate with AI
                  </>
                )}
              </Button>
              
              <Button 
                onClick={handleShowSample} 
                variant="outline"
                className="border-blue-200 text-blue-700 hover:bg-blue-50"
              >
                <Eye className="h-4 w-4 mr-2" />
                Show Sample
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Generated Agenda */}
        <div className="space-y-6">
          {generatedAgenda ? (
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl">{generatedAgenda.title}</CardTitle>
                    <CardDescription className="flex items-center gap-4 mt-2">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {generatedAgenda.date}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {generatedAgenda.duration}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {generatedAgenda.attendees.length} attendees
                      </span>
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={copyToClipboard}>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy
                    </Button>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Export
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Objectives */}
                <div>
                  <h3 className="font-semibold flex items-center gap-2 mb-3">
                    <Target className="h-4 w-4 text-blue-600" />
                    Meeting Objectives
                  </h3>
                  <ul className="space-y-1">
                    {generatedAgenda.objectives.map((objective, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <div className="w-2 h-2 rounded-full bg-blue-600 mt-2 flex-shrink-0"></div>
                        <span className="text-sm">{objective}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <Separator />

                {/* Agenda Items */}
                <div>
                  <h3 className="font-semibold flex items-center gap-2 mb-3">
                    <FileText className="h-4 w-4 text-green-600" />
                    Agenda Items
                  </h3>
                  <div className="space-y-3">
                    {generatedAgenda.agenda.map((item, index) => (
                      <div key={index} className="border rounded-lg p-3 bg-gray-50">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-medium">{index + 1}. {item.item}</h4>
                          <Badge variant="outline">{item.timeAllocation}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-1">{item.description}</p>
                        <p className="text-xs text-blue-600">Presenter: {item.presenter}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Ice Breakers */}
                {generatedAgenda.icebreakers && generatedAgenda.icebreakers.length > 0 && (
                  <>
                    <div>
                      <h3 className="font-semibold flex items-center gap-2 mb-3">
                        <Sparkles className="h-4 w-4 text-pink-600" />
                        Ice Breaker Activities
                      </h3>
                      <div className="space-y-3">
                        {generatedAgenda.icebreakers.map((icebreaker, index) => (
                          <div key={index} className="border rounded-lg p-3 bg-pink-50">
                            <div className="flex justify-between items-start mb-2">
                              <h4 className="font-medium text-pink-800">{icebreaker.name}</h4>
                              <Badge variant="outline" className="text-pink-600">{icebreaker.timeNeeded}</Badge>
                            </div>
                            <p className="text-sm text-gray-700 mb-2">{icebreaker.description}</p>
                            <div className="text-xs space-y-1">
                              <p><strong>Materials:</strong> {icebreaker.materials.join(', ')}</p>
                              <p><strong>Instructions:</strong> {icebreaker.instructions}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <Separator />
                  </>
                )}

                {/* Discussion Topics */}
                <div>
                  <h3 className="font-semibold flex items-center gap-2 mb-3">
                    <Lightbulb className="h-4 w-4 text-yellow-600" />
                    Discussion Topics
                  </h3>
                  <div className="space-y-2">
                    {generatedAgenda.discussionTopics.map((topic, index) => (
                      <div key={index} className="flex justify-between items-start p-3 bg-yellow-50 rounded">
                        <div className="flex-1">
                          <p className="font-medium text-sm">{topic.topic}</p>
                          <p className="text-xs text-muted-foreground mb-1">{topic.purpose}</p>
                          {topic.facilitationTips && (
                            <p className="text-xs text-yellow-700"><strong>Facilitation Tips:</strong> {topic.facilitationTips}</p>
                          )}
                        </div>
                        <Badge variant="secondary" className="text-xs">{topic.timeLimit}</Badge>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Interactive Activities */}
                {generatedAgenda.activities && generatedAgenda.activities.length > 0 && (
                  <>
                    <div>
                      <h3 className="font-semibold flex items-center gap-2 mb-3">
                        <Zap className="h-4 w-4 text-orange-600" />
                        Interactive Activities
                      </h3>
                      <div className="space-y-3">
                        {generatedAgenda.activities.map((activity, index) => (
                          <div key={index} className="border rounded-lg p-3 bg-orange-50">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <h4 className="font-medium text-orange-800">{activity.name}</h4>
                                <Badge variant="outline" className="text-xs mt-1">{activity.type}</Badge>
                              </div>
                              <Badge variant="outline" className="text-orange-600">{activity.timeNeeded}</Badge>
                            </div>
                            <p className="text-sm text-gray-700 mb-2">{activity.description}</p>
                            <div className="text-xs space-y-1">
                              <p><strong>Materials:</strong> {activity.materials.join(', ')}</p>
                              <p><strong>Learning Goal:</strong> {activity.learningGoal}</p>
                              <p><strong>Instructions:</strong> {activity.instructions}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <Separator />
                  </>
                )}

                {/* Handouts */}
                {generatedAgenda.handouts && generatedAgenda.handouts.length > 0 && (
                  <>
                    <div>
                      <h3 className="font-semibold flex items-center gap-2 mb-3">
                        <FileText className="h-4 w-4 text-slate-600" />
                        Handouts & Resources
                      </h3>
                      <div className="space-y-3">
                        {generatedAgenda.handouts.map((handout, index) => (
                          <div key={index} className="border rounded-lg p-3 bg-slate-50">
                            <div className="flex justify-between items-start mb-2">
                              <h4 className="font-medium text-slate-800">{handout.title}</h4>
                              <Badge variant="outline" className="text-slate-600">{handout.type}</Badge>
                            </div>
                            <p className="text-sm text-gray-700 mb-2">{handout.purpose}</p>
                            <div className="bg-white p-2 rounded border text-xs">
                              <strong>Content Preview:</strong>
                              <div className="mt-1 whitespace-pre-line">{handout.content.substring(0, 200)}...</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <Separator />
                  </>
                )}

                <Separator />

                {/* Action Items */}
                <div>
                  <h3 className="font-semibold flex items-center gap-2 mb-3">
                    <CheckSquare className="h-4 w-4 text-purple-600" />
                    Action Items
                  </h3>
                  <div className="space-y-2">
                    {generatedAgenda.actionItems.map((action, index) => (
                      <div key={index} className="flex justify-between items-start p-3 border rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium text-sm">{action.task}</p>
                          <p className="text-xs text-muted-foreground">Assigned to: {action.assignee}</p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <Badge 
                            variant={action.priority === 'High' ? 'destructive' : action.priority === 'Medium' ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {action.priority}
                          </Badge>
                          <span className="text-xs text-muted-foreground">{action.deadline}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Follow-up Planning */}
                <div>
                  <h3 className="font-semibold flex items-center gap-2 mb-3">
                    <Mail className="h-4 w-4 text-indigo-600" />
                    Follow-up Planning
                  </h3>
                  <div className="bg-indigo-50 p-3 rounded-lg">
                    <p className="text-sm">{generatedAgenda.followUpPlanning}</p>
                  </div>
                </div>

                {/* Energizers */}
                {generatedAgenda.energizers && generatedAgenda.energizers.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <h3 className="font-semibold flex items-center gap-2 mb-3">
                        <Zap className="h-4 w-4 text-emerald-600" />
                        Quick Energizers
                      </h3>
                      <div className="space-y-2">
                        {generatedAgenda.energizers.map((energizer, index) => (
                          <div key={index} className="border rounded-lg p-3 bg-emerald-50">
                            <div className="flex justify-between items-start mb-1">
                              <h4 className="font-medium text-emerald-800 text-sm">{energizer.name}</h4>
                              <Badge variant="outline" className="text-emerald-600 text-xs">{energizer.timeNeeded}</Badge>
                            </div>
                            <p className="text-xs text-emerald-700 mb-1"><strong>When to use:</strong> {energizer.when}</p>
                            <p className="text-xs text-gray-700">{energizer.howTo}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {/* Key Takeaways */}
                {generatedAgenda.takeaways && generatedAgenda.takeaways.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <h3 className="font-semibold flex items-center gap-2 mb-3">
                        <Award className="h-4 w-4 text-gold-600" />
                        Key Takeaways
                      </h3>
                      <div className="bg-gradient-to-r from-amber-50 to-yellow-50 p-4 rounded-lg border border-amber-200">
                        <ul className="space-y-2">
                          {generatedAgenda.takeaways.map((takeaway, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <div className="w-2 h-2 rounded-full bg-amber-500 mt-2 flex-shrink-0"></div>
                              <span className="text-sm text-amber-800">{takeaway}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <div className="mb-4">
                  <Calendar className="h-12 w-12 text-muted-foreground mx-auto" />
                </div>
                <h3 className="text-lg font-medium text-muted-foreground mb-2">No agenda generated yet</h3>
                <p className="text-sm text-muted-foreground">
                  Fill out the meeting details on the left and click "Generate Meeting Agenda" to create your customized staff meeting agenda.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}