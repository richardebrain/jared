import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth-context";
import { Link } from "wouter";

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
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Award, ChevronLeft, Heart, Home, Medal, Star, ThumbsUp, Trophy, UserCheck } from "lucide-react";
import axios from "axios";
import { formatDistanceToNow } from "date-fns";

// Define the core values for Raising Arizona Preschool
const coreValues = [
  { value: "Be Consistent", label: "Be Consistent", icon: <Star className="h-5 w-5 text-blue-500" /> },
  { value: "Be Prepared", label: "Be Prepared", icon: <Medal className="h-5 w-5 text-amber-500" /> },
  { value: "Be Committed", label: "Be Committed", icon: <Trophy className="h-5 w-5 text-purple-500" /> },
  { value: "Be Caring", label: "Be Caring", icon: <Heart className="h-5 w-5 text-red-500" /> },
  { value: "Be Positive", label: "Be Positive", icon: <ThumbsUp className="h-5 w-5 text-green-500" /> },
];

// Form schema
const formSchema = z.object({
  nomineeId: z.string({
    required_error: "Please select a teacher to nominate",
  }),
  coreValue: z.string({
    required_error: "Please select a core value",
  }),
  description: z
    .string()
    .min(10, {
      message: "Description must be at least 10 characters",
    })
    .max(200, {
      message: "Description must not be longer than 200 characters",
    }),
});

