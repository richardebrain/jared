import { useState, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle, AlertCircle, RefreshCw, X, Clock, Mail } from "lucide-react";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function InviteTeachersPage() {
  const { toast } = useToast();
  const { user, isOwner, isSchoolAdmin, isAdmin } = useAuth();
  const [emails, setEmails] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check if the user has permission to access this page
  const hasPermission = isOwner || isSchoolAdmin || isAdmin;
  if (!hasPermission) {
    return (
      <div className="container mx-auto py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>
            You don't have permission to access this page. Only school owners and administrators can invite teachers.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Get the user's school ID
  const schoolId = user?.schoolId;
  if (!schoolId && !isAdmin) {
    return (
      <div className="container mx-auto py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>School Not Found</AlertTitle>
          <AlertDescription>
            You must be associated with a school to invite teachers. Please contact support.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Query to get all invitations for this school
  const { data: invitations, isLoading: isLoadingInvitations, refetch: refetchInvitations } = useQuery({
    queryKey: [`/api/teacher-invitations/school/${schoolId}`],
    enabled: !!schoolId,
  });

  // Mutation to upload emails and send invitations
  const uploadMutation = useMutation({
    mutationFn: async (emailsToInvite: string[]) => {
      const response = await apiRequest(
        "POST", 
        "/api/teacher-invitations/upload", 
        { emails: emailsToInvite, schoolId: schoolId }
      );
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Invitations Sent",
        description: `Successfully processed ${data.invitations.filter(i => i.success).length} out of ${data.invitations.length} invitations.`,
        variant: "default",
      });
      setEmails("");
      refetchInvitations();
    },
    onError: (error) => {
      console.error("Error sending invitations:", error);
      toast({
        title: "Error",
        description: "Failed to send invitations. Please try again.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsProcessing(false);
    }
  });

  // Mutation to resend an invitation
  const resendMutation = useMutation({
    mutationFn: async (invitationId: number) => {
      const response = await apiRequest(
        "POST", 
        `/api/teacher-invitations/resend/${invitationId}`, 
        {}
      );
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Invitation Resent",
        description: data.message,
        variant: "default",
      });
      refetchInvitations();
    },
    onError: (error) => {
      console.error("Error resending invitation:", error);
      toast({
        title: "Error",
        description: "Failed to resend invitation. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Mutation to cancel an invitation
  const cancelMutation = useMutation({
    mutationFn: async (invitationId: number) => {
      const response = await apiRequest(
        "DELETE", 
        `/api/teacher-invitations/${invitationId}`, 
        {}
      );
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Invitation Cancelled",
        description: data.message,
        variant: "default",
      });
      refetchInvitations();
    },
    onError: (error) => {
      console.error("Error cancelling invitation:", error);
      toast({
        title: "Error",
        description: "Failed to cancel invitation. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Split emails into an array, clean up whitespace and empty lines
    const emailList = emails
      .split(/[,\n]/)
      .map(email => email.trim())
      .filter(email => email.length > 0);
    
    if (emailList.length === 0) {
      toast({
        title: "No Emails Provided",
        description: "Please enter at least one email address.",
        variant: "destructive",
      });
      return;
    }
    
    // Show processing state
    setIsProcessing(true);
    
    // Send invitations
    uploadMutation.mutate(emailList);
  };

  // Handle CSV file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      
      // Extract emails from CSV content
      const lines = content.split(/\r\n|\n/);
      const extractedEmails: string[] = [];
      
      lines.forEach(line => {
        // Try to extract email from each line
        const parts = line.split(',');
        parts.forEach(part => {
          // Simple email validation regex
          const emailMatch = part.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
          if (emailMatch) {
            extractedEmails.push(emailMatch[0]);
          }
        });
      });
      
      if (extractedEmails.length === 0) {
        toast({
          title: "No Emails Found",
          description: "No valid email addresses were found in the uploaded file.",
          variant: "destructive",
        });
        return;
      }
      
      // Update textarea with found emails
      setEmails(extractedEmails.join('\n'));
      
      toast({
        title: "File Processed",
        description: `Found ${extractedEmails.length} email addresses in the uploaded file.`,
        variant: "default",
      });
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    };
    
    reader.readAsText(file);
  };

  // Render invitation status badge
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>;
      case 'sent':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200"><Mail className="w-3 h-3 mr-1" /> Sent</Badge>;
      case 'accepted':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200"><CheckCircle className="w-3 h-3 mr-1" /> Accepted</Badge>;
      case 'expired':
        return <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200"><AlertCircle className="w-3 h-3 mr-1" /> Expired</Badge>;
      case 'error':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200"><AlertCircle className="w-3 h-3 mr-1" /> Error</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Check if invitation is expired
  const isExpired = (expiryDate: string) => {
    if (!expiryDate) return false;
    return new Date(expiryDate) < new Date();
  };

  return (
    <div className="container mx-auto py-8 max-w-6xl">
      <h1 className="text-3xl font-bold mb-8">Invite Teachers</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        {/* Invitation Form */}
        <Card>
          <CardHeader>
            <CardTitle>Send Invitations</CardTitle>
            <CardDescription>
              Enter email addresses of teachers you'd like to invite to your school. Each teacher will receive an invitation email with a link to create an account.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <Label htmlFor="emails">
                  Email Addresses
                </Label>
                <Textarea
                  id="emails"
                  value={emails}
                  onChange={(e) => setEmails(e.target.value)}
                  placeholder="Enter email addresses, one per line or comma-separated"
                  className="min-h-[150px]"
                />
                <p className="text-sm text-muted-foreground mt-2">
                  Enter multiple email addresses, one per line or comma-separated.
                </p>
              </div>
              
              <div className="mb-6">
                <Label htmlFor="file" className="block mb-2">
                  Or Upload a CSV File
                </Label>
                <Input
                  id="file"
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.txt"
                  onChange={handleFileUpload}
                  className="mb-2"
                />
                <p className="text-sm text-muted-foreground">
                  Upload a CSV file containing email addresses. The file will be processed and the emails will be added to the text area above.
                </p>
              </div>
              
              <Button 
                type="submit" 
                disabled={isProcessing || !emails.trim()} 
                className="w-full"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending Invitations...
                  </>
                ) : (
                  'Send Invitations'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
        
        {/* Tips/Help Section */}
        <Card>
          <CardHeader>
            <CardTitle>Tips for Inviting Teachers</CardTitle>
            <CardDescription>
              Here are some helpful tips for inviting your teachers to the platform.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="border-l-4 border-blue-500 pl-4 py-2">
                <h3 className="font-medium">Invitation Process</h3>
                <p className="text-sm text-muted-foreground">
                  Teachers will receive an email with a link to create their account. The link is valid for 7 days.
                </p>
              </div>
              
              <div className="border-l-4 border-blue-500 pl-4 py-2">
                <h3 className="font-medium">CSV Format</h3>
                <p className="text-sm text-muted-foreground">
                  If uploading a CSV file, ensure it contains email addresses. The system will automatically extract valid email addresses from the file.
                </p>
              </div>
              
              <div className="border-l-4 border-blue-500 pl-4 py-2">
                <h3 className="font-medium">Bulk Import</h3>
                <p className="text-sm text-muted-foreground">
                  You can invite multiple teachers at once by adding their email addresses in the text area or uploading a CSV file.
                </p>
              </div>
              
              <div className="border-l-4 border-blue-500 pl-4 py-2">
                <h3 className="font-medium">Invitation Management</h3>
                <p className="text-sm text-muted-foreground">
                  You can view the status of all invitations below. You can resend invitations that haven't been accepted yet.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Invitations Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <span>Teacher Invitations</span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => refetchInvitations()}
              disabled={isLoadingInvitations}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingInvitations ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </CardTitle>
          <CardDescription>
            View and manage all teacher invitations for your school.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingInvitations ? (
            <div className="py-20 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : !invitations || invitations.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <Mail className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p>No invitations have been sent yet.</p>
              <p className="text-sm">Use the form above to invite teachers to your school.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableCaption>A list of all teacher invitations for your school.</TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Sent Date</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invitations.map((invitation) => (
                    <TableRow key={invitation.id}>
                      <TableCell className="font-medium">{invitation.email}</TableCell>
                      <TableCell>{renderStatusBadge(invitation.status)}</TableCell>
                      <TableCell>{formatDate(invitation.sentAt)}</TableCell>
                      <TableCell>
                        {invitation.status === 'accepted' ? (
                          'N/A'
                        ) : (
                          <span className={isExpired(invitation.expiresAt) ? 'text-red-500' : ''}>
                            {formatDate(invitation.expiresAt)}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {invitation.status !== 'accepted' && (
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => resendMutation.mutate(invitation.id)}
                              disabled={resendMutation.isPending}
                            >
                              {resendMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <RefreshCw className="h-4 w-4" />
                              )}
                              <span className="sr-only md:not-sr-only md:ml-2">Resend</span>
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => cancelMutation.mutate(invitation.id)}
                              disabled={cancelMutation.isPending}
                            >
                              {cancelMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <X className="h-4 w-4" />
                              )}
                              <span className="sr-only md:not-sr-only md:ml-2">Cancel</span>
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}