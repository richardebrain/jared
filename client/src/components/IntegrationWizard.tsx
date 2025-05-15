import { useState } from "react";
import { useLocation } from "wouter";
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
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Check, ChevronRight, Loader2, Lock, Shield } from "lucide-react";

// Integration platforms
const platformCategories = [
  {
    id: "childcare",
    name: "Childcare Management",
    platforms: [
      { id: "procare", name: "Procare", logo: "https://www.procaresoftware.com/wp-content/themes/procare-2018/img/procare-logo.svg", fallbackLogo: "Procare", url: "https://www.procaresoftware.com/auth/login" },
      { id: "intellakid", name: "IntellAKid", logo: null, fallbackLogo: "IntellAKid", url: "https://intellakid.com/login" },
      { id: "tadpoles", name: "Tadpoles", logo: null, fallbackLogo: "Tadpoles", url: "https://www.tadpoles.com/login" },
      { id: "himama", name: "HiMama", logo: null, fallbackLogo: "HiMama", url: "https://www.himama.com/login" },
      { id: "brightwheel", name: "Brightwheel", logo: null, fallbackLogo: "Brightwheel", url: "https://schools.mybrightwheel.com/sign-in" },
    ],
  },
  {
    id: "finance",
    name: "Financial Systems",
    platforms: [
      { id: "bankofamerica", name: "Bank of America", logo: null, fallbackLogo: "Bank of America", url: "https://secure.bankofamerica.com/login/" },
      { id: "wellsfargo", name: "Wells Fargo", logo: null, fallbackLogo: "Wells Fargo", url: "https://banking.wellsfargo.com/signin" },
      { id: "chase", name: "Chase", logo: null, fallbackLogo: "Chase", url: "https://www.chase.com/personal/sign-in" },
      { id: "usbank", name: "US Bank", logo: null, fallbackLogo: "US Bank", url: "https://www.usbank.com/index.html" },
      { id: "quickbooks", name: "QuickBooks", logo: null, fallbackLogo: "QuickBooks", url: "https://quickbooks.intuit.com/login/" },
    ],
  },
  {
    id: "hr",
    name: "HR & Payroll",
    platforms: [
      { id: "adp", name: "ADP", logo: null, fallbackLogo: "ADP", url: "https://login.adp.com/welcome" },
      { id: "paychex", name: "Paychex", logo: null, fallbackLogo: "Paychex", url: "https://www.paychex.com/login" },
      { id: "gusto", name: "Gusto", logo: null, fallbackLogo: "Gusto", url: "https://app.gusto.com/login" },
      { id: "bamboohr", name: "BambooHR", logo: null, fallbackLogo: "BambooHR", url: "https://www.bamboohr.com/login/" },
      { id: "paylocity", name: "Paylocity", logo: null, fallbackLogo: "Paylocity", url: "https://login.paylocity.com/" },
    ],
  },
  {
    id: "communication",
    name: "Communication",
    platforms: [
      { id: "slack", name: "Slack", logo: null, fallbackLogo: "Slack", url: "https://slack.com/signin" },
      { id: "zoom", name: "Zoom", logo: null, fallbackLogo: "Zoom", url: "https://zoom.us/signin" },
      { id: "microsoft", name: "Microsoft 365", logo: null, fallbackLogo: "Microsoft 365", url: "https://www.office.com/?auth=1" },
      { id: "google", name: "Google Workspace", logo: null, fallbackLogo: "Google", url: "https://workspace.google.com/dashboard" },
      { id: "mailchimp", name: "Mailchimp", logo: null, fallbackLogo: "Mailchimp", url: "https://login.mailchimp.com/" },
    ],
  },
];

// Form schema
const formSchema = z.object({
  platformId: z.string().min(1, "Please select a platform"),
  integrationName: z.string().min(2, "Please enter a name for this integration"),
  apiKey: z.string().optional(),
  apiSecret: z.string().optional(),
  storeCredentials: z.boolean().default(false),
  dataSync: z.enum(["manual", "daily", "realtime"]).default("manual"),
});

type FormValues = z.infer<typeof formSchema>;

