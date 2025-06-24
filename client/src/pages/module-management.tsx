import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth-context";
import Header from "@/components/Header";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardFooter 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  ArrowUpDown, CheckCircle, AlertTriangle, 
  Search, RefreshCw, Filter, Shield 
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

export default function ModuleManagement() {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  
  // Fetch all modules with visibility status
  const { data: modules, isLoading: isLoadingModules, isError } = useQuery({
    queryKey: ["/api/modules/management"],
    refetchOnWindowFocus: false,
  });
  
  // System diagnostics to check for missing modules
  const { data: diagnostics, isLoading: isRunningDiagnostics, refetch: runDiagnostics } = useQuery({
    queryKey: ["/api/modules/verify"],
    enabled: false, // Don't run automatically, only when requested
  });
  
  useEffect(() => {
    // Redirect if not admin or owner
    if (!isLoading && (!user || (!user.isAdmin && !user.isOwner))) {
      toast({
        title: "Access Denied",
        description: "You need admin privileges to access this page.",
        variant: "destructive",
      });
      setLocation("/dashboard");
    }
  }, [user, isLoading, setLocation, toast]);
  
  // Toggle module visibility
  const toggleModuleVisibility = async (moduleId: number, visible: boolean) => {
    try {
      await apiRequest("PATCH", `/api/modules/${moduleId}/visibility`, { visible });
      
      queryClient.invalidateQueries({ queryKey: ["/api/modules/management"] });
      queryClient.invalidateQueries({ queryKey: ["/api/modules"] });
      
      toast({
        title: "Module Updated",
        description: `Module visibility has been ${visible ? "enabled" : "disabled"}.`,
        variant: "default",
      });
    } catch (error) {
      console.error("Error toggling module visibility:", error);
      toast({
        title: "Update Failed",
        description: "There was a problem updating the module visibility.",
        variant: "destructive",
      });
    }
  };
  
  // Run system diagnostics and restore missing modules
  const handleRunDiagnostics = async () => {
    try {
      await runDiagnostics();
      
      // Re-fetch the modules list
      queryClient.invalidateQueries({ queryKey: ["/api/modules/management"] });
      queryClient.invalidateQueries({ queryKey: ["/api/modules"] });
    } catch (error) {
      console.error("Error running diagnostics:", error);
      toast({
        title: "Diagnostics Failed",
        description: "There was a problem running the system diagnostics.",
        variant: "destructive",
      });
    }
  };
  
  // Filter and search modules
  const filteredModules = modules?.filter(module => {
    const matchesSearch = 
      searchTerm === "" || 
      module.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      module.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      module.category?.toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesCategory = 
      categoryFilter === "all" || 
      module.category?.toLowerCase() === categoryFilter.toLowerCase();
      
    return matchesSearch && matchesCategory;
  }) || [];
  
  // Extract unique categories for filter
  const categories = modules ? 
    ["all", ...new Set(modules.map(module => module.category?.toLowerCase()))] : 
    ["all"];
  
  if (isLoading || !user) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex justify-center items-center h-48">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }
  
  if (!user.isAdmin && !user.isOwner) {
    return null; // Handle by useEffect redirect
  }
  
  return (
    <div className="container mx-auto py-6 max-w-7xl">
      <Header />
      
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Module Management System</h1>
        <p className="text-muted-foreground">
          Control which training modules are visible on the dashboard and restore missing modules.
        </p>
      </div>
      
      {diagnostics && (
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle>Diagnostic Results</CardTitle>
            <CardDescription>
              System check completed at {new Date().toLocaleTimeString()}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {diagnostics.fixed > 0 ? (
              <div className="bg-green-50 border border-green-200 rounded-md p-4">
                <div className="flex">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                  <p className="text-green-700">
                    <span className="font-semibold">Success!</span> Restored {diagnostics.fixed} missing module(s): {diagnostics.modules.join(", ")}
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <p className="text-blue-700">
                  <span className="font-semibold">All good!</span> All essential modules are present in the system.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
      
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <Card className="flex-1">
          <CardHeader className="pb-3">
            <CardTitle>System Tools</CardTitle>
            <CardDescription>
              Utilities to maintain the module system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Button 
                  onClick={handleRunDiagnostics} 
                  disabled={isRunningDiagnostics}
                  className="w-full"
                >
                  {isRunningDiagnostics ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Running System Check...
                    </>
                  ) : (
                    <>
                      <Shield className="mr-2 h-4 w-4" />
                      Verify & Restore Essential Modules
                    </>
                  )}
                </Button>
                <p className="text-sm text-muted-foreground mt-2">
                  This tool will check for missing essential training modules and restore them if needed.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="flex-1">
          <CardHeader className="pb-3">
            <CardTitle>Module Filters</CardTitle>
            <CardDescription>
              Filter and search for specific modules
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search modules..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <div>
                <label className="text-sm font-medium flex items-center mb-2">
                  <Filter className="h-4 w-4 mr-1" />
                  Category Filter
                </label>
                <select
                  className="w-full p-2 border rounded-md"
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                >
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category === "all" ? "All Categories" : 
                        category.charAt(0).toUpperCase() + category.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Module Visibility Settings</CardTitle>
          <CardDescription>
            Control which modules appear on the dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingModules ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : isError ? (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex items-center">
                <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
                <p className="text-red-700">
                  There was a problem loading the modules. Please try again.
                </p>
              </div>
            </div>
          ) : (
            <Table>
              <TableCaption>
                Showing {filteredModules.length} of {modules.length} modules
              </TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">ID</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-center">Points</TableHead>
                  <TableHead className="text-center">Difficulty</TableHead>
                  <TableHead className="text-center">Visible</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredModules.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                      No modules found matching your search
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredModules.map((module) => (
                    <TableRow key={module.id}>
                      <TableCell>{module.id}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{module.title}</div>
                          <div className="text-sm text-muted-foreground">
                            {module.description.length > 80 
                              ? `${module.description.substring(0, 80)}...` 
                              : module.description}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {module.category.charAt(0).toUpperCase() + module.category.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge>
                          +{module.pointValue}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={
                          module.difficulty === "beginner" ? "secondary" :
                          module.difficulty === "intermediate" ? "outline" :
                          "default"
                        }>
                          {module.difficulty.charAt(0).toUpperCase() + module.difficulty.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Switch 
                          checked={module.featured}
                          onCheckedChange={(checked) => toggleModuleVisibility(module.id, checked)}
                        />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={() => setLocation("/dashboard")}>
            Back to Dashboard
          </Button>
          <Button onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/modules/management"] })}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh Module List
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}