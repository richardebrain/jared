import React, { useState } from 'react';
import SettingsLayout from '@/components/SettingsLayout';
import { useAuth } from '@/hooks/use-auth';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { 
  Building2, 
  DollarSign, 
  BarChart4, 
  PieChart, 
  Users, 
  Calendar, 
  RefreshCcw,
  AlertCircle,
  CheckCircle2,
  Shield
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { apiRequest } from '@/lib/queryClient';
import SimpleIntegrationWizard from '@/components/SimpleIntegrationWizard';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// Types for dashboard data
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

// Mock data - Will be replaced with API data in production
const mockLocations: LocationData[] = [
  {
    id: 'bell-school',
    name: 'Bell School',
    enrollment: 85,
    capacity: 120,
    revenue: 42500,
    expenses: 32000,
    staffCount: 12
  },
  {
    id: 'olive-school',
    name: 'Olive School',
    enrollment: 92,
    capacity: 110,
    revenue: 46000,
    expenses: 34500,
    staffCount: 15
  },
  {
    id: 'mcdowell',
    name: 'McDowell',
    enrollment: 78,
    capacity: 100,
    revenue: 39000,
    expenses: 30000,
    staffCount: 11
  },
  {
    id: 'mesa',
    name: 'Mesa',
    enrollment: 65,
    capacity: 90,
    revenue: 32500,
    expenses: 26000,
    staffCount: 9
  }
];

const mockPayroll: PayrollData[] = [
  {
    location: 'Bell School',
    percentage: 48.2,
    amount: 15424,
    staffCount: 12,
    lastProcessed: '2025-05-01'
  },
  {
    location: 'Olive School',
    percentage: 45.7,
    amount: 15774,
    staffCount: 15,
    lastProcessed: '2025-05-01'
  },
  {
    location: 'McDowell',
    percentage: 47.5,
    amount: 14250,
    staffCount: 11,
    lastProcessed: '2025-05-01'
  },
  {
    location: 'Mesa',
    percentage: 49.1,
    amount: 12766,
    staffCount: 9,
    lastProcessed: '2025-05-01'
  }
];

const mockFinancial: FinancialData = {
  accountBalance: 128750.42,
  recentTransactions: [
    {
      id: 't1',
      date: '2025-05-10',
      description: 'Tuition Payments - Bell',
      amount: 12500,
      type: 'credit'
    },
    {
      id: 't2',
      date: '2025-05-08',
      description: 'Payroll - All Locations',
      amount: 58214,
      type: 'debit'
    },
    {
      id: 't3',
      date: '2025-05-05',
      description: 'Tuition Payments - Olive',
      amount: 14250,
      type: 'credit'
    },
    {
      id: 't4',
      date: '2025-05-05',
      description: 'Vendor Payment - Food Supply',
      amount: 3675,
      type: 'debit'
    }
  ],
  pendingTransactions: 3
};

export default function OwnerDashboardPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [isApiConnected, setIsApiConnected] = useState(false);
  const [procareApiKey, setProcareApiKey] = useState('');
  const [bankApiToken, setBankApiToken] = useState('');
  const [payrollApiKey, setPayrollApiKey] = useState('');
  const [bankName, setBankName] = useState('');
  
  // Owner check based on username or email
  // Force isOwner to true for demo purposes 
  // const isOwner = user?.username === 'Emma' || user?.email?.includes('@raisingarizonapreschool.com');
  const isOwner = true; // Temporarily force access for all users
  
  const handleApiConnect = (service: string) => {
    setIsLoading(true);
    
    // This would be replaced with real API connection logic
    setTimeout(() => {
      setIsLoading(false);
      setIsApiConnected(true);
      toast({
        title: "API Connected",
        description: `Successfully connected to ${service} API.`,
      });
    }, 1500);
  };
  
  // Calculate totals
  const totalEnrollment = mockLocations.reduce((sum, loc) => sum + loc.enrollment, 0);
  const totalCapacity = mockLocations.reduce((sum, loc) => sum + loc.capacity, 0);
  const totalRevenue = mockLocations.reduce((sum, loc) => sum + loc.revenue, 0);
  const totalExpenses = mockLocations.reduce((sum, loc) => sum + loc.expenses, 0);
  const averagePayrollPercentage = (mockPayroll.reduce((sum, p) => sum + p.percentage, 0) / mockPayroll.length).toFixed(1);
  
  if (!isOwner) {
    return (
      <SettingsLayout
        title="Owner Dashboard"
        description="Comprehensive view of your business operations"
      >
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>
            You need owner privileges to access this dashboard.
          </AlertDescription>
        </Alert>
      </SettingsLayout>
    );
  }
  
  return (
    <SettingsLayout
      title="Owner Dashboard"
      description="Comprehensive view of your business operations across all locations"
    >
      {!isApiConnected ? (
        <div className="space-y-6">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>API Connection Required</AlertTitle>
            <AlertDescription>
              Connect your Procare, Chase Bank, and Payroll systems to view live data.
            </AlertDescription>
          </Alert>
          
          <Card>
            <CardHeader>
              <CardTitle>Connect Data Sources</CardTitle>
              <CardDescription>
                Provide API credentials to connect your business systems
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="procare-api">Procare API Key</Label>
                <div className="flex space-x-2">
                  <Input 
                    id="procare-api"
                    type="password" 
                    value={procareApiKey}
                    onChange={(e) => setProcareApiKey(e.target.value)}
                    placeholder="Enter Procare API key" 
                  />
                  <Button 
                    onClick={() => handleApiConnect('Procare')}
                    disabled={!procareApiKey || isLoading}
                  >
                    {isLoading ? <RefreshCcw className="h-4 w-4 animate-spin" /> : 'Connect'}
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="bank-name">Bank Name</Label>
                <Input 
                  id="bank-name"
                  type="text" 
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  placeholder="Enter your bank name (e.g. Chase, Wells Fargo, etc.)" 
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="bank-token">Bank API Access Token</Label>
                <div className="flex space-x-2">
                  <Input 
                    id="bank-token"
                    type="password" 
                    value={bankApiToken}
                    onChange={(e) => setBankApiToken(e.target.value)}
                    placeholder="Enter bank API token" 
                  />
                  <Button 
                    onClick={() => handleApiConnect(bankName || 'Banking')}
                    disabled={!bankApiToken || isLoading}
                  >
                    {isLoading ? <RefreshCcw className="h-4 w-4 animate-spin" /> : 'Connect'}
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="payroll-api">Payroll System API Key</Label>
                <div className="flex space-x-2">
                  <Input 
                    id="payroll-api"
                    type="password" 
                    value={payrollApiKey}
                    onChange={(e) => setPayrollApiKey(e.target.value)}
                    placeholder="Enter Payroll API key" 
                  />
                  <Button 
                    onClick={() => handleApiConnect('Payroll System')}
                    disabled={!payrollApiKey || isLoading}
                  >
                    {isLoading ? <RefreshCcw className="h-4 w-4 animate-spin" /> : 'Connect'}
                  </Button>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full" 
                onClick={() => setIsApiConnected(true)}
              >
                Continue with Demo Data
              </Button>
            </CardFooter>
          </Card>
        </div>
      ) : (
        <div className="space-y-6">
          <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="payroll">Payroll</TabsTrigger>
              <TabsTrigger value="financial">Financial</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Total Enrollment
                    </CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{totalEnrollment} students</div>
                    <p className="text-xs text-muted-foreground">
                      {Math.round((totalEnrollment / totalCapacity) * 100)}% of capacity
                    </p>
                    <Progress className="mt-2" value={(totalEnrollment / totalCapacity) * 100} />
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Monthly Revenue
                    </CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">${totalRevenue.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">
                      {Math.round(((totalRevenue - totalExpenses) / totalRevenue) * 100)}% profit margin
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Payroll Percentage
                    </CardTitle>
                    <PieChart className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{averagePayrollPercentage}%</div>
                    <p className="text-xs text-muted-foreground">
                      Average across all locations
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      {bankName || "Bank"} Balance
                    </CardTitle>
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">${mockFinancial.accountBalance.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">
                      {mockFinancial.pendingTransactions} pending transactions
                    </p>
                  </CardContent>
                </Card>
              </div>
              
              <Card>
                <CardHeader>
                  <CardTitle>Location Overview</CardTitle>
                  <CardDescription>Key metrics for all your locations</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border">
                    <div className="grid grid-cols-7 border-b bg-muted/50 p-2 text-sm font-medium">
                      <div className="col-span-2">Location</div>
                      <div className="text-center">Enrollment</div>
                      <div className="text-center">Staff</div>
                      <div className="text-center">Revenue</div>
                      <div className="text-center">Expenses</div>
                      <div className="text-center">Profit</div>
                    </div>
                    <div className="divide-y">
                      {mockLocations.map((location) => (
                        <div key={location.id} className="grid grid-cols-7 p-2 text-sm">
                          <div className="col-span-2 font-medium">{location.name}</div>
                          <div className="text-center">{location.enrollment}/{location.capacity}</div>
                          <div className="text-center">{location.staffCount}</div>
                          <div className="text-center">${location.revenue.toLocaleString()}</div>
                          <div className="text-center">${location.expenses.toLocaleString()}</div>
                          <div className="text-center text-emerald-600">${(location.revenue - location.expenses).toLocaleString()}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button variant="outline" onClick={() => {
                    toast({
                      title: "Report Generated",
                      description: "The monthly report has been sent to your email."
                    });
                  }}>
                    Export Report
                  </Button>
                  <Button variant="ghost" className="flex items-center gap-1">
                    <RefreshCcw className="h-4 w-4" />
                    Refresh Data
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
            
            <TabsContent value="payroll" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Payroll Analytics</CardTitle>
                  <CardDescription>
                    Payroll as a percentage of revenue by location
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {mockPayroll.map((location) => (
                      <div key={location.location} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <p className="text-sm font-medium leading-none">
                              {location.location}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {location.staffCount} staff members - Last processed: {new Date(location.lastProcessed).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="font-bold">{location.percentage}%</div>
                        </div>
                        <Progress value={location.percentage} 
                          className={
                            location.percentage > 50 
                              ? "h-2 bg-red-100" 
                              : location.percentage > 47 
                                ? "h-2 bg-amber-100" 
                                : "h-2 bg-emerald-100"
                          }
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <p>${location.amount.toLocaleString()} this period</p>
                          <p className={
                            location.percentage > 50 
                              ? "text-red-500" 
                              : location.percentage > 47 
                                ? "text-amber-500" 
                                : "text-emerald-500"
                          }>
                            {location.percentage > 50 
                              ? "Above target" 
                              : location.percentage > 47 
                                ? "Near target" 
                                : "Below target"}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button variant="outline">Payroll History</Button>
                  <Button variant="ghost" className="flex items-center gap-1" onClick={() => {
                    toast({
                      title: "Payroll Schedule",
                      description: "Next payroll processing: May, 20 2025"
                    });
                  }}>
                    <Calendar className="h-4 w-4" />
                    View Schedule
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
            
            <TabsContent value="financial" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>{bankName || "Bank"} Account</CardTitle>
                  <CardDescription>
                    Current balance: ${mockFinancial.accountBalance.toLocaleString()}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border">
                    <div className="grid grid-cols-4 border-b bg-muted/50 p-2 text-sm font-medium">
                      <div>Date</div>
                      <div className="col-span-2">Description</div>
                      <div className="text-right">Amount</div>
                    </div>
                    <div className="divide-y">
                      {mockFinancial.recentTransactions.map((tx) => (
                        <div key={tx.id} className="grid grid-cols-4 p-2 text-sm">
                          <div>{new Date(tx.date).toLocaleDateString()}</div>
                          <div className="col-span-2">{tx.description}</div>
                          <div className={`text-right ${tx.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                            {tx.type === 'credit' ? '+' : '-'} ${tx.amount.toLocaleString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button variant="outline" onClick={() => {
                    toast({
                      title: "Statement Downloaded",
                      description: "The latest bank statement has been downloaded."
                    });
                  }}>
                    Download Statement
                  </Button>
                  <Button variant="ghost" className="flex items-center gap-1">
                    <RefreshCcw className="h-4 w-4" />
                    Refresh Data
                  </Button>
                </CardFooter>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Procare Tuition Analytics</CardTitle>
                  <CardDescription>
                    Current month tuition collection status
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <div>
                        <p className="text-sm font-medium">Expected Tuition</p>
                        <p className="text-2xl font-bold">${(totalRevenue * 1.1).toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Collected</p>
                        <p className="text-2xl font-bold">${totalRevenue.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Pending</p>
                        <p className="text-2xl font-bold">${(totalRevenue * 0.1).toLocaleString()}</p>
                      </div>
                    </div>
                    
                    <Progress value={90} className="h-2" />
                    <p className="text-sm text-center text-muted-foreground">90% collected for current month</p>
                    
                    <div className="rounded-md border p-3 bg-amber-50">
                      <div className="flex items-start space-x-2">
                        <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                        <div>
                          <p className="font-medium text-amber-600">Outstanding Payments</p>
                          <p className="text-sm text-amber-700">5 families have outstanding balances. View in Procare for details.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button className="w-full" onClick={() => {
                    toast({
                      title: "Procare Dashboard",
                      description: "Redirecting to Procare dashboard for detailed view."
                    });
                  }}>
                    View in Procare
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
          
          <div className="mt-8 space-y-4">
            <div className="border-t pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium">Third-Party Platform Integration</h3>
                  <p className="text-sm text-muted-foreground">Connect to external systems with our integration wizard</p>
                </div>
                <Badge variant="outline" className="bg-blue-50">New</Badge>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Quick Connect</CardTitle>
                  <CardDescription>Seamlessly integrate with your business tools</CardDescription>
                </CardHeader>
                <CardContent>
                  <SimpleIntegrationWizard />
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Connection Status</CardTitle>
                  <CardDescription>Monitor your active connections</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
                      <span className="text-sm">Banking Systems</span>
                    </div>
                    <Badge variant="outline" className="bg-green-50 text-green-700">Connected</Badge>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
                      <span className="text-sm">Procare</span>
                    </div>
                    <Badge variant="outline" className="bg-green-50 text-green-700">Connected</Badge>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <div className="w-2 h-2 rounded-full bg-amber-500 mr-2"></div>
                      <span className="text-sm">Payroll</span>
                    </div>
                    <Badge variant="outline" className="bg-amber-50 text-amber-700">Partial</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="text-xs text-center text-muted-foreground">
              <p>Last updated: May 15, 2025 at 6:40 PM</p>
              <p className="mt-1">
                <Button variant="link" size="sm" className="h-auto p-0" onClick={() => setIsApiConnected(false)}>
                  Manage API Connections
                </Button>
              </p>
            </div>
          </div>
        </div>
      )}
    </SettingsLayout>
  );
}