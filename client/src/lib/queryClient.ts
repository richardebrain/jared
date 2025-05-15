import { QueryClient, QueryFunction } from "@tanstack/react-query";
import axios, { AxiosRequestConfig } from "axios";

// Define a custom default query function that's compatible with TanStack Query v5
const defaultQueryFn: QueryFunction = async ({ queryKey }) => {
  if (!queryKey || !queryKey[0] || typeof queryKey[0] !== 'string') {
    throw new Error('Query key must be a string');
  }

  const path = queryKey[0] as string;
  const response = await axios.get(path, {
    withCredentials: true, // Important for cookies/sessions
  });
  
  return response.data;
};

// Create the query client with our custom default function
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
      queryFn: defaultQueryFn,
    },
  },
});

// API wrapper for other methods (POST, PUT, DELETE)
export async function apiRequest<T = any>(
  url: string,
  config: AxiosRequestConfig = {}
): Promise<T> {
  try {
    const response = await axios({
      url,
      withCredentials: true, // Important for cookies/sessions
      ...config,
    });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      // Extract the error message from the response, if available
      const errorMessage = error.response.data?.message || error.message;
      throw new Error(errorMessage);
    }
    throw error;
  }
}