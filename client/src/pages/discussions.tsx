import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import DiscussionForum from "@/components/DiscussionForum";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { type User } from "@/types";

export default function DiscussionsPage() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute('/discussions/:id');
  const threadId = params?.id ? parseInt(params.id) : undefined;
  const [user, setUser] = useState<User | null>(null);

  const { data: userData, isError } = useQuery({
    queryKey: ["/api/auth/me"],
    queryFn: async () => {
      const response = await fetch("/api/auth/me");
      if (!response.ok) {
        if (response.status === 401) {
          return null;
        }
        throw new Error("Failed to fetch user data");
      }
      return response.json();
    },
    retry: false,
  });

  useEffect(() => {
    if (userData) {
      setUser(userData);
    }
  }, [userData]);

  const pageTitle = threadId ? "Discussion Thread" : "Teacher Discussion Forum";

  return (
    <div className="container py-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">{pageTitle}</h1>
      <p className="text-gray-600 mb-6">
        {threadId 
          ? "View and participate in this discussion thread"
          : "Connect, share, and learn from other early childhood educators"
        }
      </p>

      {isError && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            There was an error loading the discussion forum. Please try again later.
          </AlertDescription>
        </Alert>
      )}

      <DiscussionForum user={user} threadId={threadId} />
    </div>
  );
}