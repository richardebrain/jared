import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  ChevronLeft, ChevronRight, Search, Filter, RefreshCw, CalendarIcon, User, Mail, Clock, TrendingUp, TrendingDown, RotateCcw
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";

// TODO: Replace with proper authentication system
// This is a temporary solution for local development only
const TEMP_ADMIN_PASSWORD = "BIGSURF55";

interface AssessmentResult {
  id: number;
  userId: number;
  userName: string;
  userEmail: string;
  completedAt: string;
  accuracyRate: number;
  overallScore: number;
  totalQuestions: number;
  totalCorrect: number;
  durationMinutes: number;
  topGrowthAreas: string[];
  strengthAreas: string[];
  growthAreas: string[];
}

interface PaginatedResults {
  data: AssessmentResult[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export function AssessmentResultsManagement() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [nameFilter, setNameFilter] = useState("");
  const [emailFilter, setEmailFilter] = useState("");
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);
  const [accuracyMin, setAccuracyMin] = useState<number | undefined>(undefined);
  const [accuracyMax, setAccuracyMax] = useState<number | undefined>(undefined);
  const [sortBy, setSortBy] = useState("calculatedAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Build query parameters
  const queryParams = {
    admin_password: TEMP_ADMIN_PASSWORD,
    page,
    limit,
    sortBy,
    sortOrder,
    ...(nameFilter && { name: nameFilter }),
    ...(emailFilter && { email: emailFilter }),
    ...(dateFrom && { dateFrom: format(dateFrom, 'yyyy-MM-dd') }),
    ...(dateTo && { dateTo: format(dateTo, 'yyyy-MM-dd') }),
    ...(accuracyMin !== undefined && { accuracyMin }),
    ...(accuracyMax !== undefined && { accuracyMax }),
  };

  // Fetch assessment results with pagination and filters
  const { 
    data: resultsData, 
    isLoading: isLoadingResults, 
    error,
    refetch
  } = useQuery<PaginatedResults>({
    queryKey: ["/api/admin/assessment-results", queryParams],
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(queryParams).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });
      
      const response = await apiRequest(`/api/admin/assessment-results?${params.toString()}`);
      
      if (response.success && response.data) {
        return {
          data: response.data,
          pagination: response.pagination || { page: 1, limit: 20, total: 0, pages: 0, hasNext: false, hasPrev: false }
        };
      }
      
      return { data: [], pagination: { page: 1, limit: 20, total: 0, pages: 0, hasNext: false, hasPrev: false } };
    },
    retry: false,
    staleTime: 30000,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [nameFilter, emailFilter, dateFrom, dateTo, accuracyMin, accuracyMax]);

  // Clear all filters
  const clearFilters = () => {
    setNameFilter("");
    setEmailFilter("");
    setDateFrom(undefined);
    setDateTo(undefined);
    setAccuracyMin(undefined);
    setAccuracyMax(undefined);
    setPage(1);
  };

  // Validation helpers
  const today = new Date();
  today.setHours(23, 59, 59, 999); // End of today

  // Handle date changes with validation
  const handleDateFromChange = (date: Date | undefined) => {
    if (!date) {
      setDateFrom(undefined);
      return;
    }

    // Prevent future dates
    if (date > today) {
      return; // Don't set future dates
    }

    // If there's a dateTo and the new dateFrom is after it, adjust dateTo
    if (dateTo && date > dateTo) {
      setDateTo(date);
    }
    
    setDateFrom(date);
  };

  const handleDateToChange = (date: Date | undefined) => {
    if (!date) {
      setDateTo(undefined);
      return;
    }

    // Prevent future dates
    if (date > today) {
      return; // Don't set future dates
    }

    // If there's a dateFrom and the new dateTo is before it, adjust dateFrom
    if (dateFrom && date < dateFrom) {
      setDateFrom(date);
    }
    
    setDateTo(date);
  };

  // Handle accuracy changes with validation
  const handleAccuracyMinChange = (value: string) => {
    const numValue = value ? parseFloat(value) : undefined;
    
    if (numValue !== undefined) {
      // Ensure value is between 0 and 100
      if (numValue < 0 || numValue > 100) return;
      
      // If there's a max value and min is greater, adjust max
      if (accuracyMax !== undefined && numValue > accuracyMax) {
        setAccuracyMax(numValue);
      }
    }
    
    setAccuracyMin(numValue);
  };

  const handleAccuracyMaxChange = (value: string) => {
    const numValue = value ? parseFloat(value) : undefined;
    
    if (numValue !== undefined) {
      // Ensure value is between 0 and 100
      if (numValue < 0 || numValue > 100) return;
      
      // If there's a min value and max is less, adjust min
      if (accuracyMin !== undefined && numValue < accuracyMin) {
        setAccuracyMin(numValue);
      }
    }
    
    setAccuracyMax(numValue);
  };

  // Handle sorting
  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("desc");
    }
    setPage(1);
  };

  // Get accuracy color based on percentage
  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 80) return "text-green-600";
    if (accuracy >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), 'MMM dd, yyyy');
    } catch {
      return "N/A";
    }
  };

  // Format duration
  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  };

  const results = resultsData?.data || [];
  const pagination = resultsData?.pagination || { page: 1, limit: 20, total: 0, pages: 0, hasNext: false, hasPrev: false };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Assessment Results</CardTitle>
          <CardDescription>View and analyze all user assessment results</CardDescription>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        {/* Filters Section */}
        <div className="mb-6 p-4 border rounded-lg bg-muted/50">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="h-4 w-4" />
            <span className="font-medium">Filters</span>
            <Button variant="ghost" size="sm" onClick={clearFilters} className="ml-auto">
              <RotateCcw className="h-4 w-4 mr-1" />
              Clear All
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {/* Name Filter */}
            <div className="space-y-2">
              <Label htmlFor="name-filter" className="text-sm font-medium">Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="name-filter"
                  placeholder="Search by name..."
                  value={nameFilter}
                  onChange={(e) => setNameFilter(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Email Filter */}
            <div className="space-y-2">
              <Label htmlFor="email-filter" className="text-sm font-medium">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email-filter"
                  placeholder="Search by email..."
                  value={emailFilter}
                  onChange={(e) => setEmailFilter(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Date From Filter */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">From Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dateFrom && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateFrom ? format(dateFrom, "MMM dd, yyyy") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateFrom}
                    onSelect={handleDateFromChange}
                    disabled={(date) => date > today}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <p className="text-xs text-muted-foreground">No future dates allowed</p>
            </div>

            {/* Date To Filter */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">To Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dateTo && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateTo ? format(dateTo, "MMM dd, yyyy") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateTo}
                    onSelect={handleDateToChange}
                    disabled={(date) => date > today}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <p className="text-xs text-muted-foreground">No future dates allowed</p>
            </div>

            {/* Accuracy Min Filter */}
            <div className="space-y-2">
              <Label htmlFor="accuracy-min" className="text-sm font-medium">Min Accuracy %</Label>
              <Input
                id="accuracy-min"
                type="number"
                min="0"
                max="100"
                step="0.1"
                placeholder="0"
                value={accuracyMin || ""}
                onChange={(e) => handleAccuracyMinChange(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Range: 0-100%</p>
            </div>

            {/* Accuracy Max Filter */}
            <div className="space-y-2">
              <Label htmlFor="accuracy-max" className="text-sm font-medium">Max Accuracy %</Label>
              <Input
                id="accuracy-max"
                type="number"
                min="0"
                max="100"
                step="0.1"
                placeholder="100"
                value={accuracyMax || ""}
                onChange={(e) => handleAccuracyMaxChange(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Range: 0-100%</p>
            </div>
          </div>
        </div>

        {/* Results Summary */}
        <div className="mb-4 flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {results.length} of {pagination.total} results
          </div>
          <div className="text-sm text-muted-foreground">
            Page {pagination.page} of {pagination.pages}
          </div>
        </div>

        {/* Results Table */}
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort('userName')}
                >
                  <div className="flex items-center gap-2">
                    User
                    {sortBy === 'userName' && (
                      sortOrder === 'asc' ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />
                    )}
                  </div>
                </TableHead>
                <TableHead>Email</TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort('calculatedAt')}
                >
                  <div className="flex items-center gap-2">
                    Completed
                    {sortBy === 'calculatedAt' && (
                      sortOrder === 'asc' ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />
                    )}
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort('accuracyRate')}
                >
                  <div className="flex items-center gap-2">
                    Accuracy
                    {sortBy === 'accuracyRate' && (
                      sortOrder === 'asc' ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />
                    )}
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort('totalTimeSeconds')}
                >
                  <div className="flex items-center gap-2">
                    Duration
                    {sortBy === 'totalTimeSeconds' && (
                      sortOrder === 'asc' ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />
                    )}
                  </div>
                </TableHead>
                <TableHead>Top Growth Areas</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoadingResults ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                      Loading assessment results...
                    </div>
                  </TableCell>
                </TableRow>
              ) : results.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No assessment results found
                  </TableCell>
                </TableRow>
              ) : (
                results.map((result) => (
                  <TableRow key={result.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">
                      <div>
                        <div className="font-semibold">{result.userName}</div>
                        <div className="text-sm text-muted-foreground">ID: {result.userId}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{result.userEmail}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{formatDate(result.completedAt)}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className={cn("font-semibold", getAccuracyColor(result.accuracyRate))}>
                          {result.accuracyRate.toFixed(1)}%
                        </div>
                        <div className="text-xs text-muted-foreground">
                          ({result.totalCorrect}/{result.totalQuestions})
                        </div>
                      </div>
                      <Progress 
                        value={result.accuracyRate} 
                        className="w-20 h-2 mt-1"
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Clock className="h-3 w-3" />
                        {formatDuration(result.durationMinutes)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {result.topGrowthAreas.slice(0, 3).map((area, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {area}
                          </Badge>
                        ))}
                        {result.topGrowthAreas.length === 0 && (
                          <span className="text-xs text-muted-foreground">No growth areas</span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-muted-foreground">
              Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} results
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page - 1)}
                disabled={!pagination.hasPrev}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
              
              <span className="text-sm px-2">
                Page {pagination.page} of {pagination.pages}
              </span>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page + 1)}
                disabled={!pagination.hasNext}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 