import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { User } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

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
      const response = await apiRequest("POST", "/api/auth/logout", {});
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
    <header className="sticky top-0 bg-white shadow-md z-50">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex items-center">
          <Link href="/">
            <div className="text-3xl font-accent text-primary mr-2 cursor-pointer">LinguaMeet</div>
          </Link>
          <div className="hidden md:block text-sm text-neutral-800">Language Learning</div>
        </div>
        
        <nav className="hidden md:flex space-x-6 items-center">
          <Link href="/">
            <a className={`font-heading font-semibold ${location === "/" ? "text-primary" : "text-neutral-800 hover:text-primary"} transition`}>
              Dashboard
            </a>
          </Link>
          <Link href="/schedule">
            <a className={`font-heading font-semibold ${location === "/schedule" ? "text-primary" : "text-neutral-800 hover:text-primary"} transition`}>
              Schedule
            </a>
          </Link>
          <Link href="/assessment">
            <a className={`font-heading font-semibold ${location === "/assessment" ? "text-primary" : "text-neutral-800 hover:text-primary"} transition`}>
              Assessment
            </a>
          </Link>
        </nav>
        
        <div className="flex items-center space-x-4">
          <button className="relative text-neutral-800 hover:text-primary transition">
            <i className="ri-notification-3-line text-xl"></i>
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-destructive rounded-full flex items-center justify-center">
              <span className="text-white text-xs">3</span>
            </div>
          </button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="relative cursor-pointer">
                <Avatar>
                  <AvatarImage src={user?.profilePicture} alt={user?.firstName} />
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
              <a className={`font-heading font-semibold ${location === "/" ? "text-primary" : "text-neutral-800"}`}>
                Dashboard
              </a>
            </Link>
            <Link href="/schedule">
              <a className={`font-heading font-semibold ${location === "/schedule" ? "text-primary" : "text-neutral-800"}`}>
                Schedule
              </a>
            </Link>
            <Link href="/assessment">
              <a className={`font-heading font-semibold ${location === "/assessment" ? "text-primary" : "text-neutral-800"}`}>
                Assessment
              </a>
            </Link>
            <div className="pt-2 border-t border-neutral-100">
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
