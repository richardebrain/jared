import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Bell,
  Send,
  Users,
  MessageSquare,
  AlertTriangle,
  BadgeCheck,
  Award,
  Check,
  RefreshCw,
  Trash
} from "lucide-react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// Message types and their colors for UI
const messageTypes = [
  { id: "welcome", label: "Welcome", icon: <BadgeCheck className="h-4 w-4" />, color: "text-green-500" },
  { id: "announcement", label: "Announcement", icon: <Bell className="h-4 w-4" />, color: "text-blue-500" },
  { id: "personal", label: "Personal", icon: <MessageSquare className="h-4 w-4" />, color: "text-purple-500" },
  { id: "shoutout", label: "Core Value Shout-Out", icon: <Award className="h-4 w-4" />, color: "text-rose-500" }
];

export default function DirectorMessagesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messageFormOpen, setMessageFormOpen] = useState(false);
  const [messageData, setMessageData] = useState({
    recipientId: "",
    title: "",
    content: "",
    messageType: "announcement",
    important: false,
    coreValue: "" // Used only for shout-outs
  });
  
  // Only school admins, admins, and owners should be able to access this page
  const isAuthorized = user?.isAdmin || user?.isSchoolAdmin || user?.isOwner;
  
  // Fetch team members (for the recipient dropdown)
  const { data: teamMembers, isLoading: isLoadingTeam } = useQuery({
    queryKey: ["/api/school/team-members"],
    enabled: isAuthorized,
  });
  
  // Fetch sent messages
  const { data: sentMessages, isLoading: isLoadingMessages, refetch: refetchMessages } = useQuery({
    queryKey: ["/api/messages/sent"],
    enabled: isAuthorized,
  });
  
  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (data: typeof messageData) => {
      let messageContent = data.content;
      
      // If it's a shout-out, add the core value to the content
      if (data.messageType === "shoutout" && data.coreValue) {
        messageContent = `${data.content}\n\nCore Value: ${data.coreValue}`;
      }
      
      const response = await apiRequest("/api/messages/send", {
        method: "POST",
        data: {
          ...data,
          content: messageContent
        }
      });
      return response.data;
    },
    onSuccess: () => {
      toast({
        title: "Message Sent",
        description: "Your message has been sent successfully.",
        variant: "default",
      });
      setMessageFormOpen(false);
      setMessageData({
        recipientId: "",
        title: "",
        content: "",
        messageType: "announcement",
        important: false,
        coreValue: ""
      });
      queryClient.invalidateQueries({ queryKey: ["/api/messages/sent"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
      console.error("Error sending message:", error);
    },
  });

  // Delete message mutation
  const deleteMessageMutation = useMutation({
    mutationFn: async (messageId: number) => {
      const response = await apiRequest(`/api/messages/${messageId}`, {
        method: "DELETE",
      });
      return response.data;
    },
    onSuccess: () => {
      toast({
        title: "Message Deleted",
        description: "The message has been deleted successfully.",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/messages/sent"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete message. Please try again.",
        variant: "destructive",
      });
      console.error("Error deleting message:", error);
    },
  });
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessageMutation.mutate(messageData);
  };
  
  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setMessageData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle select changes
  const handleSelectChange = (name: string, value: string) => {
    setMessageData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Format date for display
  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric'
    }).format(date);
  };
  
  // Get user initials for Avatar
  const getUserInitials = (firstName: string, lastName: string) => {
    return `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase();
  };
  
  // If not authorized, show access denied message
  if (!isAuthorized) {
    return (
      <div className="container max-w-6xl mx-auto p-6">
        <Card className="border-rose-100 bg-rose-50/30">
          <CardContent className="p-6">
            <div className="text-center text-rose-600">
              <h2 className="text-xl font-semibold">Access Denied</h2>
              <p className="mt-2">You don't have permission to access this page.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="container max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Team Communications</h1>
        <Button onClick={() => setMessageFormOpen(true)}>
          <MessageSquare className="h-4 w-4 mr-2" /> New Message
        </Button>
      </div>
      
      <Tabs defaultValue="messages">
        <TabsList className="mb-4">
          <TabsTrigger value="messages">Sent Messages</TabsTrigger>
          <TabsTrigger value="team">Team Members</TabsTrigger>
        </TabsList>
        
        <TabsContent value="messages">
          <Card>
            <CardHeader className="bg-gradient-to-r from-slate-50 to-blue-50">
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center">
                  <MessageSquare className="h-5 w-5 mr-2 text-blue-500" />
                  Sent Messages
                </CardTitle>
                <Button variant="outline" size="sm" onClick={() => refetchMessages()}>
                  <RefreshCw className="h-4 w-4 mr-2" /> Refresh
                </Button>
              </div>
              <CardDescription>
                View and manage messages sent to your team
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {isLoadingMessages ? (
                <div className="flex justify-center items-center h-32">
                  <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : sentMessages?.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Type</TableHead>
                        <TableHead>Title</TableHead>
                        <TableHead>Recipient</TableHead>
                        <TableHead>Date Sent</TableHead>
                        <TableHead>Read</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sentMessages.map((message: any) => (
                        <TableRow key={message.id}>
                          <TableCell>
                            <div className="flex items-center">
                              <span className={messageTypes.find(t => t.id === message.messageType)?.color || "text-gray-500"}>
                                {messageTypes.find(t => t.id === message.messageType)?.icon}
                              </span>
                              <span className="ml-2 text-xs">
                                {messageTypes.find(t => t.id === message.messageType)?.label || "Message"}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {message.important && <Badge variant="outline" className="text-amber-500 border-amber-200 bg-amber-50">Important</Badge>}
                              <span className="font-medium">{message.title}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Avatar className="h-6 w-6">
                                <AvatarImage src={message.recipient?.profilePicture || ""} alt="" />
                                <AvatarFallback className="text-xs">
                                  {getUserInitials(message.recipient?.firstName, message.recipient?.lastName)}
                                </AvatarFallback>
                              </Avatar>
                              <span>{message.recipient?.firstName} {message.recipient?.lastName}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {formatDate(message.createdAt)}
                          </TableCell>
                          <TableCell>
                            {message.isRead ? (
                              <Check className="h-4 w-4 text-green-500" />
                            ) : (
                              <div className="h-2 w-2 rounded-full bg-amber-500" />
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteMessageMutation.mutate(message.id)}
                              className="text-rose-500 hover:text-rose-700 hover:bg-rose-50"
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-20" />
                  <p>No messages sent yet</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-4"
                    onClick={() => setMessageFormOpen(true)}
                  >
                    Send Your First Message
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="team">
          <Card>
            <CardHeader className="bg-gradient-to-r from-slate-50 to-purple-50">
              <CardTitle className="flex items-center">
                <Users className="h-5 w-5 mr-2 text-purple-500" />
                Team Members
              </CardTitle>
              <CardDescription>
                Your school's teachers and staff
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {isLoadingTeam ? (
                <div className="flex justify-center items-center h-32">
                  <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : teamMembers?.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Title</TableHead>
                        <TableHead>Member Since</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {teamMembers.map((member: any) => (
                        <TableRow key={member.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={member.profilePicture || ""} alt="" />
                                <AvatarFallback>
                                  {getUserInitials(member.firstName, member.lastName)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium">{member.firstName} {member.lastName}</div>
                                <div className="text-xs text-muted-foreground">@{member.username}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{member.email}</TableCell>
                          <TableCell>{member.jobTitle || "Teacher"}</TableCell>
                          <TableCell>{formatDate(member.createdAt)}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setMessageData(prev => ({
                                  ...prev,
                                  recipientId: member.id
                                }));
                                setMessageFormOpen(true);
                              }}
                            >
                              <MessageSquare className="h-4 w-4 mr-2" /> Message
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-20" />
                  <p>No team members found</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* New Message Dialog */}
      <Dialog open={messageFormOpen} onOpenChange={setMessageFormOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>New Message</DialogTitle>
            <DialogDescription>
              Send a message to a team member or make an announcement.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="messageType" className="text-right">
                  Message Type
                </Label>
                <div className="col-span-3">
                  <Select
                    value={messageData.messageType}
                    onValueChange={(value) => handleSelectChange("messageType", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a message type" />
                    </SelectTrigger>
                    <SelectContent>
                      {messageTypes.map(type => (
                        <SelectItem key={type.id} value={type.id}>
                          <div className="flex items-center">
                            <span className={type.color}>{type.icon}</span>
                            <span className="ml-2">{type.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="recipientId" className="text-right">
                  Recipient
                </Label>
                <div className="col-span-3">
                  <Select
                    value={messageData.recipientId}
                    onValueChange={(value) => handleSelectChange("recipientId", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a team member" />
                    </SelectTrigger>
                    <SelectContent>
                      {teamMembers?.map((member: any) => (
                        <SelectItem key={member.id} value={member.id.toString()}>
                          {member.firstName} {member.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {messageData.messageType === "shoutout" && (
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="coreValue" className="text-right">
                    Core Value
                  </Label>
                  <div className="col-span-3">
                    <Select
                      value={messageData.coreValue}
                      onValueChange={(value) => handleSelectChange("coreValue", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a core value" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Be Consistent">Be Consistent</SelectItem>
                        <SelectItem value="Be Prepared">Be Prepared</SelectItem>
                        <SelectItem value="Be Committed">Be Committed</SelectItem>
                        <SelectItem value="Be Caring">Be Caring</SelectItem>
                        <SelectItem value="Be Positive">Be Positive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="title" className="text-right">
                  Title
                </Label>
                <div className="col-span-3">
                  <Input
                    id="title"
                    name="title"
                    value={messageData.title}
                    onChange={handleInputChange}
                    placeholder="Enter message title"
                    className="w-full"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="content" className="text-right">
                  Message
                </Label>
                <div className="col-span-3">
                  <Textarea
                    id="content"
                    name="content"
                    value={messageData.content}
                    onChange={handleInputChange}
                    placeholder="Enter your message"
                    className="w-full min-h-[100px]"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <div className="col-span-3 col-start-2 flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="important"
                    checked={messageData.important}
                    onChange={(e) => setMessageData(prev => ({
                      ...prev,
                      important: e.target.checked
                    }))}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <Label htmlFor="important" className="font-normal">
                    Mark as important
                  </Label>
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setMessageFormOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={sendMessageMutation.isPending}>
                {sendMessageMutation.isPending ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Send Message
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}