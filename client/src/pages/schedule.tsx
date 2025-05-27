import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import type { User, Meeting } from "@shared/schema";
import { insertMeetingSchema } from "@shared/schema";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import Header from "@/components/Header";
import ChatbotSupport from "@/components/ChatbotSupport";
import { TimeZonePicker } from "@/components/TimeZonePicker";
import { MeetingScheduler } from "@/components/MeetingScheduler";

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
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

// Meeting form schema
const meetingFormSchema = z.object({
  title: z.string().min(3, {
    message: "Title must be at least 3 characters.",
  }),
  description: z.string().optional(),
  startTime: z.string().refine((val) => {
    return new Date(val).toString() !== "Invalid Date";
  }, {
    message: "Please select a valid date and time.",
  }),
  endTime: z.string().refine((val) => {
    return new Date(val).toString() !== "Invalid Date";
  }, {
    message: "Please select a valid date and time.",
  }),
  timeZone: z.string(),
  guestId: z.number().optional(),
});

export default function Schedule() {
  const { toast } = useToast();
  const [selectedTimeZone, setSelectedTimeZone] = useState("");

  // Get current user data
  const { data: user } = useQuery<User>({
    queryKey: ["/api/auth/me"]
  });

  // Get all meetings for the user
  const { data: meetings } = useQuery<Meeting[]>({
    queryKey: ["/api/meetings"]
  });

  // Form setup
  const form = useForm<z.infer<typeof meetingFormSchema>>({
    resolver: zodResolver(meetingFormSchema),
    defaultValues: {
      title: "",
      description: "",
      startTime: "",
      endTime: "",
      timeZone: user?.timeZone || "",
    },
  });

  // Update form time zone when user loads
  useState(() => {
    if (user?.timeZone && !selectedTimeZone) {
      setSelectedTimeZone(user.timeZone);
      form.setValue("timeZone", user.timeZone);
    }
  });

  // Create meeting mutation
  const { mutate: createMeeting, isPending } = useMutation({
    mutationFn: async (data: z.infer<typeof meetingFormSchema>) => {
      const response = await apiRequest("POST", "/api/meetings", data);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Meeting scheduled",
        description: "Your meeting has been scheduled successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/meetings"] });
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to schedule meeting",
        description: error.message || "There was an error scheduling your meeting.",
        variant: "destructive",
      });
    },
  });

  // Form submit handler
  const onSubmit = (values: z.infer<typeof meetingFormSchema>) => {
    // Ensure startTime is before endTime
    const startTime = new Date(values.startTime);
    const endTime = new Date(values.endTime);
    
    if (startTime >= endTime) {
      toast({
        title: "Invalid time range",
        description: "End time must be after start time.",
        variant: "destructive",
      });
      return;
    }
    
    createMeeting(values);
  };

  // Filter meetings by status
  const upcomingMeetings = meetings?.filter(meeting => 
    meeting.status === "scheduled" && new Date(meeting.startTime) > new Date()
  ).sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()) || [];
  
  const pastMeetings = meetings?.filter(meeting => 
    meeting.status === "completed" || new Date(meeting.startTime) < new Date()
  ).sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()) || [];

  return (
    <div className="min-h-screen bg-neutral-100">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl md:text-4xl font-heading font-bold text-neutral-800">
            Schedule Language Practice
          </h1>
          <TimeZonePicker 
            value={selectedTimeZone} 
            onChange={(value) => {
              setSelectedTimeZone(value);
              form.setValue("timeZone", value);
            }} 
          />
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Schedule a New Meeting</CardTitle>
                <CardDescription>
                  Create a meeting to practice language with other learners or native speakers
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Meeting Title</FormLabel>
                          <FormControl>
                            <Input placeholder="E.g., Spanish Conversation Practice" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description (Optional)</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Add details about what you'd like to practice or discuss" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="startTime"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Start Time</FormLabel>
                            <FormControl>
                              <Input 
                                type="datetime-local" 
                                {...field} 
                                min={new Date().toISOString().slice(0, 16)} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="endTime"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>End Time</FormLabel>
                            <FormControl>
                              <Input 
                                type="datetime-local" 
                                {...field} 
                                min={form.watch("startTime") || new Date().toISOString().slice(0, 16)} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <input type="hidden" {...form.register("timeZone")} />
                    
                    <Button type="submit" className="w-full" disabled={isPending}>
                      {isPending ? "Scheduling..." : "Schedule Meeting"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
            
            <div className="mt-8">
              <MeetingScheduler timeZone={selectedTimeZone} />
            </div>
          </div>
          
          <div>
            <Tabs defaultValue="upcoming">
              <TabsList className="w-full mb-4">
                <TabsTrigger value="upcoming" className="flex-1">Upcoming</TabsTrigger>
                <TabsTrigger value="past" className="flex-1">Past</TabsTrigger>
              </TabsList>
              
              <TabsContent value="upcoming">
                <Card>
                  <CardHeader>
                    <CardTitle>Upcoming Meetings</CardTitle>
                    <CardDescription>
                      Your scheduled language practice sessions
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {upcomingMeetings.length > 0 ? (
                      <div className="space-y-4">
                        {upcomingMeetings.map(meeting => (
                          <div key={meeting.id} className="border rounded-lg p-4 hover:border-primary transition">
                            <div className="flex justify-between items-start">
                              <div>
                                <h3 className="font-heading font-semibold">{meeting.title}</h3>
                                <p className="text-sm text-muted-foreground mt-1">
                                  {meeting.description || "No description provided"}
                                </p>
                              </div>
                              <span className="bg-primary text-white text-xs rounded-full px-2 py-1">
                                {meeting.status}
                              </span>
                            </div>
                            <div className="mt-3 flex items-center text-sm">
                              <i className="ri-time-line mr-2"></i>
                              <span>
                                {new Date(meeting.startTime).toLocaleDateString()} at{" "}
                                {new Date(meeting.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                              </span>
                            </div>
                            <div className="mt-1 flex items-center text-sm">
                              <i className="ri-global-line mr-2"></i>
                              <span>{meeting.timeZone}</span>
                            </div>
                            <div className="mt-3 flex justify-end space-x-2">
                              <Button variant="outline" size="sm">
                                Reschedule
                              </Button>
                              <Button variant="destructive" size="sm">
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6">
                        <p className="text-muted-foreground">No upcoming meetings.</p>
                        <p className="text-sm mt-2">Schedule your first language practice session above!</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="past">
                <Card>
                  <CardHeader>
                    <CardTitle>Past Meetings</CardTitle>
                    <CardDescription>
                      Your completed language practice sessions
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {pastMeetings.length > 0 ? (
                      <div className="space-y-4">
                        {pastMeetings.map(meeting => (
                          <div key={meeting.id} className="border rounded-lg p-4 bg-muted/30">
                            <div className="flex justify-between items-start">
                              <div>
                                <h3 className="font-heading font-semibold">{meeting.title}</h3>
                                <p className="text-sm text-muted-foreground mt-1">
                                  {meeting.description || "No description provided"}
                                </p>
                              </div>
                              <span className="bg-muted text-muted-foreground text-xs rounded-full px-2 py-1">
                                {meeting.status === "completed" ? "Completed" : "Missed"}
                              </span>
                            </div>
                            <div className="mt-3 flex items-center text-sm">
                              <i className="ri-time-line mr-2"></i>
                              <span>
                                {new Date(meeting.startTime).toLocaleDateString()} at{" "}
                                {new Date(meeting.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                              </span>
                            </div>
                            <div className="mt-1 flex items-center text-sm text-muted-foreground">
                              <i className="ri-global-line mr-2"></i>
                              <span>{meeting.timeZone}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6">
                        <p className="text-muted-foreground">No past meetings found.</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
            
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Time Zone Tips</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start">
                    <i className="ri-information-line mr-2 mt-0.5 text-primary"></i>
                    <span>All meeting times are displayed in your selected time zone: <strong>{selectedTimeZone}</strong></span>
                  </li>
                  <li className="flex items-start">
                    <i className="ri-information-line mr-2 mt-0.5 text-primary"></i>
                    <span>When scheduling with someone in a different time zone, double-check the time conversion.</span>
                  </li>
                  <li className="flex items-start">
                    <i className="ri-information-line mr-2 mt-0.5 text-primary"></i>
                    <span>Remember to account for daylight saving time changes when scheduling meetings in advance.</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      
      <ChatbotSupport />
    </div>
  );
}
