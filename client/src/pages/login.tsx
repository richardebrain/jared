import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/lib/auth-context";

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import GoogleAuthButton from "@/components/GoogleAuthButton";
import { Eye, EyeOff } from "lucide-react";

// Form schema for login
const loginSchema = z.object({
  username: z.string().min(3, {
    message: "Username must be at least 3 characters.",
  }),
  password: z.string().min(6, {
    message: "Password must be at least 6 characters.",
  }),
});

export default function Login() {
  const [_, setLocation] = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Force complete authentication cleanup on login page
  useEffect(() => {
    console.log('Login page mounted - clearing all authentication data');
    try {
      // Clear all storage
      localStorage.clear();
      sessionStorage.clear();
      
      // Clear specific auth keys that might persist
      ['authState', 'user', 'authData', 'isAuthenticated'].forEach(key => {
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
      });
      
      // Clear cookies
      document.cookie.split(";").forEach(cookie => {
        const eqPos = cookie.indexOf("=");
        const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
        document.cookie = `${name.trim()}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
      });
      
      console.log('Login page cleanup complete');
    } catch (e) {
      console.warn("Auth cleanup error:", e);
    }
  }, []);
  
  // Safely get auth context with fallback
  let authContext;
  try {
    authContext = useAuth();
    console.log("Auth context in login:", authContext)
  } catch (error) {
    // If auth context is not available, use fallback values
    authContext = {
      isAuthenticated: false,
      isLoading: false,
      login: async () => {
        // Fallback login function that makes direct API call
        throw new Error("Auth context not available");
      }
    };
  }
  
  const { isAuthenticated, isLoading, login } = authContext;
  
  const navigate = (path: string) => {
    setLocation(path);
  };

  // Create form - MUST be before any conditional returns
  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  // Form submission handler
  async function onSubmit(values: z.infer<typeof loginSchema>) {
    try {
      setIsSubmitting(true);
      // Trim values at submission time rather than during typing
      // This allows password managers to work correctly
      const trimmedValues = {
        username: values.username.trim(),
        password: values.password.trim()
      };
      
      // Use the auth context's login function
      await login(trimmedValues);
      
      // Navigation will be handled by the useEffect below when isAuthenticated changes
    } catch (error: any) {
      // Error handling is already done in the auth context
      console.error("Login error:", error);
    } finally {
      setIsSubmitting(false);
    }
  }

  // Prevent infinite redirects - only redirect if authenticated and not loading
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      console.log("User is authenticated, redirecting to dashboard");
      setLocation("/dashboard");
    }
  }, [isAuthenticated, isLoading, setLocation]);

  // If still loading auth state, show loading spinner
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-background/90 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-2 text-primary">MentorMe</h1>
          <h2 className="text-xl text-muted-foreground">Professional Development Platform</h2>
        </div>
        
        <div className="bg-white p-8 rounded-lg shadow-md">
          <h2 className="text-2xl font-heading font-bold mb-6">Log In</h2>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter your username" 
                        {...field} 
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                    <p className="text-xs text-muted-foreground mt-1">
                      Tip: Username is case-sensitive (e.g., "jlcookie20")
                    </p>
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
                      <div className="relative">
                        <Input 
                          type={showPassword ? "text" : "password"} 
                          placeholder="Enter your password" 
                          {...field} 
                          disabled={isSubmitting}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                          disabled={isSubmitting}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <Eye className="h-4 w-4 text-muted-foreground" />
                          )}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                    <p className="text-xs text-muted-foreground mt-1">
                      For demo: try "jlcookie20" / "password"
                    </p>
                  </FormItem>
                )}
              />
              
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Logging in...
                  </>
                ) : (
                  "Log In"
                )}
              </Button>
            </form>
          </Form>
          
          <div className="mt-6">
            <Separator className="my-4" />
            <GoogleAuthButton />
          </div>
          
          <div className="mt-6 text-center space-y-3">
            <p className="text-sm text-muted-foreground">
              Don't have an account?{" "}
              <Link href="/register" className="text-primary hover:underline">
                Sign up as a teacher
              </Link>
            </p>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">or</span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Starting a new school?{" "}
              <Link href="/business-signup" className="text-primary hover:underline font-semibold">
                Register your school
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
