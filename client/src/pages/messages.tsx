import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bell, Mail, MailOpen, Calendar, User } from "lucide-react";
import { format } from "date-fns";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface Message {
  id: number;
  createdAt: string;
  senderId: number;
  recipientId: number;
  messageType: string;
  title: string;
  content: string;
  isRead: boolean;
  isImportant: boolean;
  sender: {
    firstName: string;
    lastName: string;
    profilePicture: string | null;
  };
}

export default function MessagesPage() {
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: messages = [], isLoading } = useQuery<Message[]>({
    queryKey: ['/api/messages'],
  });

  const markAsReadMutation = useMutation({
    mutationFn: (messageId: number) => 
      apiRequest('POST', `/api/messages/${messageId}/read`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/messages'] });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
    },
  });

  const handleMessageClick = (message: Message) => {
    setSelectedMessage(message);
    if (!message.isRead) {
      markAsReadMutation.mutate(message.id);
    }
  };

  const getMessageTypeColor = (type: string) => {
    switch (type) {
      case 'announcement': return 'bg-blue-100 text-blue-800';
      case 'reminder': return 'bg-orange-100 text-orange-800';
      case 'welcome': return 'bg-green-100 text-green-800';
      case 'appreciation': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getMessageTypeLabel = (type: string) => {
    switch (type) {
      case 'announcement': return 'Announcement';
      case 'reminder': return 'Reminder';
      case 'welcome': return 'Welcome';
      case 'appreciation': return 'Appreciation';
      default: return 'Message';
    }
  };

  const unreadCount = messages.filter(m => !m.isRead).length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading messages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Mail className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-800">Messages</h1>
            {unreadCount > 0 && (
              <Badge className="bg-red-500 text-white">
                {unreadCount} unread
              </Badge>
            )}
          </div>
          <p className="text-gray-600">View messages from your administrators and colleagues</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Messages List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                All Messages ({messages.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {messages.length === 0 ? (
                <div className="text-center py-8">
                  <Mail className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500">No messages yet</p>
                  <p className="text-sm text-gray-400">Messages from administrators will appear here</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                        selectedMessage?.id === message.id
                          ? 'border-blue-500 bg-blue-50'
                          : message.isRead
                          ? 'border-gray-200 bg-white hover:bg-gray-50'
                          : 'border-blue-200 bg-blue-25 hover:bg-blue-50'
                      }`}
                      onClick={() => handleMessageClick(message)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0">
                          {message.isRead ? (
                            <MailOpen className="h-5 w-5 text-gray-400" />
                          ) : (
                            <Mail className="h-5 w-5 text-blue-600" />
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge className={getMessageTypeColor(message.messageType)}>
                              {getMessageTypeLabel(message.messageType)}
                            </Badge>
                            {message.isImportant && (
                              <Badge variant="destructive" className="text-xs">
                                Important
                              </Badge>
                            )}
                          </div>
                          
                          <h3 className={`font-medium text-sm mb-1 ${
                            !message.isRead ? 'font-semibold' : ''
                          }`}>
                            {message.title}
                          </h3>
                          
                          <p className="text-xs text-gray-600 truncate">
                            {message.content}
                          </p>
                          
                          <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                            <div className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {message.sender.firstName} {message.sender.lastName}
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(message.createdAt), 'MMM dd, yyyy')}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Message Detail */}
          <Card>
            <CardHeader>
              <CardTitle>Message Details</CardTitle>
            </CardHeader>
            <CardContent>
              {selectedMessage ? (
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={getMessageTypeColor(selectedMessage.messageType)}>
                        {getMessageTypeLabel(selectedMessage.messageType)}
                      </Badge>
                      {selectedMessage.isImportant && (
                        <Badge variant="destructive">Important</Badge>
                      )}
                    </div>
                    <h2 className="text-xl font-semibold text-gray-800 mb-3">
                      {selectedMessage.title}
                    </h2>
                  </div>

                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="flex items-center gap-3 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        From: {selectedMessage.sender.firstName} {selectedMessage.sender.lastName}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {format(new Date(selectedMessage.createdAt), 'MMM dd, yyyy HH:mm')}
                      </div>
                    </div>
                  </div>

                  <div className="prose max-w-none">
                    <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                      {selectedMessage.content}
                    </div>
                  </div>

                  {!selectedMessage.isRead && (
                    <Button
                      onClick={() => markAsReadMutation.mutate(selectedMessage.id)}
                      disabled={markAsReadMutation.isPending}
                      className="w-full"
                    >
                      Mark as Read
                    </Button>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Mail className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500">Select a message to view details</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}