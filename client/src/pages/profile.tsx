import { useSimpleAuth } from "@/lib/simple-auth";
import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import PointsDisplay from "@/components/BearBucksDisplay";
import WelcomeMessage from "@/components/WelcomeMessage";
import CertificationTracker from "@/components/CertificationTracker";
import {
  Edit,
  Save,
  User,
  Mail,
  Calendar,
  Award,
  MapPin,
  Clock,
  FileText,
  GraduationCap,
  BadgeCheck
} from "lucide-react";

export default function ProfilePage() {
  const { user } = useSimpleAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    language: "",
    nativeLanguage: "",
    timeZone: ""
  });

  // Fetch user data if not already available
  const { data: userData, isLoading } = useQuery({
    queryKey: ["/api/auth/me"],
    enabled: !user,
    retry: false,
  });

  // Use either the auth context user or the fetched user data
  const profileUser = user || userData;

  // Initialize form data when user data is available
  useState(() => {
    if (profileUser) {
      setFormData({
        firstName: profileUser.firstName || "",
        lastName: profileUser.lastName || "",
        email: profileUser.email || "",
        language: profileUser.language || "",
        nativeLanguage: profileUser.nativeLanguage || "",
        timeZone: profileUser.timeZone || ""
      });
    }
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await apiRequest("/api/update-profile", {
        method: "POST",
        data
      });
      return response.data;
    },
    onSuccess: () => {
      toast({
        title: "Profile Updated",
        description: "Your profile information has been successfully updated.",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      setIsEditing(false);
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description: "There was an error updating your profile. Please try again.",
        variant: "destructive",
      });
      console.error("Profile update error:", error);
    },
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="container max-w-6xl mx-auto p-6">
        <Card className="border-rose-100 bg-rose-50/30">
          <CardContent className="p-6">
            <div className="text-center text-rose-600">
              <h2 className="text-xl font-semibold">User Not Found</h2>
              <p className="mt-2">Please log in to view your profile.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Calculate user initials for avatar fallback
  const userInitials = `${profileUser.firstName?.[0] || ""}${profileUser.lastName?.[0] || ""}`.toUpperCase();

  // Calculate teacher level based on points
  const getTeacherLevel = (points: number) => {
    if (points >= 2500) return "Master Lead Teacher";
    if (points >= 1500) return "Lead Teacher";
    if (points >= 800) return "Associate Teacher";
    if (points >= 300) return "Assistant Teacher";
    return "Teacher in Training";
  };

  // Get points needed for next level
  const getPointsForNextLevel = (points: number) => {
    if (points >= 2500) return "Maximum Level Reached";
    if (points >= 1500) return `${2500 - points} more to Master Lead Teacher`;
    if (points >= 800) return `${1500 - points} more to Lead Teacher`;
    if (points >= 300) return `${800 - points} more to Associate Teacher`;
    return `${300 - points} more to Assistant Teacher`;
  };

  // Format date
  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  };

  return (
    <div className="container max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">Your Profile</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column - Personal Info */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Avatar className="h-20 w-20 border-4 border-white shadow-md">
                    <AvatarImage src={profileUser.profilePicture || ""} alt={profileUser.firstName || ""} />
                    <AvatarFallback className="text-xl bg-primary text-primary-foreground">
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-2xl">
                      {profileUser.firstName} {profileUser.lastName}
                    </CardTitle>
                    <CardDescription className="text-base mt-1">
                      {getTeacherLevel(profileUser.lifetimePoints || profileUser.points || 0)}
                    </CardDescription>
                  </div>
                </div>
                
                {!isEditing ? (
                  <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                    <Edit className="h-4 w-4 mr-2" /> Edit Profile
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}>
                    Cancel
                  </Button>
                )}
              </div>
            </CardHeader>
            
            <CardContent className="p-6">
              {!isEditing ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <User className="h-5 w-5 text-blue-500" />
                        <div>
                          <div className="text-sm font-medium text-muted-foreground">Username</div>
                          <div>{profileUser.username}</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <Mail className="h-5 w-5 text-blue-500" />
                        <div>
                          <div className="text-sm font-medium text-muted-foreground">Email</div>
                          <div>{profileUser.email}</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <MapPin className="h-5 w-5 text-blue-500" />
                        <div>
                          <div className="text-sm font-medium text-muted-foreground">School</div>
                          <div>Raising Arizona Preschool</div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-blue-500" />
                        <div>
                          <div className="text-sm font-medium text-muted-foreground">Language</div>
                          <div>{profileUser.language}</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <GraduationCap className="h-5 w-5 text-blue-500" />
                        <div>
                          <div className="text-sm font-medium text-muted-foreground">Native Language</div>
                          <div>{profileUser.nativeLanguage}</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <Clock className="h-5 w-5 text-blue-500" />
                        <div>
                          <div className="text-sm font-medium text-muted-foreground">Time Zone</div>
                          <div>{profileUser.timeZone}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 mt-6">
                    <Calendar className="h-5 w-5 text-blue-500" />
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">Member Since</div>
                      <div>{formatDate(profileUser.createdAt)}</div>
                    </div>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="firstName">First Name</Label>
                        <Input
                          id="firstName"
                          name="firstName"
                          value={formData.firstName}
                          onChange={handleInputChange}
                          className="mt-1"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input
                          id="lastName"
                          name="lastName"
                          value={formData.lastName}
                          onChange={handleInputChange}
                          className="mt-1"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          className="mt-1"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="language">Language</Label>
                        <Input
                          id="language"
                          name="language"
                          value={formData.language}
                          onChange={handleInputChange}
                          className="mt-1"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="nativeLanguage">Native Language</Label>
                        <Input
                          id="nativeLanguage"
                          name="nativeLanguage"
                          value={formData.nativeLanguage}
                          onChange={handleInputChange}
                          className="mt-1"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="timeZone">Time Zone</Label>
                        <Input
                          id="timeZone"
                          name="timeZone"
                          value={formData.timeZone}
                          onChange={handleInputChange}
                          className="mt-1"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-end mt-6">
                    <Button type="submit" disabled={updateProfileMutation.isPending}>
                      {updateProfileMutation.isPending ? (
                        <div className="flex items-center">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                          Saving...
                        </div>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" /> Save Changes
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Right Column - Stats & Achievements */}
        <div>
          <div className="space-y-6">
            {/* Certification Tracker */}
            <CertificationTracker
              userId={profileUser.id}
              fingerprintExpiration={profileUser.fingerprintExpiration}
              cprExpiration={profileUser.cprExpiration}
              firstAidExpiration={profileUser.firstAidExpiration}
              foodHandlerExpiration={profileUser.foodHandlerExpiration}
            />
            
            <Card>
              <CardHeader className="bg-amber-50">
                <CardTitle className="flex items-center">
                  <Award className="h-5 w-5 mr-2 text-amber-600" />
                  Progression & Rewards
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-4">
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Current Level</div>
                    <div className="text-xl font-semibold">
                      {getTeacherLevel(profileUser.lifetimePoints || profileUser.points || 0)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {getPointsForNextLevel(profileUser.lifetimePoints || profileUser.points || 0)}
                    </div>
                  </div>
                  
                  <div className="pt-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-muted-foreground">Current Points</span>
                      <span className="text-sm font-medium text-amber-600">{profileUser.points || 0}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-amber-500 h-2 rounded-full"
                        style={{ width: `${Math.min(100, ((profileUser.points || 0) / 3000) * 100)}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="pt-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-muted-foreground">Lifetime Points</span>
                      <span className="text-sm font-medium text-purple-600">
                        {profileUser.lifetimePoints || profileUser.points || 0}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-purple-500 h-2 rounded-full"
                        style={{ width: `${Math.min(100, ((profileUser.lifetimePoints || profileUser.points || 0) / 3500) * 100)}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="pt-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-muted-foreground">Bear Bucks</span>
                      <span className="text-sm font-medium text-green-600">{profileUser.bearBucks || 0}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full"
                        style={{ width: `${Math.min(100, ((profileUser.bearBucks || 0) / 50) * 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="bg-blue-50">
                <CardTitle className="flex items-center">
                  <User className="h-5 w-5 mr-2 text-blue-600" />
                  Account Status
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Login Streak</span>
                    <span className="font-medium">{profileUser.streak || 0} days</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Last Active</span>
                    <span className="font-medium">{profileUser.lastActive ? formatDate(profileUser.lastActive) : 'Today'}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Achievements</span>
                    <span className="font-medium">{profileUser.achievementCount || 0}</span>
                  </div>

                  {profileUser.isAdmin && (
                    <div className="mt-4 pt-3 border-t">
                      <div className="text-sm font-medium mb-2">Admin Privileges</div>
                      <div className="bg-blue-100 text-blue-800 text-xs py-1 px-2 rounded-full inline-block">
                        Admin Access
                      </div>
                    </div>
                  )}

                  {profileUser.isSchoolAdmin && (
                    <div className="mt-4 pt-3 border-t">
                      <div className="text-sm font-medium mb-2">School Admin Privileges</div>
                      <div className="bg-violet-100 text-violet-800 text-xs py-1 px-2 rounded-full inline-block">
                        School Admin
                      </div>
                    </div>
                  )}

                  {profileUser.isOwner && (
                    <div className="mt-4 pt-3 border-t">
                      <div className="text-sm font-medium mb-2">Owner Privileges</div>
                      <div className="bg-amber-100 text-amber-800 text-xs py-1 px-2 rounded-full inline-block">
                        App Owner
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}