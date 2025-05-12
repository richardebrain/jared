import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { LearningModule } from "@shared/schema";
import { Link } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Search, 
  BookOpen, 
  Brain, 
  GraduationCap, 
  Users, 
  ClipboardList, 
  Heart, 
  MessageSquare, 
  LifeBuoy 
} from "lucide-react";

// Define category info with icons and labels
const categoryInfo = {
  "foundations": { label: "Foundations", icon: BookOpen, color: "bg-primary/10 text-primary" },
  "management": { label: "Classroom Management", icon: Users, color: "bg-secondary/10 text-secondary" },
  "mindful-mornings": { label: "Mindful Mornings", icon: Heart, color: "bg-accent/10 text-accent" },
  "child-development": { label: "Child Development", icon: Brain, color: "bg-purple-100 text-purple-600" },
  "curriculum": { label: "Curriculum", icon: BookOpen, color: "bg-blue-100 text-blue-600" },
  "assessment": { label: "Assessment", icon: ClipboardList, color: "bg-amber-100 text-amber-600" },
  "inclusion": { label: "Inclusion", icon: LifeBuoy, color: "bg-green-100 text-green-600" },
  "family-engagement": { label: "Family Engagement", icon: MessageSquare, color: "bg-pink-100 text-pink-600" },
  "teacher-wellness": { label: "Teacher Wellness", icon: Heart, color: "bg-indigo-100 text-indigo-600" },
};

// Get all unique categories
const allCategories = Object.keys(categoryInfo);

export default function ContentLibrary() {
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filteredModules, setFilteredModules] = useState<LearningModule[]>([]);

  // Fetch all modules
  const { data: modules, isLoading } = useQuery<LearningModule[]>({
    queryKey: ["/api/modules"],
  });

  // Filter modules based on active category and search query
  useEffect(() => {
    if (!modules) return;

    let filtered = modules;

    // Filter by category if not "all"
    if (activeCategory !== "all") {
      filtered = filtered.filter(module => module.category === activeCategory);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(module => 
        module.title.toLowerCase().includes(query) || 
        (module.description && module.description.toLowerCase().includes(query))
      );
    }

    setFilteredModules(filtered);
  }, [modules, activeCategory, searchQuery]);

  // Group modules by category
  const modulesByCategory = filteredModules.reduce((acc, module) => {
    const category = module.category || "other";
    if (!acc[category]) acc[category] = [];
    acc[category].push(module);
    return acc;
  }, {} as Record<string, LearningModule[]>);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-heading font-bold text-primary">Content Library</h2>
          <p className="text-neutral-600">Explore our expanded collection of early childhood education resources</p>
        </div>
        
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
          <Input
            placeholder="Search modules..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <Tabs defaultValue="all" value={activeCategory} onValueChange={setActiveCategory} className="w-full">
        <div className="overflow-x-auto pb-2">
          <TabsList className="w-full justify-start">
            <TabsTrigger value="all" className="flex-shrink-0">
              All Topics
            </TabsTrigger>
            {allCategories.map(category => (
              <TabsTrigger key={category} value={category} className="flex-shrink-0">
                {categoryInfo[category as keyof typeof categoryInfo]?.label || category}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <TabsContent value="all" className="mt-6">
          {isLoading ? (
            <div className="flex justify-center p-8">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="space-y-8">
              {Object.keys(modulesByCategory).map(category => (
                <div key={category} className="space-y-4">
                  <div className="flex items-center">
                    {categoryInfo[category as keyof typeof categoryInfo]?.icon && (
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center mr-3 ${categoryInfo[category as keyof typeof categoryInfo]?.color || "bg-neutral-100"}`}>
                        {React.createElement(categoryInfo[category as keyof typeof categoryInfo]?.icon || BookOpen, { size: 20 })}
                      </div>
                    )}
                    <h3 className="text-lg font-heading font-bold">
                      {categoryInfo[category as keyof typeof categoryInfo]?.label || category}
                    </h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {modulesByCategory[category].map(module => (
                      <ModuleCard key={module.id} module={module} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {allCategories.map(category => (
          <TabsContent key={category} value={category} className="mt-6">
            {isLoading ? (
              <div className="flex justify-center p-8">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {(modulesByCategory[category] || []).map(module => (
                  <ModuleCard key={module.id} module={module} />
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

// Module card component
function ModuleCard({ module }: { module: LearningModule }) {
  const categoryData = categoryInfo[module.category as keyof typeof categoryInfo] || { label: module.category, icon: BookOpen, color: "bg-neutral-100 text-neutral-800" };
  
  return (
    <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all border overflow-hidden flex flex-col h-full">
      {module.featured && (
        <div className="bg-primary/10 p-2 text-xs text-primary font-medium flex justify-center">
          <GraduationCap size={14} className="mr-1" /> Featured Course
        </div>
      )}
      
      <div className="p-5 flex flex-col flex-1">
        <div className="flex justify-between items-start mb-3">
          <Badge variant="outline" className={categoryData.color}>
            {categoryData.label}
          </Badge>
          <span className="text-xs text-neutral-500">{module.duration} min</span>
        </div>
        
        <h3 className="font-heading font-semibold text-lg mb-2">{module.title}</h3>
        <p className="text-neutral-600 text-sm mb-4 flex-1">
          {module.description?.length > 120 
            ? `${module.description.substring(0, 120)}...` 
            : module.description}
        </p>
        
        <div className="mt-auto">
          <div className="flex items-center justify-between">
            <span className="text-xs px-2 py-1 rounded-full bg-neutral-100 text-neutral-700">
              {module.difficulty === "beginner" 
                ? "Beginner" 
                : module.difficulty === "intermediate" 
                  ? "Intermediate" 
                  : "Advanced"}
            </span>
            <Link href={`/modules/${module.id}`}>
              <Button variant="outline" size="sm" className="text-primary border-primary hover:bg-primary hover:text-white">
                View Course
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}