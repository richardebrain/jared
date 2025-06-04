import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Grid3X3, AlertTriangle } from "lucide-react";

interface MatrixData {
  matrix: Array<{
    domainId: number;
    domainName: string;
    difficulties: Record<number, number>;
  }>;
  difficultyLevels: number[];
  domains: Array<{ id: number; name: string }>;
}

interface QuestionCoverageMatrixProps {
  onFilterSelect: (domainId: number | null, difficulty: number | null) => void;
  currentFilters: {
    domainFilter: string;
    difficultyFilter: string;
  };
}

// Define color thresholds and their corresponding styles
const getCoverageColor = (count: number): { bg: string; text: string; label: string } => {
  if (count === 0 || count === 1) {
    return { bg: 'bg-red-600', text: 'text-white', label: 'Critical' };
  } else if (count === 2) {
    return { bg: 'bg-orange-500', text: 'text-white', label: 'Severe' };
  } else if (count >= 3 && count <= 4) {
    return { bg: 'bg-yellow-500', text: 'text-black', label: 'Poor' };
  } else if (count >= 5 && count <= 6) {
    return { bg: 'bg-lime-600', text: 'text-white', label: 'Good' };
  } else {
    return { bg: 'bg-green-600', text: 'text-white', label: 'Excellent' };
  }
};

// Get difficulty level label
const getDifficultyLabel = (level: number): string => {
  const labels: Record<number, string> = {
    1: 'Very Easy',
    2: 'Easy',
    3: 'Medium',
    4: 'Hard',
    5: 'Very Hard',
    6: 'Master'
  };
  return labels[level] || `Level ${level}`;
};

