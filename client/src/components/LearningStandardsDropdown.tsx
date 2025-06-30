import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Loader2, ChevronDown, ChevronUp, X, BookOpen } from 'lucide-react';

interface LearningStandard {
  id: number;
  code: string;
  title: string;
  description: string;
  category: string;
  ageGroup: string;
  domain: string;
  isActive: boolean;
  displayOrder: number;
}

interface LearningStandardsDropdownProps {
  value?: string;
  onValueChange?: (value: string) => void;
  selectedStandards?: string[];
  onSelectionChange?: (standards: string[]) => void;
  onDescriptionUpdate?: (description: string) => void;
  ageGroup?: string;
  category?: string;
  label?: string;
  placeholder?: string;
}

export default function LearningStandardsDropdown({
  value,
  onValueChange,
  selectedStandards = [],
  onSelectionChange,
  onDescriptionUpdate,
  ageGroup,
  category,
  label = "Learning Standard",
  placeholder = "Select a learning standard..."
}: LearningStandardsDropdownProps) {
  const { data: standards = [], isLoading, error } = useQuery({
    queryKey: ['/api/learning-standards', { ageGroup, category }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (ageGroup) params.append('ageGroup', ageGroup);
      if (category) params.append('category', category);
      
      const response = await fetch(`/api/learning-standards?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch learning standards');
      }
      return response.json() as Promise<LearningStandard[]>;
    },
  });

  // Group standards by category for better organization
  const groupedStandards = standards.reduce((acc, standard) => {
    if (!acc[standard.category]) {
      acc[standard.category] = [];
    }
    acc[standard.category].push(standard);
    return acc;
  }, {} as Record<string, LearningStandard[]>);

  const selectedStandard = standards.find(s => s.code === value);

  if (error) {
    return (
      <div className="space-y-2">
        <Label>{label}</Label>
        <div className="text-sm text-red-600">
          Error loading learning standards. Please try again.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Select value={value || ""} onValueChange={onValueChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder={
            isLoading ? (
              <div className="flex items-center space-x-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Loading standards...</span>
              </div>
            ) : placeholder
          } />
        </SelectTrigger>
        <SelectContent className="max-h-[300px]">
          {isLoading ? (
            <div className="flex items-center justify-center p-4">
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Loading standards...
            </div>
          ) : Object.keys(groupedStandards).length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              No learning standards available
            </div>
          ) : (
            Object.entries(groupedStandards).map(([categoryName, categoryStandards]) => (
              <div key={categoryName}>
                <div className="px-2 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50">
                  {categoryName}
                </div>
                {categoryStandards.map(standard => (
                  <SelectItem 
                    key={standard.code} 
                    value={standard.code}
                    className="pl-4"
                  >
                    <div className="flex flex-col">
                      <div className="font-medium">
                        {standard.code}: {standard.title}
                      </div>
                      <div className="text-xs text-gray-500 truncate max-w-[400px]">
                        {standard.description}
                      </div>
                      <div className="text-xs text-blue-600">
                        {standard.ageGroup} • {standard.domain}
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </div>
            ))
          )}
        </SelectContent>
      </Select>
      
      {selectedStandard && (
        <div className="text-sm p-3 bg-blue-50 border border-blue-200 rounded-md">
          <div className="font-medium text-blue-900">
            {selectedStandard.code}: {selectedStandard.title}
          </div>
          <div className="text-blue-700 mt-1">
            {selectedStandard.description}
          </div>
          <div className="text-blue-600 text-xs mt-2">
            {selectedStandard.ageGroup} • {selectedStandard.domain} • {selectedStandard.category}
          </div>
        </div>
      )}
    </div>
  );
}