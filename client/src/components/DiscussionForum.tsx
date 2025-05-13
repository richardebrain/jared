import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, BookOpen, CheckCircle, ChevronDown, MessageSquare, Search, ThumbsDown, ThumbsUp, Users } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { type User, type DiscussionThread } from "@/types";
import { apiRequest } from "@/lib/queryClient";

const formatDate = (date: Date | string) => {
  const d = new Date(date);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: 'numeric'
  }).format(d);
};

const getInitials = (name: string) => {
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase();
};

const categories = [
  { value: "curriculum", label: "Curriculum & Planning" },
  { value: "classroom-management", label: "Classroom Management" },
  { value: "child-development", label: "Child Development" },
  { value: "parent-communication", label: "Parent Communication" },
  { value: "professional-development", label: "Professional Development" },
  { value: "mindful-mornings", label: "Mindful Mornings" },
  { value: "teaching-strategies", label: "Teaching Strategies" },
  { value: "resources", label: "Resources & Materials" },
  { value: "general", label: "General Discussion" }
];

const threadFormSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters").max(100, "Title cannot exceed 100 characters"),
  content: z.string().min(10, "Content must be at least 10 characters"),
  category: z.string().min(1, "Please select a category")
});

const commentFormSchema = z.object({
  content: z.string().min(5, "Comment must be at least 5 characters")
});

interface CommentProps {
  comment: any;
  user: User | null;
  threadAuthorId: number;
}

