import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { LearningModule, UserProgress } from '@shared/schema';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Award, Star, Gift, Trophy, BookOpen } from 'lucide-react';
import ProgressHeatmap from './ProgressHeatmap';
import { Skeleton } from "@/components/ui/skeleton";

interface AchievementsSectionProps {
  modules: LearningModule[];
  progress: UserProgress[];
}

export default function AchievementsSection({ modules, progress }: AchievementsSectionProps) {
  // Fetch user achievement data
  const { data: achievementData, isLoading, error } = useQuery({
    queryKey: ['/api/achievements'],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-[400px] w-full rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Skeleton className="h-32 rounded-lg" />
          <Skeleton className="h-32 rounded-lg" />
          <Skeleton className="h-32 rounded-lg" />
          <Skeleton className="h-32 rounded-lg" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Achievements</CardTitle>
          <CardDescription>Your learning progress</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-destructive/10 text-destructive p-4 rounded-lg">
            <p>Failed to load achievement data. Please try again later.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { totalPoints, teacherLevel, achievements, stats } = achievementData || {
    totalPoints: 0,
    teacherLevel: 'Teacher in Training',
    achievements: [],
    stats: { totalModules: 0, modulesInProgress: 0, assessmentsCompleted: 0 }
  };

  // Achievement icon mapping
  const achievementIcons: Record<string, any> = {
    'First Steps': BookOpen,
    'Eager Learner': Star,
    'Dedicated Teacher': Award,
    'Master Teacher': Trophy,
    'Assessment Champion': Gift
  };

  return (
    <div className="space-y-6">
      {/* Progress Heatmap */}
      <ProgressHeatmap 
        modules={modules} 
        progress={progress} 
        level={teacherLevel}
        totalPoints={totalPoints}
      />
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatsCard
          title="Total Points"
          value={totalPoints}
          description="Your accumulated learning points"
          icon={Star}
          color="text-amber-500"
        />
        <StatsCard
          title="Teacher Level"
          value={teacherLevel}
          description="Your current achievement level"
          icon={Trophy}
          color="text-purple-500"
        />
        <StatsCard
          title="Modules"
          value={`${progress.filter(p => p.completed).length}/${modules.length}`}
          description={`${stats.modulesInProgress} in progress`}
          icon={BookOpen}
          color="text-blue-500"
        />
        <StatsCard
          title="Assessments"
          value={stats.assessmentsCompleted}
          description="Assessments completed"
          icon={Award}
          color="text-green-500"
        />
      </div>
      
      {/* Achievements List */}
      {achievements && achievements.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Achievements</CardTitle>
            <CardDescription>Your latest learning accomplishments</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {achievements.map((achievement: any) => {
                const Icon = achievementIcons[achievement.name] || BookOpen;
                return (
                  <div 
                    key={achievement.id}
                    className="flex items-center p-3 bg-muted/50 rounded-lg hover:bg-muted/80 transition-colors animate-pop"
                  >
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center mr-3 bg-primary/10`}>
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium">{achievement.name}</h4>
                      <p className="text-xs text-muted-foreground">{achievement.description}</p>
                      <Badge variant="outline" className="mt-1 text-xs">+{achievement.points} points</Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Stats card component
function StatsCard({ title, value, description, icon: Icon, color }: { 
  title: string; 
  value: number | string; 
  description: string; 
  icon: React.ElementType;
  color: string;
}) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            <p className="text-xs text-muted-foreground mt-1">{description}</p>
          </div>
          <div className={`h-10 w-10 rounded-full flex items-center justify-center ${color} bg-background`}>
            <Icon className={`h-5 w-5 ${color}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}