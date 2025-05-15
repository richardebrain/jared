import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import LinkValidator from '@/components/LinkValidator';
import ContentChecker from '@/components/ContentChecker';
import { AlertTriangle, Video, Link2, BookOpen, Users, RefreshCw, Award, Check, Clipboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/**
 * Admin tools component for various system validation and maintenance tasks
 * - Video validation tool
 * - Link validation tool
 * - Other administrative functions
 */
export default function AdminTools() {
  const [isOpen, setIsOpen] = useState(false);

  // If the tools are closed, show just a button to open them
  if (!isOpen) {
    return (
      <div className="mb-4 text-right">
        <Button 
          variant="ghost" 
          size="sm"
          className="text-xs text-muted-foreground flex items-center gap-1"
          onClick={() => setIsOpen(true)}
        >
          <AlertTriangle className="h-3 w-3" />
          Admin Tools
        </Button>
      </div>
    );
  }

  return (
    <div className="mb-8">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg">Admin Tools</CardTitle>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setIsOpen(false)}
            >
              Close
            </Button>
          </div>
          <CardDescription>
            System validation and maintenance tools for administrators
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4">
          <Tabs defaultValue="users">
            <TabsList className="grid w-full grid-cols-4 mb-4">
              <TabsTrigger value="users" className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                Manage Users
              </TabsTrigger>
              <TabsTrigger value="content" className="flex items-center gap-1">
                <BookOpen className="h-4 w-4" />
                Content Checker
              </TabsTrigger>
              <TabsTrigger value="links" className="flex items-center gap-1">
                <Link2 className="h-4 w-4" />
                Link Validator
              </TabsTrigger>
              <TabsTrigger value="videos" className="flex items-center gap-1">
                <Video className="h-4 w-4" />
                Video Validator
              </TabsTrigger>
            </TabsList>
            
            {/* User Management Tab */}
            <TabsContent value="users" className="space-y-4">
              <div className="text-sm text-muted-foreground mb-2">
                View and manage user accounts, reset points or progress as needed
              </div>
              <UserManagement />
            </TabsContent>
            
            <TabsContent value="content" className="space-y-4">
              <div className="text-sm text-muted-foreground mb-2">
                Check all modules for proper educational content, working videos, and quizzes
              </div>
              <ContentChecker />
            </TabsContent>
            
            <TabsContent value="links" className="space-y-4">
              <div className="text-sm text-muted-foreground mb-2">
                Validate internal navigation links to identify 404 errors or broken links
              </div>
              <LinkValidator />
            </TabsContent>
            
            <TabsContent value="videos" className="space-y-4">
              <div className="text-sm text-muted-foreground mb-2">
                Validate YouTube videos in the resource library to identify unavailable content
              </div>
              <div className="mb-4 p-4 border border-amber-200 bg-amber-50 rounded-md">
                <h3 className="text-sm font-medium mb-2 flex items-center">
                  <AlertTriangle className="h-4 w-4 text-amber-500 mr-2" />
                  Video Validation Tools
                </h3>
                <p className="text-xs text-muted-foreground mb-3">
                  Check for unavailable videos in the library by running one of these tools:
                </p>
                <div className="space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (typeof window !== 'undefined' && window.validateAllVideos) {
                        window.validateAllVideos()
                          .then(results => {
                            console.log('Validation complete:', results);
                          })
                          .catch(error => {
                            console.error('Video validation error:', error);
                          });
                      } else {
                        console.error('Validation utility not loaded');
                      }
                    }}
                  >
                    Check All Videos
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const videoId = prompt('Enter YouTube video ID to check:');
                      if (videoId && typeof window !== 'undefined' && window.checkYouTubeVideo) {
                        window.checkYouTubeVideo(videoId)
                          .then(isValid => {
                            console.log(`Video ${videoId} is ${isValid ? 'valid' : 'invalid'}`);
                          })
                          .catch(error => {
                            console.error('Video check error:', error);
                          });
                      }
                    }}
                  >
                    Check Specific Video
                  </Button>
                </div>
              </div>
              
              {/* Additional video validation tools could go here */}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

