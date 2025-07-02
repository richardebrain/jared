import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import VoiceInputTextarea from "@/components/VoiceInputTextarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { MessageCircle, Send, Users, User as UserIcon, Clock, BookOpen, Target, Award, Gift, Star, Trophy, Sparkles } from "lucide-react";
import type { User } from "@shared/schema";

interface DirectorMessage {
  id: number;
  title: string;
  content: string;
  recipientId: number | null;
  loginDuration: number;
  createdAt: string;
  recipientName?: string;
}

export default function DirectorMessages() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [newMessage, setNewMessage] = useState({
    title: "",
    content: "",
    recipientId: "",
    loginDuration: 3
  });

  const [trainingAssignment, setTrainingAssignment] = useState({
    moduleId: "",
    teacherIds: [] as string[],
    dueDate: "",
    message: ""
  });

  const [bonusBox, setBonusBox] = useState({
    recipientIds: [] as string[],
    boxType: "bronze" as "bonus" | "bronze" | "silver" | "gold",
    message: ""
  });

  // Fetch current user
  const { data: user } = useQuery({
    queryKey: ["/api/auth/me"],
  });

  // Fetch teachers in the school
  const { data: teachers } = useQuery({
    queryKey: ["/api/school-teachers"],
    enabled: !!user,
  });

  // Fetch existing messages
  const { data: messages } = useQuery({
    queryKey: ["/api/director-messages/sent"],
    enabled: !!user,
  });

  // Fetch available modules for training assignments
  const { data: modules } = useQuery({
    queryKey: ["/api/modules"],
    enabled: !!user,
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (messageData: any) => {
      return apiRequest("POST", "/api/director-messages", messageData);
    },
    onSuccess: () => {
      toast({
        title: "Message Sent!",
        description: "Your message has been sent to the selected teachers.",
      });
      setNewMessage({
        title: "",
        content: "",
        recipientId: "",
        loginDuration: 3
      });
      queryClient.invalidateQueries({ queryKey: ["/api/director-messages/sent"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Assign training mutation
  const assignTrainingMutation = useMutation({
    mutationFn: async (assignmentData: any) => {
      return apiRequest("POST", "/api/training-assignments", assignmentData);
    },
    onSuccess: () => {
      toast({
        title: "Training Assigned",
        description: "Training has been assigned successfully!",
      });
      setTrainingAssignment({
        moduleId: "",
        teacherIds: [],
        dueDate: "",
        message: ""
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to assign training. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Send bonus box mutation
  const sendBonusBoxMutation = useMutation({
    mutationFn: (data: { recipientId: number; boxType: string; message?: string }) =>
      apiRequest("/api/bonus-boxes/send", {
        method: "POST",
        body: data,
      }),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Bonus box sent successfully!",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send bonus box. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSendMessage = () => {
    if (!newMessage.title.trim() || !newMessage.content.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fill in both title and message content.",
        variant: "destructive",
      });
      return;
    }

    const messageData = {
      title: newMessage.title,
      content: newMessage.content,
      recipientId: newMessage.recipientId && newMessage.recipientId !== "all" ? parseInt(newMessage.recipientId) : null,
      loginDuration: newMessage.loginDuration
    };

    sendMessageMutation.mutate(messageData);
  };

  const handleAssignTraining = () => {
    if (!trainingAssignment.moduleId || trainingAssignment.teacherIds.length === 0) {
      toast({
        title: "Missing Information",
        description: "Please select a training module and at least one teacher.",
        variant: "destructive",
      });
      return;
    }

    const assignmentData = {
      userIds: trainingAssignment.teacherIds.map(id => parseInt(id)),
      moduleId: parseInt(trainingAssignment.moduleId),
      dueDate: trainingAssignment.dueDate || null,
      priority: "medium",
      assignmentMessage: trainingAssignment.message || "You have been assigned a new training module. Please complete it as soon as possible.",
      isBlocking: true
    };

    assignTrainingMutation.mutate(assignmentData);
  };

  const handleSendBonusBox = () => {
    if (bonusBox.recipientIds.length === 0) {
      toast({
        title: "Missing Information",
        description: "Please select at least one teacher to send bonus boxes to.",
        variant: "destructive",
      });
      return;
    }

    // Send bonus box to each selected teacher
    bonusBox.recipientIds.forEach((recipientId) => {
      sendBonusBoxMutation.mutate({
        recipientId: parseInt(recipientId),
        boxType: bonusBox.boxType,
        message: bonusBox.message || undefined,
      });
    });

    // Reset form
    setBonusBox({
      recipientIds: [],
      boxType: "bronze",
      message: ""
    });
  };

  if (!user || (!user.isSchoolAdmin && !user.isOwner && !user.isAdmin)) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-gray-600">
              You don't have permission to access this page.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center space-x-2 mb-6">
        <MessageCircle className="h-6 w-6 text-blue-600" />
        <h1 className="text-2xl font-bold">Director Communication Hub</h1>
      </div>

      <Tabs defaultValue="messages" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="messages" className="flex items-center space-x-2">
            <MessageCircle className="h-4 w-4" />
            <span>Messages</span>
          </TabsTrigger>
          <TabsTrigger value="training" className="flex items-center space-x-2">
            <Target className="h-4 w-4" />
            <span>Assign Training</span>
          </TabsTrigger>
          <TabsTrigger value="bonusBoxes" className="flex items-center space-x-2">
            <Award className="h-4 w-4" />
            <span>Bonus Boxes</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="messages">
          {/* Send New Message */}
          <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Send className="h-5 w-5" />
            <span>Send Message to Teachers</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Message Title</label>
            <Input
              placeholder="Enter message title..."
              value={newMessage.title}
              onChange={(e) => setNewMessage({ ...newMessage, title: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Recipients</label>
            <Select
              value={newMessage.recipientId}
              onValueChange={(value) => setNewMessage({ ...newMessage, recipientId: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select recipient..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4" />
                    <span>All Teachers in School</span>
                  </div>
                </SelectItem>
                {teachers?.teachers && Array.isArray(teachers.teachers) && teachers.teachers.map((teacher: User) => (
                  <SelectItem key={teacher.id} value={teacher.id.toString()}>
                    <div className="flex items-center space-x-2">
                      <UserIcon className="h-4 w-4" />
                      <span>{teacher.firstName} {teacher.lastName}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Show for how many logins?
            </label>
            <Select
              value={newMessage.loginDuration.toString()}
              onValueChange={(value) => setNewMessage({ ...newMessage, loginDuration: parseInt(value) })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 login</SelectItem>
                <SelectItem value="2">2 logins</SelectItem>
                <SelectItem value="3">3 logins</SelectItem>
                <SelectItem value="5">5 logins</SelectItem>
                <SelectItem value="7">7 logins</SelectItem>
                <SelectItem value="10">10 logins</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Message Content</label>
            <VoiceInputTextarea
              value={newMessage.content}
              onChange={(value) => setNewMessage({ ...newMessage, content: value })}
              placeholder="Enter your message here..."
              minHeight="min-h-[120px]"
            />
          </div>

          <Button 
            onClick={handleSendMessage}
            disabled={sendMessageMutation.isPending}
            className="w-full"
          >
            {sendMessageMutation.isPending ? "Sending..." : "Send Message"}
          </Button>
        </CardContent>
      </Card>

      {/* Previous Messages */}
      <Card>
        <CardHeader>
          <CardTitle>Previous Messages</CardTitle>
        </CardHeader>
        <CardContent>
          {messages && Array.isArray(messages) && messages.length > 0 ? (
            <div className="space-y-4">
              {messages.map((message: DirectorMessage) => (
                <div key={message.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold">{message.title}</h3>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">
                        <Clock className="h-3 w-3 mr-1" />
                        {message.loginDuration} logins
                      </Badge>
                      <Badge variant={message.recipientId ? "default" : "secondary"}>
                        {message.recipientId ? (
                          <><UserIcon className="h-3 w-3 mr-1" />{message.recipientName}</>
                        ) : (
                          <><Users className="h-3 w-3 mr-1" />All Teachers</>
                        )}
                      </Badge>
                    </div>
                  </div>
                  <p className="text-gray-600 mb-2">{message.content}</p>
                  <p className="text-sm text-gray-400">
                    Sent: {new Date(message.createdAt).toLocaleDateString()} at {new Date(message.createdAt).toLocaleTimeString()}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">
              No messages sent yet. Send your first message to your teachers above!
            </p>
          )}
        </CardContent>
      </Card>
        </TabsContent>

        <TabsContent value="training">
          {/* Assign Training */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BookOpen className="h-5 w-5" />
                <span>Assign Training to Teachers</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Select Training Module</label>
                <Select
                  value={trainingAssignment.moduleId}
                  onValueChange={(value) => setTrainingAssignment({ ...trainingAssignment, moduleId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a training module..." />
                  </SelectTrigger>
                  <SelectContent>
                    {modules && Array.isArray(modules) && modules.map((module: any) => (
                      <SelectItem key={module.id} value={module.id.toString()}>
                        <div className="flex items-center space-x-2">
                          <BookOpen className="h-4 w-4" />
                          <span>{module.title}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Select Teachers</label>
                <div className="space-y-2">
                  {teachers?.teachers && Array.isArray(teachers.teachers) && teachers.teachers.map((teacher: User) => (
                    <label key={teacher.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={trainingAssignment.teacherIds.includes(teacher.id.toString())}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setTrainingAssignment({
                              ...trainingAssignment,
                              teacherIds: [...trainingAssignment.teacherIds, teacher.id.toString()]
                            });
                          } else {
                            setTrainingAssignment({
                              ...trainingAssignment,
                              teacherIds: trainingAssignment.teacherIds.filter(id => id !== teacher.id.toString())
                            });
                          }
                        }}
                        className="rounded"
                      />
                      <span>{teacher.firstName} {teacher.lastName}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Due Date (Optional)</label>
                <Input
                  type="date"
                  value={trainingAssignment.dueDate}
                  onChange={(e) => setTrainingAssignment({ ...trainingAssignment, dueDate: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Additional Message (Optional)</label>
                <VoiceInputTextarea
                  value={trainingAssignment.message}
                  onChange={(value) => setTrainingAssignment({ ...trainingAssignment, message: value })}
                  placeholder="Add any additional instructions or context for this training assignment..."
                  minHeight="min-h-[120px]"
                />
              </div>

              <Button 
                onClick={handleAssignTraining}
                disabled={assignTrainingMutation.isPending}
                className="w-full"
              >
                {assignTrainingMutation.isPending ? "Assigning Training..." : "Assign Training"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bonusBoxes">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Gift className="h-5 w-5" />
                <span>Send Bonus Boxes to Teachers</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Select Recipients</label>
                <div className="space-y-2 max-h-60 overflow-y-auto border rounded-lg p-3">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="select-all-bonus"
                      checked={teachers?.teachers && bonusBox.recipientIds.length === teachers.teachers.length}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setBonusBox({ 
                            ...bonusBox, 
                            recipientIds: teachers?.teachers?.map((t: User) => t.id.toString()) || [] 
                          });
                        } else {
                          setBonusBox({ ...bonusBox, recipientIds: [] });
                        }
                      }}
                      className="rounded"
                    />
                    <label htmlFor="select-all-bonus" className="text-sm font-medium">
                      Select All Teachers
                    </label>
                  </div>
                  {teachers?.teachers && Array.isArray(teachers.teachers) && teachers.teachers.map((teacher: User) => (
                    <div key={teacher.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`teacher-bonus-${teacher.id}`}
                        checked={bonusBox.recipientIds.includes(teacher.id.toString())}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setBonusBox({ 
                              ...bonusBox, 
                              recipientIds: [...bonusBox.recipientIds, teacher.id.toString()] 
                            });
                          } else {
                            setBonusBox({ 
                              ...bonusBox, 
                              recipientIds: bonusBox.recipientIds.filter(id => id !== teacher.id.toString()) 
                            });
                          }
                        }}
                        className="rounded"
                      />
                      <label htmlFor={`teacher-bonus-${teacher.id}`} className="text-sm">
                        {teacher.firstName} {teacher.lastName}
                      </label>
                    </div>
                  ))}
                </div>
                <div className="text-sm text-muted-foreground mt-2">
                  {bonusBox.recipientIds.length} teacher(s) selected
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Box Type</label>
                <Select 
                  value={bonusBox.boxType} 
                  onValueChange={(value: "bonus" | "bronze" | "silver" | "gold") => 
                    setBonusBox({ ...bonusBox, boxType: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bonus">
                      <div className="flex items-center space-x-2">
                        <Sparkles className="h-4 w-4 text-purple-600" />
                        <span>Bonus Box (1-30 points)</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="bronze">
                      <div className="flex items-center space-x-2">
                        <Star className="h-4 w-4 text-orange-600" />
                        <span>Bronze Box (1-20 points)</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="silver">
                      <div className="flex items-center space-x-2">
                        <Award className="h-4 w-4 text-gray-600" />
                        <span>Silver Box (10-30 points)</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="gold">
                      <div className="flex items-center space-x-2">
                        <Trophy className="h-4 w-4 text-yellow-600" />
                        <span>Gold Box (20-50 points)</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Personal Message (Optional)</label>
                <Textarea
                  value={bonusBox.message}
                  onChange={(e) => setBonusBox({ ...bonusBox, message: e.target.value })}
                  placeholder="Add a personal message for the bonus box..."
                  rows={3}
                  maxLength={200}
                />
                <div className="text-xs text-muted-foreground mt-1">
                  {bonusBox.message.length}/200 characters
                </div>
              </div>

              <Button 
                onClick={handleSendBonusBox}
                disabled={sendBonusBoxMutation.isPending || bonusBox.recipientIds.length === 0}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                {sendBonusBoxMutation.isPending ? (
                  <>
                    <Clock className="h-4 w-4 mr-2 animate-spin" />
                    Sending Bonus Boxes...
                  </>
                ) : (
                  <>
                    <Gift className="h-4 w-4 mr-2" />
                    Send Bonus Boxes
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}