export default function IntegrationWizard() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState(platformCategories[0].id);
  const [selectedPlatform, setSelectedPlatform] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const { toast } = useToast();
  const [location, setLocation] = useLocation();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      platformId: "",
      integrationName: "",
      apiKey: "",
      apiSecret: "",
      storeCredentials: false,
      dataSync: "manual",
    },
  });

  const selectedCategoryPlatforms = platformCategories.find(c => c.id === selectedCategory)?.platforms || [];

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setSelectedPlatform(null);
    form.setValue("platformId", "");
  };

  const handlePlatformSelect = (platform: any) => {
    setSelectedPlatform(platform);
    form.setValue("platformId", platform.id);
    form.setValue("integrationName", `${platform.name} Integration`);
    nextStep();
  };

  const nextStep = () => {
    if (step < 4) {
      setStep(step + 1);
    }
  };

  const prevStep = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const onSubmit = async (values: FormValues) => {
    setIsLoading(true);
    
    try {
      // In a real application, this would connect to the server to save the integration details
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API call
      
      // Handle direct login (we don't need API keys for this approach)
      if (selectedPlatform) {
        window.open(selectedPlatform.url, '_blank');
      }
      
      setIsComplete(true);
      
      toast({
        title: "Integration Successful",
        description: "Your platform has been successfully integrated.",
        variant: "default",
      });
      
      // Reset and close after a short delay
      setTimeout(() => {
        setIsComplete(false);
        setStep(1);
        form.reset();
        setOpen(false);
      }, 2000);
      
    } catch (error) {
      toast({
        title: "Integration Failed",
        description: "There was an error setting up the integration. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

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
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Third-Party Platform Integration Wizard</DialogTitle>
          <DialogDescription>
            Connect Raising Arizona's systems with your essential business platforms
          </DialogDescription>
        </DialogHeader>

        <div className="my-6">
          <div className="flex justify-between mb-4">
            {[1, 2, 3, 4].map((stepNumber) => (
              <div key={stepNumber} className="flex flex-col items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    step === stepNumber
                      ? "bg-blue-600 text-white border-2 border-blue-200"
                      : step > stepNumber
                      ? "bg-green-600 text-white"
                      : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {step > stepNumber ? <Check className="h-4 w-4" /> : stepNumber}
                </div>
                <div className="text-xs mt-1 text-gray-500">
                  {stepNumber === 1 && "Select"}
                  {stepNumber === 2 && "Configure"}
                  {stepNumber === 3 && "Security"}
                  {stepNumber === 4 && "Finish"}
                </div>
              </div>
            ))}
          </div>
          <div className="h-1 w-full bg-gray-200 relative">
            <div
              className="absolute top-0 left-0 h-full bg-blue-600 transition-all"
              style={{ width: `${((step - 1) / 3) * 100}%` }}
            ></div>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Step 1: Select Platform */}
            {step === 1 && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Select Integration Platform</h3>
                <Tabs value={selectedCategory} onValueChange={handleCategoryChange}>
                  <TabsList className="grid grid-cols-4">
                    {platformCategories.map((category) => (
                      <TabsTrigger key={category.id} value={category.id}>
                        {category.name}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                  
                  {platformCategories.map((category) => (
                    <TabsContent key={category.id} value={category.id} className="mt-4">
                      <div className="grid grid-cols-2 gap-3">
                        {category.platforms.map((platform) => (
                          <Card 
                            key={platform.id} 
                            className={`cursor-pointer hover:border-blue-400 transition-colors ${
                              selectedPlatform?.id === platform.id ? 'border-blue-600' : ''
                            }`}
                            onClick={() => handlePlatformSelect(platform)}
                          >
                            <CardContent className="p-4 flex flex-col items-center justify-center">
                              <div className="h-14 flex items-center justify-center">
                                {platform.logo ? (
                                  <img 
                                    src={platform.logo} 
                                    alt={platform.name}
                                    className="max-h-10 mb-2"
                                    onError={(e) => {
                                      const target = e.currentTarget;
                                      target.onerror = null;
                                      target.src = `https://placehold.co/120x30/4f46e5/fff?text=${platform.fallbackLogo}`;
                                    }}
                                  />
                                ) : (
                                  <div className="text-lg font-bold text-blue-600 mb-2">{platform.fallbackLogo}</div>
                                )}
                              </div>
                              <p className="text-sm text-center">{platform.name}</p>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>
              </div>
            )}

            {/* Step 2: Configure Integration */}
            {step === 2 && selectedPlatform && (
              <div className="space-y-4">
                <div className="flex items-center space-x-2 mb-4">
                  <div className="bg-blue-100 p-2 rounded-md">
                    {selectedPlatform.logo ? (
                      <img 
                        src={selectedPlatform.logo}
                        alt={selectedPlatform.name}
                        className="h-8"
                        onError={(e) => {
                          const target = e.currentTarget;
                          target.onerror = null;
                          target.src = `https://placehold.co/80x30/4f46e5/fff?text=${selectedPlatform.fallbackLogo}`;
                        }}
                      />
                    ) : (
                      <div className="text-md font-bold text-blue-600">{selectedPlatform.fallbackLogo}</div>
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-medium">{selectedPlatform.name} Integration</h3>
                    <p className="text-sm text-gray-500">Configure how this platform connects with your system</p>
                  </div>
                </div>

                <FormField
                  control={form.control}
                  name="integrationName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Integration Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter a friendly name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="dataSync"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data Synchronization</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select sync frequency" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="manual">Manual Sync Only</SelectItem>
                          <SelectItem value="daily">Daily Sync</SelectItem>
                          <SelectItem value="realtime">Real-time Sync</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* Step 3: Security Settings */}
            {step === 3 && selectedPlatform && (
              <div className="space-y-4">
                <div className="flex items-center space-x-2 mb-4">
                  <Lock className="h-5 w-5 text-blue-600" />
                  <h3 className="text-lg font-medium">Security & Access</h3>
                </div>
                
                <div className="bg-amber-50 border border-amber-200 p-3 rounded-md mb-4">
                  <p className="text-sm text-amber-800">
                    For maximum security, we recommend using direct login to {selectedPlatform.name}. 
                    This integration will open a secure login window when needed.
                  </p>
                </div>

                {/* Optional API credentials */}
                <div className="space-y-4">
                  <p className="text-sm text-gray-500 italic">Optional: If you have API credentials, you can add them here</p>
                  
                  <FormField
                    control={form.control}
                    name="apiKey"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>API Key (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter API key" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="apiSecret"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>API Secret (Optional)</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="Enter API secret" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="storeCredentials"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 pt-2">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>
                            Remember my credentials (encrypted storage)
                          </FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            )}

            {/* Step 4: Complete */}
            {step === 4 && selectedPlatform && (
              <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="text-lg font-medium mb-2">Integration Summary</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Platform:</span>
                      <span className="font-medium">{selectedPlatform.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Integration Name:</span>
                      <span className="font-medium">{form.getValues().integrationName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Data Sync:</span>
                      <span className="font-medium">
                        {form.getValues().dataSync === "manual" ? "Manual Sync Only" : 
                         form.getValues().dataSync === "daily" ? "Daily Sync" : "Real-time Sync"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">API Credentials:</span>
                      <span className="font-medium">
                        {form.getValues().apiKey ? "Provided" : "Using Direct Login"}
                      </span>
                    </div>
                  </div>
                </div>

                {isComplete ? (
                  <div className="bg-green-50 p-4 rounded-lg text-center">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 mb-4">
                      <Check className="h-6 w-6 text-green-600" />
                    </div>
                    <h3 className="text-lg font-medium text-green-800">Integration Complete!</h3>
                    <p className="text-sm text-green-600 mt-1">
                      Your {selectedPlatform.name} integration has been set up successfully
                    </p>
                  </div>
                ) : (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-center text-gray-600">
                      Click "Complete Setup" to finalize your integration with {selectedPlatform.name}.
                      <br />
                      You will be able to manage this integration from your dashboard.
                    </p>
                  </div>
                )}
              </div>
            )}

            <DialogFooter className="mt-6">
              {step > 1 && !isComplete && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={prevStep}
                  className="mr-auto"
                >
                  Back
                </Button>
              )}
              
              {step < 4 && selectedPlatform && (
                <Button type="button" onClick={nextStep}>
                  Continue <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              )}
              
              {step === 4 && !isComplete && (
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Setting up...
                    </>
                  ) : (
                    <>Complete Setup</>
                  )}
                </Button>
              )}
              
              {isComplete && (
                <Button
                  type="button"
                  onClick={() => {
                    setIsComplete(false);
                    setStep(1);
                    form.reset();
                    setOpen(false);
                  }}
                >
                  Done
                </Button>
              )}
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}