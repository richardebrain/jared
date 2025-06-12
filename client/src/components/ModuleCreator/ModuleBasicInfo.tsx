import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { FileEdit, Building, Clock, Trophy } from 'lucide-react';

interface ModuleBasicInfoProps {
  formData: {
    title: string;
    description: string;
    category: string;
    level: string;
    estimatedDuration: number;
    tags: string[];
    moduleType: string;
    isPublic: boolean;
    points: number;
    certificationEligible: boolean;
  };
  onFormDataChange: (updates: Partial<typeof formData>) => void;
  tagInput: string;
  onTagInputChange: (value: string) => void;
  onAddTag: () => void;
  onRemoveTag: (index: number) => void;
}

export default function ModuleBasicInfo({
  formData,
  onFormDataChange,
  tagInput,
  onTagInputChange,
  onAddTag,
  onRemoveTag
}: ModuleBasicInfoProps) {
  const categories = [
    'Child Development',
    'Classroom Management',
    'Safety & Health',
    'Communication',
    'Professional Development',
    'Curriculum Planning',
    'Family Engagement',
    'Special Needs',
    'Assessment',
    'Leadership'
  ];

  const levels = [
    'Beginner',
    'Intermediate', 
    'Advanced',
    'Expert'
  ];

  const moduleTypes = [
    'training',
    'quick-tip',
    'deep-dive',
    'certification',
    'refresher'
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileEdit className="h-5 w-5" />
          Module Information
        </CardTitle>
        <CardDescription>
          Set up the basic details for your training module
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="title">Module Title</Label>
            <Input
              id="title"
              placeholder="Enter module title..."
              value={formData.title}
              onChange={(e) => onFormDataChange({ title: e.target.value })}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select value={formData.category} onValueChange={(value) => onFormDataChange({ category: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            placeholder="Describe what learners will gain from this module..."
            value={formData.description}
            onChange={(e) => onFormDataChange({ description: e.target.value })}
            rows={3}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="level">Difficulty Level</Label>
            <Select value={formData.level} onValueChange={(value) => onFormDataChange({ level: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select level" />
              </SelectTrigger>
              <SelectContent>
                {levels.map((level) => (
                  <SelectItem key={level} value={level}>
                    {level}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="duration" className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              Duration (minutes)
            </Label>
            <Input
              id="duration"
              type="number"
              min="1"
              placeholder="30"
              value={formData.estimatedDuration}
              onChange={(e) => onFormDataChange({ estimatedDuration: parseInt(e.target.value) || 0 })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="points" className="flex items-center gap-1">
              <Trophy className="h-4 w-4" />
              Points Awarded
            </Label>
            <Input
              id="points"
              type="number"
              min="0"
              placeholder="10"
              value={formData.points}
              onChange={(e) => onFormDataChange({ points: parseInt(e.target.value) || 0 })}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="moduleType">Module Type</Label>
          <Select value={formData.moduleType} onValueChange={(value) => onFormDataChange({ moduleType: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Select module type" />
            </SelectTrigger>
            <SelectContent>
              {moduleTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {type.charAt(0).toUpperCase() + type.slice(1).replace('-', ' ')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Tags</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Add a tag..."
                value={tagInput}
                onChange={(e) => onTagInputChange(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && onAddTag()}
              />
            </div>
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.tags.map((tag, index) => (
                  <Badge 
                    key={index} 
                    variant="secondary" 
                    className="cursor-pointer hover:bg-red-100"
                    onClick={() => onRemoveTag(index)}
                  >
                    {tag} ×
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building className="h-4 w-4" />
              <Label htmlFor="isPublic">Make module public</Label>
            </div>
            <Switch
              id="isPublic"
              checked={formData.isPublic}
              onCheckedChange={(checked) => onFormDataChange({ isPublic: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy className="h-4 w-4" />
              <Label htmlFor="certificationEligible">Certification eligible</Label>
            </div>
            <Switch
              id="certificationEligible"
              checked={formData.certificationEligible}
              onCheckedChange={(checked) => onFormDataChange({ certificationEligible: checked })}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}