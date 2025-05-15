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
              <img src={raisingArizonaLogo} alt="Raising Arizona Preschool" className="h-14 mr-3" />
              <div>
                <div className="text-xl md:text-2xl font-bold text-[#532A18]">MentorMe</div>
                <div className="text-xs text-[#532A18]">Raising Arizona Teacher Training</div>
              </div>
            </div>
          </Link>
        </div>
        
        <nav className="hidden md:flex items-center border-b border-transparent">
          <Link href="/">
            <div className={`font-heading font-semibold px-4 py-2 ${location === "/" 
              ? "text-primary border-b-2 border-primary" 
              : "text-neutral-800 hover:text-primary"} transition cursor-pointer`}>
              Dashboard
            </div>
          </Link>
          <Link href="/progression-map">
            <div className={`font-heading font-semibold px-4 py-2 ${location === "/progression-map" 
              ? "text-primary border-b-2 border-primary" 
              : "text-neutral-800 hover:text-primary"} transition cursor-pointer`}>
              Teacher Progression
            </div>
          </Link>
          <Link href="/assessment">
            <div className={`font-heading font-semibold px-4 py-2 ${location === "/assessment" 
              ? "text-primary border-b-2 border-primary" 
              : "text-neutral-800 hover:text-primary"} transition cursor-pointer`}>
              Assessment
            </div>
          </Link>
          <Link href="/tools">
            <div className={`font-heading font-semibold px-4 py-2 ${location === "/tools" 
              ? "text-primary border-b-2 border-primary" 
              : "text-neutral-800 hover:text-primary"} transition cursor-pointer`}>
              Teacher Tools
            </div>
          </Link>
          <Link href="/video-resources">
            <div className={`font-heading font-semibold px-4 py-2 ${location === "/video-resources" 
              ? "text-primary border-b-2 border-primary" 
              : "text-neutral-800 hover:text-primary"} transition cursor-pointer`}>
              Video Library
            </div>
          </Link>
          {/* Games section hidden until more games are available
          <Link href="/games">
            <div className={`font-heading font-semibold px-4 py-2 ${location === "/games" 
              ? "text-primary border-b-2 border-primary" 
              : "text-neutral-800 hover:text-primary"} transition cursor-pointer`}>
              Games
            </div>
          </Link>
          */}
        </nav>
        
        <div className="flex items-center space-x-4">
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
        <div className="bg-white py-3 px-4 md:hidden">
          <nav className="flex flex-col space-y-3">
            <Link href="/">
              <div className={`font-heading font-semibold ${location === "/" ? "text-primary" : "text-neutral-800"} cursor-pointer`}>
                Dashboard
              </div>
            </Link>
            <Link href="/progression-map">
              <div className={`font-heading font-semibold ${location === "/progression-map" ? "text-primary" : "text-neutral-800"} cursor-pointer`}>
                Teacher Progression
              </div>
            </Link>
            <Link href="/assessment">
              <div className={`font-heading font-semibold ${location === "/assessment" ? "text-primary" : "text-neutral-800"} cursor-pointer`}>
                Assessment
              </div>
            </Link>
            <Link href="/tools">
              <div className={`font-heading font-semibold ${location === "/tools" ? "text-primary" : "text-neutral-800"} cursor-pointer`}>
                Teacher Tools
              </div>
            </Link>
            <Link href="/video-resources">
              <div className={`font-heading font-semibold ${location === "/video-resources" ? "text-primary" : "text-neutral-800"} cursor-pointer`}>
                Video Library
              </div>
            </Link>
            {/* Games section hidden until more games are available
            <Link href="/games">
              <div className={`font-heading font-semibold ${location === "/games" ? "text-primary" : "text-neutral-800"} cursor-pointer`}>
                Games
              </div>
            </Link>
            */}
            <div className="pt-2 border-t border-neutral-100">
              <Button variant="outline" className="w-full justify-start mb-2" onClick={() => setLocation("/admin")}>
                <i className="ri-shield-keyhole-line mr-2"></i>
                Admin Access
              </Button>
              <Button variant="outline" className="w-full justify-start" onClick={handleLogout}>
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
