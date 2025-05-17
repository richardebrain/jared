import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
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
  DownloadCloud,
  Star,
  Info,
  AlarmClock,
  GraduationCap,
  Award,
  BookOpen,
  Database,
  CreditCard
} from "lucide-react";
import Header from "@/components/Header";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";

interface School {
  id: number;
  name: string;
  subscriptionActive: boolean;
  subscriptionType: string | null;
  subscriptionExpiresAt: string | null;
  teacherCount: number | null;
  isFreeAccess: boolean;
}

interface DashboardStats {
  totalSchools: number;
  activeSubscriptions: number;
  totalUsers: number;
  averageUsersPerSchool: number;
  revenueStats: {
    monthly: number;
    annual: number;
    projected: number;
  };
}

interface OwnerDashboardData {
  schools: School[];
  stats: DashboardStats;
}

export default function AppOwnerDashboard() {
  const { toast } = useToast();
  const { user, isLoading: authLoading, isOwner } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedPeriod, setSelectedPeriod] = useState("month");
  const [yearFilter, setYearFilter] = useState("2025");
  const [_, setLocation] = useLocation();
  
  // Fetch dashboard data from API
  const { data, isLoading, error } = useQuery<OwnerDashboardData>({
    queryKey: ["/api/owner/dashboard"],
    refetchOnWindowFocus: false
  });
  
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

  // Formatter for currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Calculate the subscription percentage
  const getSubscriptionPercentage = () => {
    if (!data) return 0;
    const { schools } = data;
    const totalNonFreeSchools = schools.filter(s => !s.isFreeAccess).length;
    if (totalNonFreeSchools === 0) return 0;
    
    const subscribedSchools = schools.filter(s => s.subscriptionActive && !s.isFreeAccess).length;
    return Math.round((subscribedSchools / totalNonFreeSchools) * 100);
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

  // Add loading indicator while data is being fetched
  if (isLoading) {
    return (
      <>
        <Header />
        <div className="container max-w-7xl mx-auto p-4 py-8">
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="mb-4 flex justify-center">
                <RefreshCw className="h-12 w-12 text-muted-foreground animate-spin" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Loading Dashboard Data</h3>
              <p className="text-muted-foreground">Please wait while we fetch the latest subscription information...</p>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Handle error state
  if (error || !data) {
    return (
      <>
        <Header />
        <div className="container max-w-7xl mx-auto p-4 py-8">
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="mb-4 flex justify-center">
                <AlertCircle className="h-12 w-12 text-destructive" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Error Loading Data</h3>
              <p className="text-muted-foreground mb-4">
                We encountered an error loading the subscription data.
              </p>
              <Button onClick={() => window.location.reload()}>
                Retry
              </Button>
            </div>
          </div>
        </div>
      </>
    );
  }

  const { schools, stats } = data;

  return (
    <>
      <Header />
      <div className="container max-w-7xl mx-auto p-4 py-8">
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">App Owner Dashboard</h1>
            <p className="text-muted-foreground mt-1">Manage subscriptions and monitor platform performance</p>
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
                  <p className="text-sm font-medium text-muted-foreground">Total Schools</p>
                  <p className="text-3xl font-bold">{stats.totalSchools}</p>
                </div>
                <div className="bg-blue-100 p-2 rounded-lg">
                  <Building2 className="h-6 w-6 text-blue-700" />
                </div>
              </div>
              <div className="mt-4">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span>Subscription Rate</span>
                  <span className="font-medium">{getSubscriptionPercentage()}%</span>
                </div>
                <Progress value={getSubscriptionPercentage()} className="h-2" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Active Subscriptions</p>
                  <p className="text-3xl font-bold">{stats.activeSubscriptions}</p>
                </div>
                <div className="bg-green-100 p-2 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-green-700" />
                </div>
              </div>
              <div className="mt-4">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span>Free Access Schools</span>
                  <span className="font-medium">{schools.filter(s => s.isFreeAccess).length}</span>
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <span>Paid Access Schools</span>
                  <span className="ml-auto font-medium">{schools.filter(s => !s.isFreeAccess).length}</span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Monthly Revenue</p>
                  <p className="text-3xl font-bold">{formatCurrency(stats.revenueStats.monthly)}</p>
                </div>
                <div className="bg-indigo-100 p-2 rounded-lg">
                  <DollarSign className="h-6 w-6 text-indigo-700" />
                </div>
              </div>
              <div className="flex items-center mt-4 text-green-600 text-sm">
                <TrendingUp className="h-4 w-4 mr-1" />
                <span>{formatCurrency(stats.revenueStats.annual)} annual projected</span>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                  <p className="text-3xl font-bold">{stats.totalUsers}</p>
                </div>
                <div className="bg-purple-100 p-2 rounded-lg">
                  <Users className="h-6 w-6 text-purple-700" />
                </div>
              </div>
              <div className="flex items-center mt-4 text-indigo-600 text-sm">
                <Info className="h-4 w-4 mr-1" />
                <span>~{stats.averageUsersPerSchool} per school</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="mb-8">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="overview">Subscription Overview</TabsTrigger>
            <TabsTrigger value="schools">School Management</TabsTrigger>
            <TabsTrigger value="revenue">Revenue Analytics</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Subscription Analytics</CardTitle>
                <CardDescription>
                  Overview of subscription status across all schools
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-8 mb-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Subscription Status</h3>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm">Active Subscriptions</span>
                          <span className="text-sm font-medium">{stats.activeSubscriptions}</span>
                        </div>
                        <Progress value={(stats.activeSubscriptions / stats.totalSchools) * 100} className="h-2" />
                      </div>
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm">Expired Subscriptions</span>
                          <span className="text-sm font-medium">
                            {schools.filter(s => !s.subscriptionActive && !s.isFreeAccess).length}
                          </span>
                        </div>
                        <Progress 
                          value={(schools.filter(s => !s.subscriptionActive && !s.isFreeAccess).length / stats.totalSchools) * 100} 
                          className="h-2 bg-gray-100" 
                        />
                      </div>
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm">Free Access Schools</span>
                          <span className="text-sm font-medium">
                            {schools.filter(s => s.isFreeAccess).length}
                          </span>
                        </div>
                        <Progress 
                          value={(schools.filter(s => s.isFreeAccess).length / stats.totalSchools) * 100} 
                          className="h-2 bg-amber-100" 
                        />
                      </div>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Subscription Types</h3>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm">Monthly Plans</span>
                          <span className="text-sm font-medium">
                            {schools.filter(s => s.subscriptionType === 'monthly').length}
                          </span>
                        </div>
                        <Progress 
                          value={(schools.filter(s => s.subscriptionType === 'monthly').length / stats.totalSchools) * 100} 
                          className="h-2 bg-blue-100" 
                        />
                      </div>
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm">Annual Plans</span>
                          <span className="text-sm font-medium">
                            {schools.filter(s => s.subscriptionType === 'annual').length}
                          </span>
                        </div>
                        <Progress 
                          value={(schools.filter(s => s.subscriptionType === 'annual').length / stats.totalSchools) * 100} 
                          className="h-2 bg-green-100" 
                        />
                      </div>
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm">Enterprise Plans</span>
                          <span className="text-sm font-medium">
                            {schools.filter(s => s.subscriptionType === 'enterprise').length}
                          </span>
                        </div>
                        <Progress 
                          value={(schools.filter(s => s.subscriptionType === 'enterprise').length / stats.totalSchools) * 100} 
                          className="h-2 bg-purple-100" 
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <h3 className="text-lg font-semibold mb-3">Expirations Timeline</h3>
                <div className="space-y-4">
                  {/* Filter to get schools with expiring subscriptions in the next 30 days */}
                  {schools
                    .filter(school => 
                      school.subscriptionActive && 
                      school.subscriptionExpiresAt && 
                      new Date(school.subscriptionExpiresAt).getTime() - new Date().getTime() < 30 * 24 * 60 * 60 * 1000
                    )
                    .sort((a, b) => 
                      new Date(a.subscriptionExpiresAt!).getTime() - new Date(b.subscriptionExpiresAt!).getTime()
                    )
                    .slice(0, 5)
                    .map(school => {
                      const daysLeft = Math.ceil(
                        (new Date(school.subscriptionExpiresAt!).getTime() - new Date().getTime()) / 
                        (24 * 60 * 60 * 1000)
                      );
                      
                      return (
                        <div key={school.id} className="flex items-center justify-between p-3 border rounded-md">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-md ${
                              daysLeft < 7 ? 'bg-red-100' : daysLeft < 14 ? 'bg-amber-100' : 'bg-blue-100'
                            }`}>
                              <AlarmClock className={`h-5 w-5 ${
                                daysLeft < 7 ? 'text-red-600' : daysLeft < 14 ? 'text-amber-600' : 'text-blue-600'
                              }`} />
                            </div>
                            <div>
                              <p className="font-medium">{school.name}</p>
                              <p className="text-sm text-muted-foreground">
                                Expires in {daysLeft} day{daysLeft !== 1 ? 's' : ''}
                              </p>
                            </div>
                          </div>
                          <Badge variant={daysLeft < 7 ? 'destructive' : daysLeft < 14 ? 'default' : 'outline'}>
                            {new Date(school.subscriptionExpiresAt!).toLocaleDateString()}
                          </Badge>
                        </div>
                      );
                    })
                  }
                  
                  {/* Show a message if no schools are expiring soon */}
                  {schools.filter(school => 
                    school.subscriptionActive && 
                    school.subscriptionExpiresAt && 
                    new Date(school.subscriptionExpiresAt).getTime() - new Date().getTime() < 30 * 24 * 60 * 60 * 1000
                  ).length === 0 && (
                    <div className="text-center py-6 border rounded-md">
                      <CheckCircle className="mx-auto h-8 w-8 text-green-500 mb-2" />
                      <p className="font-medium">No upcoming expirations</p>
                      <p className="text-sm text-muted-foreground">All subscriptions are in good standing</p>
                    </div>
                  )}

                  <Button variant="outline" className="w-full mt-2">
                    View All Expirations
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="schools" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>School Directory</CardTitle>
                <CardDescription>
                  Manage schools and their subscription status
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4 flex justify-between">
                  <Input 
                    placeholder="Search schools..." 
                    className="max-w-sm"
                  />
                  <div className="flex gap-2">
                    <Button variant="outline" className="gap-1">
                      <DownloadCloud className="h-4 w-4" />
                      Export
                    </Button>
                    <Button className="gap-1">
                      <Plus className="h-4 w-4" />
                      Add School
                    </Button>
                  </div>
                </div>
                
                <div className="rounded-md border">
                  <div className="grid grid-cols-6 bg-muted/50 p-3 text-sm font-medium">
                    <div className="col-span-2">School</div>
                    <div>Users</div>
                    <div>Plan</div>
                    <div>Status</div>
                    <div>Expiration</div>
                  </div>
                  
                  <div className="divide-y">
                    {schools
                      .sort((a, b) => a.name.localeCompare(b.name))
                      .map(school => (
                        <div key={school.id} className="grid grid-cols-6 p-3 text-sm items-center">
                          <div className="col-span-2 font-medium">{school.name}</div>
                          <div>{school.teacherCount || "-"}</div>
                          <div>
                            {school.isFreeAccess ? (
                              <Badge variant="outline" className="bg-amber-50 text-amber-700 hover:bg-amber-50">
                                Free Access
                              </Badge>
                            ) : school.subscriptionType ? (
                              <Badge variant="outline" className="capitalize">
                                {school.subscriptionType}
                              </Badge>
                            ) : "-"}
                          </div>
                          <div>
                            {school.subscriptionActive ? (
                              <Badge variant="default" className="bg-green-500">Active</Badge>
                            ) : (
                              <Badge variant="destructive">Inactive</Badge>
                            )}
                          </div>
                          <div>
                            {school.isFreeAccess ? (
                              "N/A"
                            ) : school.subscriptionExpiresAt ? (
                              new Date(school.subscriptionExpiresAt).toLocaleDateString()
                            ) : "-"}
                          </div>
                        </div>
                      ))
                    }
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="revenue" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Revenue Analytics</CardTitle>
                    <CardDescription>
                      Track platform subscription revenue
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Select 
                      defaultValue={selectedPeriod} 
                      onValueChange={setSelectedPeriod}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Select period" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="month">Monthly</SelectItem>
                        <SelectItem value="quarter">Quarterly</SelectItem>
                        <SelectItem value="year">Yearly</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <Select 
                      defaultValue={yearFilter} 
                      onValueChange={setYearFilter}
                    >
                      <SelectTrigger className="w-[120px]">
                        <SelectValue placeholder="Select year" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="2024">2024</SelectItem>
                        <SelectItem value="2025">2025</SelectItem>
                        <SelectItem value="2026">2026</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">Monthly Revenue</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-end gap-2">
                        <span className="text-3xl font-bold">{formatCurrency(stats.revenueStats.monthly)}</span>
                        <span className="text-sm text-green-600 mb-1">+5% MoM</span>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">Annual Revenue</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-end gap-2">
                        <span className="text-3xl font-bold">{formatCurrency(stats.revenueStats.annual)}</span>
                        <span className="text-sm text-green-600 mb-1">Estimated</span>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">Revenue Per School</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-end gap-2">
                        <span className="text-3xl font-bold">
                          {formatCurrency(stats.activeSubscriptions > 0 
                            ? Math.round(stats.revenueStats.monthly / stats.activeSubscriptions) 
                            : 0)}
                        </span>
                        <span className="text-sm text-muted-foreground mb-1">Avg</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Recent Transactions</h3>
                    <div className="rounded-md border overflow-hidden">
                      <div className="bg-muted/50 p-3 grid grid-cols-4 text-sm font-medium">
                        <div>Date</div>
                        <div className="col-span-2">School</div>
                        <div className="text-right">Amount</div>
                      </div>
                      <div className="divide-y">
                        {/* Mock transactions - would be replaced with real data */}
                        <div className="p-3 grid grid-cols-4 text-sm">
                          <div>May 16, 2025</div>
                          <div className="col-span-2">Little Stars Preschool - Monthly Subscription</div>
                          <div className="text-right font-medium">$250.00</div>
                        </div>
                        <div className="p-3 grid grid-cols-4 text-sm">
                          <div>May 15, 2025</div>
                          <div className="col-span-2">Happy Horizons Academy - Annual Subscription</div>
                          <div className="text-right font-medium">$2,500.00</div>
                        </div>
                        <div className="p-3 grid grid-cols-4 text-sm">
                          <div>May 14, 2025</div>
                          <div className="col-span-2">Sunshine Learners - Monthly Subscription</div>
                          <div className="text-right font-medium">$250.00</div>
                        </div>
                        <div className="p-3 grid grid-cols-4 text-sm">
                          <div>May 13, 2025</div>
                          <div className="col-span-2">Creative Minds Preschool - Monthly Subscription</div>
                          <div className="text-right font-medium">$250.00</div>
                        </div>
                        <div className="p-3 grid grid-cols-4 text-sm">
                          <div>May 12, 2025</div>
                          <div className="col-span-2">Growing Leaders Academy - Monthly Subscription</div>
                          <div className="text-right font-medium">$250.00</div>
                        </div>
                      </div>
                    </div>
                    <Button variant="outline" className="w-full mt-4">View All Transactions</Button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Subscription Renewals</CardTitle>
                        <CardDescription>
                          Upcoming renewals in the next 30 days
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {/* This would be dynamically generated from real data */}
                          <div className="flex items-center justify-between p-3 border rounded-md">
                            <div>
                              <p className="font-medium">Little Stars Preschool</p>
                              <p className="text-sm text-muted-foreground">
                                Monthly Plan - Renews in 8 days
                              </p>
                            </div>
                            <Badge>$250.00</Badge>
                          </div>
                          <div className="flex items-center justify-between p-3 border rounded-md">
                            <div>
                              <p className="font-medium">Creative Minds Preschool</p>
                              <p className="text-sm text-muted-foreground">
                                Monthly Plan - Renews in 12 days
                              </p>
                            </div>
                            <Badge>$250.00</Badge>
                          </div>
                          <div className="flex items-center justify-between p-3 border rounded-md">
                            <div>
                              <p className="font-medium">Sunshine Learners</p>
                              <p className="text-sm text-muted-foreground">
                                Monthly Plan - Renews in 14 days
                              </p>
                            </div>
                            <Badge>$250.00</Badge>
                          </div>
                          <Button variant="outline" className="w-full">
                            View All Renewals
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader>
                        <CardTitle>Payment Methods</CardTitle>
                        <CardDescription>
                          Connected payment processors
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between p-3 border rounded-md">
                            <div className="flex items-center gap-3">
                              <div className="bg-indigo-100 p-2 rounded-md">
                                <CreditCard className="h-5 w-5 text-indigo-600" />
                              </div>
                              <div>
                                <p className="font-medium">Stripe</p>
                                <p className="text-sm text-muted-foreground">
                                  Primary payment processor
                                </p>
                              </div>
                            </div>
                            <Badge variant="outline" className="bg-green-50 text-green-700">
                              Connected
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between p-3 border rounded-md">
                            <div className="flex items-center gap-3">
                              <div className="bg-blue-100 p-2 rounded-md">
                                <Database className="h-5 w-5 text-blue-600" />
                              </div>
                              <div>
                                <p className="font-medium">QuickBooks</p>
                                <p className="text-sm text-muted-foreground">
                                  Accounting integration
                                </p>
                              </div>
                            </div>
                            <Badge variant="outline">
                              Not Connected
                            </Badge>
                          </div>
                          <Button className="w-full">
                            Manage Payment Integrations
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}

// This component isn't defined in the lucide-react package, so we need to define it
function Plus(props) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}