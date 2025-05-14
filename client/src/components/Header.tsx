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
      const response = await apiRequest("/api/auth/logout", { method: "POST" });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });
      setLocation("/");
    },
    onError: (error: Error) => {
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
    <header className="sticky top-0 bg-white shadow-md z-50 border-b-4 border-amber-400">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex items-center">
          <Link href="/">
            <div className="flex items-center">
              <img src={raisingArizonaLogo} alt="Raising Arizona Preschool" className="h-16 mr-3 shadow-md rounded-md" />
              <div>
                <div className="text-xl md:text-2xl font-bold text-[#532A18] font-['Bubblegum_Sans']">MentorMe</div>
                <div className="text-xs text-[#532A18]">Raising Arizona Teacher Training</div>
              </div>
            </div>
          </Link>
        </div>
        
        <nav className="hidden md:flex items-center border-b border-transparent">
          <Link href="/">
            <div className={`font-['Bubblegum_Sans'] px-4 py-2 text-lg rounded-lg mx-1 ${location === "/" 
              ? "bg-amber-500 text-white shadow-md border border-amber-600" 
              : "text-neutral-800 hover:bg-amber-100"} transition cursor-pointer`}>
              Dashboard
            </div>
          </Link>
          <Link href="/progression-map">
            <div className={`font-['Bubblegum_Sans'] px-4 py-2 text-lg rounded-lg mx-1 ${location === "/progression-map" 
              ? "bg-green-600 text-white shadow-md border border-green-700" 
              : "text-neutral-800 hover:bg-green-100"} transition cursor-pointer`}>
              Teacher Progression
            </div>
          </Link>
          <Link href="/assessment">
            <div className={`font-['Bubblegum_Sans'] px-4 py-2 text-lg rounded-lg mx-1 ${location === "/assessment" 
              ? "bg-blue-600 text-white shadow-md border border-blue-700" 
              : "text-neutral-800 hover:bg-blue-100"} transition cursor-pointer`}>
              Assessment
            </div>
          </Link>
          <Link href="/tools">
            <div className={`font-['Bubblegum_Sans'] px-4 py-2 text-lg rounded-lg mx-1 ${location === "/tools" 
              ? "bg-purple-600 text-white shadow-md border border-purple-700" 
              : "text-neutral-800 hover:bg-purple-100"} transition cursor-pointer`}>
              Teacher Tools
            </div>
          </Link>
          <Link href="/video-resources">
            <div className={`font-['Bubblegum_Sans'] px-4 py-2 text-lg rounded-lg mx-1 ${location === "/video-resources" 
              ? "bg-pink-600 text-white shadow-md border border-pink-700" 
              : "text-neutral-800 hover:bg-pink-100"} transition cursor-pointer`}>
              Video Library
            </div>
          </Link>
        </nav>
        
        <div className="flex items-center space-x-4">
          <div className="relative group">
            <button 
              className="relative text-neutral-800 hover:text-primary transition flex items-center justify-center"
              onClick={() => setLocation("/beary-ai")}
            >
              <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center hover:bg-amber-200 transition-colors shadow-sm border-2 border-amber-200">
                <span role="img" aria-label="bear" className="text-xl">🐻</span>
              </div>
            </button>
            <div className="absolute top-full right-0 mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ease-in-out">
              <div className="bg-amber-50 shadow-lg rounded-xl p-2 whitespace-nowrap text-sm font-['Bubblegum_Sans'] border-2 border-amber-200">
                Ask me anything! <span className="text-amber-500">📚</span>
              </div>
              <div className="absolute top-0 right-3 -mt-2 w-3 h-3 bg-amber-50 border-t-2 border-l-2 border-amber-200 transform rotate-45"></div>
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="relative cursor-pointer">
                <Avatar className="border-2 border-sky-200 shadow-sm w-10 h-10">
                  <AvatarImage src={user?.profilePicture ? user.profilePicture : ""} alt={user?.firstName || ""} />
                  <AvatarFallback className="bg-green-100 text-green-800 font-['Bubblegum_Sans']">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-sky-50 border-2 border-sky-200 rounded-xl p-1 font-['Bubblegum_Sans']">
              <DropdownMenuLabel className="text-center text-sky-800 border-b-2 border-sky-200 pb-2">My Profile</DropdownMenuLabel>
              <DropdownMenuItem className="cursor-pointer my-1 rounded-lg hover:bg-sky-100" onClick={() => setLocation("/profile")}>
                <span className="mr-2">👤</span>
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer my-1 rounded-lg hover:bg-sky-100" onClick={() => setLocation("/settings")}>
                <span className="mr-2">⚙️</span>
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-sky-200" />
              <DropdownMenuItem className="cursor-pointer my-1 rounded-lg bg-red-50 hover:bg-red-100 text-red-800" onClick={handleLogout}>
                <span className="mr-2">👋</span>
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <button 
            className="md:hidden text-neutral-800 hover:text-primary transition bg-sky-100 p-2 rounded-full shadow-sm border-2 border-sky-200"
            onClick={toggleMobileMenu}
          >
            <span className="text-xl">{isMobileMenuOpen ? "✕" : "☰"}</span>
          </button>
        </div>
      </div>
      
      {/* Mobile navigation */}
      {isMobileMenuOpen && (
        <div className="bg-white py-3 px-4 md:hidden rounded-b-lg shadow-md border-x border-b border-gray-200">
          <nav className="flex flex-col space-y-3">
            <Link href="/">
              <div className={`font-['Bubblegum_Sans'] text-lg p-2 rounded-lg ${location === "/" 
                ? "bg-amber-500 text-white shadow-md border border-amber-600" 
                : "text-neutral-800 hover:bg-amber-100 border border-gray-200"} cursor-pointer`}>
                🏠 Dashboard
              </div>
            </Link>
            <Link href="/progression-map">
              <div className={`font-['Bubblegum_Sans'] text-lg p-2 rounded-lg ${location === "/progression-map" 
                ? "bg-green-600 text-white shadow-md border border-green-700" 
                : "text-neutral-800 hover:bg-green-100 border border-gray-200"} cursor-pointer`}>
                🌱 Teacher Progression
              </div>
            </Link>
            <Link href="/assessment">
              <div className={`font-['Bubblegum_Sans'] text-lg p-2 rounded-lg ${location === "/assessment" 
                ? "bg-blue-600 text-white shadow-md border border-blue-700" 
                : "text-neutral-800 hover:bg-blue-100 border border-gray-200"} cursor-pointer`}>
                📝 Assessment
              </div>
            </Link>
            <Link href="/tools">
              <div className={`font-['Bubblegum_Sans'] text-lg p-2 rounded-lg ${location === "/tools" 
                ? "bg-purple-600 text-white shadow-md border border-purple-700" 
                : "text-neutral-800 hover:bg-purple-100 border border-gray-200"} cursor-pointer`}>
                🛠️ Teacher Tools
              </div>
            </Link>
            <Link href="/video-resources">
              <div className={`font-['Bubblegum_Sans'] text-lg p-2 rounded-lg ${location === "/video-resources" 
                ? "bg-pink-600 text-white shadow-md border border-pink-700" 
                : "text-neutral-800 hover:bg-pink-100 border border-gray-200"} cursor-pointer`}>
                🎬 Video Library
              </div>
            </Link>
            <div className="pt-2 border-t border-gray-200">
              <Button 
                variant="outline" 
                className="w-full justify-start font-['Bubblegum_Sans'] text-lg bg-red-600 hover:bg-red-700 border-red-700 text-white shadow-md" 
                onClick={handleLogout}
              >
                👋 Logout
              </Button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
