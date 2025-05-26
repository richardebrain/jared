import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth-context";
import {
  Building2,
  DollarSign,
  TrendingUp,
  Users,
  Calendar,
  AlertCircle,
  CheckCircle,
  BarChart3,
  FileText,
  Wallet,
  RefreshCw,
  Download,
  Upload,
  Star,
  Info,
  AlarmClock,
  GraduationCap,
  Watch
} from "lucide-react";
import Header from "@/components/Header";
import IntegrationWizard from "@/components/IntegrationWizard";

// Mock data types
interface LocationData {
  id: string;
  name: string;
  enrollment: number;
  capacity: number;
  revenue: number;
  expenses: number;
  staffCount: number;
}

interface PayrollData {
  location: string;
  percentage: number;
  amount: number;
  staffCount: number;
  lastProcessed: string;
}

interface FinancialData {
  accountBalance: number;
  recentTransactions: {
    id: string;
    date: string;
    description: string;
    amount: number;
    type: 'credit' | 'debit';
  }[];
  pendingTransactions: number;
}

// Mock data
const mockLocations: LocationData[] = [
  {
    id: "1",
    name: "Bell Road School",
    enrollment: 98,
    capacity: 120,
    revenue: 124500,
    expenses: 89300,
    staffCount: 18
  },
  {
    id: "2",
    name: "Olive School",
    enrollment: 86,
    capacity: 100,
    revenue: 109200,
    expenses: 76800,
    staffCount: 15
  },
  {
    id: "3",
    name: "McDowell School",
    enrollment: 112,
    capacity: 130,
    revenue: 142000,
    expenses: 105600,
    staffCount: 21
  },
  {
    id: "4",
    name: "Mesa School",
    enrollment: 78,
    capacity: 90,
    revenue: 98800,
    expenses: 68900,
    staffCount: 14
  }
];

const mockPayroll: PayrollData[] = [
  {
    location: "Bell Road School",
    percentage: 42,
    amount: 42000,
    staffCount: 18,
    lastProcessed: "May 1, 2025"
  },
  {
    location: "Olive School",
    percentage: 38,
    amount: 35000,
    staffCount: 15,
    lastProcessed: "May 1, 2025"
  },
  {
    location: "McDowell School",
    percentage: 45,
    amount: 48000,
    staffCount: 21,
    lastProcessed: "May 1, 2025"
  },
  {
    location: "Mesa School",
    percentage: 37,
    amount: 32000,
    staffCount: 14,
    lastProcessed: "May 1, 2025"
  }
];

const mockFinancial: FinancialData = {
  accountBalance: 487500.89,
  recentTransactions: [
    {
      id: "tx1",
      date: "May 10, 2025",
      description: "Tuition Payments - Bell Road",
      amount: 12450.00,
      type: "credit"
    },
    {
      id: "tx2",
      date: "May 9, 2025",
      description: "Supply Order - Educational Materials",
      amount: 3245.67,
      type: "debit"
    },
    {
      id: "tx3",
      date: "May 8, 2025",
      description: "Tuition Payments - Olive",
      amount: 10920.00,
      type: "credit"
    },
    {
      id: "tx4",
      date: "May 7, 2025",
      description: "Utility Payment - All Locations",
      amount: 5678.90,
      type: "debit"
    },
    {
      id: "tx5",
      date: "May 6, 2025",
      description: "Catering Services - Staff Event",
      amount: 1250.00,
      type: "debit"
    }
  ],
  pendingTransactions: 3
};

