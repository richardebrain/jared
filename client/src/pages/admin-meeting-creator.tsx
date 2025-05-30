import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  Mail
} from 'lucide-react';
import { Link } from 'wouter';

interface MeetingAgenda {
  title: string;
  date: string;
  duration: string;
  attendees: string[];
  objectives: string[];
  agenda: {
    item: string;
    timeAllocation: string;
    presenter: string;
    description: string;
  }[];
  discussionTopics: {
    topic: string;
    purpose: string;
    timeLimit: string;
  }[];
  actionItems: {
    task: string;
    assignee: string;
    deadline: string;
    priority: 'High' | 'Medium' | 'Low';
  }[];
  resources: string[];
  followUpPlanning: string;
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
      const response = await apiRequest('/api/ai/generate-meeting-agenda', {
        method: 'POST',
        body: JSON.stringify(data)
      });
      return response.data;
    },
    onSuccess: (agenda) => {
      setGeneratedAgenda(agenda);
      toast({
        title: "Meeting agenda generated successfully!",
        description: "Your AI-powered staff meeting agenda is ready to use."
      });
    },
    onError: (error) => {
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
              <Textarea
                id="primaryFocus"
                placeholder="What is the main goal of this meeting? (e.g., discuss new curriculum implementation, address parent feedback, plan upcoming events)"
                value={formData.primaryFocus}
                onChange={(e) => handleInputChange('primaryFocus', e.target.value)}
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="specificTopics">Specific Topics to Cover</Label>
              <Textarea
                id="specificTopics"
                placeholder="List any specific topics, announcements, or issues to address (optional)"
                value={formData.specificTopics}
                onChange={(e) => handleInputChange('specificTopics', e.target.value)}
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="challenges">Current Challenges/Issues</Label>
              <Textarea
                id="challenges"
                placeholder="Any current challenges the team is facing that should be addressed? (optional)"
                value={formData.challenges}
                onChange={(e) => handleInputChange('challenges', e.target.value)}
                rows={2}
              />
            </div>

            <div>
              <Label htmlFor="goals">Upcoming Goals/Milestones</Label>
              <Textarea
                id="goals"
                placeholder="Any upcoming goals, deadlines, or milestones to discuss? (optional)"
                value={formData.goals}
                onChange={(e) => handleInputChange('goals', e.target.value)}
                rows={2}
              />
            </div>

            <div>
              <Label htmlFor="previousMeetingNotes">Previous Meeting Follow-up</Label>
              <Textarea
                id="previousMeetingNotes"
                placeholder="Any action items or topics from the previous meeting to follow up on? (optional)"
                value={formData.previousMeetingNotes}
                onChange={(e) => handleInputChange('previousMeetingNotes', e.target.value)}
                rows={2}
              />
            </div>

            <Button 
              onClick={handleGenerate} 
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              disabled={generateAgenda.isPending}
            >
              {generateAgenda.isPending ? (
                <>
                  <Sparkles className="h-4 w-4 mr-2 animate-spin" />
                  Generating Agenda...
                </>
              ) : (
                <>
                  <Wand2 className="h-4 w-4 mr-2" />
                  Generate Meeting Agenda
                </>
              )}
            </Button>
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

                {/* Discussion Topics */}
                <div>
                  <h3 className="font-semibold flex items-center gap-2 mb-3">
                    <Lightbulb className="h-4 w-4 text-yellow-600" />
                    Discussion Topics
                  </h3>
                  <div className="space-y-2">
                    {generatedAgenda.discussionTopics.map((topic, index) => (
                      <div key={index} className="flex justify-between items-start p-2 bg-yellow-50 rounded">
                        <div>
                          <p className="font-medium text-sm">{topic.topic}</p>
                          <p className="text-xs text-muted-foreground">{topic.purpose}</p>
                        </div>
                        <Badge variant="secondary" className="text-xs">{topic.timeLimit}</Badge>
                      </div>
                    ))}
                  </div>
                </div>

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