export default function CoreValuesShoutOutPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("nominate");

  // Fetch all teachers/users
  const { data: teachers } = useQuery({
    queryKey: ["/api/users"],
    enabled: !!user,
  });

  // Fetch nominations made
  const { data: nominationsMade, isLoading: loadingMade } = useQuery({
    queryKey: ["/api/core-values/nominations-made"],
    enabled: !!user,
  });

  // Fetch nominations received
  const { data: nominationsReceived, isLoading: loadingReceived } = useQuery({
    queryKey: ["/api/core-values/nominations-received"],
    enabled: !!user,
  });

  // Form setup
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: "",
    },
  });

  // Mutation for creating a nomination
  const nominateMutation = useMutation({
    mutationFn: async (values: z.infer<typeof formSchema>) => {
      const response = await axios.post("/api/core-values/nominate", {
        nomineeId: parseInt(values.nomineeId),
        coreValue: values.coreValue,
        description: values.description,
        message: values.description, // Send both for backend compatibility
      });
      return response.data;
    },
    onSuccess: (data) => {
      // Play success sound for points earned
      try {
        const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmCJEjGH2O2xYxUFLITPwtzEfiMFklgqpYBobWNfZJKurZNiOTZfndHapxoEHaPb6Pl8PAcaY7vty6RUFQpOr+PqwWsaAzeO1+vLdicDQ5vZ6sV/PQUZYLjqxoI1AQOJ0+/Jh0cKDV6z5c2lWR4IRZ7Z4ruBQwgUXLHk0aReGAU7k9bryl8gADyU1O6+hU8LEmWw5sqjXSoIMJDR5saMTgwOUKnn47NrJAMxhM/lxpFJDQpRqePmu2UeDkeg4OW5aScEOI/Z6cF+QAcZY7np0KRaGgg6lNDrwXkxBSSApMfQeDMBE2q27kWHFH7DfERtHRjrKD0FAAB6AAAGAAAAAKNhdUePdmF0YQ==');
        audio.volume = 0.3;
        audio.play().catch(() => {
          console.log("Could not play sound completion:", {});
        });
      } catch (error) {
        console.log("Could not play sound completion:", error);
      }
      
      toast({
        title: "Nomination Successful!",
        description: data.message,
      });
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/core-values/nominations-made"] });
      queryClient.invalidateQueries({ queryKey: ["/api/core-values/nominations-received"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/shout-outs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
    },
    onError: (error) => {
      toast({
        title: "Nomination Failed",
        description: "There was an error submitting your nomination. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    nominateMutation.mutate(values);
  };

  // Helper to render core value icon
  const getCoreValueIcon = (value: string) => {
    const coreValue = coreValues.find(cv => cv.value === value);
    return coreValue ? coreValue.icon : <Award className="h-5 w-5" />;
  };

  const getTeacherName = (id: number) => {
    if (!teachers || !Array.isArray(teachers)) return "Unknown Teacher";
    const teacher = teachers.find((t: any) => t.id === id);
    return teacher ? `${teacher.firstName} ${teacher.lastName}` : "Unknown Teacher";
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <Link href="/dashboard">
          <Button variant="outline" className="flex items-center gap-2">
            <ChevronLeft className="h-4 w-4" />
            <span>Back to Dashboard</span>
          </Button>
        </Link>
      </div>
      
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold mb-2">Core Values Shout Out</h1>
        <p className="text-muted-foreground">
          Recognize your fellow teachers for exemplifying our core values
        </p>
      </div>

      <Tabs defaultValue="nominate" className="w-full" onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="nominate">Nominate a Teacher</TabsTrigger>
          <TabsTrigger value="given">Nominations I've Given</TabsTrigger>
          <TabsTrigger value="received">Nominations I've Received</TabsTrigger>
        </TabsList>

        <TabsContent value="nominate" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Nominate a Teacher</CardTitle>
              <CardDescription>
                Recognize a colleague who has demonstrated one of our core values
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="nomineeId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Teacher to Nominate</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a teacher" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {teachers && Array.isArray(teachers) && teachers
                              .filter((teacher: any) => teacher.id !== user?.id)
                              .map((teacher: any) => (
                                <SelectItem key={teacher.id} value={teacher.id.toString()}>
                                  {teacher.firstName} {teacher.lastName}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Choose a teacher you'd like to recognize
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="coreValue"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Core Value</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a core value" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {coreValues.map((cv) => (
                              <SelectItem key={cv.value} value={cv.value}>
                                <div className="flex items-center gap-2">
                                  {cv.icon}
                                  <span>{cv.label}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Which core value did they demonstrate?
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Describe how they demonstrated this core value..."
                            className="resize-none"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Share a brief example of how they exemplified this value
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={nominateMutation.isPending}
                  >
                    {nominateMutation.isPending ? "Submitting..." : "Submit Nomination"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="given" className="mt-6">
          <div className="grid gap-4">
            <h2 className="text-2xl font-bold mb-4">Nominations I've Given</h2>
            {loadingMade ? (
              <div className="text-center py-8">Loading nominations...</div>
            ) : nominationsMade && Array.isArray(nominationsMade) && nominationsMade.length > 0 ? (
              nominationsMade.map((nomination: any) => (
                <Card key={nomination.id} className="mb-4">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-center">
                      <div>
                        <CardTitle>{getTeacherName(nomination.nomineeId)}</CardTitle>
                        <CardDescription>
                          {formatDistanceToNow(new Date(nomination.createdAt), { addSuffix: true })}
                        </CardDescription>
                      </div>
                      <Badge className="flex items-center gap-1">
                        {getCoreValueIcon(nomination.coreValue)}
                        <span className="ml-1 capitalize">{nomination.coreValue}</span>
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600">{nomination.description}</p>
                  </CardContent>
                  <CardFooter className="text-sm text-muted-foreground">
                    <div>They earned {nomination.pointsAwarded} points for this nomination!</div>
                  </CardFooter>
                </Card>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                You haven't given any nominations yet. Recognize a teacher for their hard work!
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="received" className="mt-6">
          <div className="grid gap-4">
            <h2 className="text-2xl font-bold mb-4">Nominations I've Received</h2>
            {loadingReceived ? (
              <div className="text-center py-8">Loading nominations...</div>
            ) : nominationsReceived && Array.isArray(nominationsReceived) && nominationsReceived.length > 0 ? (
              nominationsReceived.map((nomination: any) => (
                <Card key={nomination.id} className="mb-4">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-center">
                      <div>
                        <CardTitle>From: {getTeacherName(nomination.nominatorId)}</CardTitle>
                        <CardDescription>
                          {formatDistanceToNow(new Date(nomination.createdAt), { addSuffix: true })}
                        </CardDescription>
                      </div>
                      <Badge className="flex items-center gap-1">
                        {getCoreValueIcon(nomination.coreValue)}
                        <span className="ml-1 capitalize">{nomination.coreValue}</span>
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600">{nomination.description}</p>
                  </CardContent>
                  <CardFooter className="text-sm text-muted-foreground">
                    <div>You earned {nomination.pointsAwarded} points for this nomination!</div>
                  </CardFooter>
                </Card>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                You haven't received any nominations yet. Keep up the good work!
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}