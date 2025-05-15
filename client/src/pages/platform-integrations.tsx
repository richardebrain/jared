import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Helmet } from 'react-helmet';
import { useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import SimpleIntegrationWizard from '@/components/SimpleIntegrationWizard';
import { Puzzle, Shield, FileCheck, CheckCircle, XCircle } from 'lucide-react';

// Platform category types
export type PlatformCategory = 'childcare' | 'financial' | 'payroll' | 'learning';

// Platform status types
export type ConnectionStatus = 'connected' | 'disconnected' | 'pending';

// Platform integration interface
export interface PlatformIntegration {
  id: string;
  name: string;
  description: string;
  category: PlatformCategory;
  iconUrl?: string;
  status: ConnectionStatus;
  lastSynced?: string;
}

// Mock data for platform integrations
const platformIntegrations: PlatformIntegration[] = [
  {
    id: 'procare',
    name: 'Procare',
    description: 'Child care management software',
    category: 'childcare',
    status: 'connected',
    lastSynced: '2025-05-14T14:30:00Z'
  },
  {
    id: 'intellakid',
    name: 'IntellAKid',
    description: 'Childcare payment processing',
    category: 'childcare',
    status: 'connected',
    lastSynced: '2025-05-14T13:15:00Z'
  },
  {
    id: 'quickbooks',
    name: 'QuickBooks',
    description: 'Financial management software',
    category: 'financial',
    status: 'disconnected'
  },
  {
    id: 'adp',
    name: 'ADP',
    description: 'Payroll and HR services',
    category: 'payroll',
    status: 'pending'
  },
  {
    id: 'brightwheels',
    name: 'Brightwheel',
    description: 'Early education platform',
    category: 'childcare',
    status: 'disconnected'
  },
  {
    id: 'bank_of_america',
    name: 'Bank of America',
    description: 'Banking services',
    category: 'financial',
    status: 'connected',
    lastSynced: '2025-05-14T10:00:00Z'
  }
];

export default function PlatformIntegrationsPage() {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [_, setLocation] = useLocation();
  
  // Check if the user is authorized (owner/admin)
  const isAuthorized = user?.username === 'Emma' || user?.email?.includes('@raisingarizonapreschool.com');

  // Redirect unauthorized users
  useEffect(() => {
    if (user && !isAuthorized) {
      setLocation('/dashboard');
      toast({
        title: "Access Restricted",
        description: "Platform integrations are only accessible by administrators.",
        variant: "destructive"
      });
    }
  }, [user, isAuthorized, setLocation, toast]);
  
  // Filter platforms based on active tab
  const filteredPlatforms = activeTab === 'all' 
    ? platformIntegrations 
    : platformIntegrations.filter(platform => platform.category === activeTab);

  const connectionCount = platformIntegrations.filter(p => p.status === 'connected').length;
  const totalPlatforms = platformIntegrations.length;

  const handleStatusChange = (platformId: string, newStatus: ConnectionStatus) => {
    // Would handle the status change in a real implementation
    toast({
      title: "Connection status updated",
      description: `Platform ${platformId} is now ${newStatus}`,
    });
  };

  const openWizard = () => setIsWizardOpen(true);
  const closeWizard = () => setIsWizardOpen(false);

  return (
    <>
      <Helmet>
        <title>Platform Integrations | MentorMe</title>
        <meta name="description" content="Connect your MentorMe application with third-party platforms for seamless data synchronization" />
      </Helmet>

      <div className="container max-w-screen-xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight mb-2">Platform Integrations</h1>
          <p className="text-muted-foreground">Connect and manage third-party platforms</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium">Connected Platforms</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-2">
                <span className="text-3xl font-bold text-primary">{connectionCount}</span>
                <span className="text-sm text-muted-foreground pb-1">of {totalPlatforms}</span>
              </div>
            </CardContent>
            <CardFooter className="pt-0">
              <Button variant="outline" size="sm" onClick={openWizard}>
                <Puzzle className="h-4 w-4 mr-2" />
                Add Integration
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium">Data Security</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-green-500" />
                <span className="text-sm">All connections are secure and encrypted</span>
              </div>
            </CardContent>
            <CardFooter className="pt-0">
              <Button variant="outline" size="sm" className="text-xs">
                View Security Details
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium">Last Sync</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <FileCheck className="h-5 w-5 text-blue-500" />
                <span className="text-sm">All data synchronized 35 minutes ago</span>
              </div>
            </CardContent>
            <CardFooter className="pt-0">
              <Button variant="outline" size="sm" className="text-xs">
                Sync Now
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* Main content */}
        <div className="bg-white rounded-lg shadow-sm border mb-6">
          <div className="p-4 border-b">
            <h2 className="text-xl font-semibold">Manage Integrations</h2>
            <p className="text-sm text-muted-foreground">Connect your platforms for seamless data sharing</p>
          </div>

          <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="p-4">
            <div className="border-b pb-2 mb-4">
              <TabsList className="grid grid-cols-5 w-full max-w-2xl">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="childcare">Childcare</TabsTrigger>
                <TabsTrigger value="financial">Financial</TabsTrigger>
                <TabsTrigger value="payroll">HR & Payroll</TabsTrigger>
                <TabsTrigger value="learning">Learning</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value={activeTab} className="mt-0">
              <div className="grid grid-cols-1 gap-4">
                {filteredPlatforms.map((platform) => (
                  <div key={platform.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-center">
                      <div className="h-10 w-10 bg-gray-100 rounded-md flex items-center justify-center mr-4">
                        {platform.iconUrl ? (
                          <img src={platform.iconUrl} alt={platform.name} className="h-6 w-6" />
                        ) : (
                          <Puzzle className="h-6 w-6 text-gray-500" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-medium">{platform.name}</h3>
                        <p className="text-sm text-muted-foreground">{platform.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {platform.status === 'connected' && (
                        <div className="flex items-center text-sm">
                          <span className="text-muted-foreground mr-2">Last synced:</span>
                          <span>{new Date(platform.lastSynced!).toLocaleString()}</span>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-2">
                        {platform.status === 'connected' ? (
                          <>
                            <span className="flex items-center text-sm text-green-600">
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Connected
                            </span>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleStatusChange(platform.id, 'disconnected')}
                            >
                              Disconnect
                            </Button>
                          </>
                        ) : platform.status === 'pending' ? (
                          <span className="flex items-center text-sm text-amber-600">
                            <span className="h-2 w-2 bg-amber-500 rounded-full mr-2"></span>
                            Pending Authorization
                          </span>
                        ) : (
                          <>
                            <span className="flex items-center text-sm text-red-600">
                              <XCircle className="h-4 w-4 mr-1" />
                              Disconnected
                            </span>
                            <Button 
                              variant="default" 
                              size="sm"
                              onClick={() => handleStatusChange(platform.id, 'connected')}
                            >
                              Connect
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {filteredPlatforms.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No integrations found in this category</p>
                    <Button variant="outline" className="mt-4" onClick={openWizard}>
                      Add Integration
                    </Button>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Need Help Setting Up Integrations?</CardTitle>
            <CardDescription>Our team can help you connect your platforms quickly and securely</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              If you're experiencing any issues connecting your platforms or need assistance with data synchronization, 
              our technical support team is available to help. We can guide you through the process or set up the 
              integrations for you.
            </p>
          </CardContent>
          <CardFooter className="flex justify-end gap-2">
            <Button variant="outline">View Documentation</Button>
            <Button>Contact Support</Button>
          </CardFooter>
        </Card>
      </div>

      {/* Integration Wizard */}
      {isWizardOpen && (
        <SimpleIntegrationWizard 
          isOpen={isWizardOpen} 
          onClose={closeWizard}
        />
      )}
    </>
  );
}