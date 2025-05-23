import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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

export default function AvatarCustomizationPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("customize");
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [selectedAvatar, setSelectedAvatar] = useState<UserAvatar | null>(null);
  const [customization, setCustomization] = useState<Record<string, number>>({});
  
  // Fetch avatar categories
  const { data: categories = [] } = useQuery({
    queryKey: ["/api/avatars/categories"],
    enabled: activeTab === "customize" || activeTab === "shop",
  });
  
  // Fetch all avatar items
  const { data: allItems = [] } = useQuery({
    queryKey: ["/api/avatars/items"],
    enabled: activeTab === "customize" || activeTab === "shop",
  });
  
  // Fetch user avatars
  const { data: userAvatars = [], isLoading: loadingAvatars } = useQuery({
    queryKey: ["/api/avatars/user-avatars"],
  });
  
  // Ensure userAvatars is always an array
  const avatarsArray = Array.isArray(userAvatars) ? userAvatars : [];
  
  // Fetch user's purchased items
  const { data: userItems = [] } = useQuery({
    queryKey: ["/api/avatars/user-avatar-items"],
  });
  
  // Fetch active avatar
  const { data: activeAvatar, isLoading: loadingActiveAvatar } = useQuery({
    queryKey: ["/api/avatars/user-avatars/active"],
    onSuccess: (data) => {
      if (data) {
        setSelectedAvatar(data);
        setCustomization(data.components || {});
      }
    },
    onError: () => {
      // If no active avatar, create one if the user has avatars
      if (avatarsArray.length > 0) {
        setSelectedAvatar(avatarsArray[0]);
        setCustomization(avatarsArray[0].components || {});
      }
    }
  });
  
  // Set initial selected category
  useEffect(() => {
    if (categories.length > 0 && !selectedCategory) {
      setSelectedCategory(categories[0].id);
    }
  }, [categories, selectedCategory]);
  
  // Create a new avatar
  const createAvatarMutation = useMutation({
    mutationFn: async (data: { name: string }) => {
      return apiRequest("POST", "/api/avatars/user-avatars", {
        name: data.name,
        isActive: true,
        components: {}
      });
    },
    onSuccess: () => {
      toast({
        title: "Avatar Created",
        description: "Your new avatar has been created.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/avatars/user-avatars"] });
      queryClient.invalidateQueries({ queryKey: ["/api/avatars/user-avatars/active"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create avatar. Please try again.",
        variant: "destructive"
      });
      console.error("Error creating avatar:", error);
    }
  });
  
  // Update avatar mutation
  const updateAvatarMutation = useMutation({
    mutationFn: async (data: { id: number, components: Record<string, number> }) => {
      return apiRequest("PUT", `/api/avatars/user-avatars/${data.id}`, {
        components: data.components
      });
    },
    onSuccess: () => {
      toast({
        title: "Avatar Updated",
        description: "Your avatar has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/avatars/user-avatars"] });
      queryClient.invalidateQueries({ queryKey: ["/api/avatars/user-avatars/active"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update avatar. Please try again.",
        variant: "destructive"
      });
      console.error("Error updating avatar:", error);
    }
  });
  
  // Set active avatar mutation
  const setActiveAvatarMutation = useMutation({
    mutationFn: async (avatarId: number) => {
      return apiRequest("POST", `/api/avatars/user-avatars/${avatarId}/set-active`, {});
    },
    onSuccess: () => {
      toast({
        title: "Avatar Activated",
        description: "Your selected avatar is now active.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/avatars/user-avatars"] });
      queryClient.invalidateQueries({ queryKey: ["/api/avatars/user-avatars/active"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to activate avatar. Please try again.",
        variant: "destructive"
      });
      console.error("Error activating avatar:", error);
    }
  });
  
  // Purchase item mutation
  const purchaseItemMutation = useMutation({
    mutationFn: async (itemId: number) => {
      return apiRequest("POST", `/api/avatars/purchase/${itemId}`, {});
    },
    onSuccess: () => {
      toast({
        title: "Item Purchased",
        description: "You have successfully purchased this item!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/avatars/user-avatar-items"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
    },
    onError: (error: any) => {
      toast({
        title: "Purchase Failed",
        description: error.message || "You don't have enough points for this item.",
        variant: "destructive"
      });
      console.error("Error purchasing item:", error);
    }
  });
  
  // Create a new avatar if none exists
  const handleCreateAvatar = () => {
    const name = `Avatar ${avatarsArray.length + 1}`;
    createAvatarMutation.mutate({ name });
  };
  
  // Select an avatar
  const handleSelectAvatar = (avatar: UserAvatar) => {
    setSelectedAvatar(avatar);
    setCustomization(avatar.components || {});
  };
  
  // Activate an avatar
  const handleActivateAvatar = (avatarId: number) => {
    setActiveAvatarMutation.mutate(avatarId);
  };
  
  // Save avatar customization
  const handleSaveCustomization = () => {
    if (selectedAvatar) {
      updateAvatarMutation.mutate({
        id: selectedAvatar.id,
        components: customization
      });
    }
  };
  
  // Apply an item to the current customization
  const handleApplyItem = (categoryId: number, itemId: number) => {
    setCustomization(prev => ({
      ...prev,
      [categoryId.toString()]: itemId
    }));
  };
  
  // Purchase an item
  const handlePurchaseItem = (itemId: number) => {
    purchaseItemMutation.mutate(itemId);
  };
  
  // Check if user owns an item
  const userOwnsItem = (itemId: number) => {
    return userItems.some((item: UserAvatarItem) => item.itemId === itemId);
  };
  
  // Filter items by category
  const itemsByCategory = selectedCategory 
    ? allItems.filter((item: AvatarItem) => item.categoryId === selectedCategory)
    : [];
  
  // Get category name
  const getCategoryName = (categoryId: number) => {
    const category = categories.find((cat: AvatarCategory) => cat.id === categoryId);
    return category ? category.name : "Unknown";
  };
  
  // Get item details
  const getItemDetails = (itemId: number) => {
    return allItems.find((item: AvatarItem) => item.id === itemId);
  };
  
  // Render avatar preview based on customization choices
  const renderAvatarPreview = () => {
    // This is a placeholder. In a real implementation,
    // you would compose different images based on the customization values
    return (
      <div className="relative w-64 h-64 mx-auto bg-gray-100 rounded-full overflow-hidden border-4 border-primary">
        {/* Base avatar */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xl font-bold text-gray-400">Avatar Preview</span>
        </div>
        
        {/* Render each component based on selected items */}
        {Object.entries(customization).map(([categoryId, itemId]) => {
          const item = getItemDetails(itemId);
          if (!item) return null;
          
          return (
            <div key={categoryId} className="absolute inset-0">
              {item.imageUrl && (
                <img 
                  src={item.imageUrl} 
                  alt={item.name} 
                  className="w-full h-full object-cover"
                />
              )}
            </div>
          );
        })}
      </div>
    );
  };
  
  if (loadingAvatars || loadingActiveAvatar) {
    return (
      <div className="container py-8">
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
            <TabsTrigger value="customize">Customize</TabsTrigger>
            <TabsTrigger value="shop">Shop</TabsTrigger>
            <TabsTrigger value="my-avatars">My Avatars</TabsTrigger>
          </TabsList>
          
          {/* Customize Tab */}
          <TabsContent value="customize">
            {avatarsArray.length === 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle>Create Your First Avatar</CardTitle>
                  <CardDescription>
                    You don't have any avatars yet. Create your first one to get started!
                  </CardDescription>
                </CardHeader>
                <CardFooter>
                  <Button onClick={handleCreateAvatar}>
                    Create Avatar
                  </Button>
                </CardFooter>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Avatar Preview */}
                <Card className="md:col-span-1">
                  <CardHeader>
                    <CardTitle>Preview</CardTitle>
                    <CardDescription>
                      {selectedAvatar?.name || "Your Avatar"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex justify-center">
                    {renderAvatarPreview()}
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Button onClick={handleSaveCustomization} disabled={!selectedAvatar}>
                      Save Changes
                    </Button>
                    {selectedAvatar && !selectedAvatar.isActive && (
                      <Button 
                        variant="outline" 
                        onClick={() => handleActivateAvatar(selectedAvatar.id)}
                      >
                        Set as Active
                      </Button>
                    )}
                  </CardFooter>
                </Card>
                
                {/* Customization Options */}
                <Card className="md:col-span-2">
                  <CardHeader>
                    <CardTitle>Customization Options</CardTitle>
                    <CardDescription>
                      Select a category and customize your avatar
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {/* Category Tabs */}
                    <div className="flex overflow-x-auto pb-2 mb-4 space-x-2">
                      {categories.map((category: AvatarCategory) => (
                        <Button
                          key={category.id}
                          variant={selectedCategory === category.id ? "default" : "outline"}
                          onClick={() => setSelectedCategory(category.id)}
                          className="whitespace-nowrap"
                        >
                          {category.name}
                        </Button>
                      ))}
                    </div>
                    
                    {/* Items Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {itemsByCategory.map((item: AvatarItem) => {
                        const isOwned = userOwnsItem(item.id);
                        const isSelected = customization[selectedCategory?.toString() || ""] === item.id;
                        
                        if (!isOwned) return null;
                        
                        return (
                          <div 
                            key={item.id} 
                            className={`relative cursor-pointer border rounded-lg p-4 transition-all ${
                              isSelected ? "border-primary bg-primary/10" : "border-gray-200 hover:border-primary"
                            }`}
                            onClick={() => handleApplyItem(item.categoryId, item.id)}
                          >
                            <div className="flex flex-col items-center">
                              <div className="w-16 h-16 mb-2 bg-gray-100 rounded-md overflow-hidden">
                                {item.imageUrl ? (
                                  <img 
                                    src={item.imageUrl} 
                                    alt={item.name} 
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <Shirt className="h-8 w-8 text-gray-400" />
                                  </div>
                                )}
                              </div>
                              <span className="text-sm font-medium text-center">{item.name}</span>
                              {isSelected && (
                                <div className="absolute top-2 right-2 bg-primary text-white rounded-full p-1">
                                  <Check className="h-4 w-4" />
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                      
                      {itemsByCategory.filter(item => userOwnsItem(item.id)).length === 0 && (
                        <div className="col-span-full p-8 text-center">
                          <Alert>
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>No items found</AlertTitle>
                            <AlertDescription>
                              You don't own any items in this category yet. Visit the shop to purchase items!
                            </AlertDescription>
                          </Alert>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>
          
          {/* Shop Tab */}
          <TabsContent value="shop">
            <Card>
              <CardHeader>
                <CardTitle>Avatar Shop</CardTitle>
                <CardDescription>
                  Spend your points to purchase new items for your avatar
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Category Tabs */}
                <div className="flex overflow-x-auto pb-2 mb-4 space-x-2">
                  {categories.map((category: AvatarCategory) => (
                    <Button
                      key={category.id}
                      variant={selectedCategory === category.id ? "default" : "outline"}
                      onClick={() => setSelectedCategory(category.id)}
                      className="whitespace-nowrap"
                    >
                      {category.name}
                    </Button>
                  ))}
                </div>
                
                {/* Shop Items Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {itemsByCategory.map((item: AvatarItem) => {
                    const isOwned = userOwnsItem(item.id);
                    
                    return (
                      <Card key={item.id} className="overflow-hidden">
                        <div className="aspect-square bg-gray-100 relative">
                          {item.imageUrl ? (
                            <img 
                              src={item.imageUrl} 
                              alt={item.name} 
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Shirt className="h-16 w-16 text-gray-400" />
                            </div>
                          )}
                          
                          {/* Rarity Badge */}
                          <div className="absolute top-2 right-2">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger>
                                  <Badge variant={
                                    item.rarity === 'Common' ? 'outline' :
                                    item.rarity === 'Rare' ? 'secondary' :
                                    item.rarity === 'Epic' ? 'default' : 'destructive'
                                  }>
                                    {item.rarity === 'Legendary' && <Crown className="h-3 w-3 mr-1" />}
                                    {item.rarity}
                                  </Badge>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Item rarity: {item.rarity}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        </div>
                        
                        <CardHeader className="p-3">
                          <CardTitle className="text-lg">{item.name}</CardTitle>
                          <CardDescription className="text-xs">
                            {item.description || `A ${item.rarity.toLowerCase()} ${getCategoryName(item.categoryId).toLowerCase()} item`}
                          </CardDescription>
                        </CardHeader>
                        
                        <CardFooter className="p-3 pt-0 flex justify-between items-center">
                          {isOwned ? (
                            <Badge variant="outline" className="bg-emerald-50">
                              <Check className="h-3 w-3 mr-1 text-emerald-500" />
                              Owned
                            </Badge>
                          ) : (
                            <>
                              <div className="flex items-center">
                                <Award className="h-4 w-4 mr-1 text-amber-500" />
                                <span className="font-semibold">{item.pointsCost} Points</span>
                              </div>
                              <Button 
                                size="sm" 
                                onClick={() => handlePurchaseItem(item.id)}
                                disabled={user?.points < item.pointsCost}
                              >
                                Purchase
                              </Button>
                            </>
                          )}
                        </CardFooter>
                      </Card>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* My Avatars Tab */}
          <TabsContent value="my-avatars">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>My Avatars</CardTitle>
                  <CardDescription>
                    Manage your collection of avatars
                  </CardDescription>
                </div>
                <Button onClick={handleCreateAvatar}>
                  Create New Avatar
                </Button>
              </CardHeader>
              <CardContent>
                {avatarsArray.length === 0 ? (
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
                    {avatarsArray.map((avatar: UserAvatar) => (
                      <Card 
                        key={avatar.id}
                        className={`cursor-pointer transition-all ${
                          avatar.isActive ? "border-primary" : "border-gray-200 hover:border-primary"
                        }`}
                        onClick={() => handleSelectAvatar(avatar)}
                      >
                        <CardHeader className="pb-2">
                          <div className="flex justify-between items-center">
                            <CardTitle className="text-lg">{avatar.name}</CardTitle>
                            {avatar.isActive && (
                              <Badge variant="outline" className="bg-emerald-50">
                                <Check className="h-3 w-3 mr-1 text-emerald-500" />
                                Active
                              </Badge>
                            )}
                          </div>
                          <CardDescription className="text-xs">
                            Created {new Date(avatar.createdAt).toLocaleDateString()}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="flex justify-center py-2">
                            <Avatar className="h-24 w-24">
                              <AvatarImage src="/placeholder-avatar.png" alt={avatar.name} />
                              <AvatarFallback>
                                {avatar.name.substring(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                          </div>
                          <div className="mt-2">
                            <Separator className="my-2" />
                            <div className="text-xs text-muted-foreground">
                              Items: {Object.keys(avatar.components || {}).length}
                            </div>
                          </div>
                        </CardContent>
                        <CardFooter>
                          {!avatar.isActive && (
                            <Button 
                              variant="outline" 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleActivateAvatar(avatar.id);
                              }}
                              className="w-full"
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
        </Tabs>
      </div>
    </div>
  );
}