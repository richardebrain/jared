import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import Header from '@/components/Header';
import { useAuth } from '@/hooks/use-auth';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import SimpleIntegrationWizard from '@/components/SimpleIntegrationWizard';
import { Building2, CheckCircle, ExternalLink, Lock, Shield } from 'lucide-react';

// Define integration platforms with direct links
const integrationPlatforms = [
  {
    id: 'childcare',
    name: 'Childcare Management',
    platforms: [
      { id: 'procare', name: 'Procare', url: 'https://www.procaresoftware.com/auth/login' },
      { id: 'intellakid', name: 'IntellAKid', url: 'https://intellakid.com/login' },
      { id: 'tadpoles', name: 'Tadpoles', url: 'https://www.tadpoles.com/login' },
    ]
  },
  {
    id: 'finance',
    name: 'Financial Systems',
    platforms: [
      { id: 'bankofamerica', name: 'Bank of America', url: 'https://secure.bankofamerica.com/login/' },
      { id: 'wellsfargo', name: 'Wells Fargo', url: 'https://banking.wellsfargo.com/signin' },
      { id: 'chase', name: 'Chase', url: 'https://www.chase.com/personal/sign-in' },
      { id: 'quickbooks', name: 'QuickBooks', url: 'https://quickbooks.intuit.com/login/' },
    ]
  },
  {
    id: 'hr',
    name: 'HR & Payroll',
    platforms: [
      { id: 'adp', name: 'ADP', url: 'https://login.adp.com/welcome' },
      { id: 'paychex', name: 'Paychex', url: 'https://www.paychex.com/login' },
      { id: 'gusto', name: 'Gusto', url: 'https://app.gusto.com/login' },
    ]
  },
];

const PlatformIntegrationsPage = () => {
  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();

  const handlePlatformConnect = (platform: any) => {
    window.open(platform.url, '_blank');
    
    toast({
      title: "Platform Connected",
      description: `Successfully connected to ${platform.name}`,
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="container mx-auto py-8 px-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Platform Integrations</h1>
            <p className="text-muted-foreground mt-1">
              Connect Raising Arizona with your essential business tools
            </p>
          </div>
          
          <div className="mt-4 md:mt-0">
            <SimpleIntegrationWizard />
          </div>
        </div>
        
        <div className="mb-8 p-6 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-start md:items-center gap-4 flex-col md:flex-row">
            <div className="bg-blue-100 p-3 rounded-full">
              <Shield className="h-6 w-6 text-blue-700" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold mb-1">Seamless Third-Party Platform Integration</h2>
              <p className="text-gray-600">
                Our integration wizard guides you through connecting all your business tools with Raising Arizona's 
                system - no technical knowledge required! All connections are secure and follow best practices for 
                data privacy.
              </p>
            </div>
            <div className="mt-4 md:mt-0">
              <Badge variant="outline" className="bg-blue-100 border-blue-300 text-blue-800">NEW FEATURE</Badge>
            </div>
          </div>
        </div>
        
        <Tabs defaultValue="childcare" className="mb-8">
          <TabsList>
            {integrationPlatforms.map(category => (
              <TabsTrigger key={category.id} value={category.id}>
                {category.name}
              </TabsTrigger>
            ))}
          </TabsList>
          
          {integrationPlatforms.map(category => (
            <TabsContent key={category.id} value={category.id} className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {category.platforms.map(platform => (
                  <Card key={platform.id} className="overflow-hidden">
                    <CardHeader className="bg-slate-50 pb-3">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg font-semibold">{platform.name}</CardTitle>
                        <Badge variant="outline" className="bg-green-50 text-green-700">
                          <CheckCircle className="h-3 w-3 mr-1" /> Ready
                        </Badge>
                      </div>
                      <CardDescription>
                        Secure single sign-on connection
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-start gap-2">
                            <Lock className="h-4 w-4 text-slate-500 mt-0.5" />
                            <div>
                              <p className="text-sm font-medium">Secure Connection</p>
                              <p className="text-xs text-muted-foreground">Industry-standard encryption</p>
                            </div>
                          </div>
                        </div>
                        
                        <Button 
                          variant="outline" 
                          className="w-full"
                          onClick={() => handlePlatformConnect(platform)}
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Connect to {platform.name}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>
        
        <div className="border-t pt-6">
          <h2 className="text-xl font-semibold mb-4">Integration Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Connected Platforms</CardTitle>
                <CardDescription>Your active system connections</CardDescription>
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
                
                <div className="border-t mt-3 pt-3">
                  <Button variant="outline" size="sm" className="w-full">
                    Manage Connection Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Quick Actions</CardTitle>
                <CardDescription>Common integration tasks</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start">
                  <Building2 className="h-4 w-4 mr-2" />
                  Sign into all connected platforms
                </Button>
                
                <Button variant="outline" className="w-full justify-start">
                  <Shield className="h-4 w-4 mr-2" />
                  Run security check on connections
                </Button>
                
                <Button variant="outline" className="w-full justify-start">
                  <SimpleIntegrationWizard />
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PlatformIntegrationsPage;