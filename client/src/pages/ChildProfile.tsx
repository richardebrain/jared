import { useState } from 'react';
import { useParams, Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  ArrowLeft, 
  Calendar, 
  User, 
  CheckCircle, 
  XCircle, 
  Camera, 
  BookOpen, 
  Star,
  Brain,
  Heart,
  Zap,
  Users,
  Target,
  Award,
  Activity
} from 'lucide-react';
import { format, differenceInYears, differenceInMonths } from 'date-fns';

interface Child {
  id: number;
  firstName: string;
  lastName: string;
  birthDate: string;
  referencePhotoUrl?: string;
  parentGuardianName?: string;
  parentEmail?: string;
  sharedWithSchool: boolean;
  createdAt: string;
}

interface PortfolioEntry {
  id: number;
  title: string;
  description: string;
  photoUrl?: string;
  activityType?: string;
  entryDate: string;
  naeyc_standards?: string[];
  aiSummary?: string;
  isApproved: boolean;
  processingStatus: string;
}

interface DevelopmentalMilestone {
  id: string;
  category: string;
  milestone: string;
  ageRangeMonths: [number, number];
  isAchieved: boolean;
  achievedDate?: string;
  notes?: string;
}

const DEVELOPMENTAL_MILESTONES: DevelopmentalMilestone[] = [
  // Physical Development
  { id: 'phys_1', category: 'Physical Development', milestone: 'Runs smoothly with changes in speed and direction', ageRangeMonths: [36, 48], isAchieved: false },
  { id: 'phys_2', category: 'Physical Development', milestone: 'Jumps with both feet and lands on both feet', ageRangeMonths: [36, 48], isAchieved: false },
  { id: 'phys_3', category: 'Physical Development', milestone: 'Pedals a tricycle or bicycle', ageRangeMonths: [36, 60], isAchieved: false },
  { id: 'phys_4', category: 'Physical Development', milestone: 'Throws a ball overhand', ageRangeMonths: [42, 54], isAchieved: false },
  { id: 'phys_5', category: 'Physical Development', milestone: 'Uses safety scissors to cut paper', ageRangeMonths: [42, 60], isAchieved: false },
  
  // Cognitive Development
  { id: 'cog_1', category: 'Cognitive Development', milestone: 'Counts to 10 or higher', ageRangeMonths: [48, 60], isAchieved: false },
  { id: 'cog_2', category: 'Cognitive Development', milestone: 'Recognizes and names letters', ageRangeMonths: [42, 60], isAchieved: false },
  { id: 'cog_3', category: 'Cognitive Development', milestone: 'Understands concepts of time (yesterday, today, tomorrow)', ageRangeMonths: [48, 66], isAchieved: false },
  { id: 'cog_4', category: 'Cognitive Development', milestone: 'Follows multi-step instructions', ageRangeMonths: [36, 48], isAchieved: false },
  { id: 'cog_5', category: 'Cognitive Development', milestone: 'Shows understanding of cause and effect', ageRangeMonths: [36, 48], isAchieved: false },
  
  // Language Development
  { id: 'lang_1', category: 'Language Development', milestone: 'Speaks in complete sentences of 5+ words', ageRangeMonths: [36, 48], isAchieved: false },
  { id: 'lang_2', category: 'Language Development', milestone: 'Tells stories about experiences', ageRangeMonths: [42, 54], isAchieved: false },
  { id: 'lang_3', category: 'Language Development', milestone: 'Asks "why" and "how" questions', ageRangeMonths: [36, 48], isAchieved: false },
  { id: 'lang_4', category: 'Language Development', milestone: 'Uses past tense correctly', ageRangeMonths: [42, 60], isAchieved: false },
  { id: 'lang_5', category: 'Language Development', milestone: 'Follows conversation rules (turn-taking)', ageRangeMonths: [48, 60], isAchieved: false },
  
  // Social-Emotional Development
  { id: 'social_1', category: 'Social-Emotional Development', milestone: 'Plays cooperatively with other children', ageRangeMonths: [36, 48], isAchieved: false },
  { id: 'social_2', category: 'Social-Emotional Development', milestone: 'Shows empathy for others', ageRangeMonths: [36, 60], isAchieved: false },
  { id: 'social_3', category: 'Social-Emotional Development', milestone: 'Follows classroom rules and routines', ageRangeMonths: [36, 48], isAchieved: false },
  { id: 'social_4', category: 'Social-Emotional Development', milestone: 'Expresses emotions appropriately', ageRangeMonths: [36, 54], isAchieved: false },
  { id: 'social_5', category: 'Social-Emotional Development', milestone: 'Shows independence in self-care', ageRangeMonths: [36, 60], isAchieved: false },
];

