import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, ArrowRight, CheckCircle, Loader2, Puzzle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { PlatformCategory } from '@/pages/platform-integrations';

interface PlatformOption {
  id: string;
  name: string;
  description: string;
  category: PlatformCategory;
  logoUrl?: string;
}

// Platform options for the wizard
const platformOptions: PlatformOption[] = [
  {
    id: 'procare',
    name: 'Procare',
    description: 'Complete childcare management software',
    category: 'childcare'
  },
  {
    id: 'intellakid',
    name: 'IntellAKid',
    description: 'Advanced payment processing for childcare',
    category: 'childcare'
  },
  {
    id: 'brightwheels',
    name: 'Brightwheel',
    description: 'Early education management platform',
    category: 'childcare'
  },
  {
    id: 'quickbooks',
    name: 'QuickBooks',
    description: 'Financial management and accounting',
    category: 'financial'
  },
  {
    id: 'bank_of_america',
    name: 'Bank of America',
    description: 'Banking services integration',
    category: 'financial'
  },
  {
    id: 'chase',
    name: 'Chase Bank',
    description: 'Banking and financial services',
    category: 'financial'
  },
  {
    id: 'adp',
    name: 'ADP',
    description: 'HR, payroll, and benefits management',
    category: 'payroll'
  },
  {
    id: 'paychex',
    name: 'Paychex',
    description: 'Payroll and HR solutions',
    category: 'payroll'
  }
];

// Steps in the integration wizard
type WizardStep = 'select' | 'credentials' | 'connecting' | 'complete';

interface SimpleIntegrationWizardProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SimpleIntegrationWizard({ isOpen, onClose }: SimpleIntegrationWizardProps) {
  const [step, setStep] = useState<WizardStep>('select');
  const [selectedCategory, setSelectedCategory] = useState<PlatformCategory | 'all'>('all');
  const [selectedPlatform, setSelectedPlatform] = useState<PlatformOption | null>(null);
  const [credentials, setCredentials] = useState({ username: '', password: '', apiKey: '' });
  const [isConnecting, setIsConnecting] = useState(false);
  const { toast } = useToast();

  // Filter platforms based on selected category
  const filteredPlatforms = selectedCategory === 'all'
    ? platformOptions
    : platformOptions.filter(platform => platform.category === selectedCategory);

  // Handle platform selection
  const handleSelectPlatform = (platform: PlatformOption) => {
    setSelectedPlatform(platform);
    setStep('credentials');
  };

  // Handle credential input changes
  const handleCredentialChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCredentials(prev => ({ ...prev, [name]: value }));
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStep('connecting');
    setIsConnecting(true);

