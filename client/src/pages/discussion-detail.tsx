import { useState, useEffect } from "react";
import { useRoute, Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import VoiceInputTextarea from "@/components/VoiceInputTextarea";
import { Separator } from "@/components/ui/separator";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { apiRequest } from "@/lib/queryClient";
import { MessageCircle, UserCircle, ThumbsUp, ThumbsDown, Calendar, Star, Flag, Edit, Trash2, Reply, ArrowLeft, Award } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";

// Import types
type DiscussionThread = {
  id: number;
  title: string;
  content: string;
  authorId: number;
  category: string;
  tags: string[];
  pinned: boolean;
  viewCount: number;
  createdAt: string;
  lastActivityAt: string;
  author?: {
    username: string;
    firstName: string;
    lastName: string;
    profilePicture: string | null;
  };
};

type DiscussionComment = {
  id: number;
  content: string;
  authorId: number;
  threadId: number;
  parentCommentId: number | null;
  endorsed: boolean;
  upvotes: number;
  downvotes: number;
  createdAt: string;
  author?: {
    username: string;
    firstName: string;
    lastName: string;
    profilePicture: string | null;
  };
};

type CommentVote = {
  id: number;
  userId: number;
  commentId: number;
  voteType: "upvote" | "downvote";
};

// Categories with corresponding colors for badges
const CATEGORY_COLORS: Record<string, string> = {
  "General": "bg-gray-500",
  "Classroom Management": "bg-blue-500",
  "Curriculum": "bg-green-500",
  "Child Development": "bg-purple-500",
  "Assessment": "bg-amber-500",
  "Family Engagement": "bg-pink-500",
  "Teacher Wellness": "bg-teal-500",
  "Technology": "bg-indigo-500",
  "Inclusion": "bg-cyan-500",
  "Policy": "bg-orange-500",
  "Ask for Help": "bg-red-500",
  "Share Resources": "bg-emerald-500"
};

// Schema for creating a comment
const createCommentSchema = z.object({
  content: z.string().min(1, "Comment content is required"),
  parentCommentId: z.number().optional()
});

const DiscussionDetailPage = () => {
  const [match, params] = useRoute("/discussions/:id");
  const threadId = parseInt(params?.id || "0");
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // Get discussion thread details
  const { 
    data: thread, 
    isLoading: threadLoading, 
    error: threadError 
  } = useQuery({
    queryKey: [`/api/discussions/threads/${threadId}`],
    queryFn: async () => {
      const response = await fetch(`/api/discussions/threads/${threadId}`);
      if (!response.ok) throw new Error('Failed to fetch thread');
      return response.json();
    },
    enabled: !!threadId
  });
  
  // Get discussion comments
  const { 
    data: comments = [], 
    isLoading: commentsLoading, 
    error: commentsError 
  } = useQuery({
    queryKey: [`/api/discussions/threads/${threadId}/comments`],
    queryFn: async () => {
      const response = await fetch(`/api/discussions/threads/${threadId}/comments`);
      if (!response.ok) throw new Error('Failed to fetch comments');
      return response.json();
    },
    enabled: !!threadId
  });
  
  if (!match) return <div>404 - Discussion not found</div>;
  if (threadLoading || commentsLoading) return <div className="flex justify-center p-8">Loading discussion...</div>;
  if (threadError || commentsError) return <div className="text-red-500 p-4">Error loading discussion</div>;
  
  const categoryColor = CATEGORY_COLORS[thread.category] || "bg-gray-500";
  const formattedDate = thread.createdAt 
    ? format(new Date(thread.createdAt), "MMM d, yyyy 'at' h:mm a")
    : "";
  
  return (
    <div className="container mx-auto py-8 px-4">
      <Link href="/discussions" className="flex items-center text-primary mb-6 hover:underline">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Discussions
      </Link>
      
      <Card className="mb-8">
        <CardHeader>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <Badge variant="outline" className={`${categoryColor} text-white`}>
              {thread.category}
            </Badge>
            {thread.pinned && (
              <Badge variant="secondary">Pinned</Badge>
            )}
            {thread.tags && thread.tags.map((tag, index) => (
              <Badge key={index} variant="outline">
                {tag}
              </Badge>
            ))}
          </div>
          <div className="flex justify-between items-start">
            <CardTitle className="text-2xl md:text-3xl">{thread.title}</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center mb-4 text-sm text-gray-500">
            <UserInfo user={thread.author} showAvatar />
            <span className="mx-2">•</span>
            <Calendar className="h-4 w-4 mr-1" />
            <span>{formattedDate}</span>
            <span className="mx-2">•</span>
            <MessageCircle className="h-4 w-4 mr-1" />
            <span>{comments.length} {comments.length === 1 ? 'comment' : 'comments'}</span>
          </div>
          <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: thread.content }} />
        </CardContent>
        {thread.author && (
          <CardFooter className="border-t pt-4 flex justify-between items-center">
            <div className="text-sm text-gray-500">
              Last activity: {formatDistanceToNow(new Date(thread.lastActivityAt), { addSuffix: true })}
            </div>
            <ThreadActions thread={thread} />
          </CardFooter>
        )}
      </Card>
      
      <div className="mb-8">
        <h2 className="text-xl font-bold mb-4">Comments ({comments.length})</h2>
        <AddComment threadId={threadId} />
      </div>
      
      <div className="space-y-6">
        {comments.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-gray-500">No comments yet. Be the first to share your thoughts!</p>
            </CardContent>
          </Card>
        ) : (
          <CommentsList comments={comments} thread={thread} />
        )}
      </div>
    </div>
  );
};

