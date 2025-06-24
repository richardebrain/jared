import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useSimpleAuth } from "@/lib/simple-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Check, Shirt, ShoppingBag, Crown, Award } from "lucide-react";

// Type definitions
interface AvatarCategory {
  id: number;
  name: string;
  displayOrder: number;
  description: string | null;
}

interface AvatarItem {
  id: number;
  categoryId: number;
  name: string;
  description: string | null;
  imageUrl: string;
  pointsCost: number;
  rarity: string;
  unlockRequirement: string | null;
}

interface UserAvatar {
  id: number;
  userId: number;
  name: string;
  isActive: boolean;
  components: Record<string, number>;
  createdAt: string;
  updatedAt: string;
}

interface UserAvatarItem {
  id: number;
  userId: number;
  itemId: number;
}

export default function AvatarStablePage() {
  const { toast } = useToast();
  const { user } = useSimpleAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("my-avatars");
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [customization, setCustomization] = useState<Record<string, number>>({});
  
  // Fetch avatar categories with error handling
  const { 
    data: categoriesData, 
    isLoading: loadingCategories 
  } = useQuery({
    queryKey: ["/api/avatars/categories"],
    enabled: activeTab === "customize" || activeTab === "shop",
  });
  
  // Ensure categories is always an array
  const categories = Array.isArray(categoriesData) ? categoriesData : [];
  
  // Fetch all avatar items with error handling
  const { 
    data: allItemsData, 
    isLoading: loadingItems 
  } = useQuery({
    queryKey: ["/api/avatars/items"],
    enabled: activeTab === "customize" || activeTab === "shop",
  });
  
  // Ensure allItems is always an array
  const allItems = Array.isArray(allItemsData) ? allItemsData : [];
  
  // Fetch user avatars with error handling
  const { 
    data: userAvatarsData, 
    isLoading: loadingAvatars 
  } = useQuery({
    queryKey: ["/api/avatars/user-avatars"],
  });
  
  // Ensure userAvatars is always an array
  const userAvatars = Array.isArray(userAvatarsData) ? userAvatarsData : [];
  
  // Fetch user's purchased items with error handling
  const { 
    data: userItemsData, 
    isLoading: loadingUserItems 
  } = useQuery({
    queryKey: ["/api/avatars/user-avatar-items"],
  });
  
  // Ensure userItems is always an array
  const userItems = Array.isArray(userItemsData) ? userItemsData : [];
  
  // Helper function to check if user owns an item
  const userOwnsItem = (itemId: number) => {
    if (!Array.isArray(userItems)) return false;
    return userItems.some((item: UserAvatarItem) => item.itemId === itemId);
  };
  
  // Create a new avatar
  const handleCreateAvatar = () => {
    const name = `Avatar ${userAvatars.length + 1}`;
    toast({
      title: "Creating Avatar",
      description: "Please wait while we create your new avatar...",
    });
    
    apiRequest("POST", "/api/avatars/user-avatars", {
      name: name,
      isActive: true,
      components: {}
    })
    .then(() => {
      toast({
        title: "Avatar Created",
        description: "Your new avatar has been created successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/avatars/user-avatars"] });
    })
    .catch((error) => {
      console.error("Error creating avatar:", error);
      toast({
        title: "Error",
        description: "Failed to create avatar. Please try again later.",
        variant: "destructive"
      });
    });
  };
  
  // Handle setting an avatar as active
  const handleSetActive = (avatarId: number) => {
    toast({
      title: "Activating Avatar",
      description: "Setting this avatar as your active avatar...",
    });
    
    apiRequest("POST", `/api/avatars/user-avatars/${avatarId}/set-active`, {})
    .then(() => {
      toast({
        title: "Avatar Activated",
        description: "This avatar is now your active avatar!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/avatars/user-avatars"] });
    })
    .catch((error) => {
      console.error("Error activating avatar:", error);
      toast({
        title: "Error",
        description: "Failed to activate avatar. Please try again later.",
        variant: "destructive"
      });
    });
  };
  
  const isLoading = loadingCategories || loadingItems || loadingAvatars || loadingUserItems;
  
  if (isLoading) {
    return (
      <div className="container py-8">
        <h1 className="text-3xl font-bold mb-6">Avatar Customization</h1>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container py-8">
      <div className="flex flex-col space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Avatar Customization</h1>
          <div className="flex items-center space-x-2">
            <ShoppingBag className="h-5 w-5 text-primary" />
            <span className="font-semibold">{user?.points || 0} Points</span>
          </div>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="my-avatars">My Avatars</TabsTrigger>
            <TabsTrigger value="customize">Customize</TabsTrigger>
            <TabsTrigger value="shop">Shop</TabsTrigger>
          </TabsList>
          
          {/* My Avatars Tab */}
          <TabsContent value="my-avatars">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>My Avatars</CardTitle>
                  <CardDescription>
                    Manage and switch between your avatars
                  </CardDescription>
                </div>
                <Button onClick={handleCreateAvatar}>
                  Create New Avatar
                </Button>
              </CardHeader>
              <CardContent>
                {userAvatars.length === 0 ? (
                  <div className="p-8 text-center">
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>No Avatars Created</AlertTitle>
                      <AlertDescription>
                        You haven't created any avatars yet. Create your first one to get started!
                      </AlertDescription>
                    </Alert>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {userAvatars.map((avatar: UserAvatar) => (
                      <Card 
                        key={avatar.id}
                        className={`cursor-pointer transition-all ${
                          avatar.isActive ? "border-primary" : "border-gray-200 hover:border-primary"
                        }`}
                      >
                        <CardHeader>
                          <CardTitle className="flex items-center justify-between">
                            {avatar.name}
                            {avatar.isActive && (
                              <Badge className="ml-2 bg-primary">Active</Badge>
                            )}
                          </CardTitle>
                          <CardDescription>
                            Created {new Date(avatar.createdAt).toLocaleDateString()}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="flex flex-col items-center pt-0">
                          <Avatar className="h-24 w-24 mb-4">
                            <AvatarImage src="/placeholder-avatar.png" alt={avatar.name} />
                            <AvatarFallback className="bg-primary text-primary-foreground">
                              {avatar.name.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="text-sm text-gray-500">
                            Items: {Object.keys(avatar.components || {}).length}
                          </div>
                        </CardContent>
                        <CardFooter>
                          {!avatar.isActive && (
                            <Button 
                              variant="outline" 
                              className="w-full"
                              onClick={() => handleSetActive(avatar.id)}
                            >
                              Set as Active
                            </Button>
                          )}
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Customize Tab */}
          <TabsContent value="customize">
            <Card>
              <CardHeader>
                <CardTitle>Customize Your Avatar</CardTitle>
                <CardDescription>
                  This feature is still being improved! For now, check out your avatars in the "My Avatars" tab.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Coming Soon</AlertTitle>
                  <AlertDescription>
                    The customize feature is currently being enhanced for a better experience.
                    Please come back later to customize your avatar!
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Shop Tab */}
          <TabsContent value="shop">
            <Card>
              <CardHeader>
                <CardTitle>Avatar Shop</CardTitle>
                <CardDescription>
                  This feature is still being improved! Check back soon to purchase new items for your avatar.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Coming Soon</AlertTitle>
                  <AlertDescription>
                    The shop feature is currently being enhanced for a better experience.
                    Please come back later to browse and purchase new items!
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}