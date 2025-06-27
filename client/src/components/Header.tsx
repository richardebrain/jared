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
import { Bell, MessageSquare, AlertCircle, X } from "lucide-react";

// Assessment Navigation Button Component
function AssessmentNavButton({ location }: { location: string }) {
  const handleAssessmentClick = () => {
    // Direct navigation to initial assessment page
    window.location.href = '/initial-assessment';
  };

  const isActive = location === "/initial-assessment" || location === "/assessment/results";

  return (
    <div 
      onClick={handleAssessmentClick}
      className={`whitespace-nowrap font-medium px-3.5 py-1.5 rounded-full mx-1 text-sm ${isActive
        ? "bg-amber-600 text-white shadow-sm" 
        : "text-neutral-700 hover:bg-amber-100"} transition-all duration-200 cursor-pointer`}
    >
      Assessment
    </div>
  );
}

// Mobile Assessment Navigation Button Component
function MobileAssessmentNavButton({ location }: { location: string }) {
  const handleAssessmentClick = () => {
    // Direct navigation to initial assessment page
    window.location.href = '/initial-assessment';
  };

  const isActive = location === "/initial-assessment" || location === "/assessment/results";

  return (
    <div 
      onClick={handleAssessmentClick}
      className={`py-2 px-4 rounded-md ${isActive
        ? "bg-amber-600 text-white font-medium shadow-sm" 
        : "text-neutral-700 hover:bg-amber-100"} cursor-pointer transition-colors`}
    >
      Assessment
    </div>
  );
}

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

  // Fetch unread messages count for notification badge - reduced frequency
  const { data: unreadMessages } = useQuery({
    queryKey: ["/api/director-messages"],
    enabled: !!user && (isAdmin || isSchoolAdmin || isOwner),
    refetchInterval: 2 * 60 * 1000, // Check every 2 minutes instead of 30 seconds
    staleTime: 90 * 1000, // Cache for 90 seconds
  });

  // Fetch credential expiration notifications - reduced frequency
  const { data: credentialAlerts } = useQuery({
    queryKey: ["/api/credential-alerts"],
    enabled: !!user && (isAdmin || isSchoolAdmin || isOwner),
    refetchInterval: 5 * 60 * 1000, // Check every 5 minutes instead of 1 minute
    staleTime: 3 * 60 * 1000, // Cache for 3 minutes
  });

  const messageCount = Array.isArray(unreadMessages) 
    ? unreadMessages.filter((msg: any) => !msg.isRead).length 
    : 0;

  const credentialCount = Array.isArray(credentialAlerts) 
    ? credentialAlerts.filter((alert: any) => !alert.dismissed).length 
    : 0;

  const totalNotifications = messageCount + credentialCount;
  
  console.log(isAdmin,isSchoolAdmin,isOwner,'isAdmin,isSchoolAdmin,isOwner from header')
  console.log(user,'user from header')
  const performLogout = async () => {
    console.log("Starting force logout process...");
    
    // Immediately clear all client-side data
    try {
      localStorage.clear();
      sessionStorage.clear();
      
      // Clear all cookies by setting them to expire
      document.cookie.split(";").forEach(cookie => {
        const eqPos = cookie.indexOf("=");
        const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
        document.cookie = `${name.trim()}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
      });
      
      queryClient.clear();
    } catch (error) {
      console.warn("Client data clear error:", error);
    }
    
    try {
      // Clear server sessions
      await fetch("/api/auth/clear-all-sessions", { method: "POST", credentials: "include" });
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
      console.log("Server logout completed");
    } catch (error) {
      console.warn("Server logout error (continuing anyway):", error);
    }
    
    // Show success message
    toast({
      title: "Logged out",
      description: "Session cleared, redirecting to login...",
    });
    
    // Force complete navigation to login page
    setTimeout(() => {
      window.location.href = "/login";
    }, 500);
  };

  const handleLogout = () => {
    performLogout();
  };
  
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // Message dismissal mutation
  const dismissMessageMutation = useMutation({
    mutationFn: async (messageId: number) => {
      const response = await apiRequest(`/api/director-messages/${messageId}/mark-read`, {
        method: "POST",
      });
      return response.data;
    },
    onSuccess: () => {
      // Force immediate query refetch to update UI
      queryClient.invalidateQueries({ queryKey: ["/api/director-messages"] });
      queryClient.refetchQueries({ queryKey: ["/api/director-messages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      toast({
        title: "Message dismissed",
        description: "The message has been marked as read.",
      });
    },
    onError: (error) => {
      console.error("Error dismissing message:", error);
      toast({
        title: "Error",
        description: "Failed to dismiss message. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleDismissMessage = (messageId: number) => {
    dismissMessageMutation.mutate(messageId);
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
          
          {/* Beary AI button - visible on mobile after logos */}
          <div className="md:hidden ml-4">
            <Button 
              onClick={() => setLocation('/ai-tools')}
              className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white px-3 py-1.5 rounded-full text-sm font-medium shadow-md transition-all duration-200"
            >
              <i className="ri-robot-line mr-1"></i>
              Beary AI
            </Button>
          </div>
        </div>

        {/* Mobile hamburger menu button - prominently placed */}
        <button 
          className="md:hidden text-neutral-800 hover:text-amber-600 transition p-3 rounded-lg bg-amber-50 border border-amber-200 shadow-sm"
          onClick={toggleMobileMenu}
          aria-label="Toggle mobile menu"
        >
          <i className={`${isMobileMenuOpen ? "ri-close-line" : "ri-menu-line"} text-2xl`}></i>
        </button>
        
        {/* Desktop navigation - hidden on mobile */}
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
          <AssessmentNavButton location={location} />
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
        
        {/* Desktop user menu - hidden on mobile */}
        <div className="hidden md:flex items-center space-x-2 md:space-x-4">
          <div className="flex items-center space-x-1 md:space-x-2">
            {/* Notification Bell - hidden on small mobile, visible on larger screens */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="relative p-1 md:p-2 hidden sm:flex">
                  <Bell className="h-4 w-4 md:h-5 md:w-5" />
                  {totalNotifications > 0 && (
                    <Badge 
                      className="absolute -top-1 -right-1 h-4 w-4 md:h-5 md:w-5 rounded-full p-0 flex items-center justify-center text-xs bg-red-500 text-white"
                    >
                      {totalNotifications}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80 max-h-96 overflow-y-auto">
                {/* Credential Alerts Section */}
                {Array.isArray(credentialAlerts) && credentialAlerts.length > 0 && (
                  <>
                    <DropdownMenuLabel className="flex items-center">
                      <AlertCircle className="h-4 w-4 mr-2 text-orange-500" />
                      Credential Expiration Alerts
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {credentialAlerts.filter((alert: any) => !alert.dismissed).slice(0, 3).map((alert: any, index: number) => (
                      <DropdownMenuItem 
                        key={`alert-${index}`} 
                        className="flex-col items-start p-3"
                      >
                        <div className="flex items-center w-full">
                          <div className={`font-medium text-sm flex-1 ${
                            alert.daysUntilExpiration <= 1 
                              ? 'text-red-700' 
                              : alert.daysUntilExpiration <= 15 
                                ? 'text-orange-700' 
                                : 'text-yellow-700'
                          }`}>
                            {alert.credentialType} expires {alert.daysUntilExpiration === 0 ? 'today' : `in ${alert.daysUntilExpiration} days`}
                          </div>
                          <div className={`w-2 h-2 rounded-full ml-2 ${
                            alert.daysUntilExpiration <= 1 
                              ? 'bg-red-500' 
                              : alert.daysUntilExpiration <= 15 
                                ? 'bg-orange-500' 
                                : 'bg-yellow-500'
                          }`}></div>
                        </div>
                        <div className="text-xs text-gray-600 mt-1">
                          Expiration: {new Date(alert.expirationDate).toLocaleDateString()}
                        </div>
                        <div className="flex gap-2 mt-2">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="text-xs h-6"
                            onClick={async () => {
                              try {
                                await apiRequest(`/api/credential-alerts/${alert.id}/dismiss`, {
                                  method: "POST"
                                });
                                queryClient.invalidateQueries({ queryKey: ["/api/credential-alerts"] });
                              } catch (error) {
                                console.error("Error dismissing alert:", error);
                              }
                            }}
                          >
                            Dismiss
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="text-xs h-6"
                            onClick={async () => {
                              try {
                                await apiRequest(`/api/credential-alerts/${alert.id}/remind`, {
                                  method: "POST"
                                });
                                queryClient.invalidateQueries({ queryKey: ["/api/credential-alerts"] });
                                toast({
                                  title: "Reminder Set",
                                  description: "You'll be reminded again tomorrow about this credential.",
                                  duration: 3000
                                });
                              } catch (error) {
                                console.error("Error setting reminder:", error);
                              }
                            }}
                          >
                            Remind Tomorrow
                          </Button>
                        </div>
                      </DropdownMenuItem>
                    ))}
                    {credentialCount > 3 && (
                      <DropdownMenuItem className="text-center text-sm text-orange-600">
                        {credentialCount - 3} more credential alerts
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                  </>
                )}

                {/* Messages Section */}
                <DropdownMenuLabel className="flex items-center">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Messages from Leadership
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {Array.isArray(unreadMessages) && unreadMessages.filter((msg: any) => !msg.isRead).length > 0 ? (
                  unreadMessages.filter((msg: any) => !msg.isRead).slice(0, 5).map((message: any, index: number) => (
                    <div 
                      key={`message-${message.id}`} 
                      className="p-3 min-h-[80px] max-w-[320px] border-b border-gray-100 last:border-b-0 hover:bg-gray-50"
                    >
                      <div className="flex items-start justify-between w-full mb-2">
                        <div className="font-medium text-sm flex-1 pr-2 leading-tight">
                          {message.title}
                        </div>
                        <div className="flex items-center space-x-1 flex-shrink-0">
                          {!message.isRead && (
                            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                          )}
                          <button
                            className="p-1 hover:bg-gray-200 rounded-full transition-colors"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleDismissMessage(message.id);
                            }}
                          >
                            <X className="h-3 w-3 text-gray-400 hover:text-gray-600" />
                          </button>
                        </div>
                      </div>
                      <div className="text-xs text-gray-600 mb-2 leading-relaxed max-h-[36px] overflow-hidden">
                        {message.content.length > 100 
                          ? `${message.content.substring(0, 100)}...` 
                          : message.content
                        }
                      </div>
                      <div className="text-xs text-gray-400">
                        From: {message.senderName} • {new Date(message.createdAt).toLocaleDateString()}
                      </div>
                    </div>
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
            <MobileAssessmentNavButton location={location} />
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
