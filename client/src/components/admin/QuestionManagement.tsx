import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  CheckCircle, XCircle, Plus, Edit, Trash2, Search, Filter, 
  ChevronLeft, ChevronRight, AlertCircle, BookOpen, Eye, EyeOff 
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Question {
  id: string;
  domainId: string;
  text: string;
  options: string;
  correctAnswer: number;
  difficulty: string;
  explanation?: string;
  miniLesson?: string;
  tags?: string;
  createdBy?: number;
  approvedBy?: number;
  isApproved: boolean;
  isEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
  domainName?: string;
  createdByName?: string;
}

interface PaginatedQuestions {
  questions: Question[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export function QuestionManagement() {
  const { toast } = useToast();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [search, setSearch] = useState("");
  const [domainFilter, setDomainFilter] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState("");
  const [approvalFilter, setApprovalFilter] = useState("");
  const [enabledFilter, setEnabledFilter] = useState("");
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  // Build query parameters
  const queryParams = {
    admin_password: "BIGSURF55", // Required for admin access
    page,
    limit,
    ...(search && { search }),
    ...(domainFilter && { domainId: domainFilter }),
    ...(difficultyFilter && { difficulty: difficultyFilter }),
    ...(approvalFilter !== "" && { isApproved: approvalFilter === "true" }),
    ...(enabledFilter !== "" && { isEnabled: enabledFilter === "true" }),
  };

  // Fetch questions
  const { data: questionsData, isLoading: isLoadingQuestions, error } = useQuery({
    queryKey: ["/api/admin/questions", queryParams],
    retry: false,
  });

  // Fetch domains for filter dropdown
  const { data: domains } = useQuery({
    queryKey: ["/api/admin/domains", { admin_password: "BIGSURF55" }],
    retry: false,
  });

  // Delete question mutation
  const deleteQuestionMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest(`/api/admin/questions/${id}?admin_password=BIGSURF55`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Question deleted successfully",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/questions"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete question",
        variant: "destructive",
      });
    },
  });

  // Approve/unapprove question mutation
  const approvalMutation = useMutation({
    mutationFn: async ({ id, approve }: { id: string; approve: boolean }) => {
      return await apiRequest(`/api/admin/questions/${id}/approve?admin_password=BIGSURF55`, {
        method: "POST",
        data: { isApproved: approve },
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Question approval status updated",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/questions"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update approval status",
        variant: "destructive",
      });
    },
  });

  // Enable/disable question mutation
  const enableMutation = useMutation({
    mutationFn: async ({ id, enable }: { id: string; enable: boolean }) => {
      return await apiRequest(`/api/admin/questions/${id}/availability?admin_password=BIGSURF55`, {
        method: "PUT",
        data: { isEnabled: enable },
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Question availability updated",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/questions"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update availability",
        variant: "destructive",
      });
    },
  });

  const handleDelete = (question: Question) => {
    if (confirm(`Are you sure you want to delete the question: "${question.text.substring(0, 50)}..."?`)) {
      deleteQuestionMutation.mutate(question.id);
    }
  };

  const handleApproval = (question: Question, approve: boolean) => {
    approvalMutation.mutate({ id: question.id, approve });
  };

  const handleEnable = (question: Question, enable: boolean) => {
    enableMutation.mutate({ id: question.id, enable });
  };

  const getDifficultyLabel = (difficulty: string) => {
    const difficultyMap: Record<string, string> = {
      "1": "Very Easy",
      "2": "Easy", 
      "3": "Medium",
      "4": "Hard",
      "5": "Very Hard",
      "6": "Master"
    };
    return difficultyMap[difficulty] || difficulty;
  };

  const getDifficultyColor = (difficulty: string) => {
    const colorMap: Record<string, string> = {
      "1": "bg-green-100 text-green-800",
      "2": "bg-green-100 text-green-800",
      "3": "bg-yellow-100 text-yellow-800",
      "4": "bg-orange-100 text-orange-800",
      "5": "bg-red-100 text-red-800",
      "6": "bg-purple-100 text-purple-800"
    };
    return colorMap[difficulty] || "bg-gray-100 text-gray-800";
  };

  const questions = questionsData?.questions || [];
  const pagination = questionsData?.pagination || { page: 1, limit: 20, total: 0, pages: 0 };

  if (isLoadingQuestions) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-12">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Error Loading Questions</h3>
            <p className="text-muted-foreground">Failed to load questions. Please try again.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Create Button */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-blue-500" />
              Assessment Questions
            </CardTitle>
            <CardDescription>
              Manage assessment questions, approval workflow, and availability controls
            </CardDescription>
          </div>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Question
          </Button>
        </CardHeader>
      </Card>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            <div className="lg:col-span-2">
              <Label>Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search questions..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div>
              <Label>Domain</Label>
              <Select value={domainFilter} onValueChange={setDomainFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All domains" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All domains</SelectItem>
                  {domains?.map((domain: any) => (
                    <SelectItem key={domain.name} value={domain.name}>
                      {domain.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Difficulty</Label>
              <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All levels" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All levels</SelectItem>
                  <SelectItem value="1">Very Easy</SelectItem>
                  <SelectItem value="2">Easy</SelectItem>
                  <SelectItem value="3">Medium</SelectItem>
                  <SelectItem value="4">Hard</SelectItem>
                  <SelectItem value="5">Very Hard</SelectItem>
                  <SelectItem value="6">Master</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Approval</Label>
              <Select value={approvalFilter} onValueChange={setApprovalFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All statuses</SelectItem>
                  <SelectItem value="true">Approved</SelectItem>
                  <SelectItem value="false">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Availability</Label>
              <Select value={enabledFilter} onValueChange={setEnabledFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All statuses</SelectItem>
                  <SelectItem value="true">Enabled</SelectItem>
                  <SelectItem value="false">Disabled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Questions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Questions ({pagination.total})</CardTitle>
        </CardHeader>
        <CardContent>
          {questions.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Questions Found</h3>
              <p className="text-muted-foreground">
                {search || domainFilter || difficultyFilter || approvalFilter || enabledFilter
                  ? "No questions match your current filters"
                  : "Get started by creating your first assessment question"}
              </p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Question</TableHead>
                    <TableHead>Domain</TableHead>
                    <TableHead>Difficulty</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created By</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {questions.map((question) => (
                    <TableRow key={question.id}>
                      <TableCell className="max-w-md">
                        <div className="font-medium truncate">{question.text}</div>
                        <div className="text-sm text-muted-foreground">
                          ID: {question.id}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{question.domainName || question.domainId}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getDifficultyColor(question.difficulty)}>
                          {getDifficultyLabel(question.difficulty)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            {question.isApproved ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <XCircle className="h-4 w-4 text-orange-500" />
                            )}
                            <span className="text-sm">
                              {question.isApproved ? "Approved" : "Pending"}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            {question.isEnabled ? (
                              <Eye className="h-4 w-4 text-blue-500" />
                            ) : (
                              <EyeOff className="h-4 w-4 text-gray-500" />
                            )}
                            <span className="text-sm">
                              {question.isEnabled ? "Enabled" : "Disabled"}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {question.createdByName || "Unknown"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingQuestion(question)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleApproval(question, !question.isApproved)}
                            className={question.isApproved ? "text-orange-600" : "text-green-600"}
                          >
                            {question.isApproved ? <XCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEnable(question, !question.isEnabled)}
                            className={question.isEnabled ? "text-gray-600" : "text-blue-600"}
                          >
                            {question.isEnabled ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(question)}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-muted-foreground">
                  Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
                  {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
                  {pagination.total} questions
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page - 1)}
                    disabled={page <= 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <span className="text-sm">
                    Page {pagination.page} of {pagination.pages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page + 1)}
                    disabled={page >= pagination.pages}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* TODO: Add QuestionForm dialog for create and edit */}
      {/* Placeholder dialogs */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Question</DialogTitle>
            <DialogDescription>Question creation form coming soon</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-muted-foreground">
              Full question creation and editing interface will be implemented in the next phase.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingQuestion} onOpenChange={() => setEditingQuestion(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Question</DialogTitle>
            <DialogDescription>Question editing form coming soon</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-muted-foreground">
              Full question editing interface will be implemented in the next phase.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingQuestion(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 