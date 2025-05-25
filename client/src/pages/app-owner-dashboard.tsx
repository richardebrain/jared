import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Building, Users, CreditCard, DollarSign, TrendingUp, 
  CheckCircle, XCircle, ChevronDown, ChevronUp, Badge,
  Calendar, Clock, User, ArrowLeft, AlertCircle
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function AppOwnerDashboard() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  const [manageUserDialogOpen, setManageUserDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [userSearchTerm, setUserSearchTerm] = useState("");
  const [expandedSchools, setExpandedSchools] = useState<number[]>([]);

  // Fetch app metrics
  const { data: metrics, isLoading: isLoadingMetrics } = useQuery({
    queryKey: ["/api/owner/metrics"],
    retry: false,
  });

  // Fetch all schools
  const { data: schools, isLoading: isLoadingSchools } = useQuery({
    queryKey: ["/api/owner/schools"],
    retry: false,
  });

  // Fetch all payment plans
  const { data: paymentPlans, isLoading: isLoadingPaymentPlans } = useQuery({
    queryKey: ["/api/owner/payment-plans"],
    retry: false,
  });

  // Fetch all users
  const { data: allUsers, isLoading: isLoadingUsers } = useQuery({
    queryKey: ["/api/admin/users"],
    retry: false,
  });

  // Grant app owner access mutation
  const updateOwnerMutation = useMutation({
    mutationFn: async (data: { userId: number; isOwner: boolean }) => {
      return await apiRequest("/api/admin/update-owner-access", {
        method: "POST",
        data
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "User owner access updated successfully",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setManageUserDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update user owner access. Please try again.",
        variant: "destructive",
      });
      console.error("Error updating owner access:", error);
    },
  });

  const handleGrantOwnerAccess = (userId: number, isOwner: boolean) => {
    updateOwnerMutation.mutate({ userId, isOwner });
  };

  const toggleSchoolExpanded = (schoolId: number) => {
    setExpandedSchools(prev => 
      prev.includes(schoolId) 
        ? prev.filter(id => id !== schoolId) 
        : [...prev, schoolId]
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  };

  const filteredUsers = allUsers?.filter((user: any) => {
    const searchLower = userSearchTerm.toLowerCase();
    return (
      user.username?.toLowerCase().includes(searchLower) ||
      user.firstName?.toLowerCase().includes(searchLower) ||
      user.lastName?.toLowerCase().includes(searchLower) ||
      user.email?.toLowerCase().includes(searchLower)
    );
  }) || [];
  
  // Calculate total revenue metrics
  const totalRevenue = (metrics?.monthlyRevenue || 0) * 12;
  const monthlyRevenue = metrics?.monthlyRevenue || 0;
  const annualGrowthRate = metrics?.annualGrowthRate || 0;
  const totalUsers = metrics?.totalUsers || 0;
  const totalSchools = metrics?.totalSchools || 0;
  const activeSubscriptions = metrics?.activeSubscriptions || 0;

  // Function to get subscription status label and color
  const getSubscriptionStatusUI = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return { label: 'Active', icon: <CheckCircle className="h-4 w-4 text-green-500 mr-1" /> };
      case 'inactive':
      case 'expired':
        return { label: 'Expired', icon: <XCircle className="h-4 w-4 text-red-500 mr-1" /> };
      case 'trial':
        return { label: 'Trial', icon: <Clock className="h-4 w-4 text-blue-500 mr-1" /> };
      case 'free':
        return { label: 'Free', icon: <Badge className="h-4 w-4 text-purple-500 mr-1" /> };
      default:
        return { label: 'Unknown', icon: <Calendar className="h-4 w-4 text-gray-500 mr-1" /> };
    }
  };

  if (isLoadingMetrics || isLoadingSchools || isLoadingPaymentPlans || isLoadingUsers) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="container max-w-7xl mx-auto p-6">
      <div className="flex items-center mb-4">
        <Button variant="ghost" onClick={() => window.location.href = "/dashboard"} className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Button>
      </div>
      
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">App Owner Dashboard</h1>
          <p className="text-muted-foreground">Manage schools, subscriptions, and revenue</p>
        </div>
        
        <div className="flex items-center gap-4">
          <Button variant="default">
            <DollarSign className="h-4 w-4 mr-2" />
            Stripe Dashboard
          </Button>
          <Button variant="outline">
            <TrendingUp className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="schools">Schools</TabsTrigger>
          <TabsTrigger value="plans">Payment Plans</TabsTrigger>
          <TabsTrigger value="owners">App Owners</TabsTrigger>
        </TabsList>
        
        {/* Overview Tab */}
        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
                <p className="text-xs text-muted-foreground">Annual</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Monthly Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(monthlyRevenue)}</div>
                <p className="text-xs text-muted-foreground">Current Month</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Schools</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalSchools}</div>
                <p className="text-xs text-muted-foreground">{activeSubscriptions} with active subscriptions</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Users</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalUsers}</div>
                <p className="text-xs text-muted-foreground">Total registered users</p>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Recent Subscriptions</CardTitle>
                <CardDescription>Latest school subscriptions and renewals</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>School</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(Array.isArray(schools) ? schools.slice(0, 5) : []).map((school: any) => (
                      <TableRow key={school.id}>
                        <TableCell className="font-medium">{school.name}</TableCell>
                        <TableCell>{school.subscription?.planName || "Free"}</TableCell>
                        <TableCell>{formatDate(school.subscription?.startDate || school.createdAt)}</TableCell>
                        <TableCell>{formatCurrency(school.subscription?.amount || 0)}</TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            {getSubscriptionStatusUI(school.subscription?.status || 'free').icon}
                            <span>{getSubscriptionStatusUI(school.subscription?.status || 'free').label}</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {(!schools || schools.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground">No subscriptions found</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Revenue by Plan</CardTitle>
                <CardDescription>Monthly revenue breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                {(Array.isArray(paymentPlans) ? paymentPlans : []).map((plan: any) => (
                  <div key={plan.id} className="flex items-center justify-between mb-4">
                    <div>
                      <div className="font-medium">{plan.name}</div>
                      <div className="text-sm text-muted-foreground">{plan.schoolCount} schools</div>
                    </div>
                    <div className="font-semibold">{formatCurrency(plan.monthlyRevenue)}</div>
                  </div>
                ))}
                {(!paymentPlans || paymentPlans.length === 0) && (
                  <div className="text-center text-muted-foreground py-8">
                    No payment plans configured
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Schools Tab */}
        <TabsContent value="schools">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Schools</CardTitle>
                <CardDescription>Manage all registered schools and their subscriptions</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Input 
                  placeholder="Search schools..." 
                  className="w-64" 
                />
                <Select defaultValue="all">
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Schools</SelectItem>
                    <SelectItem value="active">Active Subscription</SelectItem>
                    <SelectItem value="trial">Trial</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                    <SelectItem value="free">Free Plan</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>School</TableHead>
                    <TableHead>Teachers</TableHead>
                    <TableHead>Subscription</TableHead>
                    <TableHead>Revenue</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(Array.isArray(schools) ? schools : []).map((school: any) => (
                    <>
                      <TableRow key={school.id} className={expandedSchools.includes(school.id) ? "bg-muted/50" : ""}>
                        <TableCell className="font-medium">
                          <div className="flex items-center">
                            <Building className="h-4 w-4 mr-2 text-primary" />
                            {school.name}
                            {school.isSample && (
                              <span className="ml-2 px-2 py-0.5 text-xs bg-amber-100 text-amber-800 rounded-full">
                                Sample School
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            ID: {school.id} • Created: {formatDate(school.createdAt)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <Users className="h-4 w-4 mr-2 text-blue-500" />
                            {school.teacherCount || 0}
                          </div>
                        </TableCell>
                        <TableCell>
                          {school.subscription?.planName || "Free Plan"}
                          <div className="text-xs text-muted-foreground mt-1">
                            {school.subscription?.nextBillingDate ? 
                              `Next billing: ${formatDate(school.subscription.nextBillingDate)}` : 
                              "No billing cycle"
                            }
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">
                            {formatCurrency(school.subscription?.amount || 0)}
                            <span className="text-xs font-normal text-muted-foreground">/month</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            {getSubscriptionStatusUI(school.subscription?.status || 'free').icon}
                            <span>{getSubscriptionStatusUI(school.subscription?.status || 'free').label}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => toggleSchoolExpanded(school.id)}
                          >
                            {expandedSchools.includes(school.id) ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </Button>
                        </TableCell>
                      </TableRow>
                      
                      {/* Expanded details row */}
                      {expandedSchools.includes(school.id) && (
                        <TableRow>
                          <TableCell colSpan={6} className="bg-muted/30 p-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div>
                                <h4 className="font-semibold mb-2">Contact Information</h4>
                                <div className="space-y-1 text-sm">
                                  <div>
                                    <span className="text-muted-foreground">Email:</span>{" "}
                                    {school.contactEmail || "Not provided"}
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">Phone:</span>{" "}
                                    {school.contactPhone || "Not provided"}
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">Address:</span>{" "}
                                    {school.address ? `${school.address}, ${school.city || ""}, ${school.state || ""} ${school.zipCode || ""}` : "Not provided"}
                                  </div>
                                </div>
                              </div>
                              
                              <div>
                                <h4 className="font-semibold mb-2">Subscription Details</h4>
                                <div className="space-y-1 text-sm">
                                  <div>
                                    <span className="text-muted-foreground">Plan:</span>{" "}
                                    {school.subscription?.planName || "Free Plan"}
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">Start Date:</span>{" "}
                                    {formatDate(school.subscription?.startDate || school.createdAt)}
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">Teacher Limit:</span>{" "}
                                    {school.subscription?.teacherLimit || "Unlimited"}
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">Payment Method:</span>{" "}
                                    {school.subscription?.paymentMethod || "None"}
                                  </div>
                                </div>
                              </div>
                              
                              <div className="flex flex-col space-y-2">
                                <Button variant="default" size="sm" className="justify-start">
                                  <CreditCard className="h-4 w-4 mr-2" />
                                  Manage Subscription
                                </Button>
                                <Button variant="outline" size="sm" className="justify-start">
                                  <User className="h-4 w-4 mr-2" />
                                  View School Admin
                                </Button>
                                <Button variant="ghost" size="sm" className="justify-start text-red-500 hover:text-red-700">
                                  <XCircle className="h-4 w-4 mr-2" />
                                  Deactivate School
                                </Button>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </>
                  ))}
                  {(!schools || schools.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground">No schools found</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Payment Plans Tab */}
        <TabsContent value="plans">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Payment Plans</CardTitle>
                  <CardDescription>Manage subscription tiers and pricing</CardDescription>
                </div>
                <Button>
                  <DollarSign className="h-4 w-4 mr-2" />
                  Add New Plan
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Plan Name</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Billing Cycle</TableHead>
                    <TableHead>Features</TableHead>
                    <TableHead>Schools</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">
                      <div className="flex items-center">
                        <Badge className="h-4 w-4 mr-2 text-amber-500" />
                        Free Plan
                      </div>
                    </TableCell>
                    <TableCell>$0</TableCell>
                    <TableCell>N/A</TableCell>
                    <TableCell>
                      <div className="text-sm text-muted-foreground">
                        <ul className="list-disc list-inside">
                          <li>Limited modules</li>
                          <li>5 teachers max</li>
                          <li>Basic analytics</li>
                        </ul>
                      </div>
                    </TableCell>
                    <TableCell>1</TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm" disabled>Default</Button>
                    </TableCell>
                  </TableRow>
                  
                  <TableRow>
                    <TableCell className="font-medium">
                      <div className="flex items-center">
                        <Badge className="h-4 w-4 mr-2 text-blue-500" />
                        Basic Plan
                      </div>
                    </TableCell>
                    <TableCell>$99.99</TableCell>
                    <TableCell>Monthly</TableCell>
                    <TableCell>
                      <div className="text-sm text-muted-foreground">
                        <ul className="list-disc list-inside">
                          <li>All core modules</li>
                          <li>20 teachers max</li>
                          <li>Basic analytics</li>
                        </ul>
                      </div>
                    </TableCell>
                    <TableCell>0</TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm">Edit</Button>
                    </TableCell>
                  </TableRow>
                  
                  <TableRow>
                    <TableCell className="font-medium">
                      <div className="flex items-center">
                        <Badge className="h-4 w-4 mr-2 text-green-500" />
                        Professional Plan
                      </div>
                    </TableCell>
                    <TableCell>$199.99</TableCell>
                    <TableCell>Monthly</TableCell>
                    <TableCell>
                      <div className="text-sm text-muted-foreground">
                        <ul className="list-disc list-inside">
                          <li>All modules</li>
                          <li>50 teachers max</li>
                          <li>Advanced analytics</li>
                          <li>Custom branding</li>
                        </ul>
                      </div>
                    </TableCell>
                    <TableCell>0</TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm">Edit</Button>
                    </TableCell>
                  </TableRow>
                  
                  <TableRow>
                    <TableCell className="font-medium">
                      <div className="flex items-center">
                        <Badge className="h-4 w-4 mr-2 text-purple-500" />
                        Enterprise Plan
                      </div>
                    </TableCell>
                    <TableCell>$499.99</TableCell>
                    <TableCell>Monthly</TableCell>
                    <TableCell>
                      <div className="text-sm text-muted-foreground">
                        <ul className="list-disc list-inside">
                          <li>All features</li>
                          <li>Unlimited teachers</li>
                          <li>Premium support</li>
                          <li>Custom development</li>
                        </ul>
                      </div>
                    </TableCell>
                    <TableCell>0</TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm">Edit</Button>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* App Owners Tab */}
        <TabsContent value="owners">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>App Owners Management</CardTitle>
                <CardDescription>Grant or revoke app owner access to users</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Input 
                  placeholder="Search users..." 
                  className="w-64"
                  value={userSearchTerm}
                  onChange={(e) => setUserSearchTerm(e.target.value)} 
                />
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>School</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers?.map((user: any) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        {user.firstName} {user.lastName} ({user.username})
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.schoolName || "N/A"}</TableCell>
                      <TableCell>{formatDate(user.createdAt)}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {user.isOwner && (
                            <span className="px-2 py-0.5 text-xs bg-amber-100 text-amber-800 rounded-full">
                              App Owner
                            </span>
                          )}
                          {user.isAdmin && (
                            <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded-full">
                              Admin
                            </span>
                          )}
                          {user.isSchoolAdmin && (
                            <span className="px-2 py-0.5 text-xs bg-purple-100 text-purple-800 rounded-full">
                              School Admin
                            </span>
                          )}
                          {!(user.isOwner || user.isAdmin || user.isSchoolAdmin) && (
                            <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-800 rounded-full">
                              Regular User
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Dialog open={manageUserDialogOpen && selectedUser?.id === user.id} onOpenChange={(open) => {
                          if (!open) {
                            setManageUserDialogOpen(false);
                            setSelectedUser(null);
                          }
                        }}>
                          <DialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                setSelectedUser(user);
                                setManageUserDialogOpen(true);
                              }}
                            >
                              Manage Access
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Manage User Access</DialogTitle>
                              <DialogDescription>
                                Update access levels for {user.firstName} {user.lastName} ({user.username})
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                              <div className="flex items-center space-x-2">
                                <Checkbox 
                                  id="owner-access" 
                                  checked={selectedUser?.isOwner} 
                                  onCheckedChange={(checked) => {
                                    if (selectedUser) {
                                      setSelectedUser({
                                        ...selectedUser,
                                        isOwner: !!checked
                                      });
                                    }
                                  }}
                                />
                                <Label htmlFor="owner-access" className="font-medium cursor-pointer">
                                  App Owner Access
                                </Label>
                              </div>
                              <p className="text-sm text-muted-foreground pl-6">
                                App owners have full control over the entire platform, including all schools, 
                                payment plans, and user management. This is the highest level of access.
                              </p>
                            </div>
                            <DialogFooter>
                              <Button 
                                variant="outline" 
                                onClick={() => {
                                  setManageUserDialogOpen(false);
                                  setSelectedUser(null);
                                }}
                              >
                                Cancel
                              </Button>
                              <Button
                                disabled={updateOwnerMutation.isPending}
                                onClick={() => {
                                  if (selectedUser) {
                                    handleGrantOwnerAccess(selectedUser.id, selectedUser.isOwner);
                                  }
                                }}
                              >
                                {updateOwnerMutation.isPending ? (
                                  <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                    Saving...
                                  </>
                                ) : (
                                  'Save Changes'
                                )}
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!filteredUsers || filteredUsers.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground">
                        {userSearchTerm ? "No users matching your search" : "No users found"}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}