    // Simulate connection process
    setTimeout(() => {
      setIsConnecting(false);
      setStep('complete');
      
      toast({
        title: "Platform Connected Successfully",
        description: `${selectedPlatform?.name} has been integrated with MentorMe.`,
      });
    }, 2000);
  };

  // Close dialog and reset state
  const handleClose = () => {
    // Only allow closing on select and complete steps
    if (step === 'select' || step === 'complete') {
      onClose();
      // Reset state after animation completes
      setTimeout(() => {
        setStep('select');
        setSelectedPlatform(null);
        setCredentials({ username: '', password: '', apiKey: '' });
      }, 300);
    }
  };

  // Handle "start over" action
  const handleStartOver = () => {
    setStep('select');
    setSelectedPlatform(null);
    setCredentials({ username: '', password: '', apiKey: '' });
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md md:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {step === 'select' && "Connect a New Platform"}
            {step === 'credentials' && "Enter Platform Credentials"}
            {step === 'connecting' && "Connecting to Platform"}
            {step === 'complete' && "Platform Connected Successfully"}
          </DialogTitle>
          <DialogDescription>
            {step === 'select' && "Select a platform to integrate with MentorMe"}
            {step === 'credentials' && `Connect to ${selectedPlatform?.name} by providing your credentials`}
            {step === 'connecting' && "Please wait while we establish a secure connection"}
            {step === 'complete' && "Your platform has been successfully integrated"}
          </DialogDescription>
        </DialogHeader>

        {step === 'select' && (
          <>
            <div className="flex flex-wrap gap-2 mb-4">
              <Button 
                variant={selectedCategory === 'all' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setSelectedCategory('all')}
              >
                All
              </Button>
              <Button 
                variant={selectedCategory === 'childcare' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setSelectedCategory('childcare')}
              >
                Childcare
              </Button>
              <Button 
                variant={selectedCategory === 'financial' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setSelectedCategory('financial')}
              >
                Financial
              </Button>
              <Button 
                variant={selectedCategory === 'payroll' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setSelectedCategory('payroll')}
              >
                HR & Payroll
              </Button>
              <Button 
                variant={selectedCategory === 'learning' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setSelectedCategory('learning')}
              >
                Learning
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-80 overflow-y-auto pr-2">
              {filteredPlatforms.map((platform) => (
                <Card 
                  key={platform.id}
                  className="p-4 cursor-pointer hover:bg-gray-50 transition-colors border"
                  onClick={() => handleSelectPlatform(platform)}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      {platform.logoUrl ? (
                        <img src={platform.logoUrl} alt={platform.name} className="w-6 h-6" />
                      ) : (
                        <Puzzle className="w-5 h-5 text-primary" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-medium text-sm">{platform.name}</h3>
                      <p className="text-xs text-muted-foreground">{platform.description}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </>
        )}

        {step === 'credentials' && selectedPlatform && (
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  {selectedPlatform.logoUrl ? (
                    <img src={selectedPlatform.logoUrl} alt={selectedPlatform.name} className="w-7 h-7" />
                  ) : (
                    <Puzzle className="w-6 h-6 text-primary" />
                  )}
                </div>
                <div>
                  <h3 className="font-medium">{selectedPlatform.name}</h3>
                  <p className="text-xs text-muted-foreground">{selectedPlatform.description}</p>
                </div>
              </div>

              <Alert variant="default" className="bg-blue-50 text-blue-800 border-blue-200">
                <AlertCircle className="h-4 w-4 text-blue-800" />
                <AlertDescription className="text-xs">
                  Your credentials are securely encrypted and never stored in plain text.
                </AlertDescription>
              </Alert>

              <div className="space-y-3">
                <div className="grid w-full items-center gap-1.5">
                  <label htmlFor="username" className="text-sm font-medium">Username</label>
                  <input
                    type="text"
                    id="username"
                    name="username"
                    value={credentials.username}
                    onChange={handleCredentialChange}
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder={`${selectedPlatform.name} username or email`}
                    required
                  />
                </div>

                <div className="grid w-full items-center gap-1.5">
                  <label htmlFor="password" className="text-sm font-medium">Password</label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={credentials.password}
                    onChange={handleCredentialChange}
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="Your account password"
                    required
                  />
                </div>

                {selectedPlatform.category === 'financial' && (
                  <div className="grid w-full items-center gap-1.5">
                    <label htmlFor="apiKey" className="text-sm font-medium">API Key (Optional)</label>
                    <input
                      type="text"
                      id="apiKey"
                      name="apiKey"
                      value={credentials.apiKey}
                      onChange={handleCredentialChange}
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                      placeholder="Optional API key for enhanced features"
                    />
                  </div>
                )}
              </div>
            </div>

            <DialogFooter className="mt-6 flex justify-between">
              <Button type="button" variant="outline" onClick={handleStartOver}>
                Back
              </Button>
              <Button type="submit">
                Connect Platform
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </DialogFooter>
          </form>
        )}

        {step === 'connecting' && (
          <div className="flex flex-col items-center justify-center py-8">
            <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
            <h3 className="text-lg font-medium mb-2">Establishing Connection</h3>
            <p className="text-sm text-muted-foreground text-center max-w-xs">
              We're securely connecting to {selectedPlatform?.name}. This may take a moment...
            </p>
          </div>
        )}

        {step === 'complete' && (
          <div className="flex flex-col items-center justify-center py-6">
            <div className="bg-green-100 rounded-full p-3 mb-4">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <h3 className="text-lg font-medium mb-2">Successfully Connected!</h3>
            <p className="text-sm text-center text-muted-foreground mb-6 max-w-xs">
              {selectedPlatform?.name} has been successfully integrated with MentorMe. Your data will now sync automatically.
            </p>
            <div className="flex gap-3 w-full">
              <Button variant="outline" className="w-full" onClick={handleStartOver}>
                Connect Another Platform
              </Button>
              <Button className="w-full" onClick={handleClose}>
                Done
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}