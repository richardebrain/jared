import React, { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import Header from "@/components/Header";
import { Separator } from "@/components/ui/separator";

export default function BusinessSignupSimplified() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  // Form fields
  const [schoolName, setSchoolName] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [planType, setPlanType] = useState("annual");
  const [schoolLogo, setSchoolLogo] = useState<File | null>(null);
  const [schoolLogoPreview, setSchoolLogoPreview] = useState<string | null>(null);
  
  // Form validation
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Handle logo file upload
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/svg+xml'];
    if (!validTypes.includes(file.type)) {
      toast({
        title: "Invalid File Type",
        description: "Please upload a JPG, PNG, or SVG image.",
        variant: "destructive"
      });
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Logo image must be less than 2MB.",
        variant: "destructive"
      });
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setSchoolLogoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
    
    setSchoolLogo(file);
  };

  // Validate form
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!schoolName.trim()) {
      newErrors.schoolName = "School name is required";
    }
    
    if (!contactEmail.trim()) {
      newErrors.contactEmail = "Contact email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
      newErrors.contactEmail = "Please enter a valid email address";
    }
    
    if (!adminPassword.trim()) {
      newErrors.adminPassword = "Admin password is required";
    } else if (adminPassword.length < 8) {
      newErrors.adminPassword = "Password must be at least 8 characters";
    }
    
    if (adminPassword !== confirmPassword) {
      newErrors.confirmPassword = "Passwords don't match";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast({
        title: "Please Fix Form Errors",
        description: "There are validation errors that need to be fixed before proceeding.",
        variant: "destructive"
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Register school
      const registrationResponse = await fetch("/api/schools/register", {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          schoolName,
          address: address || "",
          city: city || "",
          state: state || "",
          zipCode: zipCode || "",
          contactEmail,
          contactPhone: contactPhone || "",
          adminPassword,
          planType,
        }),
      });
      
      // Handle registration response
      if (!registrationResponse.ok) {
        const data = await registrationResponse.json();
        throw new Error(data.message || "Failed to register school");
      }
      
      const registrationData = await registrationResponse.json();
      
      toast({
        title: "Registration Successful",
        description: schoolLogo 
          ? "Your school has been registered! Uploading logo..." 
          : "Your school has been registered successfully!",
      });
      
      // Upload logo if provided
      if (schoolLogo) {
        try {
          const logoFormData = new FormData();
          logoFormData.append("schoolLogo", schoolLogo);
          const schoolId = registrationData.school?.id || registrationData.schoolId;
          
          if (!schoolId) {
            toast({
              title: "Logo Upload Skipped",
              description: "Your school was registered successfully, but we couldn't upload your logo.",
              variant: "warning"
            });
          } else {
            logoFormData.append("schoolId", schoolId.toString());
            
            const logoResponse = await fetch("/api/schools/upload-logo", {
              method: "POST",
              body: logoFormData,
            });
            
            if (!logoResponse.ok) {
              toast({
                title: "Logo Upload Issue",
                description: "Your school was registered successfully, but there was an issue uploading your logo.",
                variant: "warning"
              });
            } else {
              toast({
                title: "Registration Complete",
                description: "Your school was registered and your logo was uploaded successfully!",
              });
            }
          }
        } catch (logoError) {
          toast({
            title: "Logo Upload Failed",
            description: "Your school was registered, but we encountered an error uploading your logo.",
            variant: "warning"
          });
        }
      }
      
      // Redirect to login page after a short delay
      setTimeout(() => {
        navigate("/login");
      }, 2000);
      
    } catch (error: any) {
      toast({
        title: "Registration Failed",
        description: error?.message || "There was an error registering your school.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-10">
      <Header />
      <div className="container max-w-3xl px-4 pt-8">
        <h1 className="text-3xl font-bold mb-2">School Registration</h1>
        <p className="text-slate-600 mb-6">
          Register your preschool or childcare center to use MentorMe for teacher training and professional development.
        </p>
        
        <Card>
          <CardHeader>
            <CardTitle>School Information</CardTitle>
            <CardDescription>
              Please provide details about your school and subscription preferences
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* School Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">School Details</h3>
                <Separator />
                
                <div className="space-y-2">
                  <Label htmlFor="school-name">
                    School Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="school-name"
                    placeholder="Preschool Name"
                    value={schoolName}
                    onChange={(e) => setSchoolName(e.target.value)}
                    className={errors.schoolName ? "border-red-500" : ""}
                  />
                  {errors.schoolName && (
                    <p className="text-red-500 text-sm">{errors.schoolName}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    placeholder="123 Main St"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      placeholder="City"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      placeholder="State"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="zip-code">ZIP Code</Label>
                    <Input
                      id="zip-code"
                      placeholder="12345"
                      value={zipCode}
                      onChange={(e) => setZipCode(e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="contact-email">
                    Contact Email <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="contact-email"
                    type="email"
                    placeholder="contact@yourschool.com"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    className={errors.contactEmail ? "border-red-500" : ""}
                  />
                  {errors.contactEmail && (
                    <p className="text-red-500 text-sm">{errors.contactEmail}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="contact-phone">Contact Phone</Label>
                  <Input
                    id="contact-phone"
                    placeholder="(555) 123-4567"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                  />
                </div>
              </div>
              
              {/* Admin Password */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Admin Access</h3>
                <Separator />
                <p className="text-sm text-slate-600">
                  Set an administrator password to access your school's dashboard and manage settings
                </p>
                
                <div className="space-y-2">
                  <Label htmlFor="admin-password">
                    Admin Password <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="admin-password"
                    type="password"
                    placeholder="Set a secure password"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    className={errors.adminPassword ? "border-red-500" : ""}
                  />
                  {errors.adminPassword && (
                    <p className="text-red-500 text-sm">{errors.adminPassword}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">
                    Confirm Password <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={errors.confirmPassword ? "border-red-500" : ""}
                  />
                  {errors.confirmPassword && (
                    <p className="text-red-500 text-sm">{errors.confirmPassword}</p>
                  )}
                </div>
              </div>
              
              {/* School Logo */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">School Logo</h3>
                <Separator />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="school-logo">Upload School Logo (Optional)</Label>
                    <Input
                      id="school-logo"
                      type="file"
                      accept="image/jpeg,image/png,image/svg+xml"
                      onChange={handleLogoUpload}
                      className="cursor-pointer"
                    />
                    <p className="text-sm text-slate-500">
                      Upload JPG, PNG or SVG (max 2MB)
                    </p>
                  </div>
                  
                  <div className="flex items-center justify-center border rounded-md p-4 min-h-[120px]">
                    {schoolLogoPreview ? (
                      <img
                        src={schoolLogoPreview}
                        alt="School logo preview"
                        className="max-h-24 max-w-full object-contain"
                      />
                    ) : (
                      <p className="text-sm text-slate-500 text-center">
                        Logo preview will appear here
                      </p>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Subscription Plan */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Subscription Plan</h3>
                <Separator />
                
                <div className="space-y-2">
                  <Label htmlFor="plan-type">Select Plan</Label>
                  <Select
                    value={planType}
                    onValueChange={(value) => setPlanType(value)}
                  >
                    <SelectTrigger id="plan-type">
                      <SelectValue placeholder="Select a plan" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Monthly ($250/month)</SelectItem>
                      <SelectItem value="annual">Annual ($2,500/year - save $500)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="bg-primary/5 p-4 rounded-md">
                  <p className="text-sm">
                    <strong>Monthly Plan:</strong> $250 per month, billed monthly
                  </p>
                  <p className="text-sm mt-2">
                    <strong>Annual Plan:</strong> $2,500 billed annually (save $500 compared to monthly)
                  </p>
                </div>
              </div>
              
              <CardFooter className="flex justify-end px-0 pt-4">
                <Button
                  type="submit"
                  className="w-full md:w-auto"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <span className="mr-2">Registering...</span>
                      <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                    </>
                  ) : (
                    "Complete Registration"
                  )}
                </Button>
              </CardFooter>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}