const PORTFOLIO_CATEGORIES = [
  { id: 'learning_activities', title: 'Learning Activities', icon: BookOpen, description: 'Academic and educational activities' },
  { id: 'creative_expression', title: 'Creative Expression', icon: Star, description: 'Art, music, and creative projects' },
  { id: 'social_interaction', title: 'Social Interaction', icon: Users, description: 'Playing and interacting with peers' },
  { id: 'physical_development', title: 'Physical Development', icon: Activity, description: 'Gross and fine motor skills' },
  { id: 'problem_solving', title: 'Problem Solving', icon: Brain, description: 'Critical thinking and reasoning' },
  { id: 'emotional_growth', title: 'Emotional Growth', icon: Heart, description: 'Emotional regulation and expression' },
];

export default function ChildProfile() {
  const params = useParams();
  const childId = parseInt(params.id as string);

  // Fetch child data
  const { data: child, isLoading: childLoading } = useQuery({
    queryKey: ['/api/children', childId],
    queryFn: () => apiRequest(`/api/children/${childId}`),
  });

  // Fetch portfolio entries
  const { data: portfolioEntries = [], isLoading: entriesLoading } = useQuery({
    queryKey: ['/api/children', childId, 'portfolio'],
    queryFn: () => apiRequest(`/api/children/${childId}/portfolio`),
  });

  if (childLoading) {
    return (
      <div className="container mx-auto py-6 px-4">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!child) {
    return (
      <div className="container mx-auto py-6 px-4">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <XCircle className="h-12 w-12 text-red-400 mb-4" />
            <h3 className="text-lg font-medium mb-2">Child Not Found</h3>
            <p className="text-gray-500 text-center mb-4">
              This child profile could not be found or you don't have permission to view it.
            </p>
            <Link href="/portfolio-builder">
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Portfolio Builder
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const calculateAge = (birthDate: string) => {
    const birth = new Date(birthDate);
    const years = differenceInYears(new Date(), birth);
    const months = differenceInMonths(new Date(), birth) % 12;
    return { years, months };
  };

  const age = child.birthDate ? calculateAge(child.birthDate) : null;
  const ageInMonths = child.birthDate ? differenceInMonths(new Date(), new Date(child.birthDate)) : 0;

  // Filter milestones by category and relevance to age
  const getRelevantMilestones = (category: string) => {
    return DEVELOPMENTAL_MILESTONES.filter(milestone => 
      milestone.category === category && 
      ageInMonths >= milestone.ageRangeMonths[0] - 6 && // Show milestones 6 months before expected
      ageInMonths <= milestone.ageRangeMonths[1] + 12    // Keep showing 12 months after expected
    );
  };

  const getPortfolioEntriesByCategory = (categoryId: string) => {
    return portfolioEntries.filter((entry: PortfolioEntry) => {
      // Map activity types to categories
      const activityType = entry.activityType?.toLowerCase() || '';
      switch (categoryId) {
        case 'learning_activities':
          return activityType.includes('learning') || activityType.includes('reading') || activityType.includes('math');
        case 'creative_expression':
          return activityType.includes('art') || activityType.includes('creative') || activityType.includes('painting');
        case 'social_interaction':
          return activityType.includes('playing') || activityType.includes('social') || activityType.includes('group');
        case 'physical_development':
          return activityType.includes('physical') || activityType.includes('motor') || activityType.includes('movement');
        case 'problem_solving':
          return activityType.includes('problem') || activityType.includes('puzzle') || activityType.includes('building');
        case 'emotional_growth':
          return activityType.includes('emotional') || activityType.includes('feelings') || activityType.includes('social');
        default:
          return false;
      }
    });
  };

  const milestoneCategories = ['Physical Development', 'Cognitive Development', 'Language Development', 'Social-Emotional Development'];

  return (
    <div className="container mx-auto py-6 px-4">
      {/* Header */}
      <div className="mb-6">
        <Link href="/portfolio-builder">
          <Button variant="outline" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Portfolio Builder
          </Button>
        </Link>
        
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {child.referencePhotoUrl ? (
                  <img 
                    src={child.referencePhotoUrl} 
                    alt={`${child.firstName} ${child.lastName}`}
                    className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center border-2 border-gray-200">
                    <User className="h-8 w-8 text-gray-600" />
                  </div>
                )}
                <div>
                  <CardTitle className="text-2xl">{child.firstName} {child.lastName}</CardTitle>
                  <CardDescription className="flex items-center gap-4 mt-1">
                    {age && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {age.years} years, {age.months} months old
                      </span>
                    )}
                    {child.birthDate && (
                      <span>Born {format(new Date(child.birthDate), 'MMMM dd, yyyy')}</span>
                    )}
                  </CardDescription>
                </div>
              </div>
              <div className="text-right">
                <Badge variant={child.sharedWithSchool ? "default" : "secondary"}>
                  {child.sharedWithSchool ? "Shared with School" : "Private"}
                </Badge>
                {child.parentGuardianName && (
                  <p className="text-sm text-gray-600 mt-2">
                    Parent: {child.parentGuardianName}
                  </p>
                )}
              </div>
            </div>
          </CardHeader>
        </Card>
      </div>

      <Tabs defaultValue="milestones" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="milestones">Developmental Milestones</TabsTrigger>
          <TabsTrigger value="portfolio">Portfolio Categories</TabsTrigger>
          <TabsTrigger value="progress">Progress Overview</TabsTrigger>
        </TabsList>

        {/* Developmental Milestones */}
        <TabsContent value="milestones" className="space-y-6">
          <div className="grid gap-6">
            {milestoneCategories.map(category => {
              const relevantMilestones = getRelevantMilestones(category);
              const achievedCount = relevantMilestones.filter(m => m.isAchieved).length;
              const totalCount = relevantMilestones.length;
              const progressPercentage = totalCount > 0 ? (achievedCount / totalCount) * 100 : 0;

              return (
                <Card key={category}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{category}</CardTitle>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">
                          {achievedCount}/{totalCount} achieved
                        </span>
                        <Badge variant={progressPercentage >= 70 ? "default" : progressPercentage >= 40 ? "secondary" : "outline"}>
                          {Math.round(progressPercentage)}%
                        </Badge>
                      </div>
                    </div>
                    <Progress value={progressPercentage} className="h-2" />
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {relevantMilestones.length > 0 ? (
                        relevantMilestones.map(milestone => (
                          <div key={milestone.id} className="flex items-start gap-3 p-3 rounded-lg border">
                            {milestone.isAchieved ? (
                              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                            ) : (
                              <XCircle className="h-5 w-5 text-gray-300 mt-0.5 flex-shrink-0" />
                            )}
                            <div className="flex-1">
                              <p className={`font-medium ${milestone.isAchieved ? 'text-green-900' : 'text-gray-700'}`}>
                                {milestone.milestone}
                              </p>
                              <p className="text-sm text-gray-500">
                                Expected: {Math.floor(milestone.ageRangeMonths[0] / 12)} years {milestone.ageRangeMonths[0] % 12} months - 
                                {Math.floor(milestone.ageRangeMonths[1] / 12)} years {milestone.ageRangeMonths[1] % 12} months
                              </p>
                              {milestone.achievedDate && (
                                <p className="text-sm text-green-600">
                                  Achieved: {format(new Date(milestone.achievedDate), 'MMMM dd, yyyy')}
                                </p>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-6 text-gray-500">
                          <Target className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                          <p>No milestones in this category for {child.firstName}'s current age range.</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Portfolio Categories */}
        <TabsContent value="portfolio" className="space-y-6">
          <div className="grid gap-6">
            {PORTFOLIO_CATEGORIES.map(category => {
              const entriesInCategory = getPortfolioEntriesByCategory(category.id);
              const IconComponent = category.icon;

              return (
                <Card key={category.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <IconComponent className="h-5 w-5" />
                      {category.title}
                    </CardTitle>
                    <CardDescription>{category.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {entriesInCategory.length > 0 ? (
                      <div className="grid gap-4 md:grid-cols-2">
                        {entriesInCategory.map((entry: PortfolioEntry) => (
                          <div key={entry.id} className="border rounded-lg p-4 space-y-2">
                            <div className="flex items-start justify-between">
                              <h4 className="font-medium">{entry.title}</h4>
                              <Badge variant="outline" className="text-xs">
                                {format(new Date(entry.entryDate), 'MMM dd')}
                              </Badge>
                            </div>
                            {entry.photoUrl && (
                              <img 
                                src={entry.photoUrl} 
                                alt={entry.title}
                                className="w-full h-32 object-cover rounded"
                              />
                            )}
                            <p className="text-sm text-gray-600">{entry.description}</p>
                            {entry.naeyc_standards && entry.naeyc_standards.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {entry.naeyc_standards.slice(0, 2).map((standard, index) => (
                                  <Badge key={index} variant="secondary" className="text-xs">
                                    {standard}
                                  </Badge>
                                ))}
                                {entry.naeyc_standards.length > 2 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{entry.naeyc_standards.length - 2} more
                                  </Badge>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <IconComponent className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                        <h4 className="font-medium mb-1">No {category.title} Yet</h4>
                        <p className="text-sm">Portfolio entries in this category will appear here as they're added.</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Progress Overview */}
        <TabsContent value="progress" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  Portfolio Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>Total Entries</span>
                  <Badge variant="outline">{portfolioEntries.length}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>Approved Entries</span>
                  <Badge variant="default">
                    {portfolioEntries.filter((e: PortfolioEntry) => e.isApproved).length}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>Categories with Content</span>
                  <Badge variant="secondary">
                    {PORTFOLIO_CATEGORIES.filter(cat => getPortfolioEntriesByCategory(cat.id).length > 0).length}/
                    {PORTFOLIO_CATEGORIES.length}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Developmental Progress
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {milestoneCategories.map(category => {
                  const relevantMilestones = getRelevantMilestones(category);
                  const achievedCount = relevantMilestones.filter(m => m.isAchieved).length;
                  const totalCount = relevantMilestones.length;
                  const progressPercentage = totalCount > 0 ? (achievedCount / totalCount) * 100 : 0;

                  return (
                    <div key={category} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">{category.replace(' Development', '')}</span>
                        <span className="text-sm text-gray-600">{achievedCount}/{totalCount}</span>
                      </div>
                      <Progress value={progressPercentage} className="h-2" />
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              {portfolioEntries.length > 0 ? (
                <div className="space-y-3">
                  {portfolioEntries
                    .sort((a: PortfolioEntry, b: PortfolioEntry) => 
                      new Date(b.entryDate).getTime() - new Date(a.entryDate).getTime()
                    )
                    .slice(0, 5)
                    .map((entry: PortfolioEntry) => (
                      <div key={entry.id} className="flex items-center gap-3 p-3 border rounded-lg">
                        <Camera className="h-4 w-4 text-gray-500 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="font-medium">{entry.title}</p>
                          <p className="text-sm text-gray-600">
                            {format(new Date(entry.entryDate), 'MMMM dd, yyyy')}
                          </p>
                        </div>
                        {entry.isApproved && (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        )}
                      </div>
                    ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Activity className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                  <h4 className="font-medium mb-1">No Activity Yet</h4>
                  <p className="text-sm">Start building {child.firstName}'s portfolio by adding photos and observations.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}