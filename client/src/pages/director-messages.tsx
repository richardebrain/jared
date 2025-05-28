import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { MessageCircle, Send, Users, User as UserIcon, Clock } from "lucide-react";
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
        <h1 className="text-2xl font-bold">Director Messages</h1>
      </div>

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
                {teachers?.map((teacher: User) => (
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
            <Textarea
              placeholder="Enter your message here..."
              rows={4}
              value={newMessage.content}
              onChange={(e) => setNewMessage({ ...newMessage, content: e.target.value })}
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
          {messages && messages.length > 0 ? (
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
    </div>
  );
}