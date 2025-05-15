import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { User } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import raisingArizonaLogo from "@assets/raising-arizona-logo.jpg";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

export default function Header() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const { data: user } = useQuery<User>({
    queryKey: ["/api/auth/me"]
  });
  
  const { mutate: logout } = useMutation({
    mutationFn: async () => {
      try {
        const response = await apiRequest("/api/auth/logout", { method: "POST" });
        return response;
      } catch (error) {
        console.error("Logout error:", error);
        throw error;
      }
    },
    onSuccess: () => {
      // Clear all cached data to force a complete reset
      queryClient.clear();
      
      // Show success message
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });
      
      // Force redirect to login page with a slight delay to ensure cache is cleared
      setTimeout(() => {
        window.location.href = "/login";
      }, 100);
    },
    onError: (error: Error) => {
      console.error("Logout error in mutation:", error);
      toast({
        title: "Logout failed",
        description: error.message || "There was an error logging out.",
        variant: "destructive",
      });
    },
  });
  
  const handleLogout = () => {
    logout();
  };
  
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };
  
  const userInitials = user 
    ? `${user.firstName.charAt(0)}${user.lastName.charAt(0)}` 
    : "U";
  
  return (
    <header className="sticky top-0 bg-white shadow-md z-50">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex items-center">
          <Link href="/">
            <div className="flex items-center">
              <img src={raisingArizonaLogo} alt="Raising Arizona Preschool" className="h-12 mr-3 rounded-md shadow-sm" />
              <div className="flex flex-col">
                <div className="text-2xl font-bold bg-gradient-to-r from-amber-600 to-amber-800 bg-clip-text text-transparent">MentorMe</div>
                <div className="text-xs text-neutral-600 font-medium">Raising Arizona Teacher Training</div>
              </div>
            </div>
          </Link>
        </div>
        
        <nav className="hidden md:flex items-center bg-amber-50 rounded-full px-2 shadow-inner">
          <Link href="/">
            <div className={`font-medium px-4 py-2 rounded-full mx-1 text-sm ${location === "/" 
              ? "bg-amber-600 text-white shadow-sm" 
              : "text-neutral-700 hover:bg-amber-100"} transition-all duration-200 cursor-pointer`}>
              Dashboard
            </div>
          </Link>
          <Link href="/progression-map">
            <div className={`font-medium px-4 py-2 rounded-full mx-1 text-sm ${location === "/progression-map" 
              ? "bg-amber-600 text-white shadow-sm" 
              : "text-neutral-700 hover:bg-amber-100"} transition-all duration-200 cursor-pointer`}>
              Teacher Progression
            </div>
          </Link>
          <Link href="/assessment">
            <div className={`font-medium px-4 py-2 rounded-full mx-1 text-sm ${location === "/assessment" 
              ? "bg-amber-600 text-white shadow-sm" 
              : "text-neutral-700 hover:bg-amber-100"} transition-all duration-200 cursor-pointer`}>
              Assessment
            </div>
          </Link>
          <Link href="/tools">
            <div className={`font-medium px-4 py-2 rounded-full mx-1 text-sm ${location === "/tools" 
              ? "bg-amber-600 text-white shadow-sm" 
              : "text-neutral-700 hover:bg-amber-100"} transition-all duration-200 cursor-pointer`}>
              Teacher Tools
            </div>
          </Link>
          <Link href="/video-resources">
            <div className={`font-medium px-4 py-2 rounded-full mx-1 text-sm ${location === "/video-resources" 
              ? "bg-amber-600 text-white shadow-sm" 
              : "text-neutral-700 hover:bg-amber-100"} transition-all duration-200 cursor-pointer`}>
              Video Library
            </div>
          </Link>
          {/* Games section hidden until more games are available
          <Link href="/games">
            <div className={`font-medium px-4 py-2 rounded-full mx-1 text-sm ${location === "/games" 
              ? "bg-amber-600 text-white shadow-sm" 
              : "text-neutral-700 hover:bg-amber-100"} transition-all duration-200 cursor-pointer`}>
              Games
            </div>
          </Link>
          */}
        </nav>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            {/* Beary AI Assistant */}
            <div className="relative group">
              <button 
                className="relative text-neutral-800 hover:text-primary transition flex items-center justify-center"
                onClick={() => setLocation("/beary-ai")}
              >
                <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center hover:bg-amber-200 transition-colors">
                  <span role="img" aria-label="bear" className="text-sm">🐻</span>
                </div>
              </button>
              <div className="absolute top-full right-0 mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ease-in-out">
                <div className="bg-white shadow-lg rounded-md p-2 whitespace-nowrap text-xs font-semibold border border-amber-200">
                  Ask me anything! <span className="text-amber-500">📚</span>
                </div>
                <div className="absolute top-0 right-3 -mt-2 w-3 h-3 bg-white border-t border-l border-amber-200 transform rotate-45"></div>
              </div>
            </div>
            
            {/* Owner Dashboard Link */}
            <button 
              className="hidden md:flex items-center px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
              onClick={() => setLocation("/owner-dashboard")}
            >
              <i className="ri-building-line mr-1"></i>
              Owner Portal
            </button>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="relative cursor-pointer">
                <Avatar>
                  <AvatarImage src={user?.profilePicture ? user.profilePicture : ""} alt={user?.firstName || ""} />
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer" onClick={() => setLocation("/profile")}>
                <i className="ri-user-line mr-2"></i>
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer" onClick={() => setLocation("/settings")}>
                <i className="ri-settings-line mr-2"></i>
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer" onClick={() => setLocation("/settings/owner-dashboard")}>
                <i className="ri-building-line mr-2"></i>
                Owner Dashboard
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer" onClick={() => setLocation("/admin")}>
                <i className="ri-shield-keyhole-line mr-2"></i>
                Admin Access
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer" onClick={handleLogout}>
                <i className="ri-logout-box-line mr-2"></i>
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <button 
            className="md:hidden text-neutral-800 hover:text-primary transition"
            onClick={toggleMobileMenu}
          >
            <i className={`${isMobileMenuOpen ? "ri-close-line" : "ri-menu-line"} text-2xl`}></i>
          </button>
        </div>
      </div>
      
      {/* Mobile navigation */}
      {isMobileMenuOpen && (
        <div className="bg-amber-50 py-4 px-4 md:hidden shadow-inner">
          <nav className="flex flex-col space-y-2">
            <Link href="/">
              <div className={`py-2 px-4 rounded-md ${location === "/" 
                ? "bg-amber-600 text-white font-medium shadow-sm" 
                : "text-neutral-700 hover:bg-amber-100"} cursor-pointer transition-colors`}>
                Dashboard
              </div>
            </Link>
            <Link href="/progression-map">
              <div className={`py-2 px-4 rounded-md ${location === "/progression-map" 
                ? "bg-amber-600 text-white font-medium shadow-sm" 
                : "text-neutral-700 hover:bg-amber-100"} cursor-pointer transition-colors`}>
                Teacher Progression
              </div>
            </Link>
            <Link href="/assessment">
              <div className={`py-2 px-4 rounded-md ${location === "/assessment" 
                ? "bg-amber-600 text-white font-medium shadow-sm" 
                : "text-neutral-700 hover:bg-amber-100"} cursor-pointer transition-colors`}>
                Assessment
              </div>
            </Link>
            <Link href="/tools">
              <div className={`py-2 px-4 rounded-md ${location === "/tools" 
                ? "bg-amber-600 text-white font-medium shadow-sm" 
                : "text-neutral-700 hover:bg-amber-100"} cursor-pointer transition-colors`}>
                Teacher Tools
              </div>
            </Link>
            <Link href="/video-resources">
              <div className={`py-2 px-4 rounded-md ${location === "/video-resources" 
                ? "bg-amber-600 text-white font-medium shadow-sm" 
                : "text-neutral-700 hover:bg-amber-100"} cursor-pointer transition-colors`}>
                Video Library
              </div>
            </Link>
            {/* Games section hidden until more games are available
            <Link href="/games">
              <div className={`py-2 px-4 rounded-md ${location === "/games" 
                ? "bg-amber-600 text-white font-medium shadow-sm" 
                : "text-neutral-700 hover:bg-amber-100"} cursor-pointer transition-colors`}>
                Games
              </div>
            </Link>
            */}
            <div className="pt-3 mt-2 border-t border-amber-200">
              <Button variant="ghost" className="w-full justify-start mb-2 hover:bg-amber-200 hover:text-amber-900" onClick={() => setLocation("/admin")}>
                <i className="ri-shield-keyhole-line mr-2"></i>
                Admin Access
              </Button>
              <Button variant="ghost" className="w-full justify-start hover:bg-amber-200 hover:text-amber-900" onClick={handleLogout}>
                <i className="ri-logout-box-line mr-2"></i>
                Logout
              </Button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
