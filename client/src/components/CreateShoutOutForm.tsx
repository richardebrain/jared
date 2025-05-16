import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Award, Home } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";

const CORE_VALUES = [
  { id: "Be Consistent", name: "Be Consistent" },
  { id: "Be Prepared", name: "Be Prepared" },
  { id: "Be Committed", name: "Be Committed" },
  { id: "Be Caring", name: "Be Caring" },
  { id: "Be Positive", name: "Be Positive" }
];

// Define schema for the form
const formSchema = z.object({
  nomineeId: z.number().min(1, "Please select a colleague"),
  coreValue: z.string().min(1, "Please select a core value"),
  message: z.string().min(5, "Message must be at least 5 characters").max(300, "Message must be less than 300 characters"),
});

export default function CreateShoutOutForm() {
  const [open, setOpen] = React.useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  
  // Fetch users for the select dropdown
  const { data: users } = useQuery({
    queryKey: ["/api/users"],
    refetchOnWindowFocus: false
  });
  
  // Define the form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nomineeId: undefined,
      coreValue: "",
      message: "",
    },
  });
  
  // Handle form submission with react-query mutation
  const mutation = useMutation({
    mutationFn: (values: z.infer<typeof formSchema>) => {
      console.log("Submitting shout out form with values:", values);
      // Convert message to description for backwards compatibility
      const payload = {
        ...values,
        description: values.message
      };
      console.log("API payload:", payload);
      return apiRequest("/api/core-values/nominate", {
        method: "POST",
        data: payload,
      });
    },
    onSuccess: (data) => {
      console.log("Shout out created successfully:", data);
      toast({
        title: "Shout Out Created!",
        description: "Your recognition has been shared with the team.",
      });
      form.reset();
      setOpen(false);
      
      // Invalidate relevant queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/core-values-shoutouts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/core-values/nominations-made"] });
      queryClient.invalidateQueries({ queryKey: ["/api/core-values/nominations-received"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] }); // Refresh user points
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] }); // Refresh user data (points)
    },
    onError: (error: any) => {
      console.error("Error creating shout out:", error);
      const errorMessage = error?.response?.data?.message || "Please try again later.";
      toast({
        title: "Something went wrong",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });
  
  function onSubmit(values: z.infer<typeof formSchema>) {
    mutation.mutate(values);
  }
  
  // Handle dialog close and provide option to return home
  const handleOpenChange = (open: boolean) => {
    setOpen(open);
    if (!open) {
      // Show toast with option to go home when dialog is closed
      toast({
        title: "Form closed",
        description: (
          <div className="flex flex-col gap-2">
            <p>You can return to the home page or continue creating a shout out.</p>
            <Button 
              variant="outline" 
              onClick={() => setLocation("/")}
              className="mt-2"
            >
              <Home className="mr-2 h-4 w-4" />
              Return to Home
            </Button>
          </div>
        ),
        duration: 5000,
      });
    }
  }
  
  const selfId = queryClient.getQueryData<{ id: number }>(["/api/auth/me"])?.id;
  
  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="w-full" variant="default">
          <Award className="mr-2 h-4 w-4" />
          Create Shout Out
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Recognize a Colleague</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="nomineeId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Who are you recognizing?</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(Number(value))}
                    defaultValue={field.value?.toString()}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a colleague" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {users?.filter(user => user.id !== selfId).map((user) => (
                        <SelectItem key={user.id} value={user.id.toString()}>
                          {user.firstName} {user.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="coreValue"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Which core value did they demonstrate?</FormLabel>
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
                      {CORE_VALUES.map((value) => (
                        <SelectItem key={value.id} value={value.id}>
                          {value.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>How did they demonstrate this value?</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe what your colleague did that exemplifies this core value"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="flex flex-col gap-3">
              <Button type="submit" className="w-full" disabled={mutation.isPending}>
                {mutation.isPending ? "Submitting..." : "Submit Shout Out"}
              </Button>
              
              <Button 
                type="button" 
                variant="outline" 
                className="w-full" 
                onClick={() => setLocation("/")}
              >
                <Home className="mr-2 h-4 w-4" />
                Return to Home
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}