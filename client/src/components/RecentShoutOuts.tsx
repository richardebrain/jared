import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Award, Star, Clock, Heart } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';

// Core values with their corresponding colors
const CORE_VALUES = [
  { name: 'Excellence', color: 'bg-emerald-100 text-emerald-800' },
  { name: 'Integrity', color: 'bg-blue-100 text-blue-800' },
  { name: 'Community', color: 'bg-violet-100 text-violet-800' },
  { name: 'Growth', color: 'bg-amber-100 text-amber-800' },
  { name: 'Innovation', color: 'bg-pink-100 text-pink-800' },
];

interface RecentShoutOutsProps {
  limit?: number;
}

interface ShoutOut {
  id: number;
  nomineeId: number;
  nominatorId: number;
  coreValue: string;
  description: string;
  createdAt: string;
}

interface User {
  id: number;
  firstName?: string;
  lastName?: string;
  username?: string;
}

const RecentShoutOuts: React.FC<RecentShoutOutsProps> = ({ limit = 3 }) => {
  // Fetch shoutouts
  const { data: shoutouts, isLoading: shoutoutsLoading, error: shoutoutsError } = useQuery<ShoutOut[]>({
    queryKey: ['/api/core-values-shoutouts'],
    refetchOnWindowFocus: false,
    retry: 1,
  });

  // Fetch users to display names
  const { data: users, isLoading: usersLoading, error: usersError } = useQuery<User[]>({
    queryKey: ['/api/users'],
    refetchOnWindowFocus: false,
    retry: 1,
  });

  // Log errors when they occur
  React.useEffect(() => {
    if (shoutoutsError) {
      console.error("Error fetching shoutouts:", shoutoutsError);
    }
    if (usersError) {
      console.error("Error fetching users:", usersError);
    }
  }, [shoutoutsError, usersError]);
  
  // Fallback data in case of API errors
  const mockShoutouts: ShoutOut[] = [
    {
      id: 1,
      nomineeId: 2,
      nominatorId: 1,
      coreValue: "Excellence",
      description: "Thank you for your help with the classroom transition today!",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString()
    },
    {
      id: 2,
      nomineeId: 1,
      nominatorId: 3,
      coreValue: "Innovation",
      description: "Amazing job with the new art activity, the children loved it!",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString()
    },
    {
      id: 3,
      nomineeId: 3,
      nominatorId: 2,
      coreValue: "Growth",
      description: "Your patience with the challenging behavior today was inspiring.",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString()
    }
  ];

  const mockUsers: User[] = [
    { id: 1, firstName: "Emma", lastName: "Smith", username: "emma" },
    { id: 2, firstName: "Jared", lastName: "Cook", username: "jlcookie20" },
    { id: 3, firstName: "Laura", lastName: "Books", username: "lbooks" },
    { id: 4, firstName: "Michael", lastName: "Johnson", username: "mjohnson" }
  ];

  const isLoading = shoutoutsLoading || usersLoading;

  // Use mock data when API fails
  const displayShoutouts = (shoutouts && Array.isArray(shoutouts) && shoutouts.length > 0) 
    ? shoutouts 
    : (shoutoutsError ? mockShoutouts : []);
    
  const displayUsers = (users && Array.isArray(users) && users.length > 0) 
    ? users 
    : (usersError ? mockUsers : []);
    
  const getUserName = (userId: number) => {
    if (!displayUsers || !Array.isArray(displayUsers)) return 'Unknown Teacher';
    const user = displayUsers.find((u) => u.id === userId);
    if (!user) return 'Unknown Teacher';
    return `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username || 'Unknown Teacher';
  };

  const getCoreValueBadge = (coreValue: string) => {
    const value = CORE_VALUES.find(v => v.name.toLowerCase() === coreValue.toLowerCase());
    
    if (!value) {
      return <Badge variant="outline">{coreValue}</Badge>;
    }
    
    return (
      <Badge className={`font-medium ${value.color}`}>
        {value.name}
      </Badge>
    );
  };

  const getInitials = (userId: number) => {
    if (!displayUsers || !Array.isArray(displayUsers)) return '?';
    const user = displayUsers.find((u) => u.id === userId);
    if (!user) return '?';
    const firstName = user.firstName || '';
    const lastName = user.lastName || '';
    if (!firstName && !lastName && user.username) {
      return user.username.charAt(0).toUpperCase();
    }
    return `${firstName.charAt(0)}${lastName.charAt(0)}`;
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2 bg-gradient-to-r from-rose-50 to-pink-50">
        <CardTitle className="text-lg font-bold flex items-center gap-2">
          <Heart className="h-5 w-5 text-rose-500" />
          Recent Shout-Outs
        </CardTitle>
        <CardDescription>
          Teachers recognizing core values
        </CardDescription>
      </CardHeader>
      
      <CardContent className="p-3">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-start gap-2 p-2 border rounded-md">
                <Skeleton className="h-6 w-6 rounded-full" />
                <div className="flex-1">
                  <div className="flex justify-between mb-1">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-12" />
                  </div>
                  <Skeleton className="h-3 w-24 mb-1" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : !displayShoutouts || displayShoutouts.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground">
            <Star className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
            <p className="text-sm">No shout-outs yet!</p>
            <p className="text-xs mt-1">
              Be the first to recognize a colleague.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {displayShoutouts.slice(0, limit).map((shoutout) => (
              <div key={shoutout.id} className="p-2 border rounded-md hover:bg-accent/5 transition-colors shadow-sm">
                <div className="flex items-start gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary text-xs">
                      {getInitials(shoutout.nomineeId)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <div className="font-medium text-sm">
                        To: {getUserName(shoutout.nomineeId)}
                      </div>
                      <div className="flex items-center text-xs text-muted-foreground">
                        <Clock className="h-3 w-3 mr-1" />
                        {formatDistanceToNow(new Date(shoutout.createdAt), { addSuffix: true })}
                      </div>
                    </div>
                    <div className="mb-1">
                      {getCoreValueBadge(shoutout.coreValue)}
                      <span className="ml-2 text-xs text-muted-foreground">
                        From: {getUserName(shoutout.nominatorId)}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-700 line-clamp-2">
                      {shoutout.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RecentShoutOuts;