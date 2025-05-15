import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Link, useLocation } from "wouter";
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
  GraduationCap,
  Watch
} from "lucide-react";
import Header from "@/components/Header";
import IntegrationWizard from "@/components/IntegrationWizard";

// Mock data types
interface LocationData {
  id: string;
  name: string;
  address: string;
  students: number;
  teachers: number;
  revenue: number;
  expenses: number;
}

interface FinancialData {
  revenue: number;
  expenses: number;
  profit: number;
  pendingTransactions: number;
}

// Mock location data
const mockLocations: LocationData[] = [
  {
    id: "bell",
    name: "Bell Road Location",
    address: "4843 W Bell Rd, Phoenix, AZ 85053",
    students: 68,
    teachers: 12,
    revenue: 32450,
    expenses: 24800,
  },
  {
    id: "olive",
    name: "Olive Avenue Location",
    address: "5120 W Olive Ave, Glendale, AZ 85302",
    students: 74,
    teachers: 12,
    revenue: 35900,
    expenses: 26700,
  },
];

// Mock financial data
const mockFinancial: FinancialData = {
  revenue: 68350,
  expenses: 51500,
  profit: 16850,
  pendingTransactions: 4,
};

export default function OwnerDashboardStandalone() {
  const [activeLocation, setActiveLocation] = useState("all");
  const [selectedTab, setSelectedTab] = useState("overview");
  const [showConnections, setShowConnections] = useState(false);
  const [connectedAPIs, setConnectedAPIs] = useState<string[]>([]);
  const [bankName, setBankName] = useState("");
  const [bankApiToken, setBankApiToken] = useState("");
  const [payrollApiKey, setPayrollApiKey] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const [location, setLocation] = useLocation();

  const handleApiConnect = (api: string) => {
    setIsLoading(true);
    
    // Simulate API connection
    setTimeout(() => {
      setConnectedAPIs(prev => [...prev, api]);
      setIsLoading(false);
      
      toast({
        title: "Connection Successful",
        description: `Successfully connected to ${api} API`,
      });
    }, 1500);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Owner Dashboard</h1>
            <p className="text-gray-500">Manage all your school operations in one place</p>
          </div>
          
          <div className="flex space-x-2">
            <Button variant="outline" onClick={() => setLocation("/dashboard")}>
              <Building2 className="h-4 w-4 mr-2" />
              Return to Teacher Dashboard
            </Button>
            <Button onClick={() => setShowConnections(true)}>
              Connect External Systems
            </Button>
          </div>
        </div>
        
        {/* Location Selector */}
        <div className="mb-8">
          <Tabs defaultValue="all" value={activeLocation} onValueChange={setActiveLocation}>
            <TabsList className="mb-4">
              <TabsTrigger value="all">All Locations</TabsTrigger>
              {mockLocations.map(loc => (
                <TabsTrigger key={loc.id} value={loc.id}>{loc.name}</TabsTrigger>
              ))}
            </TabsList>
            
            <TabsContent value="all" className="mt-0">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center">
                      <Users className="h-4 w-4 text-muted-foreground mr-2" />
                      <div className="text-2xl font-bold">142</div>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      <span className="text-green-500">+5%</span> from last month
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center">
                      <DollarSign className="h-4 w-4 text-muted-foreground mr-2" />
                      <div className="text-2xl font-bold">${mockFinancial.revenue.toLocaleString()}</div>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      <span className="text-green-500">+3.2%</span> from last month
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center">
                      <TrendingUp className="h-4 w-4 text-muted-foreground mr-2" />
                      <div className="text-2xl font-bold">${mockFinancial.profit.toLocaleString()}</div>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      <span className="text-green-500">+4.7%</span> from last month
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            {mockLocations.map(loc => (
              <TabsContent key={loc.id} value={loc.id} className="mt-0">
                <Card className="mb-6">
                  <CardHeader>
                    <div className="flex justify-between">
                      <div>
                        <CardTitle>{loc.name}</CardTitle>
                        <CardDescription>{loc.address}</CardDescription>
                      </div>
                      <Badge variant="outline" className="text-sm">Active</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                      <div>
                        <div className="text-sm font-medium text-muted-foreground">Students</div>
                        <div className="text-2xl font-bold">{loc.students}</div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-muted-foreground">Teachers</div>
                        <div className="text-2xl font-bold">{loc.teachers}</div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-muted-foreground">Revenue</div>
                        <div className="text-2xl font-bold">${loc.revenue.toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-muted-foreground">Expenses</div>
                        <div className="text-2xl font-bold">${loc.expenses.toLocaleString()}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </Tabs>
        </div>
        
        {/* Main Content */}
        <Tabs defaultValue="overview" value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="financial">Financial</TabsTrigger>
            <TabsTrigger value="staff">Staff</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {/* Recent Activity */}
              <Card className="md:col-span-2 lg:col-span-1">
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>Latest activity across your schools</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start space-x-4">
                    <div className="bg-blue-100 p-2 rounded-full">
                      <Users className="h-4 w-4 text-blue-700" />
                    </div>
                    <div>
                      <p className="font-medium">2 new student enrollments</p>
                      <p className="text-sm text-muted-foreground">Bell Road Location • 2 hours ago</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-4">
                    <div className="bg-green-100 p-2 rounded-full">
                      <DollarSign className="h-4 w-4 text-green-700" />
                    </div>
                    <div>
                      <p className="font-medium">Monthly payroll processed</p>
                      <p className="text-sm text-muted-foreground">All Locations • Yesterday</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-4">
                    <div className="bg-amber-100 p-2 rounded-full">
                      <AlertCircle className="h-4 w-4 text-amber-700" />
                    </div>
                    <div>
                      <p className="font-medium">Staff shortage alert</p>
                      <p className="text-sm text-muted-foreground">Olive Avenue Location • Yesterday</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="bg-purple-100 p-2 rounded-full">
                      <Star className="h-4 w-4 text-purple-700" />
                    </div>
                    <div>
                      <p className="font-medium">New teacher achievement</p>
                      <p className="text-sm text-muted-foreground">Bell Road Location • 2 days ago</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Upcoming Events */}
              <Card>
                <CardHeader>
                  <CardTitle>Upcoming Events</CardTitle>
                  <CardDescription>Scheduled events across your schools</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start space-x-4">
                    <div className="bg-indigo-100 p-2 rounded-full">
                      <Calendar className="h-4 w-4 text-indigo-700" />
                    </div>
                    <div>
                      <p className="font-medium">Parent-Teacher Conference</p>
                      <p className="text-sm text-muted-foreground">May 20, 2025 • Bell Road Location</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-4">
                    <div className="bg-indigo-100 p-2 rounded-full">
                      <Calendar className="h-4 w-4 text-indigo-700" />
                    </div>
                    <div>
                      <p className="font-medium">Summer Program Kickoff</p>
                      <p className="text-sm text-muted-foreground">June 3, 2025 • All Locations</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-4">
                    <div className="bg-indigo-100 p-2 rounded-full">
                      <Calendar className="h-4 w-4 text-indigo-700" />
                    </div>
                    <div>
                      <p className="font-medium">Staff Training Day</p>
                      <p className="text-sm text-muted-foreground">May 25, 2025 • Olive Avenue Location</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                  <CardDescription>Frequently used tools</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button variant="outline" className="w-full justify-start">
                    <FileText className="h-4 w-4 mr-2" />
                    Generate Monthly Report
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Users className="h-4 w-4 mr-2" />
                    View Staff Directory
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Wallet className="h-4 w-4 mr-2" />
                    Process Payroll
                  </Button>
                  <Button variant="outline" className="w-full justify-start" onClick={() => setShowConnections(true)}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Connect External Systems
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* External Platform Integrations */}
            <Card>
              <CardHeader>
                <CardTitle>External Platform Integration</CardTitle>
                <CardDescription>Connect your essential business tools</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <Card className="bg-blue-50 border-blue-200">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Procare Integration</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-sm text-muted-foreground">Status</p>
                          <div className="flex items-center">
                            {connectedAPIs.includes('procare') ? (
                              <><CheckCircle className="h-4 w-4 text-green-600 mr-1" /> Connected</>
                            ) : (
                              <><Info className="h-4 w-4 text-amber-600 mr-1" /> Not connected</>
                            )}
                          </div>
                        </div>
                        <Button size="sm" onClick={() => window.open('https://www.procaresoftware.com/auth/login', '_blank')}>
                          Login to Procare
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-green-50 border-green-200">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Banking Integration</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-sm text-muted-foreground">Status</p>
                          <div className="flex items-center">
                            {connectedAPIs.includes('banking') ? (
                              <><CheckCircle className="h-4 w-4 text-green-600 mr-1" /> Connected</>
                            ) : (
                              <><Info className="h-4 w-4 text-amber-600 mr-1" /> Not connected</>
                            )}
                          </div>
                        </div>
                        <Button size="sm" onClick={() => setShowConnections(true)}>
                          Manage Banking
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-dashed border-2 flex items-center justify-center p-6">
                    <IntegrationWizard />
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="financial" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${mockFinancial.revenue.toLocaleString()}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    <span className="text-green-500">↑ 3.2%</span> from last month
                  </div>
                  <div className="h-1 bg-gray-100 rounded-full mt-4 overflow-hidden">
                    <div className="bg-green-500 h-full rounded-full" style={{ width: '70%' }}></div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${mockFinancial.expenses.toLocaleString()}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    <span className="text-red-500">↑ 1.8%</span> from last month
                  </div>
                  <div className="h-1 bg-gray-100 rounded-full mt-4 overflow-hidden">
                    <div className="bg-red-500 h-full rounded-full" style={{ width: '65%' }}></div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${mockFinancial.profit.toLocaleString()}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    <span className="text-green-500">↑ 4.7%</span> from last month
                  </div>
                  <div className="h-1 bg-gray-100 rounded-full mt-4 overflow-hidden">
                    <div className="bg-blue-500 h-full rounded-full" style={{ width: '35%' }}></div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Profit Margin</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">24.7%</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    <span className="text-green-500">↑ 1.2%</span> from last month
                  </div>
                  <div className="h-1 bg-gray-100 rounded-full mt-4 overflow-hidden">
                    <div className="bg-purple-500 h-full rounded-full" style={{ width: '24.7%' }}></div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Banking Summary</CardTitle>
                  <CardDescription>
                    Financial accounts and transactions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="font-medium">Main Business Account</h4>
                        <p className="text-sm text-muted-foreground">Bank of America</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">$86,452.37</p>
                        <p className="text-xs text-muted-foreground">Last updated: Today</p>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="font-medium">Payroll Account</h4>
                        <p className="text-sm text-muted-foreground">Bank of America</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">$35,821.12</p>
                        <p className="text-xs text-muted-foreground">Last updated: Today</p>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="font-medium">Savings Account</h4>
                        <p className="text-sm text-muted-foreground">Wells Fargo</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">$128,975.50</p>
                        <p className="text-xs text-muted-foreground">Last updated: Yesterday</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Pending Transactions</CardTitle>
                  <CardDescription>
                    Transactions requiring approval
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="font-medium">Curriculum Supplies</h4>
                        <p className="text-sm text-muted-foreground">Bell Road Location</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-red-600">-$1,245.87</p>
                        <Badge variant="outline" className="text-xs">Needs Approval</Badge>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="font-medium">Staff Development</h4>
                        <p className="text-sm text-muted-foreground">All Locations</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-red-600">-$2,500.00</p>
                        <Badge variant="outline" className="text-xs">Needs Approval</Badge>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="font-medium">Tuition Payment</h4>
                        <p className="text-sm text-muted-foreground">Olive Avenue Location</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-green-600">+$875.00</p>
                        <Badge variant="outline" className="text-xs bg-green-50">Received</Badge>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="font-medium">Maintenance Service</h4>
                        <p className="text-sm text-muted-foreground">Olive Avenue Location</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-red-600">-$452.18</p>
                        <Badge variant="outline" className="text-xs">Needs Approval</Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="staff" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle>Staff Overview</CardTitle>
                  <CardDescription>
                    Current staffing levels
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium">Bell Road Location</span>
                        <span className="text-sm">12/15</span>
                      </div>
                      <Progress value={80} className="h-2" />
                    </div>
                    
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium">Olive Avenue Location</span>
                        <span className="text-sm">12/15</span>
                      </div>
                      <Progress value={80} className="h-2" />
                    </div>
                    
                    <div className="pt-4 border-t">
                      <h4 className="font-medium mb-2">Current Open Positions</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Lead Teacher</span>
                          <Badge>2 positions</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span>Assistant Teacher</span>
                          <Badge>3 positions</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span>Administrative Assistant</span>
                          <Badge>1 position</Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Teacher Certification Status</CardTitle>
                  <CardDescription>
                    Required certifications
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="font-medium">Current Certifications</span>
                      <span className="font-medium text-green-600">92%</span>
                    </div>
                    <Progress value={92} className="h-2" />
                    
                    <div className="pt-4 space-y-2">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          <div className="h-3 w-3 rounded-full bg-green-500 mr-2"></div>
                          <span className="text-sm">Current</span>
                        </div>
                        <span className="text-sm font-medium">22 teachers</span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          <div className="h-3 w-3 rounded-full bg-amber-500 mr-2"></div>
                          <span className="text-sm">Expiring Soon</span>
                        </div>
                        <span className="text-sm font-medium">2 teachers</span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          <div className="h-3 w-3 rounded-full bg-red-500 mr-2"></div>
                          <span className="text-sm">Expired</span>
                        </div>
                        <span className="text-sm font-medium">0 teachers</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Staff Training</CardTitle>
                  <CardDescription>
                    Training completion rates
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium">CORE Training</span>
                        <span className="text-sm">100%</span>
                      </div>
                      <Progress value={100} className="h-2" />
                    </div>
                    
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium">Safety Procedures</span>
                        <span className="text-sm">95%</span>
                      </div>
                      <Progress value={95} className="h-2" />
                    </div>
                    
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium">Child Development</span>
                        <span className="text-sm">88%</span>
                      </div>
                      <Progress value={88} className="h-2" />
                    </div>
                    
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium">Conflict Resolution</span>
                        <span className="text-sm">76%</span>
                      </div>
                      <Progress value={76} className="h-2" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="reports" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Available Reports</CardTitle>
                  <CardDescription>
                    Generate and download reports
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Button variant="outline" className="w-full justify-between">
                      <div className="flex items-center">
                        <BarChart3 className="h-4 w-4 mr-2" />
                        <span>Financial Summary</span>
                      </div>
                      <Download className="h-4 w-4" />
                    </Button>
                    
                    <Button variant="outline" className="w-full justify-between">
                      <div className="flex items-center">
                        <Users className="h-4 w-4 mr-2" />
                        <span>Staff Roster</span>
                      </div>
                      <Download className="h-4 w-4" />
                    </Button>
                    
                    <Button variant="outline" className="w-full justify-between">
                      <div className="flex items-center">
                        <FileText className="h-4 w-4 mr-2" />
                        <span>Enrollment Statistics</span>
                      </div>
                      <Download className="h-4 w-4" />
                    </Button>
                    
                    <Button variant="outline" className="w-full justify-between">
                      <div className="flex items-center">
                        <Building2 className="h-4 w-4 mr-2" />
                        <span>Facilities Report</span>
                      </div>
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Scheduled Reports</CardTitle>
                  <CardDescription>
                    Automatically generated reports
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="font-medium">Monthly Financial Summary</h4>
                        <p className="text-sm text-muted-foreground">Sent on the 1st of each month</p>
                      </div>
                      <Badge variant="outline" className="bg-green-50">Active</Badge>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="font-medium">Weekly Enrollment Update</h4>
                        <p className="text-sm text-muted-foreground">Sent every Monday</p>
                      </div>
                      <Badge variant="outline" className="bg-green-50">Active</Badge>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="font-medium">Quarterly Performance Review</h4>
                        <p className="text-sm text-muted-foreground">Sent at the end of each quarter</p>
                      </div>
                      <Badge variant="outline" className="bg-green-50">Active</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Upload Reports</CardTitle>
                <CardDescription>
                  Import external reports to your dashboard
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border-2 border-dashed rounded-lg p-8 text-center">
                  <div className="mx-auto flex flex-col items-center">
                    <Upload className="h-10 w-10 text-muted-foreground mb-4" />
                    <h3 className="font-medium mb-1">Drag and drop your files</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      or click to browse (PDF, Excel, CSV)
                    </p>
                    <Button>
                      Upload Files
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}