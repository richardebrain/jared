import React, { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from "@/components/ui/tabs";
import { 
  Building2, 
  Mail, 
  Phone, 
  Shield,
  UploadCloud,
  CreditCard,
  CheckCircle2,
  AlertTriangle,
  Users,
  Briefcase
} from "lucide-react";
import Header from "@/components/Header";
import { Separator } from "@/components/ui/separator";

export default function BusinessSignupPage() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("school-info");
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [progress, setProgress] = useState(1); // Track progress through signup flow
  
  // School information
  const [schoolName, setSchoolName] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [schoolLogo, setSchoolLogo] = useState<File | null>(null);
  const [schoolLogoPreview, setSchoolLogoPreview] = useState<string | null>(null);
  
  // Admin account
  const [adminPassword, setAdminPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [adminPasswordError, setAdminPasswordError] = useState("");
  
  // Subscription information - defaults to annual for better value
  const [planType, setPlanType] = useState("annual");

  // Handle logo file upload
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
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

      // Create preview safely
      const reader = new FileReader();
      reader.onloadend = () => {
        try {
          setSchoolLogoPreview(reader.result as string);
        } catch (error) {
          console.error("Error setting logo preview:", error);
          // Don't throw error, just log it
        }
      };
      reader.onerror = () => {
        console.error("Error reading file");
        toast({
          title: "Upload Error",
          description: "There was a problem processing your image.",
          variant: "destructive"
        });
      };
      reader.readAsDataURL(file);
      
      setSchoolLogo(file);
    } catch (error) {
      console.error("Logo upload error:", error);
      toast({
        title: "Upload Error",
        description: "There was a problem with your file upload.",
        variant: "destructive"
      });
    }
  };

  const handleNextStep = () => {
    if (activeTab === "school-info") {
      // Validate school information
      if (!schoolName || !contactEmail) {
        toast({
          title: "Missing Information",
          description: "Please provide your school name and contact email.",
          variant: "destructive"
        });
        return;
      }
      
      // Move to next step
      setActiveTab("admin-access");
      setProgress(2);
      
      // Scroll to top for better UX
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (activeTab === "admin-access") {
      // Validate admin password
      if (!adminPassword) {
        setAdminPasswordError("Please set an admin password");
        return;
      }
      
      if (adminPassword.length < 8) {
        setAdminPasswordError("Password must be at least 8 characters");
        return;
      }
      
      if (adminPassword !== confirmPassword) {
        setAdminPasswordError("Passwords do not match");
        return;
      }
      
      setAdminPasswordError("");
      setActiveTab("subscription");
      setProgress(3);
      
      // Scroll to top for better UX
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const validateForm = () => {
    // Clear any existing error states
    setFormErrors({});
    let currentErrors: Record<string, string> = {};
    
    // Validate all required fields
    if (!schoolName.trim()) {
      currentErrors.schoolName = "School name is required";
    }
    
    if (!contactEmail.trim()) {
      currentErrors.contactEmail = "Contact email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
      currentErrors.contactEmail = "Please enter a valid email address";
    }
    
    if (!adminPassword.trim()) {
      currentErrors.adminPassword = "Admin password is required";
    } else if (adminPassword.length < 8) {
      currentErrors.adminPassword = "Password must be at least 8 characters";
    }
    
    if (adminPassword !== confirmPassword) {
      currentErrors.confirmPassword = "Passwords don't match";
    }
    
    if (!planType) {
      currentErrors.planType = "Please select a subscription plan";
    }
    
    setFormErrors(currentErrors);
    return Object.keys(currentErrors).length === 0;
  };
  
  const handleConfirmation = () => {
    if (validateForm()) {
      setShowConfirmation(true);
    } else {
      toast({
        title: "Please Fix Form Errors",
        description: "There are validation errors that need to be fixed before proceeding.",
        variant: "destructive"
      });
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if we're on the final tab, otherwise just handle navigation
    if (activeTab !== "subscription") {
      handleNextStep();
      return;
    }
    
    // If we're showing confirmation already and continuing with submission
    if (showConfirmation) {
      setIsLoading(true);
    } else {
      // Show confirmation dialog first
      handleConfirmation();
      return;
    }
    
    try {
      // Validation has already happened if we reach this point
      
      // Prepare form data for multipart submission
      const formData = new FormData();
      formData.append("schoolName", schoolName);
      formData.append("address", address || "");
      formData.append("city", city || "");
      formData.append("state", state || "");
      formData.append("zipCode", zipCode || "");
      formData.append("contactEmail", contactEmail);
      formData.append("contactPhone", contactPhone || "");
      formData.append("adminPassword", adminPassword);
      formData.append("planType", planType);
      
      // Simple basic registration without logo first for better reliability
      console.log("Starting registration process...");
      
      try {
        // Step 1: Try a simple registration first without the logo
        // This helps identify if the issue is in the base registration or the file upload
        console.log("Registering school basic information...");
        const basicRegistrationResponse = await fetch("/api/schools/register", {
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
        
        // Check response and handle parsing errors
        let registrationData;
        try {
          registrationData = await basicRegistrationResponse.json();
          console.log("Registration response received:", registrationData);
        } catch (parseError) {
          console.error("Failed to parse registration response:", parseError);
          registrationData = { success: false, message: "Failed to parse server response" };
        }
        
        if (!basicRegistrationResponse.ok) {
          const errorMessage = registrationData.message || "Failed to register school";
          console.error("Registration error:", errorMessage);
          throw new Error(errorMessage);
        }
        
        // Success! Logo upload is a secondary concern
        toast({
          title: "Registration Successful",
          description: schoolLogo 
            ? "Your school has been registered! Uploading logo..." 
            : "Your school has been registered successfully!",
          variant: "default"
        });
        
        // If we have a logo, try to upload it separately - this way logo failures won't prevent registration
        if (schoolLogo) {
          try {
            console.log("Uploading school logo separately...");
            const logoFormData = new FormData();
            logoFormData.append("schoolLogo", schoolLogo);
            // Make sure we're using the correct property from the response
            const schoolId = registrationData.school?.id || registrationData.schoolId;
            
            if (!schoolId) {
              console.error("Missing school ID in registration response:", registrationData);
              toast({
                title: "Logo Upload Skipped",
                description: "Your school was registered successfully, but we couldn't upload your logo due to missing school ID.",
                variant: "warning"
              });
            } else {
              logoFormData.append("schoolId", schoolId.toString());
              
              console.log(`Uploading logo for school ID: ${schoolId}`);
              
              // Use a dedicated upload endpoint with improved error handling
              const logoResponse = await fetch("/api/schools/upload-logo", {
                method: "POST",
                body: logoFormData,
              })
              .catch(error => {
                console.error("Network error during logo upload:", error);
                throw new Error("Network error during logo upload. Please try again.");
              });
              
              // Try to parse the response carefully to prevent freezing
              let logoData;
              try {
                logoData = await logoResponse.json();
                console.log("Logo upload response:", logoData);
              } catch (parseError) {
                console.error("Failed to parse logo upload response:", parseError);
                logoData = { success: false, message: "Failed to process logo upload response" };
              }
              
              if (!logoResponse.ok) {
                console.warn("Logo upload unsuccessful but registration succeeded:", 
                  logoData?.message || "Unknown error");
                toast({
                  title: "Logo Upload Issue",
                  description: "Your school was registered successfully, but there was an issue uploading your logo. You can add it later from settings.",
                  variant: "warning"
                });
              } else {
                console.log("Logo uploaded successfully:", logoData);
                // Display success message for both registration and logo
                toast({
                  title: "Registration Complete",
                  description: "Your school was registered and your logo was uploaded successfully!",
                  variant: "default"
                });
              }
            }
          } catch (logoError) {
            console.error("Error during logo upload:", logoError);
            // Don't fail the whole registration for logo issues
            toast({
              title: "Logo Upload Failed",
              description: "Your school was registered, but we encountered an error uploading your logo. You can add it later from settings.",
              variant: "warning"
            });
            
            // Add a small delay before redirecting to ensure error messages are seen
            await new Promise(resolve => setTimeout(resolve, 1500));
          }
        }
        
        // Redirect to login page
        navigate("/login");
      } catch (registrationError) {
        console.error("Error during registration:", registrationError);
        throw registrationError;
      }
    } catch (error: any) {
      console.error("Registration error:", error);
      toast({
        title: "Registration Failed",
        description: error?.message || "There was an error registering your school.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Function to render error message for a field
  const renderError = (field: string) => {
    if (formErrors[field]) {
      return <p className="text-red-500 text-sm mt-1">{formErrors[field]}</p>;
    }
    return null;
  };
  
  return (
    <>
      <Header />
      
      {/* Confirmation Dialog */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl">
            <CardHeader className="bg-primary/5">
              <CardTitle className="flex items-center">
                <CheckCircle2 className="h-5 w-5 mr-2 text-green-500" />
                Confirm School Registration
              </CardTitle>
              <CardDescription>
                Please review the information below before completing your registration
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium">School Information</h3>
                  <Separator className="my-2" />
                  <div className="grid grid-cols-2 gap-y-2 text-sm">
                    <div className="font-medium">School Name:</div>
                    <div>{schoolName}</div>
                    <div className="font-medium">Address:</div>
                    <div>{address || 'Not provided'}</div>
                    <div className="font-medium">Location:</div>
                    <div>{[city, state, zipCode].filter(Boolean).join(', ') || 'Not provided'}</div>
                    <div className="font-medium">Contact Email:</div>
                    <div>{contactEmail}</div>
                    <div className="font-medium">Contact Phone:</div>
                    <div>{contactPhone || 'Not provided'}</div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium">Subscription Details</h3>
                  <Separator className="my-2" />
                  <div className="grid grid-cols-2 gap-y-2 text-sm">
                    <div className="font-medium">Plan:</div>
                    <div className="capitalize">{planType} Plan</div>
                    <div className="font-medium">Cost:</div>
                    <div>{planType === 'monthly' ? '$250 per month' : '$2,500 per year (save $500)'}</div>
                    <div className="font-medium">Monthly Average:</div>
                    <div>${planType === 'monthly' ? '250' : '208'}/month</div>
                  </div>
                </div>
                
                <div className="bg-amber-50 border border-amber-200 rounded-md p-3 text-amber-800 text-sm">
                  By completing this registration, you agree to the terms of service and privacy policy.
                  Your subscription will begin immediately upon successful registration.
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between gap-2">
              <Button 
                variant="outline" 
                onClick={() => setShowConfirmation(false)}
                disabled={isLoading}
              >
                Go Back
              </Button>
              <Button 
                onClick={(e) => {
                  e.preventDefault();
                  handleSubmit(e);
                }}
                disabled={isLoading}
                className="bg-primary text-white"
              >
                {isLoading ? (
                  <>
                    <span className="mr-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    </span>
                    Completing Registration...
                  </>
                ) : (
                  'Complete Registration'
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}
      
      <div className="container max-w-5xl mx-auto py-10 px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Register Your School</h1>
          <p className="text-muted-foreground">
            Join the MentorMe platform and unlock powerful teacher training tools
          </p>
        </div>
        
        <Tabs 
          value={activeTab} 
          onValueChange={setActiveTab}
          className="mb-8"
        >
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="school-info">School Information</TabsTrigger>
            <TabsTrigger value="admin-access">Admin Access</TabsTrigger>
            <TabsTrigger value="subscription">Subscription</TabsTrigger>
          </TabsList>
          
          <form onSubmit={handleSubmit}>
            <TabsContent value="school-info" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Building2 className="h-5 w-5 mr-2 text-primary" />
                    School Information
                  </CardTitle>
                  <CardDescription>
                    Provide basic information about your school
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="school-name">School Name <span className="text-red-500">*</span></Label>
                    <Input
                      id="school-name"
                      placeholder="e.g., Little Stars Preschool"
                      value={schoolName}
                      onChange={(e) => setSchoolName(e.target.value)}
                      required
                      className={formErrors.schoolName ? "border-red-500" : ""}
                    />
                    {renderError("schoolName")}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="address">Street Address</Label>
                    <Input
                      id="address"
                      placeholder="Street address"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
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
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="zip-code">Zip Code</Label>
                    <Input
                      id="zip-code"
                      placeholder="Zip Code"
                      value={zipCode}
                      onChange={(e) => setZipCode(e.target.value)}
                    />
                  </div>
                  
                  <Separator className="my-4" />
                  
                  <div className="space-y-2">
                    <Label htmlFor="contact-email">Contact Email <span className="text-red-500">*</span></Label>
                    <Input
                      id="contact-email"
                      type="email"
                      placeholder="contact@yourschool.com"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      required
                    />
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
                  
                  <Separator className="my-4" />
                  
                  <div className="space-y-3">
                    <Label>School Logo</Label>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="border rounded-md p-4 space-y-3">
                        <div className="text-sm text-muted-foreground">
                          Upload your school logo. This will replace the MentorMe logo in your school's dashboard.
                        </div>
                        
                        <div className="flex items-center justify-center">
                          <label htmlFor="logo-upload" className="cursor-pointer">
                            <div className="border-2 border-dashed rounded-md px-4 py-8 flex flex-col items-center justify-center gap-2 hover:bg-muted/30 transition-colors">
                              <div className="bg-primary/10 p-2 rounded-full">
                                <UploadCloud className="h-6 w-6 text-primary" />
                              </div>
                              <div className="flex flex-col items-center gap-1">
                                <span className="text-sm font-medium">Click to upload</span>
                                <span className="text-xs text-muted-foreground">SVG, PNG, JPG</span>
                                <span className="text-xs text-muted-foreground">Max 2MB</span>
                              </div>
                            </div>
                            <Input 
                              id="logo-upload" 
                              type="file"
                              accept=".jpg,.jpeg,.png,.svg"
                              className="hidden"
                              onChange={handleLogoUpload}
                            />
                          </label>
                        </div>
                      </div>
                      
                      <div className="border rounded-md p-4">
                        <div className="mb-3 text-sm font-medium">Preview</div>
                        <div className="flex items-center justify-center h-[120px] bg-slate-50 rounded-md">
                          {schoolLogoPreview ? (
                            <img 
                              src={schoolLogoPreview} 
                              alt="School logo preview" 
                              className="max-h-full max-w-full object-contain"
                            />
                          ) : (
                            <div className="text-sm text-muted-foreground">Logo preview will appear here</div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end">
                  <Button 
                    type="button" 
                    onClick={handleNextStep}
                    disabled={isLoading}
                  >
                    Next: Admin Access
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
            
            <TabsContent value="admin-access" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Shield className="h-5 w-5 mr-2 text-primary" />
                    Admin Access
                  </CardTitle>
                  <CardDescription>
                    Set up an admin password for your school dashboard
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="bg-amber-50 border border-amber-200 rounded-md p-4 text-amber-800">
                    <h3 className="font-semibold mb-1 flex items-center">
                      <Shield className="h-4 w-4 mr-2" />
                      Important Security Information
                    </h3>
                    <p className="text-sm">
                      This admin password will be used to access your school's dashboard and manage 
                      teacher accounts. This is separate from your personal login credentials.
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="admin-password">
                      Admin Password <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="admin-password"
                      type="password"
                      placeholder="Create a secure password"
                      value={adminPassword}
                      onChange={(e) => {
                        setAdminPassword(e.target.value);
                        setAdminPasswordError("");
                      }}
                      className={adminPasswordError ? "border-red-500" : ""}
                    />
                    {adminPasswordError && (
                      <p className="text-sm text-red-500">{adminPasswordError}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Password must be at least 8 characters long
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">
                      Confirm Admin Password <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      placeholder="Confirm your password"
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        setAdminPasswordError("");
                      }}
                      className={adminPasswordError ? "border-red-500" : ""}
                    />
                  </div>
                  
                  <div className="bg-blue-50 border border-blue-200 rounded-md p-4 text-blue-800">
                    <h3 className="font-semibold mb-1">Security Best Practices:</h3>
                    <ul className="text-sm list-disc pl-5 space-y-1">
                      <li>Use a combination of uppercase and lowercase letters</li>
                      <li>Include numbers and special characters</li>
                      <li>Avoid using easily guessable information</li>
                      <li>Do not share this password with non-administrative staff</li>
                    </ul>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setActiveTab("school-info")}
                    disabled={isLoading}
                  >
                    Back
                  </Button>
                  <Button 
                    type="button" 
                    onClick={handleNextStep}
                    disabled={isLoading}
                  >
                    Next: Subscription
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
            
            <TabsContent value="subscription" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <CreditCard className="h-5 w-5 mr-2 text-primary" />
                    Subscription Details
                  </CardTitle>
                  <CardDescription>
                    Choose a subscription plan for your school
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div 
                      className={`border rounded-md p-4 cursor-pointer transition-all ${
                        planType === "monthly" 
                          ? "border-primary bg-primary/5 shadow-sm" 
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                      onClick={() => setPlanType("monthly")}
                    >
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="font-semibold text-lg">Monthly</h3>
                        {planType === "monthly" && (
                          <CheckCircle2 className="h-5 w-5 text-primary" />
                        )}
                      </div>
                      <p className="text-2xl font-bold mb-1">$250 <span className="text-sm font-normal text-muted-foreground">/month</span></p>
                      <p className="text-sm text-muted-foreground mb-4">Billed monthly</p>
                      <ul className="text-sm space-y-2">
                        <li className="flex items-start">
                          <CheckCircle2 className="h-4 w-4 mr-2 text-green-500 shrink-0 mt-0.5" />
                          <span>Full access to all training modules</span>
                        </li>
                        <li className="flex items-start">
                          <CheckCircle2 className="h-4 w-4 mr-2 text-green-500 shrink-0 mt-0.5" />
                          <span>School admin dashboard</span>
                        </li>
                        <li className="flex items-start">
                          <CheckCircle2 className="h-4 w-4 mr-2 text-green-500 shrink-0 mt-0.5" />
                          <span>Unlimited teachers</span>
                        </li>
                      </ul>
                    </div>
                    
                    <div 
                      className={`border rounded-md p-4 cursor-pointer transition-all ${
                        planType === "annual" 
                          ? "border-primary bg-primary/5 shadow-sm" 
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                      onClick={() => setPlanType("annual")}
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="font-semibold text-lg">Annual</h3>
                          <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded-full">
                            Save 16%
                          </span>
                        </div>
                        {planType === "annual" && (
                          <CheckCircle2 className="h-5 w-5 text-primary" />
                        )}
                      </div>
                      <p className="text-2xl font-bold mb-1">$2,500 <span className="text-sm font-normal text-muted-foreground">/year</span></p>
                      <p className="text-sm text-muted-foreground mb-4">Billed annually</p>
                      <ul className="text-sm space-y-2">
                        <li className="flex items-start">
                          <CheckCircle2 className="h-4 w-4 mr-2 text-green-500 shrink-0 mt-0.5" />
                          <span>All monthly features</span>
                        </li>
                        <li className="flex items-start">
                          <CheckCircle2 className="h-4 w-4 mr-2 text-green-500 shrink-0 mt-0.5" />
                          <span>Priority support</span>
                        </li>
                        <li className="flex items-start">
                          <CheckCircle2 className="h-4 w-4 mr-2 text-green-500 shrink-0 mt-0.5" />
                          <span>Quarterly performance reports</span>
                        </li>
                      </ul>
                    </div>
                    
                    <div 
                      className={`border rounded-md p-4 cursor-pointer transition-all ${
                        planType === "enterprise" 
                          ? "border-primary bg-primary/5 shadow-sm" 
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                      onClick={() => setPlanType("enterprise")}
                    >
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="font-semibold text-lg">Enterprise</h3>
                        {planType === "enterprise" && (
                          <CheckCircle2 className="h-5 w-5 text-primary" />
                        )}
                      </div>
                      <p className="text-2xl font-bold mb-1">Custom</p>
                      <p className="text-sm text-muted-foreground mb-4">Contact us for pricing</p>
                      <ul className="text-sm space-y-2">
                        <li className="flex items-start">
                          <CheckCircle2 className="h-4 w-4 mr-2 text-green-500 shrink-0 mt-0.5" />
                          <span>All annual features</span>
                        </li>
                        <li className="flex items-start">
                          <CheckCircle2 className="h-4 w-4 mr-2 text-green-500 shrink-0 mt-0.5" />
                          <span>Custom training modules</span>
                        </li>
                        <li className="flex items-start">
                          <CheckCircle2 className="h-4 w-4 mr-2 text-green-500 shrink-0 mt-0.5" />
                          <span>Dedicated account manager</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 rounded-md p-4 mb-6">
                    <h3 className="font-semibold mb-2">All Plans Include:</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
                      <div className="flex items-center">
                        <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />
                        <span className="text-sm">All Core Training Modules</span>
                      </div>
                      <div className="flex items-center">
                        <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />
                        <span className="text-sm">Teacher Progress Tracking</span>
                      </div>
                      <div className="flex items-center">
                        <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />
                        <span className="text-sm">Assessment Tools</span>
                      </div>
                      <div className="flex items-center">
                        <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />
                        <span className="text-sm">Teacher Engagement Features</span>
                      </div>
                      <div className="flex items-center">
                        <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />
                        <span className="text-sm">Email Support</span>
                      </div>
                      <div className="flex items-center">
                        <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />
                        <span className="text-sm">Regular Platform Updates</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-blue-50 border border-blue-200 rounded-md p-4 text-blue-800">
                    <p className="text-sm">
                      <span className="font-semibold">Note:</span> You will be redirected to complete payment after 
                      submitting your registration. Your subscription will begin after payment is processed.
                    </p>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setActiveTab("admin-access")}
                    disabled={isLoading}
                  >
                    Back
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={isLoading}
                    className="gap-2"
                  >
                    {isLoading && (
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    )}
                    Register School
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
          </form>
        </Tabs>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <Card className="flex flex-col">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center">
              <Users className="h-5 w-5 mr-2 text-primary" />
              Teacher Development
            </CardTitle>
            <CardDescription>
              Comprehensive training platform
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-grow">
            <ul className="space-y-2">
              <li className="flex items-start">
                <CheckCircle2 className="h-5 w-5 mr-2 text-green-500 shrink-0 mt-0.5" />
                <span>Personalized learning paths</span>
              </li>
              <li className="flex items-start">
                <CheckCircle2 className="h-5 w-5 mr-2 text-green-500 shrink-0 mt-0.5" />
                <span>Skills gap identification</span>
              </li>
              <li className="flex items-start">
                <CheckCircle2 className="h-5 w-5 mr-2 text-green-500 shrink-0 mt-0.5" />
                <span>Interactive training modules</span>
              </li>
            </ul>
          </CardContent>
        </Card>
        
        <Card className="flex flex-col">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center">
              <Building2 className="h-5 w-5 mr-2 text-primary" />
              School Administration
            </CardTitle>
            <CardDescription>
              Tools for school leaders
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-grow">
            <ul className="space-y-2">
              <li className="flex items-start">
                <CheckCircle2 className="h-5 w-5 mr-2 text-green-500 shrink-0 mt-0.5" />
                <span>Teacher progress tracking</span>
              </li>
              <li className="flex items-start">
                <CheckCircle2 className="h-5 w-5 mr-2 text-green-500 shrink-0 mt-0.5" />
                <span>Performance analytics</span>
              </li>
              <li className="flex items-start">
                <CheckCircle2 className="h-5 w-5 mr-2 text-green-500 shrink-0 mt-0.5" />
                <span>Administrative tools</span>
              </li>
            </ul>
          </CardContent>
        </Card>
        
        <Card className="flex flex-col">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center">
              <Briefcase className="h-5 w-5 mr-2 text-primary" />
              Owner Management
            </CardTitle>
            <CardDescription>
              Powerful tools for school administrators
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-grow">
            <ul className="space-y-2">
              <li className="flex items-start">
                <CheckCircle2 className="h-5 w-5 mr-2 text-green-500 shrink-0 mt-0.5" />
                <span>Comprehensive analytics dashboard</span>
              </li>
              <li className="flex items-start">
                <CheckCircle2 className="h-5 w-5 mr-2 text-green-500 shrink-0 mt-0.5" />
                <span>EOS integration and tools</span>
              </li>
              <li className="flex items-start">
                <CheckCircle2 className="h-5 w-5 mr-2 text-green-500 shrink-0 mt-0.5" />
                <span>Staff performance insights</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
      </div>
    </>
  );
}