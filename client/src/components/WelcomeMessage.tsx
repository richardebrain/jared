import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Bell, X, AlertTriangle, MessageSquare, BadgeCheck, Award, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

type Message = {
  id: number;
  senderId: number;
  recipientId: number;
  schoolId: number;
  messageType: "welcome" | "certification_reminder" | "announcement" | "personal";
  title: string;
  content: string;
  isRead: boolean;
  important: boolean;
  expiresAt: string | null;
  createdAt: string;
  sender?: {
    firstName: string;
    lastName: string;
    profilePicture: string | null;
  };
};

const messageTypeIcons = {
  welcome: <BadgeCheck className="h-5 w-5 text-green-500" />,
  certification_reminder: <AlertTriangle className="h-5 w-5 text-amber-500" />,
  announcement: <Bell className="h-5 w-5 text-blue-500" />,
  personal: <MessageSquare className="h-5 w-5 text-purple-500" />,
  shoutout: <Award className="h-5 w-5 text-rose-500" />
};

const messageTypeBadges = {
  welcome: <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Welcome</Badge>,
  certification_reminder: <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-200">Certification</Badge>,
  announcement: <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">Announcement</Badge>,
  personal: <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-200">Personal</Badge>,
  shoutout: <Badge className="bg-rose-100 text-rose-800 hover:bg-rose-200">Core Value Shout-Out</Badge>
};

export default function WelcomeMessage() {
  const { toast } = useToast();
  const [activeMessage, setActiveMessage] = useState<Message | null>(null);
  const [showNotification, setShowNotification] = useState(false);

  // Fetch unread messages
  const { data: messages, isLoading, refetch } = useQuery({
    queryKey: ["/api/messages/unread"],
    refetchOnWindowFocus: true,
  });

  // Mark message as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (messageId: number) => {
      const response = await apiRequest(`/api/messages/${messageId}/read`, {
        method: "POST",
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/messages/unread"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Could not mark message as read. Please try again.",
        variant: "destructive",
      });
      console.error("Error marking message as read:", error);
    },
  });

  // Check for certification expiration alerts
  const { data: certifications } = useQuery({
    queryKey: ["/api/certifications/expiring"],
  });

  // Check for new messages or expiring certifications on load
  useEffect(() => {
    if (messages?.length > 0 || (certifications && certifications.length > 0)) {
      setShowNotification(true);
      
      // If there are messages, set the first one as active
      if (messages?.length > 0) {
        setActiveMessage(messages[0]);
      }
    } else {
      setShowNotification(false);
    }
  }, [messages, certifications]);

  // Format date for display
  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Handle marking a message as read
  const handleMessageRead = (messageId: number) => {
    markAsReadMutation.mutate(messageId);
    setActiveMessage(null);
  };

  // Handle closing the dialog
  const handleCloseDialog = () => {
    if (activeMessage) {
      handleMessageRead(activeMessage.id);
    }
    setShowNotification(false);
  };

  const renderMessageContent = () => {
    if (!activeMessage) return null;

    return (
      <>
        <DialogHeader>
          <div className="flex items-center gap-2">
            {messageTypeIcons[activeMessage.messageType]}
            <DialogTitle>{activeMessage.title}</DialogTitle>
          </div>
          <div className="flex justify-between items-center mt-1">
            <DialogDescription>
              From: {activeMessage.sender?.firstName} {activeMessage.sender?.lastName}
            </DialogDescription>
            <div className="flex items-center gap-2">
              {messageTypeBadges[activeMessage.messageType]}
              <span className="text-xs text-muted-foreground">
                {formatDate(activeMessage.createdAt)}
              </span>
            </div>
          </div>
        </DialogHeader>

        <div className="py-4">
          <div className="mb-4 whitespace-pre-wrap">
            {activeMessage.content}
          </div>
        </div>
      </>
    );
  };

  return (
    <>
      <Dialog open={showNotification} onOpenChange={setShowNotification}>
        <DialogContent className="sm:max-w-[500px]">
          {renderMessageContent()}
          <DialogFooter>
            <Button onClick={handleCloseDialog}>
              Mark as Read
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}