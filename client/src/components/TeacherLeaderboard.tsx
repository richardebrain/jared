import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { User } from '@shared/schema';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Medal, Star, Award, Crown } from 'lucide-react';
import { Skeleton } from "@/components/ui/skeleton";

interface TeacherRanking {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  profileImage: string | null;
  totalPoints: number;
  level: string;
  completedModules: number;
  rank: number;
  isCurrentUser: boolean;
}

export default function TeacherLeaderboard() {
  // Fetch school-filtered teachers for leaderboard
  const { data: teacherData, isLoading, error } = useQuery({
    queryKey: ['/api/teachers-by-school'],
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 1
  });
  
  // Mock teacher data to use when API fails
  const mockTeacherData = [
    {
      id: 1,
      username: "emma",
      firstName: "Emma",
      lastName: "Smith",
      profilePicture: null,
      points: 275,
      level: 3,
      completedModulesCount: 8,
      isCurrentUser: false
    },
    {
      id: 2,
      username: "jlcookie20",
      firstName: "Jared",
      lastName: "Cook",
      profilePicture: null,
      points: 350,
      level: 3,
      completedModulesCount: 12,
      isCurrentUser: true
    },
    {
      id: 3,
      username: "lbooks",
      firstName: "Laura",
      lastName: "Books",
      profilePicture: null,
      points: 410,
      level: 4,
      completedModulesCount: 15,
      isCurrentUser: false
    },
    {
      id: 4,
      username: "mjohnson",
      firstName: "Michael",
      lastName: "Johnson",
      profilePicture: null,
      points: 190,
      level: 2,
      completedModulesCount: 5,
      isCurrentUser: false
    }
  ];

  // Get current user data
  const { data: currentUser } = useQuery<User>({ 
    queryKey: ['/api/auth/me'] 
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Teacher Leaderboard</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Use mock data when API fails
  const displayTeacherData = (teacherData && Array.isArray(teacherData) && teacherData.length > 0)
    ? teacherData
    : (error ? mockTeacherData : []);
  
  // Process teacher data into rankings format
  const rankings: TeacherRanking[] = React.useMemo(() => {
    if (!displayTeacherData || !Array.isArray(displayTeacherData) || displayTeacherData.length === 0) {
      console.log("No teacher data available");
      return [];
    }
    
    console.log("Processing teacher data", displayTeacherData.length, "teachers");
    
    // Sort teachers by points in descending order
    const sortedTeachers = [...displayTeacherData].sort((a, b) => {
      return (b.points || 0) - (a.points || 0);
    });
    
    // Map to ranking format
    return sortedTeachers.map((teacher, index) => {
      // Determine teacher level based on points
      let level = 'Teacher in Training';
      const points = teacher.points || 0;
      
      if (points >= 1000) level = 'Master Lead Teacher';
      else if (points >= 501) level = 'Lead Teacher';
      else if (points >= 251) level = 'Experienced Teacher';
      else if (points >= 101) level = 'Teacher';
      
      return {
        id: teacher.id,
        username: teacher.username,
        firstName: teacher.firstName || '',
        lastName: teacher.lastName || '',
        profileImage: teacher.profilePicture,
        totalPoints: points,
        level,
        completedModules: teacher.completedModulesCount || 0,
        rank: index + 1,
        isCurrentUser: teacher.id === currentUser?.id
      };
    });
  }, [teacherData, currentUser?.id]);

  // Get rank icon based on position
  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-5 w-5 text-amber-500" />;
      case 2:
        return <Medal className="h-5 w-5 text-slate-400" />;
      case 3:
        return <Medal className="h-5 w-5 text-amber-700" />;
      default:
        return <Star className="h-5 w-5 text-neutral-400" />;
    }
  };

  // Get badge color based on level
  const getLevelColor = (level: string) => {
    switch (level) {
      case 'Master Lead Teacher':
        return 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700';
      case 'Lead Teacher':
        return 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700';
      case 'Experienced Teacher':
        return 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700';
      case 'Teacher':
        return 'bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-700 hover:to-yellow-700';
      case 'Teacher in Training':
      default:
        return 'bg-gradient-to-r from-neutral-600 to-slate-600 hover:from-neutral-700 hover:to-slate-700';
    }
  };

  // Find current user in the rankings
  const currentUserRanking = rankings.find(teacher => teacher.id === currentUser?.id);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-primary/5">
        <CardTitle className="text-xl flex items-center gap-2">
          <Trophy className="h-5 w-5 text-primary" />
          Teacher Leaderboard
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        {/* Leaderboard header */}
        <div className="grid grid-cols-12 text-sm font-medium text-muted-foreground mb-2 px-2">
          <div className="col-span-1">Rank</div>
          <div className="col-span-5">Teacher</div>
          <div className="col-span-3">Level</div>
          <div className="col-span-3 text-right">Points</div>
        </div>
        
        {/* Leaderboard entries */}
        <div className="space-y-2">
          {rankings.slice(0, 5).map((teacher) => (
            <div 
              key={teacher.id}
              className={`grid grid-cols-12 items-center p-3 rounded-lg ${
                teacher.isCurrentUser ? 'bg-primary/10 border border-primary/20' : 'bg-muted/40 hover:bg-muted/60'
              } transition-colors`}
            >
              <div className="col-span-1 flex justify-center">
                {getRankIcon(teacher.rank)}
              </div>
              <div className="col-span-5 flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={teacher.profileImage || ''} />
                  <AvatarFallback className="bg-primary/20 text-primary">
                    {teacher.firstName?.[0]}{teacher.lastName?.[0]}
                  </AvatarFallback>
                </Avatar>
                <span className="font-medium truncate">
                  {teacher.firstName} {teacher.lastName}
                  {teacher.isCurrentUser && (
                    <span className="ml-1 text-xs text-muted-foreground">(You)</span>
                  )}
                </span>
              </div>
              <div className="col-span-3">
                <Badge className={`${getLevelColor(teacher.level)} text-xs`} variant="secondary">
                  {teacher.level}
                </Badge>
              </div>
              <div className="col-span-3 text-right font-bold">
                {teacher.totalPoints} pts
              </div>
            </div>
          ))}
        </div>
        
        {/* Current user info if not in top 5 */}
        {currentUserRanking && currentUserRanking.rank > 5 && (
          <div className="mt-4 pt-4 border-t border-border">
            <div 
              className="grid grid-cols-12 items-center p-3 rounded-lg bg-primary/10 border border-primary/20"
            >
              <div className="col-span-1 flex justify-center">
                {getRankIcon(currentUserRanking.rank)}
              </div>
              <div className="col-span-5 flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={currentUserRanking.profileImage || ''} />
                  <AvatarFallback className="bg-primary/20 text-primary">
                    {currentUserRanking.firstName?.[0]}{currentUserRanking.lastName?.[0]}
                  </AvatarFallback>
                </Avatar>
                <span className="font-medium">
                  {currentUserRanking.firstName} {currentUserRanking.lastName}
                  <span className="ml-1 text-xs text-muted-foreground">(You)</span>
                </span>
              </div>
              <div className="col-span-3">
                <Badge className={`${getLevelColor(currentUserRanking.level)} text-xs`} variant="secondary">
                  {currentUserRanking.level}
                </Badge>
              </div>
              <div className="col-span-3 text-right font-bold">
                {currentUserRanking.totalPoints} pts
              </div>
            </div>
          </div>
        )}
        
        {/* Achievement explanation */}
        <div className="mt-6 pt-4 border-t border-border">
          <h4 className="text-sm font-semibold flex items-center gap-1 mb-2">
            <Award className="h-4 w-4" /> Achievement Levels
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
            <div className="flex items-center gap-1">
              <Badge className="bg-gradient-to-r from-neutral-600 to-slate-600 w-2 h-2 rounded-full p-0" />
              <span>Teacher in Training (0-100)</span>
            </div>
            <div className="flex items-center gap-1">
              <Badge className="bg-gradient-to-r from-amber-600 to-yellow-600 w-2 h-2 rounded-full p-0" />
              <span>Teacher (101-250)</span>
            </div>
            <div className="flex items-center gap-1">
              <Badge className="bg-gradient-to-r from-green-600 to-emerald-600 w-2 h-2 rounded-full p-0" />
              <span>Experienced Teacher (251-500)</span>
            </div>
            <div className="flex items-center gap-1">
              <Badge className="bg-gradient-to-r from-blue-600 to-cyan-600 w-2 h-2 rounded-full p-0" />
              <span>Lead Teacher (501-1000)</span>
            </div>
            <div className="flex items-center gap-1">
              <Badge className="bg-gradient-to-r from-purple-600 to-indigo-600 w-2 h-2 rounded-full p-0" />
              <span>Master Lead Teacher (1000+)</span>
            </div>
          </div>
        </div>
        
        <div className="mt-4 text-xs text-center text-muted-foreground italic">
          Complete modules and assessments to earn points and climb the ranks!
        </div>
      </CardContent>
    </Card>
  );
}