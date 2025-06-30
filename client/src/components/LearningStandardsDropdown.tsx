import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
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
  placeholder = "Select learning standards..."
}: LearningStandardsDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({});

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
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Group standards by category for better organization
  const groupedStandards = standards.reduce((acc, standard) => {
    if (!acc[standard.category]) {
      acc[standard.category] = [];
    }
    acc[standard.category].push(standard);
    return acc;
  }, {} as Record<string, LearningStandard[]>);

  const handleStandardToggle = (standardCode: string) => {
    if (!onSelectionChange) return;
    
    const newSelection = selectedStandards.includes(standardCode)
      ? selectedStandards.filter(code => code !== standardCode)
      : [...selectedStandards, standardCode];
    
    onSelectionChange(newSelection);

    // Auto-populate description if callback provided
    if (onDescriptionUpdate && !selectedStandards.includes(standardCode)) {
      const standard = standards.find(s => s.code === standardCode);
      if (standard) {
        onDescriptionUpdate(`Learning Standard: ${standard.code} - ${standard.title}\n${standard.description}`);
      }
    }
  };

  const handleCategoryToggle = (categoryName: string) => {
    setOpenCategories(prev => ({
      ...prev,
      [categoryName]: !prev[categoryName]
    }));
  };

  const removeStandard = (standardCode: string) => {
    if (!onSelectionChange) return;
    onSelectionChange(selectedStandards.filter(code => code !== standardCode));
  };

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
      <Label className="flex items-center gap-2">
        <BookOpen className="h-4 w-4" />
        {label}
      </Label>
      
      {/* Selected Standards Display */}
      {selectedStandards.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {selectedStandards.map((code) => {
            const standard = standards.find(s => s.code === code);
            return (
              <Badge 
                key={code} 
                variant="secondary" 
                className="flex items-center gap-1 text-xs"
              >
                {standard ? `${standard.code}: ${standard.title.substring(0, 30)}...` : code}
                <X 
                  className="h-3 w-3 cursor-pointer hover:text-red-600" 
                  onClick={() => removeStandard(code)}
                />
              </Badge>
            );
          })}
        </div>
      )}

      {/* Selection Button */}
      <Button
        type="button"
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full justify-between"
        disabled={isLoading}
      >
        {isLoading ? (
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading standards...
          </div>
        ) : selectedStandards.length > 0 ? (
          `${selectedStandards.length} standard${selectedStandards.length === 1 ? '' : 's'} selected`
        ) : (
          placeholder
        )}
        {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </Button>

      {/* Standards Selection Panel */}
      {isOpen && (
        <div className="border rounded-md bg-white shadow-sm max-h-80 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center p-4">
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Loading standards...
            </div>
          ) : Object.keys(groupedStandards).length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              No learning standards found for the selected criteria.
            </div>
          ) : (
            <div className="p-2">
              {Object.entries(groupedStandards).map(([categoryName, categoryStandards]) => (
                <Collapsible 
                  key={categoryName}
                  open={openCategories[categoryName] ?? true}
                  onOpenChange={() => handleCategoryToggle(categoryName)}
                >
                  <CollapsibleTrigger className="flex items-center justify-between w-full p-2 text-left font-medium text-gray-700 hover:bg-gray-50 rounded">
                    <span>{categoryName} ({categoryStandards.length})</span>
                    {openCategories[categoryName] ?? true ? 
                      <ChevronUp className="h-4 w-4" /> : 
                      <ChevronDown className="h-4 w-4" />
                    }
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-1 pl-2">
                    {categoryStandards.map((standard) => (
                      <div 
                        key={standard.code}
                        className="flex items-start space-x-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
                        onClick={() => handleStandardToggle(standard.code)}
                      >
                        <Checkbox
                          checked={selectedStandards.includes(standard.code)}
                          onChange={() => handleStandardToggle(standard.code)}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm">{standard.code}</div>
                          <div className="text-sm text-gray-600">{standard.title}</div>
                          <div className="text-xs text-gray-500 mt-1">
                            {standard.description.substring(0, 100)}...
                          </div>
                        </div>
                      </div>
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}