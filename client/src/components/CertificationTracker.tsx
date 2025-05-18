import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { User } from "@shared/schema";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  BadgeCheck, 
  AlertCircle, 
  Clock, 
  Award,
  CalendarDays,
  Shield,
  Heart,
  Utensils
} from "lucide-react";

type CertificationType = "fingerprint" | "cpr" | "firstAid" | "foodHandler";

interface CertificationTrackerProps {
  user: User;
  isEditing: boolean;
  setIsEditing: (value: boolean) => void;
}

export default function CertificationTracker({ user, isEditing, setIsEditing }: CertificationTrackerProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    fingerprintExpiration: user.fingerprintExpiration || "",
    cprExpiration: user.cprExpiration || "",
    firstAidExpiration: user.firstAidExpiration || "",
    foodHandlerExpiration: user.foodHandlerExpiration || "",
    jobTitle: user.jobTitle || ""
  });

  const updateCertificationsMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await apiRequest("/api/update-certifications", {
        method: "POST",
        data
      });
      return response.data;
    },
    onSuccess: () => {
      toast({
        title: "Certifications Updated",
        description: "Your certification information has been successfully updated.",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      setIsEditing(false);
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description: "There was an error updating your certifications. Please try again.",
        variant: "destructive",
      });
      console.error("Certification update error:", error);
    },
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateCertificationsMutation.mutate(formData);
  };

  // Calculate days until expiration for a certification
  const getDaysUntilExpiration = (expirationDate: string | null | undefined): number | null => {
    if (!expirationDate) return null;
    const expDate = new Date(expirationDate);
    const today = new Date();
    const diffTime = expDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Get the status and color for a certification based on days until expiration
  const getCertificationStatus = (expirationDate: string | null | undefined) => {
    const daysLeft = getDaysUntilExpiration(expirationDate);
    
    if (daysLeft === null) {
      return { status: "Not Set", color: "text-gray-500", bgColor: "bg-gray-100" };
    } else if (daysLeft < 0) {
      return { status: "Expired", color: "text-red-500", bgColor: "bg-red-100" };
    } else if (daysLeft <= 30) {
      return { status: "Expiring Soon", color: "text-amber-500", bgColor: "bg-amber-100" };
    } else {
      return { status: "Valid", color: "text-green-500", bgColor: "bg-green-100" };
    }
  };

  // Format date for display
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "Not Set";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const renderCertifications = () => {
    if (isEditing) {
      return (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-4">
            <div>
              <Label htmlFor="jobTitle">Job Title</Label>
              <Input
                id="jobTitle"
                name="jobTitle"
                value={formData.jobTitle}
                onChange={handleInputChange}
                className="mt-1"
                placeholder="e.g., Lead Teacher, Assistant Teacher, Director"
              />
            </div>
            
            <div>
              <Label htmlFor="fingerprintExpiration">Fingerprint Clearance Expiration</Label>
              <Input
                id="fingerprintExpiration"
                name="fingerprintExpiration"
                type="date"
                value={formData.fingerprintExpiration}
                onChange={handleInputChange}
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="cprExpiration">CPR Certification Expiration</Label>
              <Input
                id="cprExpiration"
                name="cprExpiration"
                type="date"
                value={formData.cprExpiration}
                onChange={handleInputChange}
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="firstAidExpiration">First Aid Certification Expiration</Label>
              <Input
                id="firstAidExpiration"
                name="firstAidExpiration"
                type="date"
                value={formData.firstAidExpiration}
                onChange={handleInputChange}
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="foodHandlerExpiration">Food Handler Card Expiration</Label>
              <Input
                id="foodHandlerExpiration"
                name="foodHandlerExpiration"
                type="date"
                value={formData.foodHandlerExpiration}
                onChange={handleInputChange}
                className="mt-1"
              />
            </div>
          </div>
          
          <div className="flex justify-end mt-6">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setIsEditing(false)} 
              className="mr-2"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={updateCertificationsMutation.isPending}>
              {updateCertificationsMutation.isPending ? (
                <div className="flex items-center">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Saving...
                </div>
              ) : (
                <>Save Certifications</>
              )}
            </Button>
          </div>
        </form>
      );
    }

    return (
      <div className="space-y-3">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2">
            <Award className="h-5 w-5 text-blue-500" />
            <div>
              <div className="text-sm font-medium text-muted-foreground">Job Title</div>
              <div className="font-medium">{user.jobTitle || "Not Set"}</div>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
            Update
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
          {/* Fingerprint Clearance */}
          <CertificationItem
            icon={<Shield className="h-5 w-5" />}
            title="Fingerprint Clearance"
            expirationDate={user.fingerprintExpiration}
          />

          {/* CPR Certification */}
          <CertificationItem
            icon={<Heart className="h-5 w-5" />}
            title="CPR Certification"
            expirationDate={user.cprExpiration}
          />

          {/* First Aid Certification */}
          <CertificationItem
            icon={<AlertCircle className="h-5 w-5" />}
            title="First Aid Certification"
            expirationDate={user.firstAidExpiration}
          />

          {/* Food Handler Card */}
          <CertificationItem
            icon={<Utensils className="h-5 w-5" />}
            title="Food Handler Card"
            expirationDate={user.foodHandlerExpiration}
          />
        </div>
      </div>
    );
  };

  // Helper component for individual certification display
  const CertificationItem = ({ 
    icon, 
    title, 
    expirationDate 
  }: { 
    icon: React.ReactNode, 
    title: string, 
    expirationDate: string | null | undefined 
  }) => {
    const { status, color, bgColor } = getCertificationStatus(expirationDate);
    const daysLeft = getDaysUntilExpiration(expirationDate);
    
    return (
      <div className={`p-3 rounded-md ${bgColor} flex justify-between`}>
        <div className="flex items-center gap-2">
          <div className={color}>
            {icon}
          </div>
          <div>
            <div className="text-sm font-medium">{title}</div>
            <div className={`text-xs ${color}`}>
              {status} {daysLeft !== null && daysLeft > 0 ? `(${daysLeft} days left)` : ""}
            </div>
          </div>
        </div>
        <div className="text-sm">
          {formatDate(expirationDate)}
        </div>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader className="bg-cyan-50">
        <CardTitle className="flex items-center">
          <BadgeCheck className="h-5 w-5 mr-2 text-cyan-600" />
          Certifications & Credentials
        </CardTitle>
        <CardDescription>
          Keep track of your professional certifications
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4">
        {renderCertifications()}
      </CardContent>
    </Card>
  );
}