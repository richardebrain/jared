import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { apiRequest } from "@/lib/queryClient";
import { MessageCircle, Eye, Clock, UserCircle, Filter, Plus, Tag, ArrowUpRight } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";

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

// Categories for discussions
const DISCUSSION_CATEGORIES = [
  "General",
  "Classroom Management",
  "Curriculum",
  "Child Development",
  "Assessment",
  "Family Engagement",
  "Teacher Wellness",
  "Technology",
  "Inclusion",
  "Policy",
  "Ask for Help",
  "Share Resources"
];

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

// Form schema for creating a thread
const createThreadSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  content: z.string().min(10, "Content must be at least 10 characters"),
  category: z.string().min(1, "Please select a category"),
  tags: z.string().optional()
});

// Component for displaying a list of discussion threads
const ThreadsList = ({ category }: { category?: string }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(category);
  
  const { data: threads = [], isLoading, error } = useQuery({
    queryKey: ['/api/discussions/threads', { category: selectedCategory }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedCategory) params.append('category', selectedCategory);
      
      const response = await fetch(`/api/discussions/threads?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch threads');
      return response.json();
    }
  });
  
  // Filter threads based on search term
  const filteredThreads = threads.filter((thread: DiscussionThread) => 
    thread.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    thread.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (thread.tags && thread.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())))
  );
  
  if (isLoading) return <div className="flex justify-center p-8">Loading discussions...</div>;
  if (error) return <div className="text-red-500 p-4">Error loading discussions</div>;
  
  return (
    <div className="space-y-4">
      <div className="flex flex-col space-y-2 md:space-y-0 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center space-x-2">
          <Input
            placeholder="Search discussions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full md:w-80"
          />
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Categories</SelectItem>
              {DISCUSSION_CATEGORIES.map(category => (
                <SelectItem key={category} value={category}>{category}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <CreateThreadDialog categories={DISCUSSION_CATEGORIES} />
      </div>
      
      {filteredThreads.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">No discussions found. Start a new discussion!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredThreads.map((thread: DiscussionThread) => (
            <ThreadCard key={thread.id} thread={thread} />
          ))}
        </div>
      )}
    </div>
  );
};

// Component for displaying a thread card in the list
const ThreadCard = ({ thread }: { thread: DiscussionThread }) => {
  const formattedDate = thread.createdAt 
    ? formatDistanceToNow(new Date(thread.createdAt), { addSuffix: true })
    : "";
  
  const categoryColor = CATEGORY_COLORS[thread.category] || "bg-gray-500";
  
  return (
    <Card className="hover:shadow-md transition-shadow duration-200">
      <CardHeader className="pb-2">
        <div className="flex justify-between">
          <div>
            <Badge variant="outline" className={`${categoryColor} text-white mr-2`}>
              {thread.category}
            </Badge>
            {thread.pinned && (
              <Badge variant="secondary">Pinned</Badge>
            )}
          </div>
          <div className="flex items-center text-sm text-gray-500">
            <Eye className="h-4 w-4 mr-1" />
            <span>{thread.viewCount}</span>
            <Clock className="h-4 w-4 ml-3 mr-1" />
            <span>{formattedDate}</span>
          </div>
        </div>
        <Link href={`/discussions/${thread.id}`}>
          <CardTitle className="text-xl hover:text-primary cursor-pointer flex items-center">
            {thread.title}
            <ArrowUpRight className="h-4 w-4 ml-2" />
          </CardTitle>
        </Link>
        <CardDescription className="line-clamp-2">
          {thread.content.replace(/<[^>]*>/g, '').substring(0, 150)}
          {thread.content.length > 150 ? '...' : ''}
        </CardDescription>
      </CardHeader>
      <CardFooter className="pt-2 flex justify-between items-center">
        <div className="flex items-center space-x-2 text-sm">
          <UserCircle className="h-4 w-4" />
          <span>by {thread.author?.firstName || 'Anonymous'}</span>
        </div>
        <div className="flex flex-wrap gap-1">
          {thread.tags && thread.tags.map((tag, index) => (
            <Badge key={index} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
      </CardFooter>
    </Card>
  );
};

// Component for creating a new thread
const CreateThreadDialog = ({ categories }: { categories: string[] }) => {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const form = useForm<z.infer<typeof createThreadSchema>>({
    resolver: zodResolver(createThreadSchema),
    defaultValues: {
      title: "",
      content: "",
      category: "",
      tags: ""
    }
  });
  
  const createThread = useMutation({
    mutationFn: async (values: z.infer<typeof createThreadSchema>) => {
      const tagsArray = values.tags 
        ? values.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
        : [];
      
      return apiRequest('/api/discussions/threads', {
        method: 'POST',
        data: {
          title: values.title,
          content: values.content,
          category: values.category,
          tags: tagsArray
        }
      });
    },
    onSuccess: () => {
      // Reset form and close dialog
      form.reset();
      setOpen(false);
      
      // Invalidate queries to reload the thread list
      queryClient.invalidateQueries({ queryKey: ['/api/discussions/threads'] });
      
      toast({
        title: "Success!",
        description: "Your discussion thread has been created."
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create discussion thread. Please try again.",
        variant: "destructive"
      });
      console.error("Error creating thread:", error);
    }
  });
  
  function onSubmit(values: z.infer<typeof createThreadSchema>) {
    createThread.mutate(values);
  }
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> New Discussion
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Start a New Discussion</DialogTitle>
          <DialogDescription>
            Share your thoughts, questions, or experiences with the community.
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
                    <Input placeholder="Enter a descriptive title" {...field} />
                  </FormControl>
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
                      placeholder="Share your thoughts, questions, or insights..." 
                      className="min-h-[150px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map(category => (
                          <SelectItem key={category} value={category}>{category}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="tags"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tags (optional)</FormLabel>
                    <FormControl>
                      <div className="flex items-center">
                        <Tag className="h-4 w-4 mr-2 text-gray-400" />
                        <Input placeholder="e.g. tips, resources, questions (comma-separated)" {...field} />
                      </div>
                    </FormControl>
                    <FormDescription className="text-xs">
                      Separate tags with commas
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={createThread.isPending}>
                {createThread.isPending ? "Creating..." : "Create Discussion"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

// Main discussions page component
const DiscussionsPage = () => {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Teacher Discussions</h1>
          <p className="text-gray-500 mt-1">
            Connect, share ideas, and solve challenges with fellow teachers
          </p>
        </div>
      </div>
      
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="all">All Discussions</TabsTrigger>
          <TabsTrigger value="popular">Popular</TabsTrigger>
          <TabsTrigger value="unanswered">Unanswered</TabsTrigger>
          <TabsTrigger value="my-discussions">My Discussions</TabsTrigger>
        </TabsList>
        <TabsContent value="all">
          <ThreadsList />
        </TabsContent>
        <TabsContent value="popular">
          <div className="text-center py-8">
            <p className="text-gray-500">Popular discussions will be available soon!</p>
          </div>
        </TabsContent>
        <TabsContent value="unanswered">
          <div className="text-center py-8">
            <p className="text-gray-500">Unanswered discussions will be available soon!</p>
          </div>
        </TabsContent>
        <TabsContent value="my-discussions">
          <MyDiscussions />
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Component for displaying the user's discussions
const MyDiscussions = () => {
  const { isAuthenticated } = useAuth();
  
  const { data: myThreads = [], isLoading, error } = useQuery({
    queryKey: ['/api/discussions/my-threads'],
    queryFn: async () => {
      const response = await fetch('/api/discussions/my-threads');
      if (!response.ok) throw new Error('Failed to fetch my threads');
      return response.json();
    },
    enabled: isAuthenticated
  });
  
  if (!isAuthenticated) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Please log in to view your discussions</p>
      </div>
    );
  }
  
  if (isLoading) return <div className="flex justify-center p-8">Loading your discussions...</div>;
  if (error) return <div className="text-red-500 p-4">Error loading your discussions</div>;
  
  if (myThreads.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">You haven't created any discussions yet</p>
        <CreateThreadDialog categories={DISCUSSION_CATEGORIES} />
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {myThreads.map((thread: DiscussionThread) => (
        <ThreadCard key={thread.id} thread={thread} />
      ))}
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

export default DiscussionsPage;