function Comment({ comment, user, threadAuthorId }: CommentProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(comment.content);

  const updateCommentMutation = useMutation({
    mutationFn: (data: { content: string }) => 
      apiRequest(`/api/comments/${comment.id}`, "PATCH", data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['/api/discussions', comment.threadId, 'comments']
      });
      setIsEditing(false);
      toast({
        title: "Comment updated",
        description: "Your comment has been updated successfully.",
      });
    },
    onError: (err) => {
      toast({
        title: "Error updating comment",
        description: "There was an error updating your comment. Please try again.",
        variant: "destructive",
      });
      console.error("Error updating comment:", err);
    }
  });

  const deleteCommentMutation = useMutation({
    mutationFn: () => apiRequest(`/api/comments/${comment.id}`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['/api/discussions', comment.threadId, 'comments']
      });
      toast({
        title: "Comment deleted",
        description: "Your comment has been deleted successfully.",
      });
    },
    onError: (err) => {
      toast({
        title: "Error deleting comment",
        description: "There was an error deleting your comment. Please try again.",
        variant: "destructive",
      });
      console.error("Error deleting comment:", err);
    }
  });

  const endorseCommentMutation = useMutation({
    mutationFn: (endorsed: boolean) => 
      apiRequest(`/api/comments/${comment.id}/endorse`, "PATCH", { endorsed }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['/api/discussions', comment.threadId, 'comments']
      });
      toast({
        title: comment.endorsed ? "Comment unendorsed" : "Comment endorsed",
        description: `The comment has been ${comment.endorsed ? "unendorsed" : "endorsed"} successfully.`,
      });
    },
    onError: (err) => {
      toast({
        title: "Error endorsing comment",
        description: "There was an error endorsing the comment. Please try again.",
        variant: "destructive",
      });
      console.error("Error endorsing comment:", err);
    }
  });

  const voteMutation = useMutation({
    mutationFn: (voteType: string) => 
      apiRequest(`/api/comments/${comment.id}/vote`, "POST", { voteType }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['/api/discussions', comment.threadId, 'comments']
      });
    },
    onError: (err) => {
      toast({
        title: "Error voting",
        description: "There was an error with your vote. Please try again.",
        variant: "destructive",
      });
      console.error("Error voting:", err);
    }
  });

  const removeVoteMutation = useMutation({
    mutationFn: () => 
      apiRequest(`/api/comments/${comment.id}/vote`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['/api/discussions', comment.threadId, 'comments']
      });
    },
    onError: (err) => {
      toast({
        title: "Error removing vote",
        description: "There was an error removing your vote. Please try again.",
        variant: "destructive",
      });
      console.error("Error removing vote:", err);
    }
  });

  const authorInfo = comment.author || { firstName: "Unknown", lastName: "User" };

  const handleSaveEdit = () => {
    if (editedContent.length < 5) {
      toast({
        title: "Comment too short",
        description: "Comment must be at least 5 characters long.",
        variant: "destructive",
      });
      return;
    }
    updateCommentMutation.mutate({ content: editedContent });
  };

  const handleVote = (voteType: string) => {
    voteMutation.mutate(voteType);
  };

  const handleRemoveVote = () => {
    removeVoteMutation.mutate();
  };

  return (
    <div className="border-b border-gray-200 py-4">
      <div className="flex space-x-3">
        <Avatar className="h-10 w-10">
          <AvatarImage src={authorInfo.profilePicture || undefined} alt={`${authorInfo.firstName} ${authorInfo.lastName}`} />
          <AvatarFallback>{getInitials(`${authorInfo.firstName} ${authorInfo.lastName}`)}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold">
                {authorInfo.firstName} {authorInfo.lastName}
                {comment.endorsed && (
                  <Badge className="ml-2 bg-green-600">
                    <CheckCircle className="mr-1 h-3 w-3" /> Best Answer
                  </Badge>
                )}
              </p>
              <p className="text-sm text-gray-500">{formatDate(comment.createdAt)}</p>
            </div>
            {user && user.id === comment.authorId && (
              <div className="flex space-x-2">
                {isEditing ? (
                  <>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => {
                        setIsEditing(false);
                        setEditedContent(comment.content);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button 
                      size="sm" 
                      onClick={handleSaveEdit}
                      disabled={updateCommentMutation.isPending}
                    >
                      Save
                    </Button>
                  </>
                ) : (
                  <>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => setIsEditing(true)}
                    >
                      Edit
                    </Button>
                    <Button 
                      size="sm" 
                      variant="destructive" 
                      onClick={() => deleteCommentMutation.mutate()}
                      disabled={deleteCommentMutation.isPending}
                    >
                      Delete
                    </Button>
                  </>
                )}
              </div>
            )}
            {user && user.id === threadAuthorId && (
              <Button
                size="sm"
                variant={comment.endorsed ? "outline" : "default"}
                onClick={() => endorseCommentMutation.mutate(!comment.endorsed)}
                disabled={endorseCommentMutation.isPending}
              >
                {comment.endorsed ? "Unendorse" : "Endorse Answer"}
              </Button>
            )}
          </div>
          {isEditing ? (
            <Textarea
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              className="mt-2"
              rows={4}
            />
          ) : (
            <div className="mt-2 text-sm whitespace-pre-wrap">{comment.content}</div>
          )}
          <div className="mt-3 flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => handleVote('upvote')}
                className={comment.userVote === 'upvote' ? 'text-green-600' : ''}
              >
                <ThumbsUp className="h-4 w-4" />
              </Button>
              <span>{comment.upvotes || 0}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => handleVote('downvote')}
                className={comment.userVote === 'downvote' ? 'text-red-600' : ''}
              >
                <ThumbsDown className="h-4 w-4" />
              </Button>
              <span>{comment.downvotes || 0}</span>
            </div>
            {comment.userVote && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleRemoveVote}
                className="text-xs"
              >
                Remove vote
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ThreadView({ threadId, user }: { threadId: number, user: User | null }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newComment, setNewComment] = useState("");
  
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(commentFormSchema),
    defaultValues: {
      content: ""
    }
  });

  const threadQuery = useQuery({
    queryKey: ['/api/discussions', threadId],
    queryFn: async () => {
      const response = await fetch(`/api/discussions/${threadId}`);
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();
    }
  });

  const commentsQuery = useQuery({
    queryKey: ['/api/discussions', threadId, 'comments'],
    queryFn: async () => {
      const response = await fetch(`/api/discussions/${threadId}/comments`);
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();
    }
  });

  const addCommentMutation = useMutation({
    mutationFn: (data: { content: string }) => 
      apiRequest(`/api/discussions/${threadId}/comments`, "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['/api/discussions', threadId, 'comments']
      });
      reset();
      toast({
        title: "Comment added",
        description: "Your comment has been added successfully.",
      });
    },
    onError: (err) => {
      toast({
        title: "Error adding comment",
        description: "There was an error adding your comment. Please try again.",
        variant: "destructive",
      });
      console.error("Error adding comment:", err);
    }
  });

  const onSubmit = (data: { content: string }) => {
    addCommentMutation.mutate(data);
  };

  if (threadQuery.isLoading) {
    return <div className="flex justify-center p-10">Loading thread...</div>;
  }

  if (threadQuery.isError) {
    return (
      <div className="text-center p-10">
        <AlertCircle className="mx-auto h-10 w-10 text-red-500" />
        <h3 className="mt-2 text-lg font-medium">Error loading thread</h3>
        <p className="mt-1 text-sm text-gray-500">
          There was an error loading this discussion thread. Please try again later.
        </p>
      </div>
    );
  }

  const thread = threadQuery.data;
  const comments = commentsQuery.data || [];
  const categoryLabel = categories.find(c => c.value === thread.category)?.label || thread.category;
  const author = thread.author || { firstName: "Unknown", lastName: "User" };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <Badge className="mb-2">{categoryLabel}</Badge>
              <CardTitle className="text-2xl">{thread.title}</CardTitle>
              <CardDescription>
                Posted by {author.firstName} {author.lastName} on {formatDate(thread.createdAt)}
              </CardDescription>
            </div>
            <Avatar className="h-10 w-10">
              <AvatarImage src={author.profilePicture || undefined} alt={`${author.firstName} ${author.lastName}`} />
              <AvatarFallback>{getInitials(`${author.firstName} ${author.lastName}`)}</AvatarFallback>
            </Avatar>
          </div>
        </CardHeader>
        <CardContent>
          <div className="whitespace-pre-wrap">{thread.content}</div>
        </CardContent>
        <CardFooter className="border-t pt-4 text-sm text-gray-500">
          <div className="flex space-x-4">
            <div className="flex items-center">
              <MessageSquare className="mr-1 h-4 w-4" />
              {thread.commentCount || 0} comments
            </div>
            <div className="flex items-center">
              <Users className="mr-1 h-4 w-4" />
              {thread.viewCount || 0} views
            </div>
            <div>
              Last activity: {formatDate(thread.lastActivity || thread.createdAt)}
            </div>
          </div>
        </CardFooter>
      </Card>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">
          {comments.length} {comments.length === 1 ? 'Comment' : 'Comments'}
        </h3>

        {user ? (
          <form onSubmit={handleSubmit(onSubmit)} className="mb-6">
            <div className="space-y-3">
              <Textarea
                placeholder="Add a comment..."
                className="w-full resize-none"
                rows={4}
                {...register("content")}
              />
              {errors.content && (
                <p className="text-red-500 text-sm">{errors.content.message}</p>
              )}
              <Button 
                type="submit" 
                className="w-full sm:w-auto"
                disabled={addCommentMutation.isPending}
              >
                {addCommentMutation.isPending ? "Posting..." : "Post Comment"}
              </Button>
            </div>
          </form>
        ) : (
          <div className="bg-gray-50 p-4 rounded mb-6">
            <p className="text-center">Please log in to post a comment.</p>
          </div>
        )}

        {commentsQuery.isLoading ? (
          <div className="text-center py-8">Loading comments...</div>
        ) : comments.length > 0 ? (
          <div className="space-y-1">
            {comments.map((comment) => (
              <Comment 
                key={comment.id} 
                comment={comment} 
                user={user} 
                threadAuthorId={thread.authorId}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            No comments yet. Be the first to comment!
          </div>
        )}
      </div>
    </div>
  );
}

function ThreadCard({ thread, user }: { thread: any, user: User | null }) {
  const categoryLabel = categories.find(c => c.value === thread.category)?.label || thread.category;
  const author = thread.author || { firstName: "Unknown", lastName: "User" };

  return (
    <Card className="mb-4 hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex justify-between">
          <div>
            <Badge className="mb-1">{categoryLabel}</Badge>
            <Link href={`/discussions/${thread.id}`}>
              <CardTitle className="text-xl hover:text-primary cursor-pointer">{thread.title}</CardTitle>
            </Link>
          </div>
          <Avatar className="h-10 w-10">
            <AvatarImage src={author.profilePicture || undefined} alt={`${author.firstName} ${author.lastName}`} />
            <AvatarFallback>{getInitials(`${author.firstName} ${author.lastName}`)}</AvatarFallback>
          </Avatar>
        </div>
        <CardDescription>
          Posted by {author.firstName} {author.lastName} on {formatDate(thread.createdAt)}
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-2">
        <p className="line-clamp-2">{thread.content}</p>
      </CardContent>
      <CardFooter className="pt-2 text-sm text-gray-500">
        <div className="flex space-x-4">
          <div className="flex items-center">
            <MessageSquare className="mr-1 h-4 w-4" />
            {thread.commentCount || 0} comments
          </div>
          <div className="flex items-center">
            <Users className="mr-1 h-4 w-4" />
            {thread.viewCount || 0} views
          </div>
          <div>
            Last activity: {formatDate(thread.lastActivity || thread.createdAt)}
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}

function NewThreadDialog({ 
  isOpen, 
  onClose, 
  user 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  user: User | null;
}) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const form = useForm<z.infer<typeof threadFormSchema>>({
    resolver: zodResolver(threadFormSchema),
    defaultValues: {
      title: "",
      content: "",
      category: ""
    }
  });
  
  const createThreadMutation = useMutation({
    mutationFn: (data: z.infer<typeof threadFormSchema>) => 
      apiRequest("/api/discussions", "POST", data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/discussions'] });
      form.reset();
      onClose();
      toast({
        title: "Thread created",
        description: "Your discussion thread has been created successfully.",
      });
      // Navigate to the new thread
      window.location.href = `/discussions/${data.id}`;
    },
    onError: (err) => {
      toast({
        title: "Error creating thread",
        description: "There was an error creating your thread. Please try again.",
        variant: "destructive",
      });
      console.error("Error creating thread:", err);
    }
  });

  function onSubmit(data: z.infer<typeof threadFormSchema>) {
    createThreadMutation.mutate(data);
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Create New Discussion Thread</DialogTitle>
          <DialogDescription>
            Share your questions, insights, or experiences with other teachers.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Enter a clear, specific title for your discussion" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.value} value={category.value}>
                          {category.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Content</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Share your thoughts, questions, or experiences in detail" 
                      rows={8}
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Be clear and provide as much context as possible to get helpful responses.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={createThreadMutation.isPending}
              >
                {createThreadMutation.isPending ? "Creating..." : "Create Thread"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function ThreadList({ user }: { user: User | null }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentCategory, setCurrentCategory] = useState<string>("all");
  const [isNewThreadDialogOpen, setIsNewThreadDialogOpen] = useState(false);
  
  const threadsQuery = useQuery({
    queryKey: ['/api/discussions', currentCategory],
    queryFn: async () => {
      const url = currentCategory === "all" 
        ? "/api/discussions"
        : `/api/discussions?category=${currentCategory}`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();
    }
  });

  const filteredThreads = threadsQuery.data?.filter((thread: any) => 
    thread.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    thread.content.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <Input
            className="pl-8"
            placeholder="Search discussions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button 
          onClick={() => setIsNewThreadDialogOpen(true)}
          disabled={!user}
        >
          Start New Discussion
        </Button>
      </div>

      <Tabs defaultValue="all" value={currentCategory} onValueChange={setCurrentCategory}>
        <TabsList className="mb-4 w-full overflow-x-auto flex flex-nowrap">
          <TabsTrigger value="all">All Topics</TabsTrigger>
          {categories.map((category) => (
            <TabsTrigger 
              key={category.value} 
              value={category.value}
              className="whitespace-nowrap"
            >
              {category.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {threadsQuery.isLoading ? (
          <div className="text-center py-10">Loading discussions...</div>
        ) : threadsQuery.isError ? (
          <div className="text-center py-10">
            <AlertCircle className="mx-auto h-10 w-10 text-red-500" />
            <h3 className="mt-2 text-lg font-medium">Error loading discussions</h3>
            <p className="mt-1 text-sm text-gray-500">
              There was an error loading the discussions. Please try again later.
            </p>
          </div>
        ) : filteredThreads.length === 0 ? (
          <div className="text-center py-10 bg-gray-50 rounded-lg">
            <BookOpen className="mx-auto h-10 w-10 text-gray-400" />
            <h3 className="mt-2 text-lg font-medium">No discussions found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm 
                ? "No discussions match your search. Try different keywords."
                : "No discussions in this category yet. Be the first to start one!"}
            </p>
            {!searchTerm && user && (
              <Button 
                className="mt-4" 
                onClick={() => setIsNewThreadDialogOpen(true)}
              >
                Start New Discussion
              </Button>
            )}
          </div>
        ) : (
          <div>
            {filteredThreads.map((thread: any) => (
              <ThreadCard key={thread.id} thread={thread} user={user} />
            ))}
          </div>
        )}
      </Tabs>

      <NewThreadDialog 
        isOpen={isNewThreadDialogOpen} 
        onClose={() => setIsNewThreadDialogOpen(false)} 
        user={user}
      />
    </div>
  );
}

export default function DiscussionForum({ user, threadId }: { user: User | null, threadId?: number }) {
  if (threadId) {
    return <ThreadView threadId={threadId} user={user} />;
  }

  return <ThreadList user={user} />;
}