export function QuestionCoverageMatrix({ onFilterSelect, currentFilters }: QuestionCoverageMatrixProps) {
  const { data: matrixData, isLoading, error } = useQuery<{ success: boolean; data: MatrixData }>({
    queryKey: ['question-coverage-matrix'],
    queryFn: async () => {
      return await apiRequest('/api/admin/question-pool/coverage-matrix?admin_password=BIGSURF55');
    },
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // Refresh every minute
  });

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Coverage Matrix Error
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Failed to load coverage matrix. Please try refreshing the page.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading || !matrixData?.data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Grid3X3 className="h-5 w-5 text-blue-500" />
            Question Coverage Matrix
          </CardTitle>
          <CardDescription>Loading domain/difficulty distribution...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex gap-2 mb-4">
              <Skeleton className="h-8 w-20" />
              {Array.from({ length: 6 }, (_, i) => (
                <Skeleton key={i} className="h-8 w-16" />
              ))}
            </div>
            {Array.from({ length: 10 }, (_, i) => (
              <div key={i} className="flex gap-2">
                <Skeleton className="h-10 w-48" />
                {Array.from({ length: 6 }, (_, j) => (
                  <Skeleton key={j} className="h-10 w-16" />
                ))}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const { matrix, difficultyLevels } = matrixData.data;

  // Check if current filters match a specific cell
  const isCellSelected = (domainId: number, difficulty: number): boolean => {
    const domainMatch = currentFilters.domainFilter === 'all' || 
                       currentFilters.domainFilter === domainId.toString();
    const difficultyMatch = currentFilters.difficultyFilter === 'all' || 
                           currentFilters.difficultyFilter === difficulty.toString();
    return domainMatch && difficultyMatch && 
           (currentFilters.domainFilter !== 'all' || currentFilters.difficultyFilter !== 'all');
  };

  const handleCellClick = (domainId: number, difficulty: number) => {
    const isCurrentlySelected = isCellSelected(domainId, difficulty);
    
    if (isCurrentlySelected) {
      // If clicking on selected cell, clear filters
      onFilterSelect(null, null);
    } else {
      // Set new filters
      onFilterSelect(domainId, difficulty);
    }
  };

  const handleRowHeaderClick = (domainId: number) => {
    const isCurrentlySelected = currentFilters.domainFilter === domainId.toString() && 
                               currentFilters.difficultyFilter === 'all';
    
    if (isCurrentlySelected) {
      onFilterSelect(null, null);
    } else {
      onFilterSelect(domainId, null);
    }
  };

  const handleColumnHeaderClick = (difficulty: number) => {
    const isCurrentlySelected = currentFilters.difficultyFilter === difficulty.toString() && 
                               currentFilters.domainFilter === 'all';
    
    if (isCurrentlySelected) {
      onFilterSelect(null, null);
    } else {
      onFilterSelect(null, difficulty);
    }
  };

  // Create legend data
  const legendItems = [
    { threshold: '0-1', ...getCoverageColor(0) },
    { threshold: '2', ...getCoverageColor(2) },
    { threshold: '3-4', ...getCoverageColor(3) },
    { threshold: '5-6', ...getCoverageColor(5) },
    { threshold: '7+', ...getCoverageColor(7) }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Grid3X3 className="h-5 w-5 text-blue-500" />
          Question Coverage Matrix
        </CardTitle>
        <CardDescription>
          View question count distribution across domains and difficulty levels. Click cells to filter questions below.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <div className="min-w-full">
            {/* Header row with difficulty levels */}
            <div className="flex mb-2">
              <div className="w-48 flex-shrink-0 pr-2">
                <div className="h-8 flex items-center">
                  <span className="text-sm font-medium text-muted-foreground">Domain</span>
                </div>
              </div>
              {difficultyLevels.map((difficulty) => (
                <div key={difficulty} className="w-16 flex-shrink-0 px-1">
                  <button
                    onClick={() => handleColumnHeaderClick(difficulty)}
                    className={`h-8 w-full text-xs font-medium rounded border transition-colors hover:bg-muted/50 ${
                      currentFilters.difficultyFilter === difficulty.toString() && 
                      currentFilters.domainFilter === 'all'
                        ? 'bg-blue-100 border-blue-300 text-blue-700'
                        : 'bg-muted/20 border-border text-muted-foreground'
                    }`}
                  >
                    L{difficulty}
                  </button>
                </div>
              ))}
            </div>

            {/* Matrix rows */}
            <div className="space-y-1">
              {matrix.map((domainRow) => (
                <div key={domainRow.domainId} className="flex">
                  {/* Domain name */}
                  <div className="w-48 flex-shrink-0 pr-2">
                    <button
                      onClick={() => handleRowHeaderClick(domainRow.domainId)}
                      className={`h-10 w-full text-left px-3 py-2 text-sm font-medium rounded border transition-colors hover:bg-muted/50 ${
                        currentFilters.domainFilter === domainRow.domainId.toString() && 
                        currentFilters.difficultyFilter === 'all'
                          ? 'bg-blue-100 border-blue-300 text-blue-700'
                          : 'bg-muted/20 border-border'
                      }`}
                    >
                      <span className="truncate block" title={domainRow.domainName}>
                        {domainRow.domainName}
                      </span>
                    </button>
                  </div>

                  {/* Coverage cells */}
                  {difficultyLevels.map((difficulty) => {
                    const count = domainRow.difficulties[difficulty] || 0;
                    const coverage = getCoverageColor(count);
                    const isSelected = isCellSelected(domainRow.domainId, difficulty);

                    return (
                      <div key={difficulty} className="w-16 flex-shrink-0 px-1">
                        <button
                          onClick={() => handleCellClick(domainRow.domainId, difficulty)}
                          className={`h-10 w-full rounded border-2 transition-all hover:scale-105 hover:shadow-md ${
                            coverage.bg
                          } ${coverage.text} ${
                            isSelected 
                              ? 'border-blue-500 ring-2 ring-blue-200 shadow-lg' 
                              : 'border-transparent'
                          }`}
                          title={`${domainRow.domainName} - ${getDifficultyLabel(difficulty)}: ${count} questions`}
                        >
                          <span className="text-sm font-bold">{count}</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="mt-6 pt-4 border-t">
          <div className="flex flex-wrap items-center gap-4">
            <span className="text-sm font-medium text-muted-foreground">Coverage Level:</span>
            <div className="flex flex-wrap gap-3">
              {legendItems.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className={`w-4 h-4 rounded ${item.bg} border border-border`} />
                  <span className="text-xs text-muted-foreground">
                    {item.threshold} ({item.label})
                  </span>
                </div>
              ))}
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Numbers represent approved, enabled questions. Click headers to filter by domain or difficulty level, or click cells for specific combinations.
          </p>
        </div>
      </CardContent>
    </Card>
  );
} 