import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  MessageSquare, 
  Search, 
  Send,
  Users,
  Mail,
  Clock,
  ArrowLeft,
  Bell,
  CheckCircle,
  AlertCircle,
  Gift,
  Trophy,
  Award,
  Star
} from 'lucide-react';
import { Link } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface Teacher {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  profilePicture?: string;
  points: number;
  level: number;
  lastActive: string;
  hasUnreadMessages?: boolean;
}

interface Message {
  id: number;
  subject: string;
  content: string;
  senderName: string;
  recipientName: string;
  createdAt: string;
  isRead: boolean;
  priority: string;
}

export default function AdminMessagingPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTeachers, setSelectedTeachers] = useState<number[]>([]);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [priority, setPriority] = useState<string>('normal');
  const [messageType, setMessageType] = useState<string>('announcement');
  
  // Bonus box state
  const [boxType, setBoxType] = useState<'bonus' | 'bronze' | 'silver' | 'gold'>('bonus');
  const [bonusPoints, setBonusPoints] = useState('');
  const [bonusMessage, setBonusMessage] = useState('');
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch teachers
  const { data: teachers = [], isLoading: teachersLoading } = useQuery({
    queryKey: ['/api/users'],
    staleTime: 1000 * 60 * 5,
  });

  // Fetch recent messages
  const { data: messagesData, isLoading: messagesLoading } = useQuery({
    queryKey: ['/api/admin/messages'],
    staleTime: 1000 * 60 * 2,
  });

  // Ensure recentMessages is always an array
  const recentMessages = Array.isArray(messagesData) ? messagesData : [];

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (messageData: {
      teacherIds: number[];
      subject: string;
      content: string;
      priority: string;
      messageType: string;
    }) => {
      try {
        const response = await apiRequest('POST', '/api/admin/send-message', messageData);
        return response;
      } catch (error) {
        console.error('Message send error:', error);
        throw error;
      }
    },
    onSuccess: () => {
      toast({
        title: "Message Sent Successfully",
        description: `Message sent to ${selectedTeachers.length} teacher(s)`,
      });
      setSelectedTeachers([]);
      setSubject('');
      setMessage('');
      setPriority('normal');
      setMessageType('announcement');
      // Refresh the messages list
      queryClient.invalidateQueries({ queryKey: ['/api/admin/messages'] });
    },
    onError: () => {
      toast({
        title: "Message Send Failed",
        description: "There was an error sending the message. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Send bonus box mutation
  const sendBonusBoxMutation = useMutation({
    mutationFn: async (bonusData: {
      recipientId: number;
      boxType: string;
      points: number;
      message?: string;
    }) => {
      const response = await apiRequest('POST', '/api/bonus-boxes/send', bonusData);
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Bonus Box Sent Successfully",
        description: `${boxType.charAt(0).toUpperCase() + boxType.slice(1)} box sent!`,
      });
      setBonusPoints('');
      setBonusMessage('');
    },
    onError: () => {
      toast({
        title: "Bonus Box Send Failed",
        description: "There was an error sending the bonus box. Please try again.",
        variant: "destructive",
      });
    },
  });

  const filteredTeachers = teachers.filter((teacher: Teacher) =>
    teacher.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    teacher.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    teacher.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleTeacherToggle = (teacherId: number) => {
    setSelectedTeachers(prev =>
      prev.includes(teacherId)
        ? prev.filter(id => id !== teacherId)
        : [...prev, teacherId]
    );
  };

  const handleSelectAll = () => {
    if (selectedTeachers.length === filteredTeachers.length) {
      setSelectedTeachers([]);
    } else {
      setSelectedTeachers(filteredTeachers.map((t: Teacher) => t.id));
    }
  };

  const handleSendMessage = () => {
    if (!subject.trim() || !message.trim() || selectedTeachers.length === 0) {
      toast({
        title: "Invalid Message",
        description: "Please fill in all fields and select at least one teacher.",
        variant: "destructive",
      });
      return;
    }

    sendMessageMutation.mutate({
      teacherIds: selectedTeachers,
      subject: subject.trim(),
      content: message.trim(),
      priority,
      messageType,
    });
  };

  const handleSendBonusBox = (teacherId: number) => {
    const points = parseInt(bonusPoints);
    if (!points || points < 1 || points > 50) {
      toast({
        title: "Invalid Points",
        description: "Please enter a valid point value (1-50).",
        variant: "destructive",
      });
      return;
    }

    sendBonusBoxMutation.mutate({
      recipientId: teacherId,
      boxType: boxType,
      points: points,
      message: bonusMessage.trim() || undefined,
    });
  };

  const getBoxIcon = (type: string) => {
    switch (type) {
      case 'gold': return <Trophy className="h-4 w-4" />;
      case 'silver': return <Award className="h-4 w-4" />;
      case 'bronze': return <Star className="h-4 w-4" />;
      default: return <Gift className="h-4 w-4" />;
    }
  };

  const getBoxPoints = (type: string) => {
    switch (type) {
      case 'gold': return '20-50 points';
      case 'silver': return '10-30 points';
      case 'bronze': return '1-20 points';
      default: return '1-30 points';
    }
  };

  const getTeacherLevelLabel = (level: number) => {
    if (level >= 5) return 'Master Lead';
    if (level >= 4) return 'Lead Teacher';
    if (level >= 3) return 'Experienced';
    if (level >= 2) return 'Teacher';
    return 'In Training';
  };

  const getLevelColor = (level: number) => {
    if (level >= 5) return 'bg-purple-100 text-purple-800';
    if (level >= 4) return 'bg-blue-100 text-blue-800';
    if (level >= 3) return 'bg-green-100 text-green-800';
    if (level >= 2) return 'bg-yellow-100 text-yellow-800';
    return 'bg-gray-100 text-gray-800';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'normal': return 'bg-blue-100 text-blue-800';
      case 'low': return 'bg-gray-100 text-gray-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const messageTemplates = [
    {
      type: 'welcome',
      subject: 'Welcome to the Team!',
      content: 'Welcome to our professional development platform! We\'re excited to have you join our team of dedicated educators. Please take some time to explore the available training modules and resources.'
    },
    {
      type: 'reminder',
      subject: 'Training Module Reminder',
      content: 'This is a friendly reminder that you have pending training modules to complete. Please log in to your account to continue your professional development journey.'
    },
    {
      type: 'announcement',
      subject: 'Important School Announcement',
      content: 'We have an important announcement to share with all staff members. Please check your dashboard for updates and new information.'
    },
    {
      type: 'appreciation',
      subject: 'Recognition and Appreciation',
      content: 'We want to take a moment to recognize your outstanding work and dedication to early childhood education. Your commitment makes a real difference in children\'s lives.'
    }
  ];

  const loadTemplate = (templateType: string) => {
    const template = messageTemplates.find(t => t.type === templateType);
    if (template) {
      setSubject(template.subject);
      setMessage(template.content);
      setMessageType(templateType);
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <Link href="/director-toolkit">
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Toolkit
            </Button>
          </Link>
        </div>
        
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full">
            <MessageSquare className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Teacher Messaging Center</h1>
            <p className="text-muted-foreground">
              Send announcements, reminders, and communications to your team
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Message Composition */}
        <div className="lg:col-span-2 space-y-6">
          {/* Message Templates */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Quick Templates
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {messageTemplates.map((template) => (
                  <Button
                    key={template.type}
                    variant="outline"
                    size="sm"
                    onClick={() => loadTemplate(template.type)}
                    className="text-xs"
                  >
                    {template.type.charAt(0).toUpperCase() + template.type.slice(1)}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Send Bonus Box */}
          <Card className="border-purple-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gift className="h-5 w-5 text-purple-600" />
                Send Bonus Box
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Box Type</label>
                  <Select value={boxType} onValueChange={(value: 'bonus' | 'bronze' | 'silver' | 'gold') => setBoxType(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bonus">
                        <div className="flex items-center gap-2">
                          <Gift className="h-4 w-4 text-purple-600" />
                          <span>Bonus Box (1-30 points)</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="bronze">
                        <div className="flex items-center gap-2">
                          <Star className="h-4 w-4 text-orange-600" />
                          <span>Bronze Box (1-20 points)</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="silver">
                        <div className="flex items-center gap-2">
                          <Award className="h-4 w-4 text-gray-600" />
                          <span>Silver Box (10-30 points)</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="gold">
                        <div className="flex items-center gap-2">
                          <Trophy className="h-4 w-4 text-yellow-600" />
                          <span>Gold Box (20-50 points)</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Points</label>
                  <Input
                    type="number"
                    value={bonusPoints}
                    onChange={(e) => setBonusPoints(e.target.value)}
                    placeholder="Enter points..."
                    min="1"
                    max="50"
                  />
                  <div className="text-xs text-muted-foreground mt-1">
                    {getBoxPoints(boxType)}
                  </div>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Message (Optional)</label>
                <Textarea
                  value={bonusMessage}
                  onChange={(e) => setBonusMessage(e.target.value)}
                  placeholder="Add a personal message..."
                  rows={2}
                  maxLength={200}
                />
                <div className="text-xs text-muted-foreground mt-1">
                  {bonusMessage.length}/200 characters
                </div>
              </div>

              <div className="text-sm text-muted-foreground">
                Send a surprise bonus box to individual teachers by clicking the gift icon next to their name in the teacher list.
              </div>
            </CardContent>
          </Card>

          {/* Message Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="h-5 w-5" />
                Compose Message
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Message Type</label>
                  <Select value={messageType} onValueChange={setMessageType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="announcement">Announcement</SelectItem>
                      <SelectItem value="reminder">Reminder</SelectItem>
                      <SelectItem value="welcome">Welcome</SelectItem>
                      <SelectItem value="appreciation">Appreciation</SelectItem>
                      <SelectItem value="urgent">Urgent Notice</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Priority</label>
                  <Select value={priority} onValueChange={setPriority}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Subject</label>
                <Input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Enter message subject..."
                  maxLength={100}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Message</label>
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type your message here..."
                  rows={6}
                  maxLength={1000}
                />
                <div className="text-xs text-muted-foreground mt-1">
                  {message.length}/1000 characters
                </div>
              </div>

              <div className="flex items-center justify-between pt-4">
                <div className="text-sm text-muted-foreground">
                  {selectedTeachers.length} teacher(s) selected
                </div>
                <Button
                  onClick={handleSendMessage}
                  disabled={!subject.trim() || !message.trim() || selectedTeachers.length === 0 || sendMessageMutation.isPending}
                >
                  {sendMessageMutation.isPending ? (
                    <>
                      <Clock className="h-4 w-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Send Message
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Recent Messages */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Recent Messages
              </CardTitle>
            </CardHeader>
            <CardContent>
              {messagesLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="p-3 border rounded-lg animate-pulse">
                      <div className="space-y-2">
                        <div className="w-3/4 h-4 bg-muted rounded" />
                        <div className="w-1/2 h-3 bg-muted rounded" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : recentMessages.length === 0 ? (
                <div className="text-center py-8">
                  <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No messages sent yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentMessages.slice(0, 5).map((msg: Message) => (
                    <div key={msg.id} className="p-3 border rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">{msg.subject}</span>
                            <Badge className={`text-xs ${getPriorityColor(msg.priority)}`}>
                              {msg.priority}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            To: {msg.recipientName}
                          </p>
                          <p className="text-sm line-clamp-2">{msg.content}</p>
                        </div>
                        <div className="text-xs text-muted-foreground ml-4">
                          {formatMessageTime(msg.createdAt)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Teacher Selection */}
        <div>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Select Recipients ({selectedTeachers.length})
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAll}
                >
                  {selectedTeachers.length === filteredTeachers.length ? 'None' : 'All'}
                </Button>
              </div>
              
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search teachers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardHeader>
            
            <CardContent className="max-h-96 overflow-y-auto">
              {teachersLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-3 p-2 animate-pulse">
                      <div className="w-4 h-4 bg-muted rounded" />
                      <div className="w-8 h-8 bg-muted rounded-full" />
                      <div className="space-y-1 flex-1">
                        <div className="w-24 h-3 bg-muted rounded" />
                        <div className="w-16 h-2 bg-muted rounded" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredTeachers.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No teachers found</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredTeachers.map((teacher: Teacher) => (
                    <div
                      key={teacher.id}
                      className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                        selectedTeachers.includes(teacher.id)
                          ? 'bg-primary/5 border border-primary/20'
                          : 'hover:bg-muted/50'
                      }`}
                      onClick={() => handleTeacherToggle(teacher.id)}
                    >
                      <Checkbox
                        checked={selectedTeachers.includes(teacher.id)}
                        onChange={() => {}}
                      />
                      
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={teacher.profilePicture} alt={teacher.firstName} />
                        <AvatarFallback className="text-xs">
                          {teacher.firstName?.charAt(0)}{teacher.lastName?.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1">
                          <span className="text-sm font-medium truncate">
                            {teacher.firstName} {teacher.lastName}
                          </span>
                          {teacher.hasUnreadMessages && (
                            <Bell className="h-3 w-3 text-amber-500" />
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={`text-xs ${getLevelColor(teacher.level || 1)}`}>
                            {getTeacherLevelLabel(teacher.level || 1)}
                          </Badge>
                        </div>
                      </div>
                      
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSendBonusBox(teacher.id);
                        }}
                        disabled={sendBonusBoxMutation.isPending}
                        className="h-8 w-8 p-0 text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                        title="Send Bonus Box"
                      >
                        {sendBonusBoxMutation.isPending ? (
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-purple-600 border-t-transparent" />
                        ) : (
                          getBoxIcon(boxType)
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}