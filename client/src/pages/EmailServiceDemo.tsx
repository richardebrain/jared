import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Mail, Send, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface EmailStatus {
  emailServiceConfigured: boolean;
  provider: string;
  testMode: boolean;
}

export default function EmailServiceDemo() {
  const { toast } = useToast();
  const [emailData, setEmailData] = useState({
    to: "",
    subject: "",
    html: "",
    text: ""
  });

  // Check email service status
  const { data: emailStatus, isLoading: statusLoading } = useQuery<EmailStatus>({
    queryKey: ["/api/email/status"],
  });

  // Send custom email mutation
  const sendEmailMutation = useMutation({
    mutationFn: async (data: typeof emailData) => {
      return apiRequest("/api/email/send", {
        method: "POST",
        body: data,
      });
    },
    onSuccess: () => {
      toast({
        title: "Email sent successfully",
        description: "Your email has been delivered.",
      });
      setEmailData({ to: "", subject: "", html: "", text: "" });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to send email",
        description: error.message || "An error occurred while sending the email.",
        variant: "destructive",
      });
    },
  });

  // Send welcome email mutation
  const sendWelcomeMutation = useMutation({
    mutationFn: async (data: { email: string; firstName: string; schoolName: string }) => {
      return apiRequest("/api/email/welcome", {
        method: "POST",
        body: data,
      });
    },
    onSuccess: () => {
      toast({
        title: "Welcome email sent",
        description: "Welcome email has been delivered.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to send welcome email",
        description: error.message || "An error occurred.",
        variant: "destructive",
      });
    },
  });

  // Send invitation email mutation
  const sendInvitationMutation = useMutation({
    mutationFn: async (data: { 
      email: string; 
      schoolName: string; 
      inviteUrl: string; 
      inviterName?: string 
    }) => {
      return apiRequest("/api/email/invitation", {
        method: "POST",
        body: data,
      });
    },
    onSuccess: () => {
      toast({
        title: "Invitation sent",
        description: "Teacher invitation has been delivered.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to send invitation",
        description: error.message || "An error occurred.",
        variant: "destructive",
      });
    },
  });

  const handleSendEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailData.to || !emailData.subject) {
      toast({
        title: "Missing required fields",
        description: "Please fill in the recipient email and subject.",
        variant: "destructive",
      });
      return;
    }
    sendEmailMutation.mutate(emailData);
  };

  const handleSendWelcomeEmail = () => {
    sendWelcomeMutation.mutate({
      email: "test@example.com",
      firstName: "John",
      schoolName: "Raising Arizona Preschool"
    });
  };

  const handleSendInvitation = () => {
    sendInvitationMutation.mutate({
      email: "newteacher@example.com",
      schoolName: "Raising Arizona Preschool",
      inviteUrl: "https://mentorme.app/register?token=sample-token",
      inviterName: "Laura Book"
    });
  };

  if (statusLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">Loading email service status...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold flex items-center justify-center gap-2">
          <Mail className="h-8 w-8" />
          Email Service Demo
        </h1>
        <p className="text-muted-foreground">
          Test the custom SendGrid email service functionality
        </p>
      </div>

      {/* Service Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Service Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              {emailStatus?.emailServiceConfigured ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-yellow-500" />
              )}
              <span>
                {emailStatus?.emailServiceConfigured ? "Configured" : "Test Mode"}
              </span>
            </div>
            <Badge variant={emailStatus?.emailServiceConfigured ? "default" : "secondary"}>
              {emailStatus?.provider || "SendGrid"}
            </Badge>
            {emailStatus?.testMode && (
              <Badge variant="outline">
                Emails will be logged, not sent
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Custom Email Form */}
        <Card>
          <CardHeader>
            <CardTitle>Send Custom Email</CardTitle>
            <CardDescription>
              Send a custom email with your own content
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSendEmail} className="space-y-4">
              <div>
                <Label htmlFor="to">To Email</Label>
                <Input
                  id="to"
                  type="email"
                  value={emailData.to}
                  onChange={(e) => setEmailData(prev => ({ ...prev, to: e.target.value }))}
                  placeholder="recipient@example.com"
                />
              </div>
              
              <div>
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  value={emailData.subject}
                  onChange={(e) => setEmailData(prev => ({ ...prev, subject: e.target.value }))}
                  placeholder="Email subject"
                />
              </div>
              
              <div>
                <Label htmlFor="text">Text Content</Label>
                <Textarea
                  id="text"
                  value={emailData.text}
                  onChange={(e) => setEmailData(prev => ({ ...prev, text: e.target.value }))}
                  placeholder="Plain text email content"
                  rows={4}
                />
              </div>
              
              <div>
                <Label htmlFor="html">HTML Content (Optional)</Label>
                <Textarea
                  id="html"
                  value={emailData.html}
                  onChange={(e) => setEmailData(prev => ({ ...prev, html: e.target.value }))}
                  placeholder="<p>HTML email content</p>"
                  rows={4}
                />
              </div>
              
              <Button 
                type="submit" 
                disabled={sendEmailMutation.isPending}
                className="w-full"
              >
                <Send className="h-4 w-4 mr-2" />
                {sendEmailMutation.isPending ? "Sending..." : "Send Email"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Template Email Tests */}
        <Card>
          <CardHeader>
            <CardTitle>Template Email Tests</CardTitle>
            <CardDescription>
              Test pre-built email templates
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Welcome Email</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Sends a welcome email to test@example.com for new user John at Raising Arizona Preschool
              </p>
              <Button 
                onClick={handleSendWelcomeEmail}
                disabled={sendWelcomeMutation.isPending}
                variant="outline"
                className="w-full"
              >
                {sendWelcomeMutation.isPending ? "Sending..." : "Send Welcome Email"}
              </Button>
            </div>

            <Separator />

            <div>
              <h4 className="font-medium mb-2">Teacher Invitation</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Sends an invitation email to newteacher@example.com from Laura Book
              </p>
              <Button 
                onClick={handleSendInvitation}
                disabled={sendInvitationMutation.isPending}
                variant="outline"
                className="w-full"
              >
                {sendInvitationMutation.isPending ? "Sending..." : "Send Invitation"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Available Endpoints */}
      <Card>
        <CardHeader>
          <CardTitle>Available Email Endpoints</CardTitle>
          <CardDescription>
            Complete list of email service API endpoints
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-medium mb-2">POST Endpoints:</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• /api/email/send - Send custom email</li>
                <li>• /api/email/welcome - Send welcome email</li>
                <li>• /api/email/invitation - Send teacher invitation</li>
                <li>• /api/email/credential-expiration - Credential alerts</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Additional Features:</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• /api/email/password-reset - Password reset emails</li>
                <li>• /api/email/module-completion - Achievement emails</li>
                <li>• /api/email/bulk - Bulk email sending</li>
                <li>• /api/email/status - Service status check</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}