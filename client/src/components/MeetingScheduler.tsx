import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { CalendarDays, Clock, Mail, School, Users } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from '@/lib/queryClient';

// Schema for meeting request validation
const meetingRequestSchema = z.object({
  schoolLocation: z.string({
    required_error: "Please select your school location",
  }),
  meetingPurpose: z.string({
    required_error: "Please provide a brief purpose for the meeting",
  }).min(10, {
    message: "Meeting purpose must be at least 10 characters",
  }).max(200, {
    message: "Meeting purpose must not exceed 200 characters",
  }),
  preferredDate: z.date({
    required_error: "Please select a preferred date",
  }),
  preferredTimeSlot: z.string({
    required_error: "Please select a preferred time slot",
  }),
  notes: z.string().max(500, {
    message: "Notes must not exceed 500 characters",
  }).optional(),
});

type MeetingRequestFormValues = z.infer<typeof meetingRequestSchema>;

// School location to director email mapping
const schoolDirectorMap: Record<string, { name: string, email: string }> = {
  "bell": { 
    name: "Paije",
    email: "Paije@raisingarizonapreschool.com"
  },
  "olive": { 
    name: "Janiece",
    email: "Janiece@raisingarizonapreschool.com"
  },
  "mcdowell": { 
    name: "Emma",
    email: "Emma@raisingarizonapreschool.com"
  },
  "mesa": { 
    name: "Krystal",
    email: "Krystal@raisingarizonapreschool.com"
  },
};

// Available time slots
const timeSlots = [
  "8:00 AM - 8:15 AM",
  "8:30 AM - 8:45 AM",
  "9:00 AM - 9:15 AM",
  "9:30 AM - 9:45 AM",
  "1:00 PM - 1:15 PM",
  "1:30 PM - 1:45 PM",
  "2:00 PM - 2:15 PM",
  "2:30 PM - 2:45 PM",
  "3:00 PM - 3:15 PM",
  "3:30 PM - 3:45 PM",
  "4:00 PM - 4:15 PM",
  "4:30 PM - 4:45 PM",
];

export function MeetingScheduler() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitted, setIsSubmitted] = useState(false);
  
  // Initialize the form
  const form = useForm<MeetingRequestFormValues>({
    resolver: zodResolver(meetingRequestSchema),
    defaultValues: {
      schoolLocation: "",
      meetingPurpose: "",
      notes: "",
    },
  });

  // Handle meeting request submission
  const submitMeetingRequest = useMutation({
    mutationFn: async (values: MeetingRequestFormValues) => {
      // Get director info based on selected school
      const director = schoolDirectorMap[values.schoolLocation];
      
      if (!director) {
        throw new Error("Invalid school location selected");
      }

      // Format the meeting request data for sending
      const meetingData = {
        teacherId: user?.id,
        teacherName: `${user?.firstName} ${user?.lastName}`,
        teacherEmail: user?.email,
        directorName: director.name,
        directorEmail: director.email,
        schoolLocation: values.schoolLocation,
        meetingPurpose: values.meetingPurpose,
        preferredDate: values.preferredDate,
        preferredTimeSlot: values.preferredTimeSlot,
        notes: values.notes || "",
      };

      // In a real app, we would send this to the server
      // For now, we'll just simulate success
      console.log("Meeting request:", meetingData);
      
      // This would normally hit the API endpoint
      // return await apiRequest("/api/meetings/request", {
      //   method: "POST",
      //   data: meetingData,
      // });
      
      // For demo purposes, just wait a moment and return success
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { success: true };
    },
    onSuccess: () => {
      setIsSubmitted(true);
      toast({
        title: "Meeting Request Sent",
        description: "Your director will review your request and confirm the meeting soon.",
        variant: "default",
      });
    },
    onError: (error) => {
      console.error("Error submitting meeting request:", error);
      toast({
        title: "Request Failed",
        description: "There was an error submitting your meeting request. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Handle form submission
  function onSubmit(values: MeetingRequestFormValues) {
    submitMeetingRequest.mutate(values);
  }

  // Reset the form and allow creating a new meeting request
  function handleCreateNewRequest() {
    form.reset();
    setIsSubmitted(false);
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">
          <div className="flex items-center">
            <CalendarDays className="mr-2 h-5 w-5 text-primary" />
            Schedule a Director Meeting
          </div>
        </CardTitle>
        <CardDescription>
          Request a 15-minute meeting with your school director.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isSubmitted ? (
          <div className="py-6 text-center space-y-4">
            <div className="mb-4 flex justify-center">
              <div className="rounded-full bg-green-100 p-3">
                <Mail className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <h3 className="text-lg font-medium">Meeting Request Submitted</h3>
            <p className="text-muted-foreground">
              Your director will review your request and confirm the meeting time via email.
            </p>
            <Button onClick={handleCreateNewRequest} className="mt-4">
              Request Another Meeting
            </Button>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="schoolLocation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>School Location</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select your school location" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="bell">Bell School</SelectItem>
                        <SelectItem value="olive">Olive School</SelectItem>
                        <SelectItem value="mcdowell">McDowell School</SelectItem>
                        <SelectItem value="mesa">Mesa School</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      {field.value && schoolDirectorMap[field.value] ? 
                        `Your meeting will be with Director ${schoolDirectorMap[field.value].name}` : 
                        "Select your school to see your director"
                      }
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="meetingPurpose"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Meeting Purpose</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Briefly describe what you'd like to discuss..."
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Keep it brief but specific to help your director prepare.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-6 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="preferredDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Preferred Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarDays className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => 
                              date < new Date(Date.now() + 86400000) || // Disable dates before tomorrow
                              date.getDay() === 0 || // Disable Sundays
                              date.getDay() === 6    // Disable Saturdays
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormDescription>
                        Select a weekday at least one day in advance.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="preferredTimeSlot"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preferred Time</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a time slot" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {timeSlots.map((slot) => (
                            <SelectItem key={slot} value={slot}>
                              {slot}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        All meetings are 15 minutes long.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Additional Notes (Optional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Any additional information or context..."
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Include any relevant information that might help your director prepare.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button 
                type="submit" 
                className="w-full"
                disabled={submitMeetingRequest.isPending}
              >
                {submitMeetingRequest.isPending ? "Submitting..." : "Request Meeting"}
              </Button>
            </form>
          </Form>
        )}
      </CardContent>
    </Card>
  );
}