// Already exported as default above

/**
 * UserManagement component for administrator user management
 * - View all users
 * - See completed modules per user
 * - Reset user points
 * - Reset user learning progress
 */
function UserManagement() {
  const [selectedUser, setSelectedUser] = useState<number | null>(null);
  const [resetDialog, setResetDialog] = useState<{open: boolean, userId: number | null, type: 'points' | 'progress' | null}>(
    {open: false, userId: null, type: null}
  );
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Fetch all users with admin password
  const { data: users, isLoading: isLoadingUsers } = useQuery({ 
    queryKey: ["/api/admin/users?admin_password=BIGSURF55"],
    refetchOnWindowFocus: false
  });
  
  // Fallback to regular users endpoint if admin endpoint fails
  const { data: fallbackUsers, isLoading: isLoadingFallbackUsers } = useQuery({ 
    queryKey: ["/api/users"],
    enabled: !users && !isLoadingUsers,
    refetchOnWindowFocus: false
  });
  
  // Use fallback data if needed
  const allUsers = users || fallbackUsers || [];
  const isLoadingAllUsers = isLoadingUsers || isLoadingFallbackUsers;
  
  // Fetch all user progress
  const { data: allProgress, isLoading: isLoadingProgress } = useQuery({
    queryKey: ["/api/progress"],
    refetchOnWindowFocus: false
  });
  
  // Filter progress for the selected user
  const userProgress = React.useMemo(() => {
    if (!allProgress || !selectedUser) return [];
    return allProgress.filter((p) => p.userId === selectedUser);
  }, [allProgress, selectedUser]);

  // Fetch all modules for reference
  const { data: modules } = useQuery({
    queryKey: ["/api/modules"],
    refetchOnWindowFocus: false
  });
  
  // Reset user points mutation
  const resetPointsMutation = useMutation({
    mutationFn: async (userId: number) => {
      return apiRequest(`/api/admin/reset-points/${userId}?admin_password=BIGSURF55`, { method: 'POST' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users?admin_password=BIGSURF55"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Points Reset",
        description: "User points have been reset to zero.",
        variant: "default",
      });
      setResetDialog({open: false, userId: null, type: null});
    }
  });
  
  // Reset user progress mutation
  const resetProgressMutation = useMutation({
    mutationFn: async (userId: number) => {
      return apiRequest(`/api/admin/reset-progress/${userId}?admin_password=BIGSURF55`, { method: 'POST' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users?admin_password=BIGSURF55"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/user-progress", selectedUser] });
      queryClient.invalidateQueries({ queryKey: ["/api/progress"] });
      toast({
        title: "Progress Reset",
        description: "User learning progress has been reset.",
        variant: "default",
      });
      setResetDialog({open: false, userId: null, type: null});
    }
  });
  
  const handleResetConfirm = () => {
    if (!resetDialog.userId || !resetDialog.type) return;
    
    if (resetDialog.type === 'points') {
      resetPointsMutation.mutate(resetDialog.userId);
    } else if (resetDialog.type === 'progress') {
      resetProgressMutation.mutate(resetDialog.userId);
    }
  };
  
  const getModuleName = (moduleId: number) => {
    if (!modules) return "Unknown Module";
    const module = modules.find((m) => m.id === moduleId);
    return module ? module.title : "Unknown Module";
  };
  
  return (
    <div>
      <div className="flex items-center mb-4">
        <h3 className="text-lg font-medium flex items-center">
          <Users className="mr-2 h-5 w-5 text-primary" />
          Teacher Accounts
        </h3>
      </div>
      
      {isLoadingAllUsers ? (
        <div className="py-8 text-center text-muted-foreground">Loading users...</div>
      ) : !allUsers || allUsers.length === 0 ? (
        <div className="py-8 text-center text-muted-foreground">No users found</div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Username</TableHead>
                <TableHead>Points</TableHead>
                <TableHead>Level</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Hours in System</TableHead>
                <TableHead>Completed Modules</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allUsers.map((user) => {
                // Calculate completed modules count for each user
                const userCompletedModules = allProgress 
                  ? allProgress.filter(p => p.userId === user.id && p.completed).length 
                  : 0;
                
                return (
                  <TableRow key={user.id} className={user.id === selectedUser ? "bg-muted" : ""}>
                    <TableCell className="font-medium">
                      {user.firstName} {user.lastName}
                    </TableCell>
                    <TableCell>{user.username}</TableCell>
                    <TableCell>{user.points || 0}</TableCell>
                    <TableCell>
                      <Badge>{user.level || 1}</Badge>
                    </TableCell>
                    <TableCell>
                      {user.points >= 500 ? (
                        <Badge className="bg-amber-500">Master Lead Teacher</Badge>
                      ) : user.points >= 300 ? (
                        <Badge className="bg-indigo-500">Lead Teacher</Badge>
                      ) : user.points >= 150 ? (
                        <Badge className="bg-emerald-500">Associate Teacher</Badge>
                      ) : (
                        <Badge>Assistant Teacher</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {/* Calculate hours based on account creation date */}
                      {user.createdAt ? (
                        <span className="text-sm">
                          {Math.floor((new Date().getTime() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60))} hours
                        </span>
                      ) : (
                        "N/A"
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono">
                        {userCompletedModules}/{modules ? modules.length : '?'} modules
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-1">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => setSelectedUser(selectedUser === user.id ? null : user.id)}
                        >
                          {selectedUser === user.id ? "Hide" : "View"}
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setResetDialog({open: true, userId: user.id, type: 'points'})}
                        >
                          <RefreshCw className="h-4 w-4 mr-1" />
                          Reset Points
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setResetDialog({open: true, userId: user.id, type: 'progress'})}
                        >
                          <Award className="h-4 w-4 mr-1" />
                          Reset Progress
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
      
      {/* Display user progress when expanded */}
      {selectedUser && (
        <div className="mt-6 border rounded-md p-4 bg-muted/20">
          <div className="flex justify-between items-center mb-4">
            <h4 className="font-medium">Teacher Learning Progress</h4>
            
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" onClick={() => {
                // Fetch completed modules data for the selected user
                if (allUsers && selectedUser) {
                  const user = allUsers.find(u => u.id === selectedUser);
                  if (user) {
                    const username = user.username;
                    const email = user.email;
                    const completedModules = userProgress
                      .filter(p => p.completed)
                      .map(p => getModuleName(p.moduleId));
                    
                    // Format data for copy
                    const data = `Teacher: ${user.firstName} ${user.lastName}
Username: ${username}
Email: ${email}
Points: ${user.points || 0}
Level: ${user.level || 1}
Status: ${user.points >= 500 ? "Master Lead Teacher" : 
          user.points >= 300 ? "Lead Teacher" : 
          user.points >= 150 ? "Associate Teacher" : 
          "Assistant Teacher"}
Completed Modules: ${completedModules.length}/${modules ? modules.length : '?'}
${completedModules.map((name, i) => `${i+1}. ${name}`).join('\n')}`;
                    
                    // Copy to clipboard
                    navigator.clipboard.writeText(data)
                      .then(() => {
                        toast({
                          title: "Copied to clipboard",
                          description: "Teacher progress data has been copied.",
                        });
                      })
                      .catch(err => {
                        console.error('Failed to copy:', err);
                        toast({
                          title: "Copy failed",
                          description: "Could not copy data to clipboard.",
                          variant: "destructive",
                        });
                      });
                  }
                }
              }}>
                <Clipboard className="h-4 w-4 mr-2" />
                Copy report
              </Button>
            </div>
          </div>
          
          {isLoadingProgress ? (
            <div className="py-4 text-center text-muted-foreground">Loading progress...</div>
          ) : !userProgress || userProgress.length === 0 ? (
            <div className="py-4 text-center text-muted-foreground">No modules completed yet</div>
          ) : (
            <>
              {/* Summary statistics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                <div className="p-3 rounded-md bg-card">
                  <div className="text-sm text-muted-foreground">Completed Modules</div>
                  <div className="text-2xl font-bold">
                    {userProgress.filter(p => p.completed).length}
                    <span className="text-sm font-normal text-muted-foreground">/{modules ? modules.length : '?'}</span>
                  </div>
                </div>
                
                <div className="p-3 rounded-md bg-card">
                  <div className="text-sm text-muted-foreground">Completion %</div>
                  <div className="text-2xl font-bold">
                    {modules && modules.length > 0 
                      ? Math.round((userProgress.filter(p => p.completed).length / modules.length) * 100)
                      : 0}
                    <span className="text-sm font-normal text-muted-foreground">%</span>
                  </div>
                </div>
                
                <div className="p-3 rounded-md bg-card">
                  <div className="text-sm text-muted-foreground">Total Points Earned</div>
                  <div className="text-2xl font-bold">
                    {userProgress.reduce((sum, p) => sum + (p.pointsEarned || 0), 0)}
                  </div>
                </div>
                
                <div className="p-3 rounded-md bg-card">
                  <div className="text-sm text-muted-foreground">In Progress</div>
                  <div className="text-2xl font-bold">
                    {userProgress.filter(p => !p.completed && p.progress > 0).length}
                  </div>
                </div>
              </div>
              
              {/* Module progress list */}
              <div className="space-y-1 mt-4">
                <h5 className="text-sm font-medium mb-2">Completed Modules</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {userProgress
                    .filter(p => p.completed)
                    .map(progress => (
                      <div key={progress.id} className="flex items-center border p-3 rounded-md bg-card">
                        <Check className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                        <div className="min-w-0">
                          <div className="font-medium truncate">{getModuleName(progress.moduleId)}</div>
                          <div className="text-xs text-muted-foreground flex items-center">
                            <span>Points earned: {progress.pointsEarned || 0}</span>
                            <span className="inline-block mx-1">•</span>
                            <span>Last accessed: {
                              progress.lastAccessed 
                                ? new Date(progress.lastAccessed).toLocaleDateString() 
                                : 'Unknown'
                            }</span>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
                
                {userProgress.filter(p => !p.completed && p.progress > 0).length > 0 && (
                  <>
                    <h5 className="text-sm font-medium mt-4 mb-2">In Progress Modules</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {userProgress
                        .filter(p => !p.completed && p.progress > 0)
                        .map(progress => (
                          <div key={progress.id} className="flex items-center border p-3 rounded-md bg-card">
                            <div className="w-4 h-4 mr-2 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                              <div 
                                className="bg-amber-500 rounded-full" 
                                style={{
                                  width: `${Math.max(4, Math.min(16, progress.progress * 16))}px`,
                                  height: `${Math.max(4, Math.min(16, progress.progress * 16))}px`,
                                }}
                              ></div>
                            </div>
                            <div className="min-w-0">
                              <div className="font-medium truncate">{getModuleName(progress.moduleId)}</div>
                              <div className="text-xs text-muted-foreground">
                                <span>Progress: {Math.round(progress.progress * 100)}%</span>
                                <span className="inline-block mx-1">•</span>
                                <span>Last accessed: {
                                  progress.lastAccessed 
                                    ? new Date(progress.lastAccessed).toLocaleDateString() 
                                    : 'Unknown'
                                }</span>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      )}
      
      {/* Reset Confirmation Dialog */}
      <Dialog open={resetDialog.open} onOpenChange={(open) => !open && setResetDialog({...resetDialog, open})}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Reset</DialogTitle>
            <DialogDescription>
              {resetDialog.type === 'points'
                ? "Are you sure you want to reset this user's points to zero? This action cannot be undone."
                : "Are you sure you want to reset all learning progress for this user? This action cannot be undone."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setResetDialog({open: false, userId: null, type: null})}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={handleResetConfirm}
              disabled={resetPointsMutation.isPending || resetProgressMutation.isPending}
            >
              {resetPointsMutation.isPending || resetProgressMutation.isPending ? "Processing..." : "Reset"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}