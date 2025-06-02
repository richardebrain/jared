import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import type { User } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth-context";
import raisingArizonaLogo from "@assets/raising-arizona-logo.jpg";
// Import the MentorMe logo using the correct asset path
import mentormeLogo from "@assets/221033113.png";

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
import { Badge } from "@/components/ui/badge";
import { Bell, MessageSquare } from "lucide-react";

export default function Header() {
  // return <>hello</>
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  // const { isOwner, isAdmin, isSchoolAdmin } = useAuth();
  
  const { data: user } = useQuery<User>({
    queryKey: ["/api/auth/me"]
  });
  const isAdmin = user?.isAdmin || false;
  const isSchoolAdmin = user?.isSchoolAdmin || false;
  const isOwner = user?.isOwner || false;

  // Fetch unread messages count for notification badge
  const { data: unreadMessages } = useQuery({
    queryKey: ["/api/director-messages"],
    enabled: !!user,
    refetchInterval: 30000, // Check for new messages every 30 seconds
  });

  const unreadCount = Array.isArray(unreadMessages) 
    ? unreadMessages.filter((msg: any) => !msg.isRead).length 
    : 0;
  
  console.log(isAdmin,isSchoolAdmin,isOwner,'isAdmin,isSchoolAdmin,isOwner from header')
  console.log(user,'user from header')
  const performLogout = async () => {
    console.log("Starting logout process...");
    
    // Immediately clear all client-side data
    localStorage.clear();
    sessionStorage.clear();
    queryClient.clear();
    
    try {
      // Call server endpoints to clear session
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
      await fetch("/api/auth/clear-session", { method: "GET", credentials: "include" });
      console.log("Server logout completed");
    } catch (error) {
      console.error("Server logout error:", error);
    }
    
    // Show success message
    toast({
      title: "Logged out",
      description: "Redirecting to login page...",
    });
    
    // Force complete navigation to login page
    setTimeout(() => {
      window.location.replace("/login");
    }, 500);
  };

  const handleLogout = () => {
    performLogout();
  };
  
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };
  
  const userInitials = user && user.firstName && user.lastName
    ? `${user.firstName.charAt(0)}${user.lastName.charAt(0)}` 
    : "U";
  
  return (
    <header className="sticky top-0 bg-white shadow-md z-50">
      <div className="max-w-7xl mx-auto px-3 py-2.5 flex justify-between items-center">
        <div className="flex items-center">
          <Link href="/">
            <div className="flex items-center">
              <img src={raisingArizonaLogo} alt="Raising Arizona Preschool" className="h-12 mr-2 rounded-md" />
              <img src={mentormeLogo} alt="MentorMe" className="h-12 rounded-md" />
            </div>
          </Link>
        </div>
        
        <nav className="hidden md:flex items-center bg-amber-50 rounded-full px-2 shadow-inner max-w-[600px] overflow-x-auto">
          <Link href="/">
            <div className={`whitespace-nowrap font-medium px-3.5 py-1.5 rounded-full mx-1 text-sm ${location === "/" 
              ? "bg-amber-600 text-white shadow-sm" 
              : "text-neutral-700 hover:bg-amber-100"} transition-all duration-200 cursor-pointer`}>
              Dashboard
            </div>
          </Link>
          <Link href="/progression-map">
            <div className={`whitespace-nowrap font-medium px-3.5 py-1.5 rounded-full mx-1 text-sm ${location === "/progression-map" 
              ? "bg-amber-600 text-white shadow-sm" 
              : "text-neutral-700 hover:bg-amber-100"} transition-all duration-200 cursor-pointer`}>
              Progression
            </div>
          </Link>
          <Link href="/assessment">
            <div className={`whitespace-nowrap font-medium px-3.5 py-1.5 rounded-full mx-1 text-sm ${location === "/assessment" 
              ? "bg-amber-600 text-white shadow-sm" 
              : "text-neutral-700 hover:bg-amber-100"} transition-all duration-200 cursor-pointer`}>
              Assessment
            </div>
          </Link>
          <Link to="/tools">
            <div className={`whitespace-nowrap font-medium px-3.5 py-1.5 rounded-full mx-1 text-sm ${location === "/tools" 
              ? "bg-amber-600 text-white shadow-sm" 
              : "text-neutral-700 hover:bg-amber-100"} transition-all duration-200 cursor-pointer`}>
              Tools
            </div>
          </Link>
          <Link to="/video-resources">
            <div className={`whitespace-nowrap font-medium px-3.5 py-1.5 rounded-full mx-1 text-sm ${location === "/video-resources" 
              ? "bg-amber-600 text-white shadow-sm" 
              : "text-neutral-700 hover:bg-amber-100"} transition-all duration-200 cursor-pointer`}>
              Videos
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
            {/* Notification Bell */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="relative p-2">
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <Badge 
                      className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs bg-red-500 text-white"
                    >
                      {unreadCount}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel className="flex items-center">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Messages from Leadership
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {Array.isArray(unreadMessages) && unreadMessages.length > 0 ? (
                  unreadMessages.slice(0, 5).map((message: any, index: number) => (
                    <DropdownMenuItem 
                      key={index} 
                      className="flex-col items-start p-3 cursor-pointer"
                      onClick={async () => {
                        // Mark message as read
                        try {
                          await apiRequest(`/api/director-messages/${message.id}/mark-read`, {
                            method: "POST"
                          });
                          // Refresh messages
                          queryClient.invalidateQueries({ queryKey: ["/api/director-messages"] });
                        } catch (error) {
                          console.error("Error marking message as read:", error);
                        }
                      }}
                    >
                      <div className="flex items-center w-full">
                        <div className="font-medium text-sm flex-1">{message.title}</div>
                        {!message.isRead && (
                          <div className="w-2 h-2 bg-red-500 rounded-full ml-2"></div>
                        )}
                      </div>
                      <div className="text-xs text-gray-600 mt-1 line-clamp-2">
                        {message.content}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        From: {message.senderName} • {new Date(message.createdAt).toLocaleDateString()}
                      </div>
                    </DropdownMenuItem>
                  ))
                ) : (
                  <DropdownMenuItem disabled>
                    <div className="text-sm text-gray-500">No new messages</div>
                  </DropdownMenuItem>
                )}
                {Array.isArray(unreadMessages) && unreadMessages.length > 5 && (
                  <DropdownMenuItem className="text-center text-sm text-blue-600">
                    View all messages
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

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
              {/* Temporarily disabled avatar link to prevent logout issues */}
              <DropdownMenuItem className="cursor-pointer opacity-50" onClick={() => toast({
                title: "Feature Update in Progress",
                description: "The avatar feature is being enhanced. Please check back soon!",
                duration: 3000
              })}>
                <i className="ri-user-smile-line mr-2"></i>
                My Avatar (Coming Soon)
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer" onClick={() => setLocation("/settings")}>
                <i className="ri-settings-line mr-2"></i>
                Settings
              </DropdownMenuItem>
              
              {isOwner && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="cursor-pointer" onClick={() => setLocation("/admin")}>
                    <i className="ri-admin-line mr-2"></i>
                    System Administrator
                  </DropdownMenuItem>
                </>
              )}
              
              {isAdmin && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="cursor-pointer" onClick={() => setLocation("/settings/owner-dashboard")}>
                    <i className="ri-building-line mr-2"></i>
                    School Management
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer" onClick={() => setLocation("/app-owner-dashboard")}>
                    <i className="ri-shield-keyhole-line mr-2"></i>
                    System Administration
                  </DropdownMenuItem>
                </>
              )}
              
              {isSchoolAdmin && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="cursor-pointer" onClick={() => setLocation("/director-toolkit")}>
                    <i className="ri-tools-line mr-2"></i>
                    Director Toolkit
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer" onClick={() => setLocation("/module-creator")}>
                    <i className="ri-add-box-line mr-2"></i>
                    Module Creator
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer" onClick={() => setLocation("/director-messages")}>
                    <i className="ri-message-line mr-2"></i>
                    Director Messages
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer" onClick={() => setLocation(`/schools/${user?.schoolId}`)}>
                    <i className="ri-school-line mr-2"></i>
                    Director/Admin Panel
                  </DropdownMenuItem>
                </>
              )}
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
            <Link to="/tools">
              <div className={`py-2 px-4 rounded-md ${location === "/tools" 
                ? "bg-amber-600 text-white font-medium shadow-sm" 
                : "text-neutral-700 hover:bg-amber-100"} cursor-pointer transition-colors`}>
                Teacher Tools
              </div>
            </Link>
            <Link to="/video-resources">
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
              <Button variant="ghost" className="w-full justify-start mb-2 hover:bg-amber-200 hover:text-amber-900 opacity-50" onClick={() => toast({
                title: "Feature Update in Progress",
                description: "The avatar feature is being enhanced. Please check back soon!",
                duration: 3000
              })}>
                <i className="ri-user-smile-line mr-2"></i>
                My Avatar (Coming Soon)
              </Button>
              
              {isOwner && user?.username === "jlcookie20" && (
                <Button variant="ghost" className="w-full justify-start mb-2 hover:bg-amber-200 hover:text-amber-900" onClick={() => setLocation("/admin")}>
                  <i className="ri-admin-line mr-2"></i>
                  System Administrator
                </Button>
              )}
              
              {isAdmin && (
                <Button variant="ghost" className="w-full justify-start mb-2 hover:bg-amber-200 hover:text-amber-900" onClick={() => setLocation("/app-owner-dashboard")}>
                  <i className="ri-shield-keyhole-line mr-2"></i>
                  System Administration
                </Button>
              )}
              
              {isSchoolAdmin && (
                <>
                  <Button variant="ghost" className="w-full justify-start mb-2 hover:bg-amber-200 hover:text-amber-900" onClick={() => setLocation("/director-toolkit")}>
                    <i className="ri-tools-line mr-2"></i>
                    Director Toolkit
                  </Button>
                  <Button variant="ghost" className="w-full justify-start mb-2 hover:bg-amber-200 hover:text-amber-900" onClick={() => setLocation(`/schools/${user?.schoolId}`)}>
                    <i className="ri-school-line mr-2"></i>
                    Director/Admin Panel
                  </Button>
                </>
              )}
              
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
