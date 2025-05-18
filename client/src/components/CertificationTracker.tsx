import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  AlertOctagon,
  AlertTriangle,
  Calendar,
  Check,
  Clock,
  FileText,
  Fingerprint,
  Heart,
  RefreshCw,
  Save,
  UserCheck
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

type CertificationType = 'fingerprint' | 'cpr' | 'firstAid';

interface CertificationData {
  fingerprint: Date | null;
  cpr: Date | null;
  firstAid: Date | null;
}

export default function CertificationTracker({ userId }: { userId?: number }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const [certifications, setCertifications] = useState<CertificationData>({
    fingerprint: null,
    cpr: null,
    firstAid: null
  });

  // Only admins, school admins, and owners can update others' certifications
  const canEditOthers = user?.isAdmin || user?.isSchoolAdmin || user?.isOwner;
  const targetUserId = userId || user?.id;
  const isSelf = !userId || userId === user?.id;

  // Initialize certifications from user data
  useEffect(() => {
    if (user && isSelf) {
      setCertifications({
        fingerprint: user.fingerprintExpiration ? new Date(user.fingerprintExpiration) : null,
        cpr: user.cprExpiration ? new Date(user.cprExpiration) : null,
        firstAid: user.firstAidExpiration ? new Date(user.firstAidExpiration) : null
      });
    }
  }, [user, isSelf]);

  // Fetch teacher data if viewing someone else's certifications
  const { data: teacherData, isLoading: isLoadingTeacher } = useQuery({
    queryKey: ["/api/users", targetUserId],
    enabled: !!targetUserId && !isSelf,
  });

  // Initialize certifications from teacher data
  useEffect(() => {
    if (teacherData && !isSelf) {
      setCertifications({
        fingerprint: teacherData.fingerprintExpiration ? new Date(teacherData.fingerprintExpiration) : null,
        cpr: teacherData.cprExpiration ? new Date(teacherData.cprExpiration) : null,
        firstAid: teacherData.firstAidExpiration ? new Date(teacherData.firstAidExpiration) : null
      });
    }
  }, [teacherData, isSelf]);

  // Update certifications mutation
  const updateCertificationsMutation = useMutation({
    mutationFn: async (data: { 
      fingerprintExpiration: string | null, 
      cprExpiration: string | null, 
      firstAidExpiration: string | null, 
      teacherId?: number 
    }) => {
      const response = await apiRequest("/api/user/certifications", {
        method: "POST",
        data,
      });
      return response.data;
    },
    onSuccess: () => {
      toast({
        title: "Certifications Updated",
        description: "Certification information has been saved successfully.",
        variant: "default",
      });
      setUpdateDialogOpen(false);
      // Invalidate relevant queries
      if (isSelf) {
        queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      } else {
        queryClient.invalidateQueries({ queryKey: ["/api/users", targetUserId] });
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update certifications. Please try again.",
        variant: "destructive",
      });
      console.error("Error updating certifications:", error);
    },
  });

  // Format date for display
  const formatDate = (date: Date | null): string => {
    if (!date) return "Not on file";
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  };

  // Calculate days until expiration
  const getDaysUntilExpiration = (date: Date | null): number => {
    if (!date) return 0;
    const today = new Date();
    const expirationDate = new Date(date);
    const diffTime = expirationDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Check if certification is expired or expiring soon
  const getCertificationStatus = (date: Date | null): 'valid' | 'expiring' | 'expired' | 'not-on-file' => {
    if (!date) return 'not-on-file';
    
    const daysUntilExpiration = getDaysUntilExpiration(date);
    
    if (daysUntilExpiration < 0) {
      return 'expired';
    } else if (daysUntilExpiration <= 30) {
      return 'expiring';
    } else {
      return 'valid';
    }
  };

  // Get status badge for certification
  const getStatusBadge = (date: Date | null) => {
    const status = getCertificationStatus(date);
    
    switch (status) {
      case 'valid':
        return <Badge className="bg-green-100 text-green-800">Valid</Badge>;
      case 'expiring':
        return <Badge className="bg-amber-100 text-amber-800">Expiring Soon</Badge>;
      case 'expired':
        return <Badge className="bg-rose-100 text-rose-800">Expired</Badge>;
      case 'not-on-file':
        return <Badge className="bg-slate-100 text-slate-800">Not On File</Badge>;
    }
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    updateCertificationsMutation.mutate({
      fingerprintExpiration: certifications.fingerprint ? certifications.fingerprint.toISOString() : null,
      cprExpiration: certifications.cpr ? certifications.cpr.toISOString() : null,
      firstAidExpiration: certifications.firstAid ? certifications.firstAid.toISOString() : null,
      teacherId: !isSelf ? targetUserId : undefined
    });
  };

  // Handle date input changes
  const handleDateChange = (type: CertificationType, value: string) => {
    setCertifications(prev => ({
      ...prev,
      [type]: value ? new Date(value) : null
    }));
  };

  // Format date for input field
  const formatDateForInput = (date: Date | null): string => {
    if (!date) return '';
    return date.toISOString().split('T')[0];
  };

  // If loading teacher data, show loading state
  if (!isSelf && isLoadingTeacher) {
    return (
      <Card>
        <CardHeader className="bg-gradient-to-r from-slate-50 to-blue-50">
          <CardTitle className="flex items-center">
            <FileText className="h-5 w-5 mr-2 text-blue-500" />
            Certification Status
          </CardTitle>
          <CardDescription>
            Loading certification information...
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex justify-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="bg-gradient-to-r from-slate-50 to-blue-50">
        <CardTitle className="flex items-center">
          <FileText className="h-5 w-5 mr-2 text-blue-500" />
          Certification Status
        </CardTitle>
        <CardDescription>
          Track expiration dates for required certifications
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-6">
          {/* Fingerprint Clearance */}
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3">
              <div className="bg-blue-50 p-2 rounded-full">
                <Fingerprint className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <h3 className="text-base font-medium">Fingerprint Clearance</h3>
                <p className="text-sm text-muted-foreground">
                  Expires: {formatDate(certifications.fingerprint)}
                </p>
                {certifications.fingerprint && (
                  <p className="text-xs mt-1">
                    {getDaysUntilExpiration(certifications.fingerprint) < 0
                      ? <span className="text-rose-600">Expired {Math.abs(getDaysUntilExpiration(certifications.fingerprint))} days ago</span>
                      : <span className={getDaysUntilExpiration(certifications.fingerprint) <= 30 ? "text-amber-600" : "text-green-600"}>
                          {getDaysUntilExpiration(certifications.fingerprint)} days remaining
                        </span>
                    }
                  </p>
                )}
              </div>
            </div>
            <div>
              {getStatusBadge(certifications.fingerprint)}
            </div>
          </div>
          
          <Separator />
          
          {/* CPR Certification */}
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3">
              <div className="bg-red-50 p-2 rounded-full">
                <Heart className="h-6 w-6 text-red-500" />
              </div>
              <div>
                <h3 className="text-base font-medium">CPR Certification</h3>
                <p className="text-sm text-muted-foreground">
                  Expires: {formatDate(certifications.cpr)}
                </p>
                {certifications.cpr && (
                  <p className="text-xs mt-1">
                    {getDaysUntilExpiration(certifications.cpr) < 0
                      ? <span className="text-rose-600">Expired {Math.abs(getDaysUntilExpiration(certifications.cpr))} days ago</span>
                      : <span className={getDaysUntilExpiration(certifications.cpr) <= 30 ? "text-amber-600" : "text-green-600"}>
                          {getDaysUntilExpiration(certifications.cpr)} days remaining
                        </span>
                    }
                  </p>
                )}
              </div>
            </div>
            <div>
              {getStatusBadge(certifications.cpr)}
            </div>
          </div>
          
          <Separator />
          
          {/* First Aid Certification */}
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3">
              <div className="bg-green-50 p-2 rounded-full">
                <AlertOctagon className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <h3 className="text-base font-medium">First Aid Certification</h3>
                <p className="text-sm text-muted-foreground">
                  Expires: {formatDate(certifications.firstAid)}
                </p>
                {certifications.firstAid && (
                  <p className="text-xs mt-1">
                    {getDaysUntilExpiration(certifications.firstAid) < 0
                      ? <span className="text-rose-600">Expired {Math.abs(getDaysUntilExpiration(certifications.firstAid))} days ago</span>
                      : <span className={getDaysUntilExpiration(certifications.firstAid) <= 30 ? "text-amber-600" : "text-green-600"}>
                          {getDaysUntilExpiration(certifications.firstAid)} days remaining
                        </span>
                    }
                  </p>
                )}
              </div>
            </div>
            <div>
              {getStatusBadge(certifications.firstAid)}
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="bg-slate-50 flex justify-between">
        <div className="text-sm text-muted-foreground">
          <Clock className="h-4 w-4 inline mr-1" />
          Last updated: {user?.updatedAt ? new Date(user.updatedAt).toLocaleDateString() : 'Never'}
        </div>
        {(isSelf || canEditOthers) && (
          <Dialog open={updateDialogOpen} onOpenChange={setUpdateDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline">
                <Calendar className="h-4 w-4 mr-2" />
                Update Certifications
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Update Certification Dates</DialogTitle>
                <DialogDescription>
                  Enter the expiration dates for your certifications.
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleSubmit}>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="fingerprint" className="text-right">
                      Fingerprint
                    </Label>
                    <div className="col-span-3">
                      <Input
                        id="fingerprint"
                        type="date"
                        value={formatDateForInput(certifications.fingerprint)}
                        onChange={(e) => handleDateChange('fingerprint', e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="cpr" className="text-right">
                      CPR
                    </Label>
                    <div className="col-span-3">
                      <Input
                        id="cpr"
                        type="date"
                        value={formatDateForInput(certifications.cpr)}
                        onChange={(e) => handleDateChange('cpr', e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="firstAid" className="text-right">
                      First Aid
                    </Label>
                    <div className="col-span-3">
                      <Input
                        id="firstAid"
                        type="date"
                        value={formatDateForInput(certifications.firstAid)}
                        onChange={(e) => handleDateChange('firstAid', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
                
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setUpdateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={updateCertificationsMutation.isPending}>
                    {updateCertificationsMutation.isPending ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </CardFooter>
    </Card>
  );
}