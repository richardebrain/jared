import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { FileCheck, Calendar, AlertTriangle, CheckCircle, Edit } from "lucide-react";

interface Credential {
  name: string;
  type: 'fingerprint' | 'cpr' | 'firstAid' | 'foodHandler';
  expirationDate: string | null;
  field: 'fingerprintExpiration' | 'cprExpiration' | 'firstAidExpiration' | 'foodHandlerExpiration';
  icon: React.ReactNode;
}

interface CertificationTrackerProps {
  userId: number;
  fingerprintExpiration: string | null;
  cprExpiration: string | null;
  firstAidExpiration: string | null;
  foodHandlerExpiration: string | null;
}

const CertificationTracker: React.FC<CertificationTrackerProps> = ({
  userId,
  fingerprintExpiration,
  cprExpiration,
  firstAidExpiration,
  foodHandlerExpiration,
}) => {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCredential, setEditingCredential] = useState<Credential | null>(null);
  const [expirationDate, setExpirationDate] = useState("");

  // Define our credentials
  const credentials: Credential[] = [
    {
      name: "Fingerprint Card",
      type: "fingerprint",
      expirationDate: fingerprintExpiration,
      field: "fingerprintExpiration",
      icon: <FileCheck className="h-5 w-5 text-blue-500" />,
    },
    {
      name: "CPR Certification",
      type: "cpr",
      expirationDate: cprExpiration,
      field: "cprExpiration",
      icon: <FileCheck className="h-5 w-5 text-red-500" />,
    },
    {
      name: "First Aid Certification",
      type: "firstAid",
      expirationDate: firstAidExpiration,
      field: "firstAidExpiration",
      icon: <FileCheck className="h-5 w-5 text-green-500" />,
    },
    {
      name: "Food Handler Card",
      type: "foodHandler",
      expirationDate: foodHandlerExpiration,
      field: "foodHandlerExpiration",
      icon: <FileCheck className="h-5 w-5 text-amber-500" />,
    },
  ];

  // Update credential mutation
  const updateCredentialMutation = useMutation({
    mutationFn: async (data: { field: string; date: string }) => {
      const response = await apiRequest("/api/update-credential", {
        method: "POST",
        data: {
          userId,
          field: data.field,
          date: data.date,
        },
      });
      return response.data;
    },
    onSuccess: () => {
      toast({
        title: "Credential Updated",
        description: "Your credential information has been successfully updated.",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      setIsDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description: "There was an error updating your credential. Please try again.",
        variant: "destructive",
      });
      console.error("Credential update error:", error);
    },
  });

  const handleEdit = (credential: Credential) => {
    setEditingCredential(credential);
    setExpirationDate(credential.expirationDate || "");
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (editingCredential) {
      updateCredentialMutation.mutate({
        field: editingCredential.field,
        date: expirationDate,
      });
    }
  };

  // Check if credential is expired or expiring soon (30 days)
  const getCredentialStatus = (expirationDate: string | null) => {
    if (!expirationDate) return "missing";
    
    const today = new Date();
    const expDate = new Date(expirationDate);
    
    if (expDate < today) {
      return "expired";
    }
    
    // Check if within 30 days
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 30);
    
    if (expDate <= thirtyDaysFromNow) {
      return "expiring-soon";
    }
    
    return "valid";
  };

  // Format date in a readable format
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Not Set";
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <Card className="h-full">
      <CardHeader className="bg-blue-50">
        <CardTitle className="flex items-center text-lg">
          <Calendar className="h-5 w-5 mr-2 text-blue-600" />
          Credentials & Certifications
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <div className="space-y-4">
          {credentials.map((credential) => {
            const status = getCredentialStatus(credential.expirationDate);
            
            return (
              <div 
                key={credential.type}
                className={`p-3 rounded-md flex justify-between items-center ${
                  status === 'expired' ? 'bg-red-50 border border-red-200' :
                  status === 'expiring-soon' ? 'bg-amber-50 border border-amber-200' :
                  status === 'missing' ? 'bg-gray-50 border border-gray-200' :
                  'bg-green-50 border border-green-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  {credential.icon}
                  <div>
                    <p className="font-medium">{credential.name}</p>
                    <p className="text-sm text-gray-600">
                      {status === 'expired' && (
                        <span className="flex items-center text-red-600">
                          <AlertTriangle className="h-3 w-3 mr-1" /> Expired: {formatDate(credential.expirationDate)}
                        </span>
                      )}
                      {status === 'expiring-soon' && (
                        <span className="flex items-center text-amber-600">
                          <AlertTriangle className="h-3 w-3 mr-1" /> Expiring: {formatDate(credential.expirationDate)}
                        </span>
                      )}
                      {status === 'missing' && (
                        <span className="text-gray-500">Not set</span>
                      )}
                      {status === 'valid' && (
                        <span className="flex items-center text-green-600">
                          <CheckCircle className="h-3 w-3 mr-1" /> Valid until: {formatDate(credential.expirationDate)}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => handleEdit(credential)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
              </div>
            );
          })}
        </div>
      </CardContent>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update {editingCredential?.name}</DialogTitle>
            <DialogDescription>
              Enter the expiration date for your {editingCredential?.name.toLowerCase()}.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <Label htmlFor="expirationDate">Expiration Date</Label>
            <Input
              id="expirationDate"
              type="date"
              value={expirationDate}
              onChange={(e) => setExpirationDate(e.target.value)}
              className="mt-1"
            />
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSave}
              disabled={updateCredentialMutation.isPending}
            >
              {updateCredentialMutation.isPending ? (
                <div className="flex items-center">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Saving...
                </div>
              ) : (
                'Save'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default CertificationTracker;