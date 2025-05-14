import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle, AlertTriangle, XCircle, BookOpen, Video, FileQuestion } from 'lucide-react';
import { 
  ContentValidationInfo, 
  ValidationSummary,
  validateAllModulesContent,
  CONTENT_VALIDATION_THRESHOLDS
} from '@/lib/contentValidator';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

/**
 * ContentChecker component for verifying that all modules have appropriate educational content
 * Ensures modules have study materials, learning objectives, working videos, and quizzes
 */
export default function ContentChecker() {
  const [isChecking, setIsChecking] = useState(false);
  const [validationResults, setValidationResults] = useState<ContentValidationInfo[]>([]);
  const [validationSummary, setValidationSummary] = useState<ValidationSummary | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'incomplete' | 'error'>('all');
  const [isExpanded, setIsExpanded] = useState(false);

  // Fetch all modules
  const { data: modules, isLoading, error } = useQuery({
    queryKey: ['/api/modules'],
    enabled: true,
  });

  // Filter results based on active filter
  const filteredResults = validationResults.filter(result => {
    if (activeFilter === 'all') return true;
    return result.status === activeFilter;
  });

  // Start the validation process
  const startValidation = async () => {
    if (isChecking || !modules) return;
    setIsChecking(true);
    
    try {
      // Ensure modules is treated as an array
      const modulesArray = Array.isArray(modules) ? modules : [];
      
      const { results, summary } = await validateAllModulesContent(modulesArray);
      setValidationResults(results);
      setValidationSummary(summary);
    } catch (error) {
      console.error('Error validating module content:', error);
    } finally {
      setIsChecking(false);
    }
  };

  // If the checker is collapsed, show just a button to expand it
  if (!isExpanded) {
    return (
      <Card className="shadow-md border-2 border-gray-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-bold">Content Checker</CardTitle>
          <CardDescription>
            Verify that all modules have appropriate educational content
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Button 
            onClick={() => setIsExpanded(true)}
            className="w-full"
            variant="outline"
          >
            <BookOpen className="mr-2 h-4 w-4" />
            Check Module Content
          </Button>
        </CardFooter>
      </Card>
    );
  }

  // Show summary stats
  const renderSummary = () => {
    if (!validationSummary) return null;
    
    const { 
      totalModules, 
      completeModules, 
      incompleteModules, 
      errorModules,
      missingObjectives,
      missingStudyMaterials,
      inadequateStudyMaterials,
      missingVideos,
      brokenVideos,
      missingQuizzes,
      inadequateQuizzes
    } = validationSummary;
    
    const completePercent = Math.round((completeModules / totalModules) * 100) || 0;
    
    return (
      <Card className="shadow-md">
        <CardHeader className="pb-2">
          <CardTitle className="text-md">Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Content Completeness</span>
              <span className="font-medium">{completePercent}%</span>
            </div>
            <Progress value={completePercent} className="h-2" />
          </div>
          
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex items-center justify-between gap-2 rounded-lg border p-2">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Complete</span>
              </div>
              <Badge variant="outline">{completeModules}</Badge>
            </div>
            
            <div className="flex items-center justify-between gap-2 rounded-lg border p-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                <span>Incomplete</span>
              </div>
              <Badge variant="outline">{incompleteModules}</Badge>
            </div>
            
            <div className="flex items-center justify-between gap-2 rounded-lg border p-2">
              <div className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-red-500" />
                <span>Critical Issues</span>
              </div>
              <Badge variant="outline">{errorModules}</Badge>
            </div>
            
            <div className="flex items-center justify-between gap-2 rounded-lg border p-2">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-blue-500" />
                <span>Total Modules</span>
              </div>
              <Badge variant="outline">{totalModules}</Badge>
            </div>
          </div>
          
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="details">
              <AccordionTrigger className="text-sm">Detailed Issues</AccordionTrigger>
              <AccordionContent>
                <ul className="space-y-1 text-sm list-disc pl-5">
                  {missingObjectives > 0 && (
                    <li>Missing learning objectives: <strong>{missingObjectives}</strong></li>
                  )}
                  {missingStudyMaterials > 0 && (
                    <li>Missing study materials: <strong>{missingStudyMaterials}</strong></li>
                  )}
                  {inadequateStudyMaterials > 0 && (
                    <li>Inadequate study materials: <strong>{inadequateStudyMaterials}</strong></li>
                  )}
                  {missingVideos > 0 && (
                    <li>Missing videos: <strong>{missingVideos}</strong></li>
                  )}
                  {brokenVideos > 0 && (
                    <li>Broken videos: <strong>{brokenVideos}</strong></li>
                  )}
                  {missingQuizzes > 0 && (
                    <li>Missing quizzes: <strong>{missingQuizzes}</strong></li>
                  )}
                  {inadequateQuizzes > 0 && (
                    <li>Inadequate quizzes: <strong>{inadequateQuizzes}</strong></li>
                  )}
                </ul>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>
    );
  };

  // Render status badge for a module
  const renderStatusBadge = (status: 'complete' | 'incomplete' | 'error') => {
    switch (status) {
      case 'complete':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Complete</Badge>;
      case 'incomplete':
        return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-200">Incomplete</Badge>;
      case 'error':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-200">Critical Issues</Badge>;
      default:
        return null;
    }
  };

  return (
    <Card className="shadow-md border-2 border-gray-200">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-lg font-bold">Content Checker</CardTitle>
            <CardDescription>
              Verify that all modules have appropriate educational content
            </CardDescription>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setIsExpanded(false)}
          >
            Minimize
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-2" />
            <p className="text-muted-foreground">Loading modules...</p>
          </div>
        ) : error ? (
          <div className="text-center p-8 text-red-500">
            <p>Error loading modules. Please try again.</p>
          </div>
        ) : (
          <>
            {!validationResults.length ? (
              <div className="text-center py-4">
                <Button 
                  onClick={startValidation} 
                  disabled={isChecking}
                  className="mx-auto"
                >
                  {isChecking ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Checking content...
                    </>
                  ) : (
                    <>
                      <BookOpen className="mr-2 h-4 w-4" />
                      Check All Modules ({modules?.length || 0})
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <>
                {renderSummary()}
                
                <div className="pt-4">
                  <Tabs defaultValue="all" className="w-full" 
                    onValueChange={(value) => setActiveFilter(value as 'all' | 'incomplete' | 'error')}>
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="all">All Modules</TabsTrigger>
                      <TabsTrigger value="incomplete">Incomplete</TabsTrigger>
                      <TabsTrigger value="error">Critical Issues</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="all" className="mt-4">
                      <Table>
                        <TableCaption>Module content validation results</TableCaption>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Module</TableHead>
                            <TableHead>Content</TableHead>
                            <TableHead>Video</TableHead>
                            <TableHead>Quiz</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredResults.map((result) => (
                            <TableRow key={result.moduleId}>
                              <TableCell className="font-medium">{result.moduleName}</TableCell>
                              <TableCell>
                                <div className="flex flex-col gap-1">
                                  <div className="flex items-center gap-1">
                                    {result.hasStudyMaterials ? (
                                      <CheckCircle className="h-3 w-3 text-green-500" />
                                    ) : (
                                      <XCircle className="h-3 w-3 text-red-500" />
                                    )}
                                    <span className="text-xs">Study Materials</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    {result.hasLearningObjectives ? (
                                      <CheckCircle className="h-3 w-3 text-green-500" />
                                    ) : (
                                      <XCircle className="h-3 w-3 text-red-500" />
                                    )}
                                    <span className="text-xs">Learning Objectives</span>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1">
                                  {result.hasVideo ? (
                                    result.videoWorking ? (
                                      <CheckCircle className="h-3 w-3 text-green-500" />
                                    ) : (
                                      <XCircle className="h-3 w-3 text-red-500" />
                                    )
                                  ) : (
                                    <XCircle className="h-3 w-3 text-red-500" />
                                  )}
                                  <span className="text-xs">
                                    {result.videoId ? (
                                      result.videoWorking ? 'Working' : 'Not working'
                                    ) : 'Missing'}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1">
                                  {result.hasQuiz ? (
                                    result.quizQuestionCount >= CONTENT_VALIDATION_THRESHOLDS.MIN_QUIZ_QUESTIONS ? (
                                      <CheckCircle className="h-3 w-3 text-green-500" />
                                    ) : (
                                      <AlertTriangle className="h-3 w-3 text-amber-500" />
                                    )
                                  ) : (
                                    <XCircle className="h-3 w-3 text-red-500" />
                                  )}
                                  <span className="text-xs">
                                    {result.hasQuiz ? `${result.quizQuestionCount} questions` : 'Missing'}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell>
                                {renderStatusBadge(result.status)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TabsContent>
                    
                    <TabsContent value="incomplete" className="mt-4">
                      <Table>
                        <TableCaption>Modules with incomplete content</TableCaption>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Module</TableHead>
                            <TableHead>Issues</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredResults.map((result) => (
                            <TableRow key={result.moduleId}>
                              <TableCell className="font-medium">{result.moduleName}</TableCell>
                              <TableCell>
                                <ul className="list-disc pl-5 text-sm">
                                  {result.issues.map((issue, index) => (
                                    <li key={index}>{issue}</li>
                                  ))}
                                </ul>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TabsContent>
                    
                    <TabsContent value="error" className="mt-4">
                      <Table>
                        <TableCaption>Modules with critical issues</TableCaption>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Module</TableHead>
                            <TableHead>Critical Issues</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredResults.map((result) => (
                            <TableRow key={result.moduleId}>
                              <TableCell className="font-medium">{result.moduleName}</TableCell>
                              <TableCell>
                                <ul className="list-disc pl-5 text-sm">
                                  {result.issues.map((issue, index) => (
                                    <li key={index}>{issue}</li>
                                  ))}
                                </ul>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TabsContent>
                  </Tabs>
                </div>
                
                <div className="flex justify-between pt-4">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setValidationResults([]);
                      setValidationSummary(null);
                    }}
                  >
                    Reset
                  </Button>
                  <Button 
                    onClick={startValidation} 
                    disabled={isChecking}
                  >
                    {isChecking ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Checking again...
                      </>
                    ) : (
                      <>
                        <BookOpen className="mr-2 h-4 w-4" />
                        Check Again
                      </>
                    )}
                  </Button>
                </div>
              </>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}