import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import LinkValidator from '@/components/LinkValidator';
import ContentChecker from '@/components/ContentChecker';
import { AlertTriangle, Video, Link2, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
          <Tabs defaultValue="content">
            <TabsList className="grid w-full grid-cols-3 mb-4">
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