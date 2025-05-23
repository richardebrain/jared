// import { useEffect } from "react";
// import { Route, useLocation } from "wouter";
// import { Loader2 } from "lucide-react";
// import { useQuery } from "@tanstack/react-query";

// interface ProtectedRouteProps {
//   component: React.ComponentType;
//   path: string;
// }

// export function ProtectedRoute({
//   component: Component,
//   path,
// }: ProtectedRouteProps) {
//   const [location, setLocation] = useLocation();

//   // Simplified auth check - reduced retry to avoid request loops
//   const { data: user, isLoading } = useQuery({
//     queryKey: ["/api/auth/me"],
//     retry: 0, // No retries to prevent loops
//     refetchOnWindowFocus: false,
//     staleTime: 120000, // Longer stale time (2 minutes)
//     gcTime: 300000, // Longer cache (5 minutes)
//   });

//   useEffect(() => {
//     // Only redirect if we're certain there's no user and loading is complete
//     if (!isLoading && !user) {
//       setLocation("/login");
//     }
//   }, [user, isLoading, setLocation, location]);

//   // This prevents the component from rendering at all if the user is not logged in
//   // and the authentication check is complete
//   if (!isLoading && !user) {
//     return null;
//   }

//   return (
//     <Route path={path}>
//       {isLoading ? (
//         <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-background/90">
//           <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
//         </div>
//       ) : user ? (
//         <Component />
//       ) : null}
//     </Route>
//   );
// }
