import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { 
  Home, 
  Briefcase, 
  Award, 
  Video, 
  Music, 
  Map, 
  BarChart,
  Star,
  Building2,
  UserCircle,
  Sparkles,
  Users,
  Mail
} from "lucide-react";

interface NavigationItem {
  name: string;
  icon: React.ReactNode;
  path: string;
  badge?: string | number;
  highlight?: boolean;
}

export default function GameNavigation() {
  const [location, setLocation] = useLocation();
  const [showSparkle, setShowSparkle] = useState<number | null>(null);
  const { isOwner, isSchoolAdmin, isAdmin } = useAuth();
  
  // Define main navigation items
  const navigationItems: NavigationItem[] = [
    { 
      name: "Home", 
      icon: <Home className="h-5 w-5" />, 
      path: "/dashboard",
    },
    { 
      name: "Training", 
      icon: <Briefcase className="h-5 w-5" />, 
      path: "/modules", 
      badge: "New",
      highlight: true
    },
    { 
      name: "Challenges", 
      icon: <Award className="h-5 w-5" />, 
      path: "/ultimate-escalator", 
    },
    { 
      name: "Videos", 
      icon: <Video className="h-5 w-5" />, 
      path: "/video-resources", 
    },
    { 
      name: "Music", 
      icon: <Music className="h-5 w-5" />, 
      path: "/classroom-music", 
    },
    { 
      name: "Progress Map", 
      icon: <Map className="h-5 w-5" />, 
      path: "/progression-map", 
    },
    { 
      name: "Assessment", 
      icon: <BarChart className="h-5 w-5" />, 
      path: "/assessment", 
    },
    { 
      name: "Avatar", 
      icon: <UserCircle className="h-5 w-5" />, 
      path: "/avatar-customization", 
      badge: "New",
      highlight: true
    },
    { 
      name: "Owner", 
      icon: <Building2 className="h-5 w-5" />, 
      path: "/owner-dashboard", 
    }
  ];
  
  // When a menu item is clicked, show sparkle animation
  const handleNavClick = (index: number, path: string) => {
    setShowSparkle(index);
    setLocation(path);
  };
  
  // Reset sparkle effect after animation completes
  useEffect(() => {
    if (showSparkle !== null) {
      const timer = setTimeout(() => {
        setShowSparkle(null);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [showSparkle]);

  return (
    <Card className="py-3 px-2 rounded-2xl border-amber-200 sticky top-4">
      <div className="grid grid-cols-4 gap-2 sm:grid-cols-2 md:grid-cols-1">
        {navigationItems.map((item, index) => (
          <div key={item.name} className="relative">
            {item.highlight && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full z-10 animate-ping" />
            )}
            <Button
              variant={location === item.path ? "default" : "ghost"}
              className={`w-full justify-start p-2 ${location === item.path ? 'bg-amber-500 hover:bg-amber-600' : 'hover:bg-amber-100'}`}
              onClick={() => handleNavClick(index, item.path)}
            >
              <div className="relative flex items-center w-full">
                <div className={`${location === item.path ? "text-white" : "text-amber-800"} mr-2`}>
                  {item.icon}
                </div>
                <span className={`${location === item.path ? "text-white" : "text-gray-800"} hidden md:inline-block`}>
                  {item.name}
                </span>
                {showSparkle === index && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <Sparkles className="h-5 w-5 text-amber-300 animate-ping" />
                  </div>
                )}
                {item.badge && (
                  <span className="ml-auto bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full hidden md:block">
                    {item.badge}
                  </span>
                )}
              </div>
            </Button>
          </div>
        ))}
      </div>
    </Card>
  );
}