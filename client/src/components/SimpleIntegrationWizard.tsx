import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, ChevronRight, Loader2, Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";

// Integration platforms
const platformCategories = [
  {
    id: "childcare",
    name: "Childcare Management",
    platforms: [
      { id: "procare", name: "Procare", url: "https://www.procaresoftware.com/auth/login" },
      { id: "intellakid", name: "IntellAKid", url: "https://intellakid.com/login" },
      { id: "tadpoles", name: "Tadpoles", url: "https://www.tadpoles.com/login" },
      { id: "himama", name: "HiMama", url: "https://www.himama.com/login" },
      { id: "brightwheel", name: "Brightwheel", url: "https://schools.mybrightwheel.com/sign-in" },
    ]
  },
  {
    id: "finance",
    name: "Financial Systems",
    platforms: [
      { id: "bankofamerica", name: "Bank of America", url: "https://secure.bankofamerica.com/login/" },
      { id: "wellsfargo", name: "Wells Fargo", url: "https://banking.wellsfargo.com/signin" },
      { id: "chase", name: "Chase", url: "https://www.chase.com/personal/sign-in" },
      { id: "usbank", name: "US Bank", url: "https://www.usbank.com/index.html" },
      { id: "quickbooks", name: "QuickBooks", url: "https://quickbooks.intuit.com/login/" },
    ]
  },
  {
    id: "hr",
    name: "HR & Payroll",
    platforms: [
      { id: "adp", name: "ADP", url: "https://login.adp.com/welcome" },
      { id: "paychex", name: "Paychex", url: "https://www.paychex.com/login" },
      { id: "gusto", name: "Gusto", url: "https://app.gusto.com/login" },
      { id: "bamboohr", name: "BambooHR", url: "https://www.bamboohr.com/login/" },
      { id: "paylocity", name: "Paylocity", url: "https://login.paylocity.com/" },
    ]
  },
];

export default function SimpleIntegrationWizard() {
  const [open, setOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(platformCategories[0].id);
  const [isComplete, setIsComplete] = useState(false);
  const { toast } = useToast();

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId);
  };

  const handlePlatformSelect = (platform: any) => {
    // Open the platform in a new tab
    window.open(platform.url, '_blank');
    
    // Show success toast
    toast({
      title: "Platform Connected",
      description: `Successfully connected to ${platform.name}`,
      variant: "default",
    });
    
    // Mark as complete
    setIsComplete(true);
    
    // Reset after a delay
    setTimeout(() => {
      setIsComplete(false);
      setOpen(false);
    }, 1500);
  };

  // Get current category
  const currentCategory = platformCategories.find(cat => cat.id === selectedCategory) || platformCategories[0];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          <div className="flex items-center justify-center space-x-2">
            <Shield className="h-4 w-4" />
            <span>Launch Integration Wizard</span>
          </div>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Third-Party Platform Integration</DialogTitle>
          <DialogDescription>
            Connect Raising Arizona's systems with your essential business platforms
          </DialogDescription>
        </DialogHeader>

        {isComplete ? (
          <div className="py-6">
            <div className="bg-green-50 p-6 rounded-lg text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 mb-4">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-lg font-medium text-green-800">Integration Complete!</h3>
              <p className="text-sm text-green-600 mt-1">
                Your platform has been successfully connected
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="flex space-x-2 border-b mb-4">
              {platformCategories.map((category) => (
                <Button 
                  key={category.id}
                  variant={selectedCategory === category.id ? "default" : "ghost"}
                  onClick={() => handleCategorySelect(category.id)}
                  className="rounded-none rounded-t-lg"
                >
                  {category.name}
                </Button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3 py-2">
              {currentCategory.platforms.map((platform) => (
                <Card 
                  key={platform.id} 
                  className="cursor-pointer hover:border-blue-400 transition-colors"
                  onClick={() => handlePlatformSelect(platform)}
                >
                  <CardContent className="p-4 flex flex-col items-center justify-center">
                    <div className="text-lg font-bold text-blue-600 mb-2">{platform.name}</div>
                    <Badge variant="outline" className="bg-blue-50 mb-1">One-Click Connect</Badge>
                    <div className="flex items-center text-xs text-blue-500">
                      <span>Open Platform</span>
                      <ChevronRight className="h-3 w-3 ml-1" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}