// Component for displaying thread actions
const ThreadActions = ({ thread }: { thread: DiscussionThread }) => {
  const { isAuthenticated, user } = useAuth();
  const isAuthor = isAuthenticated && user?.id === thread.authorId;
  
  if (!isAuthenticated) return null;
  
  return (
    <div className="flex space-x-2">
      {isAuthor && (
        <>
          <Link href={`/discussions/${thread.id}/edit`}>
            <Button variant="outline" size="sm">
              <Edit className="h-4 w-4 mr-1" /> Edit
            </Button>
          </Link>
          <DeleteThreadDialog thread={thread} />
        </>
      )}
    </div>
  );
};

// Component for deleting a thread with confirmation
const DeleteThreadDialog = ({ thread }: { thread: DiscussionThread }) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const deleteThread = useMutation({
    mutationFn: async () => {
      return apiRequest(`/api/discussions/threads/${thread.id}`, {
        method: 'DELETE'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/discussions/threads'] });
      toast({
        title: "Thread deleted",
        description: "The discussion thread has been successfully deleted."
      });
      window.location.href = '/discussions';
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete the thread. Please try again.",
        variant: "destructive"
      });
      console.error("Error deleting thread:", error);
    }
  });
  
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Trash2 className="h-4 w-4 mr-1" /> Delete
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete your discussion thread
            and all comments within it.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction 
            onClick={() => deleteThread.mutate()}
            className="bg-red-500 hover:bg-red-600"
          >
            {deleteThread.isPending ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

// Component for adding a new comment
const AddComment = ({ threadId, parentCommentId }: { threadId: number, parentCommentId?: number }) => {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const form = useForm<z.infer<typeof createCommentSchema>>({
    resolver: zodResolver(createCommentSchema),
    defaultValues: {
      content: "",
      parentCommentId: parentCommentId
    }
  });
  
  const createComment = useMutation({
    mutationFn: async (values: z.infer<typeof createCommentSchema>) => {
      return apiRequest('/api/discussions/comments', {
        method: 'POST',
        data: {
          threadId,
          content: values.content,
          parentCommentId: values.parentCommentId
        }
      });
    },
    onSuccess: () => {
      form.reset();
      queryClient.invalidateQueries({ queryKey: [`/api/discussions/threads/${threadId}/comments`] });
      toast({
        title: "Comment added",
        description: "Your comment has been successfully added."
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to add your comment. Please try again.",
        variant: "destructive"
      });
      console.error("Error adding comment:", error);
    }
  });
  
  function onSubmit(values: z.infer<typeof createCommentSchema>) {
    createComment.mutate(values);
  }
  
  if (!isAuthenticated) {
    return (
      <Card>
        <CardContent className="py-4">
          <p className="text-center">Please log in to join the discussion</p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardContent className="pt-4">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{parentCommentId ? "Reply to comment" : "Add a comment"}</FormLabel>
                  <FormControl>
                    <VoiceInputTextarea
                      value={field.value}
                      onChange={field.onChange}
                      placeholder={parentCommentId ? "Write your reply..." : "Share your thoughts or questions..."}
                      minHeight="min-h-[100px]"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end">
              <Button type="submit" disabled={createComment.isPending}>
                {createComment.isPending ? "Posting..." : (parentCommentId ? "Post Reply" : "Post Comment")}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

// Component for displaying a list of comments
const CommentsList = ({ comments, thread }: { comments: DiscussionComment[], thread: DiscussionThread }) => {
  // Organize comments into a parent-child structure
  const topLevelComments = comments.filter(comment => !comment.parentCommentId);
  const childComments = comments.filter(comment => comment.parentCommentId);
  
  const getChildComments = (parentId: number): DiscussionComment[] => {
    return childComments.filter(comment => comment.parentCommentId === parentId);
  };
  
  return (
    <div className="space-y-6">
      {topLevelComments.map(comment => (
        <CommentCard 
          key={comment.id} 
          comment={comment} 
          childComments={getChildComments(comment.id)} 
          thread={thread}
          depth={0}
        />
      ))}
    </div>
  );
};

// Component for displaying a comment card with replies
const CommentCard = ({ 
  comment, 
  childComments, 
  thread,
  depth = 0
}: { 
  comment: DiscussionComment, 
  childComments: DiscussionComment[],
  thread: DiscussionThread,
  depth: number
}) => {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const { isAuthenticated, user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const maxDepth = 3; // Maximum nesting depth for replies
  
  const formattedDate = comment.createdAt 
    ? formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })
    : "";
  
  const isAuthor = isAuthenticated && user?.id === comment.authorId;
  const isThreadAuthor = comment.authorId === thread.authorId;
  
  // Delete comment mutation
  const deleteComment = useMutation({
    mutationFn: async () => {
      return apiRequest(`/api/discussions/comments/${comment.id}`, {
        method: 'DELETE'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/discussions/threads/${thread.id}/comments`] });
      toast({
        title: "Comment deleted",
        description: "Your comment has been successfully deleted."
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete the comment. Please try again.",
        variant: "destructive"
      });
      console.error("Error deleting comment:", error);
    }
  });
  
  // Endorse comment mutation
  const endorseComment = useMutation({
    mutationFn: async (endorsed: boolean) => {
      return apiRequest(`/api/discussions/comments/${comment.id}/endorse`, {
        method: 'POST',
        data: { endorsed }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/discussions/threads/${thread.id}/comments`] });
      toast({
        title: comment.endorsed ? "Endorsement removed" : "Comment endorsed",
        description: comment.endorsed 
          ? "You've removed your endorsement from this comment."
          : "You've endorsed this comment as valuable."
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update endorsement. Please try again.",
        variant: "destructive"
      });
      console.error("Error endorsing comment:", error);
    }
  });
  
  // Vote on comment mutation
  const voteOnComment = useMutation({
    mutationFn: async (voteType: "upvote" | "downvote" | "none") => {
      return apiRequest(`/api/discussions/comments/${comment.id}/vote`, {
        method: 'POST',
        data: { voteType }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/discussions/threads/${thread.id}/comments`] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to register your vote. Please try again.",
        variant: "destructive"
      });
      console.error("Error voting on comment:", error);
    }
  });
  
  return (
    <div className={`${depth > 0 ? 'pl-4 md:pl-8 border-l-2 border-gray-100' : ''}`}>
      <Card>
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <div className="flex items-center">
              <UserInfo user={comment.author} showAvatar={true} />
              {isThreadAuthor && (
                <Badge variant="outline" className="ml-2 bg-primary text-white">
                  Author
                </Badge>
              )}
              {comment.endorsed && (
                <Badge variant="outline" className="ml-2 bg-green-500 text-white flex items-center">
                  <Star className="h-3 w-3 mr-1" /> Endorsed
                </Badge>
              )}
            </div>
            <div className="text-sm text-gray-500">
              {formattedDate}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="prose max-w-none">
            {comment.content}
          </div>
        </CardContent>
        <CardFooter className="pt-0 flex flex-wrap justify-between gap-2">
          <div className="flex items-center space-x-2">
            <VoteButtons 
              upvotes={comment.upvotes} 
              downvotes={comment.downvotes} 
              onVote={(type) => voteOnComment.mutate(type)}
              isDisabled={!isAuthenticated}
            />
            
            {isAuthenticated && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowReplyForm(!showReplyForm)}
                disabled={depth >= maxDepth}
              >
                <Reply className="h-4 w-4 mr-1" />
                Reply
              </Button>
            )}
            
            {isAuthenticated && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => endorseComment.mutate(!comment.endorsed)}
                    >
                      <Award className={`h-4 w-4 mr-1 ${comment.endorsed ? 'text-yellow-500' : ''}`} />
                      {comment.endorsed ? 'Endorsed' : 'Endorse'}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{comment.endorsed ? 'Remove endorsement' : 'Mark as helpful or valuable'}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
          
          {isAuthor && (
            <div className="flex space-x-2">
              <Link href={`/discussions/comments/${comment.id}/edit`}>
                <Button variant="ghost" size="sm">
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
              </Link>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete your comment
                      and all replies to it.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => deleteComment.mutate()}
                      className="bg-red-500 hover:bg-red-600"
                    >
                      {deleteComment.isPending ? "Deleting..." : "Delete"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}
        </CardFooter>
      </Card>
      
      {showReplyForm && (
        <div className="mt-4">
          <AddComment threadId={thread.id} parentCommentId={comment.id} />
        </div>
      )}
      
      {childComments.length > 0 && (
        <div className="mt-4 space-y-4">
          {childComments.map(childComment => (
            <CommentCard 
              key={childComment.id} 
              comment={childComment} 
              childComments={[]} 
              thread={thread}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// Component for voting on comments
const VoteButtons = ({ 
  upvotes, 
  downvotes, 
  onVote,
  isDisabled = false
}: { 
  upvotes: number, 
  downvotes: number, 
  onVote: (type: "upvote" | "downvote" | "none") => void,
  isDisabled?: boolean
}) => {
  const [userVote, setUserVote] = useState<"upvote" | "downvote" | null>(null);
  
  const handleVote = (voteType: "upvote" | "downvote") => {
    if (isDisabled) return;
    
    if (userVote === voteType) {
      // User is removing their vote
      setUserVote(null);
      onVote("none");
    } else {
      // User is changing or adding a vote
      setUserVote(voteType);
      onVote(voteType);
    }
  };
  
  return (
    <div className="flex items-center space-x-1">
      <Button 
        variant="ghost" 
        size="sm" 
        className={`px-2 ${userVote === 'upvote' ? 'text-green-500' : ''}`}
        onClick={() => handleVote("upvote")}
        disabled={isDisabled}
      >
        <ThumbsUp className="h-4 w-4" />
        <span className="ml-1">{upvotes}</span>
      </Button>
      <Button 
        variant="ghost" 
        size="sm" 
        className={`px-2 ${userVote === 'downvote' ? 'text-red-500' : ''}`}
        onClick={() => handleVote("downvote")}
        disabled={isDisabled}
      >
        <ThumbsDown className="h-4 w-4" />
        <span className="ml-1">{downvotes}</span>
      </Button>
    </div>
  );
};

// Helper component for displaying user info
const UserInfo = ({ user, showAvatar = false }: { user?: any, showAvatar?: boolean }) => {
  if (!user) {
    return (
      <div className="flex items-center">
        <UserCircle className="h-4 w-4 mr-1" />
        <span>Anonymous</span>
      </div>
    );
  }
  
  const initials = `${user.firstName?.charAt(0) || ''}${user.lastName?.charAt(0) || ''}`;
  
  return (
    <div className="flex items-center">
      {showAvatar && (
        <Avatar className="h-8 w-8 mr-2">
          {user.profilePicture ? (
            <AvatarImage src={user.profilePicture} alt={`${user.firstName} ${user.lastName}`} />
          ) : (
            <AvatarFallback>{initials}</AvatarFallback>
          )}
        </Avatar>
      )}
      <span>{user.firstName} {user.lastName}</span>
    </div>
  );
};

// Placeholder for auth context
const useAuth = () => {
  return {
    isAuthenticated: false, // This will be replaced with actual auth state
    user: null
  };
};

export default DiscussionDetailPage;