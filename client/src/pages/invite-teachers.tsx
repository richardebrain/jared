import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiRequest, queryClient } from "../lib/queryClient";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { FileUpload } from "@/components/FileUpload";
import { AlertCircle, Mail, Upload, CheckCircle, XCircle, Clock, RefreshCw } from "lucide-react";

// Define schema for manual email input
const manualEmailSchema = z.object({
  emails: z.string()
    .min(5, { message: "Please enter at least one email address" })
    .refine(value => {
      // Split by common separators and check each email
      const emailsArr = value.split(/[\s,;]+/).filter(e => e.trim().length > 0);
      return emailsArr.every(email => z.string().email().safeParse(email.trim()).success);
    }, { message: "Some email addresses are invalid. Please check and try again." })
});

// Status badge mapping
const StatusBadge = ({ status }: { status: string }) => {
  switch (status) {
    case 'pending':
      return <Badge variant="outline" className="flex items-center gap-1"><Clock className="w-3 h-3" /> Pending</Badge>;
    case 'sent':
      return <Badge variant="default" className="bg-green-600 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Sent</Badge>;
    case 'accepted':
      return <Badge variant="default" className="bg-blue-600 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Accepted</Badge>;
    case 'error':
      return <Badge variant="destructive" className="flex items-center gap-1"><XCircle className="w-3 h-3" /> Error</Badge>;
    case 'expired':
      return <Badge variant="secondary" className="flex items-center gap-1"><Clock className="w-3 h-3" /> Expired</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

export default function InviteTeachersPage() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState("manual");
  const [csvData, setCsvData] = useState<string[]>([]);
  const [isParsingCsv, setIsParsingCsv] = useState(false);

  // Get user and school info
  const { data: user } = useQuery({
    queryKey: ["/api/auth/me"],
    retry: false,
  });

  // Get existing invitations
  const { data: invitations, isLoading: isLoadingInvitations } = useQuery({
    queryKey: ["/api/teacher-invitations/school", user?.schoolId],
    enabled: !!user?.schoolId && (user?.isOwner || user?.isSchoolAdmin),
  });

  // Manual email input form
  const form = useForm<z.infer<typeof manualEmailSchema>>({
    resolver: zodResolver(manualEmailSchema),
    defaultValues: {
      emails: ""
    },
  });

  // File upload handler
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsParsingCsv(true);
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const content = e.target?.result as string;
      // Parse CSV content to extract email addresses
      const emailList: string[] = [];
      
      // Simple CSV parsing (splitting by newlines and commas)
      const lines = content.split(/\\r?\\n/);
      
      for (const line of lines) {
        const values = line.split(',');
        for (const value of values) {
          const trimmedValue = value.trim();
          // Try to find email format
          if (/^[^@]+@[^@]+\\.[^@]+$/.test(trimmedValue)) {
            emailList.push(trimmedValue);
          }
        }
      }
      
      setCsvData(emailList);
      setIsParsingCsv(false);
      
      if (emailList.length === 0) {
        toast({
          title: "No valid email addresses found",
          description: "The uploaded file doesn't contain any valid email addresses.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "File parsed successfully",
          description: `Found ${emailList.length} email addresses in the file.`,
        });
      }
    };
    
    reader.onerror = () => {
      setIsParsingCsv(false);
      toast({
        title: "Error reading file",
        description: "Failed to read the uploaded file. Please try again.",
        variant: "destructive"
      });
    };
    
    reader.readAsText(file);
  };

  // Send invitations mutation for manual input
  const { mutate: sendManualInvitations, isPending: isSendingManual } = useMutation({
    mutationFn: async (data: { emails: string[] }) => {
      return apiRequest("POST", "/api/teacher-invitations/upload", {
        emails: data.emails,
        schoolId: user?.schoolId
      });
    },
    onSuccess: () => {
      toast({
        title: "Invitations sent successfully",
        description: "Email invitations have been sent to the teachers.",
      });
      
      // Reset form
      form.reset();
      
      // Refetch invitations list
      queryClient.invalidateQueries({ queryKey: ["/api/teacher-invitations/school", user?.schoolId] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to send invitations",
        description: error.message || "An error occurred while sending invitations.",
        variant: "destructive"
      });
    }
  });

  // Send invitations mutation for CSV upload
  const { mutate: sendCsvInvitations, isPending: isSendingCsv } = useMutation({
    mutationFn: async (data: { emails: string[] }) => {
      return apiRequest("POST", "/api/teacher-invitations/upload", {
        emails: data.emails,
        schoolId: user?.schoolId
      });
    },
    onSuccess: () => {
      toast({
        title: "Invitations sent successfully",
        description: "Email invitations have been sent to the teachers.",
      });
      
      // Reset CSV data
      setCsvData([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      
      // Refetch invitations list
      queryClient.invalidateQueries({ queryKey: ["/api/teacher-invitations/school", user?.schoolId] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to send invitations",
        description: error.message || "An error occurred while sending invitations.",
        variant: "destructive"
      });
    }
  });

  // Handle manual form submission
  const onSubmitManual = (values: z.infer<typeof manualEmailSchema>) => {
    // Extract email addresses from text input
    const emailsArr = values.emails
      .split(/[\s,;]+/)
      .map(e => e.trim())
      .filter(e => e.length > 0 && z.string().email().safeParse(e).success);
    
    if (emailsArr.length === 0) {
      toast({
        title: "No valid email addresses",
        description: "Please enter at least one valid email address.",
        variant: "destructive"
      });
      return;
    }
    
    sendManualInvitations({ emails: emailsArr });
  };

  // Handle CSV upload submission
  const handleSendCsvInvitations = () => {
    if (csvData.length === 0) {
      toast({
        title: "No email addresses",
        description: "Please upload a file with valid email addresses first.",
        variant: "destructive"
      });
      return;
    }
    
    sendCsvInvitations({ emails: csvData });
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  if (!user) {
    return (
      <div className="container mx-auto p-8 text-center">
        <h1 className="text-2xl font-semibold">Loading...</h1>
      </div>
    );
  }

  if (!user.isOwner && !user.isSchoolAdmin) {
    return (
      <div className="container mx-auto p-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>
            You don't have permission to invite teachers. This feature is only available to school owners and administrators.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-8">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Invite Teachers</h1>
          <p className="text-muted-foreground mt-2">
            Send email invitations to teachers to join your school on MentorMe.
          </p>
        </div>

        <Separator />

        <Tabs defaultValue="manual" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="manual">Manual Entry</TabsTrigger>
            <TabsTrigger value="upload">CSV Upload</TabsTrigger>
          </TabsList>
          
          <TabsContent value="manual" className="pt-4">
            <Card>
              <CardHeader>
                <CardTitle>Add Teachers Manually</CardTitle>
                <CardDescription>
                  Enter teacher email addresses separated by commas, spaces, or new lines.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmitManual)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="emails"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Teacher Emails</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="teacher1@example.com, teacher2@example.com, teacher3@example.com"
                              className="min-h-32"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Enter multiple email addresses separated by commas, spaces, or new lines.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={isSendingManual}
                    >
                      {isSendingManual ? (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                          Sending Invitations...
                        </>
                      ) : (
                        <>
                          <Mail className="mr-2 h-4 w-4" />
                          Send Invitations
                        </>
                      )}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="upload" className="pt-4">
            <Card>
              <CardHeader>
                <CardTitle>Upload CSV File</CardTitle>
                <CardDescription>
                  Upload a CSV file containing teacher email addresses. The file should have a column that contains email addresses.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid w-full items-center gap-1.5">
                    <Label htmlFor="teacher-emails">Upload File</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        ref={fileInputRef}
                        id="teacher-emails"
                        type="file"
                        accept=".csv,.txt"
                        onChange={handleFileUpload}
                        disabled={isParsingCsv || isSendingCsv}
                      />
                      <Button 
                        variant="outline" 
                        size="icon"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isParsingCsv || isSendingCsv}
                      >
                        <Upload className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {isParsingCsv && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Parsing file...
                    </div>
                  )}

                  {csvData.length > 0 && (
                    <div className="space-y-2">
                      <Label>Found {csvData.length} email addresses:</Label>
                      <div className="max-h-40 overflow-y-auto border rounded-md p-2">
                        <ul className="text-sm space-y-1">
                          {csvData.slice(0, 10).map((email, i) => (
                            <li key={i}>{email}</li>
                          ))}
                          {csvData.length > 10 && (
                            <li className="text-muted-foreground">...and {csvData.length - 10} more</li>
                          )}
                        </ul>
                      </div>
                    </div>
                  )}

                  <Button 
                    className="w-full" 
                    onClick={handleSendCsvInvitations}
                    disabled={csvData.length === 0 || isSendingCsv}
                  >
                    {isSendingCsv ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Sending Invitations...
                      </>
                    ) : (
                      <>
                        <Mail className="mr-2 h-4 w-4" />
                        Send Invitations
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Separator className="my-6" />

        <div>
          <h2 className="text-2xl font-semibold mb-4">Teacher Invitations</h2>
          
          {isLoadingInvitations ? (
            <div className="flex justify-center p-6">
              <RefreshCw className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : invitations && invitations.length > 0 ? (
            <Table>
              <TableCaption>List of teacher invitations for your school</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Sent Date</TableHead>
                  <TableHead>Expires</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invitations.map((invitation) => (
                  <TableRow key={invitation.id}>
                    <TableCell>{invitation.email}</TableCell>
                    <TableCell><StatusBadge status={invitation.status} /></TableCell>
                    <TableCell>{formatDate(invitation.sentAt)}</TableCell>
                    <TableCell>{formatDate(invitation.expiresAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center p-6 border rounded-md bg-muted/10">
              <p className="text-muted-foreground">No invitations have been sent yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}