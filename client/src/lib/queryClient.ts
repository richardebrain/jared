import { QueryClient } from "@tanstack/react-query";
import axios from "axios";

type AxiosRequestConfig = {
  method?: string;
  url?: string;
  data?: any;
  params?: any;
  headers?: any;
  withCredentials?: boolean;
  timeout?: number;
};

// Define a custom default query function that's compatible with TanStack Query v5
const defaultQueryFn = async ({ queryKey }: { queryKey: readonly unknown[] }) => {
  if (!queryKey || !queryKey[0] || typeof queryKey[0] !== 'string') {
    throw new Error('Query key must be a string');
  }

  const path = queryKey[0] as string;
  
  try {
    // Normal API request - use longer timeout for AI content generation
    const timeout = path.includes('/api/ai') || path.includes('/generate') ? 60000 : 10000; // 60s for AI/generation, 10s for others
    const response = await axios.get(path, {
      withCredentials: true, // Important for cookies/sessions
      timeout: timeout,
    });
    
    return response.data;
  } catch (error: any) {
    // Enhanced error handling for auth endpoints
    if (path === '/api/auth/me') {
      const isOnPublicPage = () => {
        const currentPath = window.location.pathname;
        return currentPath === '/login' || currentPath === '/register' || 
               currentPath === '/business-signup' || currentPath === '/';
      };
      
      // If we're on a public page and get auth error, don't redirect
      if (isOnPublicPage() && (error.response?.status === 401 || error.response?.status === 403)) {
        console.log('Auth error on public page, not redirecting');
        throw error;
      }
      
      // For auth errors on protected pages, let the auth context handle it
      if (error.response?.status === 401 || error.response?.status === 403) {
        console.log('Auth error detected, letting auth context handle it');
        throw error;
      }
    }
    
    // For other errors, just throw them
    throw error;
  }
};

// Create the query client with our custom default function
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error: any) => {
        // Don't retry auth errors
        if (error?.response?.status === 401 || error?.response?.status === 403) {
          return false;
        }
        // Retry other errors only once
        return failureCount < 1;
      },
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false, // Disable to prevent loops
      queryFn: defaultQueryFn,
    },
  },
});

// API wrapper for other methods (POST, PUT, DELETE)
// Supports both new format: apiRequest(url, config) and legacy format: apiRequest(method, url, data)
export async function apiRequest<T = any>(
  urlOrMethod: string,
  configOrUrl?: AxiosRequestConfig | string,
  data?: any
): Promise<T> {
  let finalConfig: AxiosRequestConfig;

  // Check if this is the legacy 3-argument format: apiRequest(method, url, data)
  if (typeof configOrUrl === 'string' && data !== undefined) {
    // Legacy format: apiRequest("POST", "/api/endpoint", { data })
    const method = urlOrMethod.toUpperCase();
    const url = configOrUrl;
    
    // Use longer timeout for AI content generation
    const timeout = url.includes('/api/ai') || url.includes('/generate-lesson-plan') || url.includes('/generate') ? 60000 : 10000;
    finalConfig = {
      method: method as any,
      url,
      data,
      withCredentials: true,
      timeout: timeout,
    };
  } else {
    // New format: apiRequest("/api/endpoint", { method: "POST", data: {...} })
    const url = urlOrMethod;
    const config = (configOrUrl as AxiosRequestConfig) || {};
    
    // Use longer timeout for AI content generation
    const timeout = url.includes('/api/ai') || url.includes('/generate-lesson-plan') || url.includes('/generate') ? 60000 : 10000;
    finalConfig = {
      url,
      ...config,
      withCredentials: true,
      timeout: timeout,
    };
  }

  try {
    const response = await axios(finalConfig);
    return response.data;
  } catch (error) {
    console.error("API Error:", error);
    throw error;
  }
}