import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiRequest } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import raisingArizonaLogo from "../assets/images/raising-arizona-logo.jpg";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Invite-based registration schema
const inviteRegisterSchema = z.object({
  firstName: z.string().min(1, { message: "First name is required." }),
  lastName: z.string().min(1, { message: "Last name is required." }),
  username: z.string().min(3, { message: "Username is required (min 3 chars)." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
  email: z.string().email(),
  token: z.string().min(1),
  timeZone: z.string().min(1, { message: "Time zone is required." }),
  language: z.string().min(1, { message: "Language is required." }),
  nativeLanguage: z.string().min(1, { message: "Native language is required." }),
});

export default function Register() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const [inviteInfo, setInviteInfo] = useState<{ schoolName: string; email: string } | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(true);

  // Parse token and email from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    const email = params.get("email");
    if (!token || !email) {
      setInviteError("Invalid invitation link. Please check your email link or contact your school admin.");
      setVerifying(false);
      return;
    }
    // Verify invite
    apiRequest(`/api/teacher-invitations/verify?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`)
      .then((data) => {
        if (data.valid) {
          setInviteInfo({ schoolName: data.schoolName, email: data.email });
        } else {
          setInviteError(data.message || "Invitation is not valid.");
        }
      })
      .catch((err) => {
        setInviteError("Failed to verify invitation. Please try again later.");
      })
      .finally(() => setVerifying(false));
  }, []);

  // Form setup
  const form = useForm<z.infer<typeof inviteRegisterSchema>>({
    resolver: zodResolver(inviteRegisterSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      username: "",
      password: "",
      email: inviteInfo?.email || "",
      token: "",
      timeZone: "UTC-05:00",
      language: "English",
      nativeLanguage: "English",
    },
  });

  // Update email/token in form when inviteInfo loads
  useEffect(() => {
    if (inviteInfo) {
      form.setValue("email", inviteInfo.email);
      const params = new URLSearchParams(window.location.search);
      const token = params.get("token") || "";
      form.setValue("token", token);
    }
  }, [inviteInfo]);

  // Register mutation
  const { mutate: register, isPending } = useMutation({
    mutationFn: async (data: z.infer<typeof inviteRegisterSchema>) => {
      // Send to backend endpoint for invite-based registration
      return await apiRequest("/api/auth/register", {
        method: "POST",
        data,
      });
    },
    onSuccess: (data) => {
      localStorage.setItem("user", JSON.stringify(data));
      localStorage.setItem("isAuthenticated", "true");
      toast({
        title: "Registration successful!",
        description: "Welcome to MentorMe. Let's start your teacher journey!",
      });
      window.location.href = "/dashboard";
    },
    onError: (error: any) => {
      let errorDetails = error.message || "There was an error creating your account.";
      if (error.response?.data?.message) {
        errorDetails = error.response.data.message;
      }
      toast({
        title: "Registration failed",
        description: errorDetails,
        variant: "destructive",
      });
    },
  });

  function onSubmit(values: z.infer<typeof inviteRegisterSchema>) {
    register(values);
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/90 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8 text-center">
          <div className="mx-auto w-48 h-48 mb-4 animate-float">
            <img
              src={raisingArizonaLogo}
              alt="Raising Arizona Preschool"
              className="w-full h-full object-contain mix-blend-multiply"
            />
          </div>
          <h1 className="text-4xl font-accent bg-gradient-to-br from-primary to-secondary bg-clip-text text-transparent mb-2 animate-pulse-slow">MentorMe</h1>
          <p className="text-neutral-800 animate-pop">Create your teacher account and begin your professional development journey today!</p>
        </div>
        <div className="bg-white p-8 rounded-lg shadow-md">
          <h2 className="text-2xl font-heading font-bold mb-6 text-center">Sign Up</h2>
          {verifying ? (
            <div className="text-center py-8">Verifying your invitation link...</div>
          ) : inviteError ? (
            <div className="text-center text-red-600 font-semibold py-8">{inviteError}</div>
          ) : inviteInfo ? (
            <>
              <div className="mb-4 text-center">
                <div className="text-lg font-bold text-primary">Invited to: {inviteInfo.schoolName}</div>
                <div className="text-sm text-gray-600">Your account will be linked to this school.</div>
              </div>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter your first name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Last Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter your last name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Username</FormLabel>
                        <FormControl>
                          <Input placeholder="Choose a username" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" {...field} disabled />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="Create a password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="timeZone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Time Zone</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select your time zone" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="UTC-05:00">Eastern Time (UTC-05:00)</SelectItem>
                            <SelectItem value="UTC-06:00">Central Time (UTC-06:00)</SelectItem>
                            <SelectItem value="UTC-07:00">Mountain Time (UTC-07:00)</SelectItem>
                            <SelectItem value="UTC-08:00">Pacific Time (UTC-08:00)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="language"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Language</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select your language" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="English">English</SelectItem>
                            <SelectItem value="Spanish">Spanish</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="nativeLanguage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Native Language</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select your native language" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="English">English</SelectItem>
                            <SelectItem value="Spanish">Spanish</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full bg-primary hover:bg-primary/90 hover-pop hover-glow" disabled={isPending}>
                    {isPending ? (
                      <div className="flex items-center justify-center">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        Creating Account...
                      </div>
                    ) : (
                      "Create Account"
                    )}
                  </Button>
                </form>
              </Form>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
