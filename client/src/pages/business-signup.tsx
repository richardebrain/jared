import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'wouter';
import { 
  GraduationCap, 
  BookOpen, 
  Shield, 
  CheckCircle2, 
  Building2, 
  Users, 
  BarChart3, 
  Briefcase, 
  Sparkles, 
  Heart,
  CreditCard,
  ChevronRight
} from 'lucide-react';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const formSchema = z.object({
  businessName: z.string().min(2, {
    message: "Business name must be at least 2 characters.",
  }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  phone: z.string().min(10, {
    message: "Please enter a valid phone number.",
  }),
  teacherCount: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: "Teacher count must be a positive number.",
  }),
  plan: z.enum(["basic", "premium", "enterprise"]),
  addOwnersToolkit: z.boolean().default(false),
  addBranding: z.enum(["none", "basic", "premium"]).default("none"),
  agreeToTerms: z.boolean().refine((val) => val === true, {
    message: "You must agree to the terms and conditions.",
  }),
});

type FormValues = z.infer<typeof formSchema>;

export default function BusinessSignup() {
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [calculatedPrice, setCalculatedPrice] = useState({
    monthlyBase: 59,
    perTeacherFee: 0,
    ownersToolkit: 0,
    brandingFee: 0,
    totalMonthly: 59,
    oneTimeFee: 0
  });
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      businessName: "",
      email: "",
      phone: "",
      teacherCount: "1",
      plan: "basic",
      addOwnersToolkit: false,
      addBranding: "none",
      agreeToTerms: false,
    },
  });
  
  const onSubmit = (data: FormValues) => {
    toast({
      title: "Sign-up submitted",
      description: "We'll be in touch soon to complete your MentorMe setup!",
    });
    
    console.log(data);
  };

  const updatePrice = (values: any) => {
    const teacherCount = Number(values.teacherCount) || 1;
    const perTeacherFee = teacherCount * 5;
    const ownersToolkit = values.addOwnersToolkit ? 19 : 0;
    
    let brandingFee = 0;
    let oneTimeFee = 0;
    
    if (values.addBranding === "basic") {
      oneTimeFee = 999;
    } else if (values.addBranding === "premium") {
      oneTimeFee = 1999;
    }
    
    const totalMonthly = 59 + perTeacherFee + ownersToolkit;
    
    setCalculatedPrice({
      monthlyBase: 59,
      perTeacherFee,
      ownersToolkit,
      brandingFee,
      totalMonthly,
      oneTimeFee
    });
  };

  const watchAllFields = form.watch();

  // Update price when form values change
  React.useEffect(() => {
    updatePrice(watchAllFields);
  }, [watchAllFields]);

  const nextStep = () => {
    form.trigger().then((isValid) => {
      if (isValid) {
        setStep(step + 1);
      }
    });
  };

  const prevStep = () => {
    setStep(step - 1);
  };

  return (
    <div className="container max-w-6xl mx-auto py-8 px-4 md:px-6">
      <div className="flex flex-col items-center text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
          Transform Your School with <span className="bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">MentorMe</span>
        </h1>
        <p className="text-xl text-muted-foreground max-w-3xl">
          The premier professional development platform designed specifically for early childhood educators
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 mb-16">
        <Card className="flex flex-col">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center">
              <GraduationCap className="h-5 w-5 mr-2 text-primary" />
              Teacher Growth
            </CardTitle>
            <CardDescription>
              Personalized learning paths based on assessment results
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-grow">
            <ul className="space-y-2">
              <li className="flex items-start">
                <CheckCircle2 className="h-5 w-5 mr-2 text-green-500 shrink-0 mt-0.5" />
                <span>Adaptive learning algorithms</span>
              </li>
              <li className="flex items-start">
                <CheckCircle2 className="h-5 w-5 mr-2 text-green-500 shrink-0 mt-0.5" />
                <span>Progress tracking and achievements</span>
              </li>
              <li className="flex items-start">
                <CheckCircle2 className="h-5 w-5 mr-2 text-green-500 shrink-0 mt-0.5" />
                <span>Interactive multimedia content</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card className="flex flex-col">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center">
              <Building2 className="h-5 w-5 mr-2 text-primary" />
              School Culture
            </CardTitle>
            <CardDescription>
              Strengthen your values and build a positive environment
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-grow">
            <ul className="space-y-2">
              <li className="flex items-start">
                <CheckCircle2 className="h-5 w-5 mr-2 text-green-500 shrink-0 mt-0.5" />
                <span>Core values recognition system</span>
              </li>
              <li className="flex items-start">
                <CheckCircle2 className="h-5 w-5 mr-2 text-green-500 shrink-0 mt-0.5" />
                <span>Peer-to-peer appreciation</span>
              </li>
              <li className="flex items-start">
                <CheckCircle2 className="h-5 w-5 mr-2 text-green-500 shrink-0 mt-0.5" />
                <span>Customizable to your school values</span>
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

      <div className="bg-muted rounded-lg p-6 mb-16">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-2">Simple, Transparent Pricing</h2>
          <p className="text-muted-foreground">Choose the plan that works for your school</p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-6">
          <Card className="border-2">
            <CardHeader>
              <CardTitle>Basic</CardTitle>
              <div className="mt-2">
                <span className="text-3xl font-bold">$59</span>
                <span className="text-muted-foreground">/month per site</span>
              </div>
              <CardDescription className="mt-2">
                Plus $5 per teacher monthly
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                <li className="flex items-start">
                  <CheckCircle2 className="h-5 w-5 mr-2 text-green-500 shrink-0 mt-0.5" />
                  <span>Complete learning platform</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="h-5 w-5 mr-2 text-green-500 shrink-0 mt-0.5" />
                  <span>Teacher assessments</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="h-5 w-5 mr-2 text-green-500 shrink-0 mt-0.5" />
                  <span>Core training modules</span>
                </li>
              </ul>
            </CardContent>
            <CardFooter>
              <Button className="w-full">
                Get Started
              </Button>
            </CardFooter>
          </Card>
          
          <Card className="border-2 border-primary relative">
            <div className="absolute top-0 right-0 transform translate-x-2 -translate-y-2">
              <Badge variant="default">Most Popular</Badge>
            </div>
            <CardHeader>
              <CardTitle>Owner's Toolkit</CardTitle>
              <div className="mt-2">
                <span className="text-3xl font-bold">$78</span>
                <span className="text-muted-foreground">/month per site</span>
              </div>
              <CardDescription className="mt-2">
                Plus $5 per teacher monthly
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                <li className="flex items-start">
                  <CheckCircle2 className="h-5 w-5 mr-2 text-green-500 shrink-0 mt-0.5" />
                  <span>Everything in Basic</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="h-5 w-5 mr-2 text-green-500 shrink-0 mt-0.5" />
                  <span>EOS tools integration</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="h-5 w-5 mr-2 text-green-500 shrink-0 mt-0.5" />
                  <span>Advanced analytics</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="h-5 w-5 mr-2 text-green-500 shrink-0 mt-0.5" />
                  <span>Director dashboard</span>
                </li>
              </ul>
            </CardContent>
            <CardFooter>
              <Button className="w-full">
                Get Started
              </Button>
            </CardFooter>
          </Card>
          
          <Card className="border-2">
            <CardHeader>
              <CardTitle>Premium Branding</CardTitle>
              <div className="mt-2">
                <span className="text-3xl font-bold">$78</span>
                <span className="text-muted-foreground">/month per site</span>
              </div>
              <CardDescription className="mt-2">
                $1,999 one-time setup fee
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                <li className="flex items-start">
                  <CheckCircle2 className="h-5 w-5 mr-2 text-green-500 shrink-0 mt-0.5" />
                  <span>Everything in Owner's Toolkit</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="h-5 w-5 mr-2 text-green-500 shrink-0 mt-0.5" />
                  <span>Custom branding and logo</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="h-5 w-5 mr-2 text-green-500 shrink-0 mt-0.5" />
                  <span>Custom core values training</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="h-5 w-5 mr-2 text-green-500 shrink-0 mt-0.5" />
                  <span>Custom company song</span>
                </li>
              </ul>
            </CardContent>
            <CardFooter>
              <Button className="w-full">
                Get Started
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
      
      <div className="flex flex-col items-center mb-12">
        <h2 className="text-3xl font-bold mb-6">Sign Up For MentorMe</h2>
        
        <Card className="w-full max-w-3xl">
          <CardHeader>
            <CardTitle>School Information</CardTitle>
            <CardDescription>Tell us about your school to get started</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                {step === 1 && (
                  <div className="space-y-6">
                    <FormField
                      control={form.control}
                      name="businessName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>School/Business Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Raising Arizona Preschool" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid gap-6 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input placeholder="contact@school.com" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone Number</FormLabel>
                            <FormControl>
                              <Input placeholder="(555) 123-4567" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={form.control}
                      name="teacherCount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Number of Teachers</FormLabel>
                          <FormControl>
                            <Input type="number" min="1" {...field} />
                          </FormControl>
                          <FormDescription>
                            This will help us calculate your monthly fee ($5 per teacher)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}
                
                {step === 2 && (
                  <div className="space-y-6">
                    <FormField
                      control={form.control}
                      name="plan"
                      render={({ field }) => (
                        <FormItem className="space-y-3">
                          <FormLabel>Select Your Plan</FormLabel>
                          <FormControl>
                            <RadioGroup
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                              className="space-y-3"
                            >
                              <FormItem className="flex items-center space-x-3 space-y-0">
                                <FormControl>
                                  <RadioGroupItem value="basic" />
                                </FormControl>
                                <FormLabel className="font-normal">
                                  Basic ($59/month per site + $5/teacher)
                                </FormLabel>
                              </FormItem>
                              <FormItem className="flex items-center space-x-3 space-y-0">
                                <FormControl>
                                  <RadioGroupItem value="premium" />
                                </FormControl>
                                <FormLabel className="font-normal">
                                  Premium ($78/month per site + $5/teacher)
                                </FormLabel>
                              </FormItem>
                              <FormItem className="flex items-center space-x-3 space-y-0">
                                <FormControl>
                                  <RadioGroupItem value="enterprise" />
                                </FormControl>
                                <FormLabel className="font-normal">
                                  Enterprise (Contact us for custom pricing)
                                </FormLabel>
                              </FormItem>
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <Separator />
                    
                    <FormField
                      control={form.control}
                      name="addOwnersToolkit"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base font-semibold">
                              Add Owner's Toolkit
                            </FormLabel>
                            <FormDescription>
                              Access advanced analytics and EOS tools ($19/month)
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="addBranding"
                      render={({ field }) => (
                        <FormItem className="space-y-3">
                          <FormLabel>Custom Branding Options</FormLabel>
                          <FormControl>
                            <RadioGroup
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                              className="space-y-3"
                            >
                              <FormItem className="flex items-center space-x-3 space-y-0">
                                <FormControl>
                                  <RadioGroupItem value="none" />
                                </FormControl>
                                <FormLabel className="font-normal">
                                  No custom branding
                                </FormLabel>
                              </FormItem>
                              <FormItem className="flex items-center space-x-3 space-y-0">
                                <FormControl>
                                  <RadioGroupItem value="basic" />
                                </FormControl>
                                <FormLabel className="font-normal">
                                  Basic Branding - Logo and colors ($999 one-time)
                                </FormLabel>
                              </FormItem>
                              <FormItem className="flex items-center space-x-3 space-y-0">
                                <FormControl>
                                  <RadioGroupItem value="premium" />
                                </FormControl>
                                <FormLabel className="font-normal">
                                  Premium Branding - Logo, core values training & company song ($1,999 one-time)
                                </FormLabel>
                              </FormItem>
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}
                
                {step === 3 && (
                  <div className="space-y-6">
                    <div className="rounded-md border">
                      <div className="p-6">
                        <h3 className="text-lg font-medium mb-4">Your MentorMe Plan</h3>
                        
                        <div className="space-y-4">
                          <div className="flex justify-between py-2">
                            <span>Base monthly fee:</span>
                            <span className="font-medium">${calculatedPrice.monthlyBase}</span>
                          </div>
                          
                          <div className="flex justify-between py-2">
                            <span>Teacher fee ({form.getValues("teacherCount")} × $5):</span>
                            <span className="font-medium">${calculatedPrice.perTeacherFee}</span>
                          </div>
                          
                          {calculatedPrice.ownersToolkit > 0 && (
                            <div className="flex justify-between py-2">
                              <span>Owner's Toolkit:</span>
                              <span className="font-medium">${calculatedPrice.ownersToolkit}</span>
                            </div>
                          )}
                          
                          <Separator />
                          
                          <div className="flex justify-between py-2 font-bold">
                            <span>Total Monthly:</span>
                            <span>${calculatedPrice.totalMonthly}</span>
                          </div>
                          
                          {calculatedPrice.oneTimeFee > 0 && (
                            <div className="flex justify-between py-2 text-primary font-bold">
                              <span>One-time setup fee:</span>
                              <span>${calculatedPrice.oneTimeFee}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="agreeToTerms"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>
                              I agree to the Terms of Service and Privacy Policy
                            </FormLabel>
                            <FormDescription>
                              By checking this box, you agree to our <Link href="/terms" className="text-primary hover:underline">Terms of Service</Link> and <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>.
                            </FormDescription>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="bg-muted p-4 rounded-md">
                      <p className="text-sm text-muted-foreground">
                        After submitting, a MentorMe representative will contact you to complete your setup and provide access to your new platform.
                      </p>
                    </div>
                  </div>
                )}
                
                <div className="flex justify-between pt-2">
                  {step > 1 && (
                    <Button type="button" variant="outline" onClick={prevStep}>
                      Back
                    </Button>
                  )}
                  {step < 3 ? (
                    <Button type="button" onClick={nextStep} className="ml-auto">
                      Next Step
                    </Button>
                  ) : (
                    <Button type="submit" className="ml-auto">
                      Complete Sign-up
                    </Button>
                  )}
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
      
      <div className="text-center">
        <h3 className="text-xl font-medium mb-2">Questions about MentorMe?</h3>
        <p className="mb-4 text-muted-foreground">Contact our team for a free consultation</p>
        <Button variant="outline" className="gap-1">
          Contact Sales
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}