export default function OwnerDashboardStandalone() {
  const { toast } = useToast();
  const { user, isLoading: authLoading, isOwner } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [isLoading, setIsLoading] = useState(false);
  const [showConnections, setShowConnections] = useState(false);
  const [connectedAPIs, setConnectedAPIs] = useState<string[]>([]);
  const [bankApiToken, setBankApiToken] = useState('');
  const [payrollApiKey, setPayrollApiKey] = useState('');
  const [bankName, setBankName] = useState('');
  const [_, setLocation] = useLocation();
  
  // Check if the user is authorized to view the owner dashboard
  useEffect(() => {
    if (user && !isOwner) {
      toast({
        title: "Access Restricted",
        description: "You do not have permission to access the Owner Dashboard.",
        variant: "destructive"
      });
      setLocation('/dashboard');
    }
  }, [user, isOwner, toast, setLocation]);

  const handleApiConnect = (service: string) => {
    setIsLoading(true);
    
    // Simulate API connection
    setTimeout(() => {
      setIsLoading(false);
      setConnectedAPIs(prev => [...prev, service]);
      
      toast({
        title: "Connection Successful",
        description: `Successfully connected to ${service}`,
        variant: "default",
      });
    }, 1500);
  };

  // Show loading state while auth is being checked
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  
  // If user is not an owner, don't render anything - redirect happens in useEffect
  if (user && !isOwner) {
    return null;
  }

  return (
    <>
      <Header />
      <div className="container max-w-7xl mx-auto p-4 py-8">
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Owner Dashboard</h1>
            <p className="text-muted-foreground mt-1">Manage all your preschool locations and finances</p>
          </div>
          <Button variant="outline" className="gap-2">
            <Download size={16} />
            Export Reports
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Enrollment</p>
                  <p className="text-3xl font-bold">374</p>
                </div>
                <div className="bg-blue-100 p-2 rounded-lg">
                  <Users className="h-6 w-6 text-blue-700" />
                </div>
              </div>
              <div className="mt-4">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span>Capacity Utilization</span>
                  <span className="font-medium">85%</span>
                </div>
                <Progress value={85} className="h-2" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Monthly Revenue</p>
                  <p className="text-3xl font-bold">$474,500</p>
                </div>
                <div className="bg-green-100 p-2 rounded-lg">
                  <DollarSign className="h-6 w-6 text-green-700" />
                </div>
              </div>
              <div className="flex items-center mt-4 text-green-600 text-sm">
                <TrendingUp className="h-4 w-4 mr-1" />
                <span>8.2% increase from last month</span>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Expenses</p>
                  <p className="text-3xl font-bold">$340,600</p>
                </div>
                <div className="bg-red-100 p-2 rounded-lg">
                  <Wallet className="h-6 w-6 text-red-700" />
                </div>
              </div>
              <div className="flex items-center mt-4 text-red-600 text-sm">
                <TrendingUp className="h-4 w-4 mr-1" />
                <span>4.5% increase from last month</span>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Staff Members</p>
                  <p className="text-3xl font-bold">68</p>
                </div>
                <div className="bg-purple-100 p-2 rounded-lg">
                  <Users className="h-6 w-6 text-purple-700" />
                </div>
              </div>
              <div className="flex items-center justify-between mt-4">
                <Badge variant="outline" className="bg-purple-50">14 Teachers</Badge>
                <Badge variant="outline" className="bg-purple-50">18 Assistants</Badge>
                <Badge variant="outline" className="bg-purple-50">36 Support</Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="mb-8">
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="locations">Locations</TabsTrigger>
            <TabsTrigger value="payroll">Payroll</TabsTrigger>
            <TabsTrigger value="financial">Financial</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Locations Overview</CardTitle>
                <CardDescription>
                  Summary of your preschool locations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {mockLocations.map((location) => (
                    <Card key={location.id} className="border border-gray-200">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="font-bold text-lg">{location.name}</h3>
                            <p className="text-sm text-muted-foreground">ID: {location.id}</p>
                          </div>
                          <Badge variant={
                            location.enrollment > location.capacity * 0.9 ? "destructive" : 
                            location.enrollment > location.capacity * 0.7 ? "default" : 
                            "outline"
                          }>
                            {Math.round(location.enrollment / location.capacity * 100)}% Capacity
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div>
                            <p className="text-sm text-muted-foreground">Enrollment</p>
                            <p className="font-medium">{location.enrollment} / {location.capacity}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Staff</p>
                            <p className="font-medium">{location.staffCount} members</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Revenue</p>
                            <p className="font-medium">${location.revenue.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Expenses</p>
                            <p className="font-medium">${location.expenses.toLocaleString()}</p>
                          </div>
                        </div>
                        
                        <div className="mt-2">
                          <p className="text-sm font-medium mb-1">Capacity Utilization</p>
                          <Progress value={Math.round(location.enrollment / location.capacity * 100)} className="h-2" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Upcoming Events</CardTitle>
                  <CardDescription>
                    School events across all locations
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="bg-blue-100 p-2 rounded-lg">
                        <Calendar className="h-5 w-5 text-blue-700" />
                      </div>
                      <div>
                        <p className="font-medium">Teacher Training Day</p>
                        <p className="text-sm text-muted-foreground">May 20, 2025 • Bell Road School</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="bg-purple-100 p-2 rounded-lg">
                        <Calendar className="h-5 w-5 text-purple-700" />
                      </div>
                      <div>
                        <p className="font-medium">Parent-Teacher Conferences</p>
                        <p className="text-sm text-muted-foreground">May 25-26, 2025 • All Locations</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="bg-green-100 p-2 rounded-lg">
                        <Calendar className="h-5 w-5 text-green-700" />
                      </div>
                      <div>
                        <p className="font-medium">End of Year Celebration</p>
                        <p className="text-sm text-muted-foreground">June 5, 2025 • All Locations</p>
                      </div>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full mt-4">View All Events</Button>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Important Alerts</CardTitle>
                  <CardDescription>
                    Items that need your attention
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="bg-red-100 p-2 rounded-lg">
                        <AlertCircle className="h-5 w-5 text-red-700" />
                      </div>
                      <div>
                        <p className="font-medium">Staff shortage at Mesa School</p>
                        <p className="text-sm text-muted-foreground">2 assistant teachers needed</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="bg-amber-100 p-2 rounded-lg">
                        <AlertCircle className="h-5 w-5 text-amber-700" />
                      </div>
                      <div>
                        <p className="font-medium">Building maintenance required</p>
                        <p className="text-sm text-muted-foreground">Playground equipment at Olive School</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="bg-green-100 p-2 rounded-lg">
                        <CheckCircle className="h-5 w-5 text-green-700" />
                      </div>
                      <div>
                        <p className="font-medium">All teacher certifications up to date</p>
                        <p className="text-sm text-muted-foreground">Next renewal: August 2025</p>
                      </div>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full mt-4">View All Alerts</Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="locations" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Location Management</CardTitle>
                <CardDescription>
                  Detailed information about each school location
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {mockLocations.map((location) => (
                    <Card key={location.id} className="border border-gray-200">
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-bold text-xl mb-1">{location.name}</h3>
                            <p className="text-sm text-muted-foreground mb-4">Location ID: {location.id}</p>
                          </div>
                          <Badge variant={
                            location.enrollment > location.capacity * 0.9 ? "destructive" : 
                            location.enrollment > location.capacity * 0.7 ? "default" : 
                            "outline"
                          } className="text-sm">
                            {Math.round(location.enrollment / location.capacity * 100)}% Full
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                          <div>
                            <p className="text-sm font-medium text-muted-foreground mb-1">Student Enrollment</p>
                            <div className="flex items-baseline">
                              <p className="text-2xl font-bold">{location.enrollment}</p>
                              <p className="text-sm text-muted-foreground ml-2">/ {location.capacity} capacity</p>
                            </div>
                            <div className="mt-2">
                              <Progress value={Math.round(location.enrollment / location.capacity * 100)} className="h-2" />
                            </div>
                          </div>
                          
                          <div>
                            <p className="text-sm font-medium text-muted-foreground mb-1">Monthly Revenue</p>
                            <p className="text-2xl font-bold">${location.revenue.toLocaleString()}</p>
                            <p className="text-sm text-green-600 mt-1">
                              ${Math.round(location.revenue - location.expenses).toLocaleString()} profit
                            </p>
                          </div>
                          
                          <div>
                            <p className="text-sm font-medium text-muted-foreground mb-1">Staff Members</p>
                            <p className="text-2xl font-bold">{location.staffCount}</p>
                            <p className="text-sm text-muted-foreground mt-1">
                              {Math.round(location.enrollment / location.staffCount)} students per staff
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm">View Details</Button>
                          <Button variant="outline" size="sm">Enrollment Report</Button>
                          <Button variant="outline" size="sm">Staff Management</Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="payroll" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Payroll Overview</CardTitle>
                <CardDescription>
                  Staff payroll information across all locations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {mockPayroll.map((item, index) => (
                    <Card key={index} className="border border-gray-200">
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="font-bold text-lg">{item.location}</h3>
                            <p className="text-sm text-muted-foreground">Last processed: {item.lastProcessed}</p>
                          </div>
                          <Badge variant={
                            item.percentage > 45 ? "destructive" : 
                            item.percentage > 40 ? "default" : 
                            "outline"
                          }>
                            {item.percentage}% of Revenue
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          <div>
                            <p className="text-sm text-muted-foreground mb-1">Monthly Payroll</p>
                            <p className="text-xl font-bold">${item.amount.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground mb-1">Staff Count</p>
                            <p className="text-xl font-bold">{item.staffCount} employees</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground mb-1">Average Salary</p>
                            <p className="text-xl font-bold">
                              ${Math.round(item.amount / item.staffCount).toLocaleString()}/month
                            </p>
                          </div>
                        </div>
                        
                        <Button variant="outline" size="sm">View Detailed Report</Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Payroll Schedule</CardTitle>
                  <CardDescription>
                    Upcoming payroll processing dates
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between py-2 border-b">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                        <p>May 15, 2025</p>
                      </div>
                      <Badge variant="outline">Upcoming</Badge>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                        <p>June 1, 2025</p>
                      </div>
                      <Badge variant="outline">Scheduled</Badge>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                        <p>June 15, 2025</p>
                      </div>
                      <Badge variant="outline">Scheduled</Badge>
                    </div>
                    <div className="flex items-center justify-between py-2">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                        <p>July 1, 2025</p>
                      </div>
                      <Badge variant="outline">Scheduled</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Payroll Actions</CardTitle>
                  <CardDescription>
                    Manage payroll processing and reports
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button className="w-full" disabled={!connectedAPIs.includes('payroll')}>
                    Run Payroll Now
                  </Button>
                  <Button variant="outline" className="w-full">
                    Generate Tax Documents
                  </Button>
                  <Button variant="outline" className="w-full">
                    View Payroll History
                  </Button>
                  <Button variant="outline" className="w-full">
                    Benefits Management
                  </Button>
                  
                  {!connectedAPIs.includes('payroll') && (
                    <div className="bg-amber-50 p-4 rounded-md mt-4">
                      <div className="flex items-start">
                        <Info className="h-5 w-5 text-amber-500 mr-2 mt-0.5" />
                        <div>
                          <p className="font-medium text-amber-800">Payroll API not connected</p>
                          <p className="text-sm text-amber-700 mt-1">
                            Connect to your payroll provider to enable automated processing
                          </p>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="mt-2 bg-white"
                            onClick={() => setShowConnections(true)}
                          >
                            Connect Now
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="financial" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Account Balance</p>
                      <p className="text-3xl font-bold">${mockFinancial.accountBalance.toLocaleString()}</p>
                    </div>
                    <div className="bg-green-100 p-2 rounded-lg">
                      <DollarSign className="h-6 w-6 text-green-700" />
                    </div>
                  </div>
                  <div className="mt-4">
                    <Button variant="outline" size="sm" className="w-full" disabled={!connectedAPIs.includes('banking')}>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Refresh Balance
                    </Button>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Monthly Revenue</p>
                      <p className="text-3xl font-bold">$474,500</p>
                    </div>
                    <div className="bg-blue-100 p-2 rounded-lg">
                      <TrendingUp className="h-6 w-6 text-blue-700" />
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="text-xs text-muted-foreground flex justify-between mb-1">
                      <span>YTD Goal: $1.5M</span>
                      <span>$848,300 (56.5%)</span>
                    </div>
                    <Progress value={56.5} className="h-2" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Pending Transactions</p>
                      <p className="text-3xl font-bold">{mockFinancial.pendingTransactions}</p>
                    </div>
                    <div className="bg-amber-100 p-2 rounded-lg">
                      <AlertCircle className="h-6 w-6 text-amber-700" />
                    </div>
                  </div>
                  <div className="mt-4">
                    <Button variant="outline" size="sm" className="w-full" disabled={!connectedAPIs.includes('banking')}>
                      View Pending Transactions
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Recent Transactions</CardTitle>
                <CardDescription>
                  Recent financial activity across all locations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockFinancial.recentTransactions.map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between py-2 border-b">
                      <div className="flex items-center">
                        <div className={`p-2 rounded-full mr-3 ${
                          transaction.type === 'credit' ? 'bg-green-100' : 'bg-red-100'
                        }`}>
                          {transaction.type === 'credit' ? (
                            <Upload className={`h-4 w-4 text-green-700`} />
                          ) : (
                            <Download className={`h-4 w-4 text-red-700`} />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{transaction.description}</p>
                          <p className="text-sm text-muted-foreground">{transaction.date}</p>
                        </div>
                      </div>
                      <div className={`font-medium ${
                        transaction.type === 'credit' ? 'text-green-700' : 'text-red-700'
                      }`}>
                        {transaction.type === 'credit' ? '+' : '-'}${transaction.amount.toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
                <Button variant="outline" className="w-full mt-4">View All Transactions</Button>
              </CardContent>
            </Card>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Financial Reports</CardTitle>
                  <CardDescription>
                    Access and download financial statements
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between py-2 border-b">
                    <div className="flex items-center">
                      <FileText className="h-4 w-4 mr-2 text-muted-foreground" />
                      <p>Profit & Loss Statement</p>
                    </div>
                    <Button variant="outline" size="sm">Download</Button>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b">
                    <div className="flex items-center">
                      <FileText className="h-4 w-4 mr-2 text-muted-foreground" />
                      <p>Balance Sheet</p>
                    </div>
                    <Button variant="outline" size="sm">Download</Button>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b">
                    <div className="flex items-center">
                      <FileText className="h-4 w-4 mr-2 text-muted-foreground" />
                      <p>Cash Flow Statement</p>
                    </div>
                    <Button variant="outline" size="sm">Download</Button>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <div className="flex items-center">
                      <FileText className="h-4 w-4 mr-2 text-muted-foreground" />
                      <p>Tax Documents</p>
                    </div>
                    <Button variant="outline" size="sm">Download</Button>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Financial Analysis</CardTitle>
                  <CardDescription>
                    Key financial metrics and ratios
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between py-2 border-b">
                    <p>Revenue per Student</p>
                    <p className="font-bold">$1,269/month</p>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b">
                    <p>Profit Margin</p>
                    <p className="font-bold text-green-700">28.2%</p>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b">
                    <p>Staff Cost Ratio</p>
                    <p className="font-bold">41.3%</p>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <p>Facility Cost Ratio</p>
                    <p className="font-bold">22.6%</p>
                  </div>
                  <Button className="w-full mt-2">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    View Detailed Analysis
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
        
        {/* API Connections Dialog */}
        {showConnections && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="w-full max-w-lg">
              <CardHeader>
                <CardTitle>Connect External Systems</CardTitle>
                <CardDescription>
                  Connect to your financial and management systems to enable data integration
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h3 className="font-medium">Banking Integration</h3>
                  <div className="grid grid-cols-2 gap-3 mt-2">
                    <Button 
                      variant="outline" 
                      className="flex justify-center items-center py-4 border-dashed border-2"
                      onClick={() => window.open('https://secure.bankofamerica.com/login/', '_blank')}
                    >
                      <div className="flex flex-col items-center">
                        <span className="text-sm font-bold text-blue-800 mb-1">Bank of America</span>
                        <span className="text-xs">Login to Account</span>
                      </div>
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      className="flex justify-center items-center py-4 border-dashed border-2"
                      onClick={() => window.open('https://banking.wellsfargo.com/signin', '_blank')}
                    >
                      <div className="flex flex-col items-center">
                        <span className="text-sm font-bold text-red-700 mb-1">Wells Fargo</span>
                        <span className="text-xs">Login to Account</span>
                      </div>
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      className="flex justify-center items-center py-4 border-dashed border-2"
                      onClick={() => window.open('https://www.chase.com/personal/sign-in', '_blank')}
                    >
                      <div className="flex flex-col items-center">
                        <span className="text-sm font-bold text-blue-700 mb-1">Chase</span>
                        <span className="text-xs">Login to Account</span>
                      </div>
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      className="flex justify-center items-center py-4 border-dashed border-2"
                      onClick={() => window.open('https://www.usbank.com/index.html', '_blank')}
                    >
                      <div className="flex flex-col items-center">
                        <span className="text-sm font-bold text-blue-900 mb-1">US Bank</span>
                        <span className="text-xs">Login to Account</span>
                      </div>
                    </Button>
                  </div>
                  
                  <div className="mt-3">
                    <Button 
                      variant="outline" 
                      className="w-full flex justify-center items-center py-2"
                      onClick={() => {
                        const bankName = prompt("Enter your bank's website URL:");
                        if (bankName) {
                          // Add https:// if not present
                          const url = bankName.startsWith('http') ? bankName : `https://${bankName}`;
                          window.open(url, '_blank');
                          toast({
                            title: "Opening Bank Website",
                            description: `Redirecting to ${url}`,
                          });
                        }
                      }}
                    >
                      <div className="flex items-center">
                        <i className="ri-bank-line mr-2"></i>
                        <span>Connect to Other Bank</span>
                      </div>
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h3 className="font-medium">Payroll Systems</h3>
                  <div className="grid grid-cols-2 gap-3 mt-2">
                    <Button 
                      variant="outline" 
                      className="flex justify-center items-center py-4 border-dashed border-2"
                      onClick={() => window.open('https://login.adp.com/welcome', '_blank')}
                    >
                      <div className="flex flex-col items-center">
                        <span className="text-sm font-bold text-red-600 mb-1">ADP</span>
                        <span className="text-xs">Login to Account</span>
                      </div>
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      className="flex justify-center items-center py-4 border-dashed border-2"
                      onClick={() => window.open('https://www.paychex.com/login', '_blank')}
                    >
                      <div className="flex flex-col items-center">
                        <span className="text-sm font-bold text-blue-600 mb-1">Paychex</span>
                        <span className="text-xs">Login to Account</span>
                      </div>
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      className="flex justify-center items-center py-4 border-dashed border-2"
                      onClick={() => window.open('https://quickbooks.intuit.com/login/', '_blank')}
                    >
                      <div className="flex flex-col items-center">
                        <span className="text-sm font-bold text-green-600 mb-1">QuickBooks</span>
                        <span className="text-xs">Login to Account</span>
                      </div>
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      className="flex justify-center items-center py-4 border-dashed border-2"
                      onClick={() => window.open('https://app.gusto.com/login', '_blank')}
                    >
                      <div className="flex flex-col items-center">
                        <span className="text-sm font-bold text-purple-600 mb-1">Gusto</span>
                        <span className="text-xs">Login to Account</span>
                      </div>
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h3 className="font-medium">Procare Integration</h3>
                  <Button 
                    variant="outline" 
                    className="w-full flex justify-center items-center py-6 border-dashed border-2"
                    onClick={() => window.open('https://www.procaresoftware.com/auth/login', '_blank')}
                  >
                    <div className="flex flex-col items-center">
                      <img 
                        src="https://www.procaresoftware.com/wp-content/themes/procare-2018/img/procare-logo.svg" 
                        alt="Procare Software" 
                        className="h-6 mb-2"
                        onError={(e) => {
                          const target = e.currentTarget;
                          target.onerror = null;
                          target.src = "https://placehold.co/120x30/4f46e5/fff?text=Procare";
                        }}
                      />
                      <span className="text-sm">Log in with Procare Account</span>
                    </div>
                  </Button>
                </div>
                
                <div className="space-y-2 mt-4">
                  <h3 className="font-medium">IntellAKid Integration</h3>
                  <Button 
                    variant="outline" 
                    className="w-full flex justify-center items-center py-6 border-dashed border-2"
                    onClick={() => window.open('https://intellakid.com/login', '_blank')}
                  >
                    <div className="flex flex-col items-center">
                      <span className="text-lg font-bold text-blue-600 mb-1">IntellAKid</span>
                      <span className="text-sm">Log in with IntellAKid Account</span>
                    </div>
                  </Button>
                </div>
                
                <div className="mt-8 border-t pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-medium">Advanced Platform Integration</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Configure and manage all your third-party integrations in one place
                      </p>
                    </div>
                    <Badge variant="outline" className="bg-blue-50">New</Badge>
                  </div>
                  
                  <IntegrationWizard />
                </div>
              </CardContent>
              <div className="p-6 flex justify-end">
                <Button variant="outline" onClick={() => setShowConnections(false)}>
                  Close
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </>
  );
}