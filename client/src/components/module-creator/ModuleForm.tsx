import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  BookOpen,
  Users,
  Clock,
  Star,
  Globe
} from 'lucide-react';

interface ModuleFormData {
  title: string;
  description: string;
  category: string;
  difficulty: string;
  estimatedTime: string;
  customPoints?: string;
  pointValue: number;
  shareWithCommunity?: boolean;
}

interface ModuleFormProps {
  data: ModuleFormData;
  onDataChange: (field: keyof ModuleFormData, value: any) => void;
  onNext?: () => void;
  onBack?: () => void;
  isValid?: boolean;
}

const CATEGORIES = [
  { value: 'classroom-management', label: 'Classroom Management' },
  { value: 'child-development', label: 'Child Development' },
  { value: 'communication', label: 'Communication Skills' },
  { value: 'safety', label: 'Safety & Health' },
  { value: 'curriculum', label: 'Curriculum & Instruction' },
  { value: 'professional-development', label: 'Professional Development' },
  { value: 'family-engagement', label: 'Family Engagement' },
  { value: 'assessment', label: 'Assessment & Evaluation' },
  { value: 'special-needs', label: 'Special Needs Support' },
  { value: 'technology', label: 'Technology Integration' }
];

const DIFFICULTIES = [
  { value: 'beginner', label: 'Beginner', description: 'New to the field or topic' },
  { value: 'intermediate', label: 'Intermediate', description: 'Some experience required' },
  { value: 'advanced', label: 'Advanced', description: 'Experienced practitioners' }
];

const TIME_ESTIMATES = [
  { value: '5', label: '5 minutes' },
  { value: '10', label: '10 minutes' },
  { value: '15', label: '15 minutes' },
  { value: '20', label: '20 minutes' },
  { value: '30', label: '30 minutes' },
  { value: '45', label: '45 minutes' },
  { value: '60', label: '1 hour' },
  { value: '90', label: '1.5 hours' },
  { value: '120', label: '2 hours' }
];

export default function ModuleForm({ 
  data, 
  onDataChange, 
  onNext, 
  onBack, 
  isValid = true 
}: ModuleFormProps) {
  const handleChange = (field: keyof ModuleFormData, value: any) => {
    onDataChange(field, value);
    
    // Auto-calculate point value based on time and difficulty
    if (field === 'estimatedTime' || field === 'difficulty') {
      const timeValue = field === 'estimatedTime' ? parseInt(value) : parseInt(data.estimatedTime || '15');
      const difficultyValue = field === 'difficulty' ? value : data.difficulty;
      
      let basePoints = Math.max(5, Math.floor(timeValue / 5));
      
      if (difficultyValue === 'intermediate') {
        basePoints = Math.floor(basePoints * 1.2);
      } else if (difficultyValue === 'advanced') {
        basePoints = Math.floor(basePoints * 1.5);
      }
      
      onDataChange('pointValue', basePoints);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Module Information</h2>
        <p className="text-gray-600">Define the basic details for your training module</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Basic Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="module-title">Module Title *</Label>
            <Input
              id="module-title"
              value={data.title}
              onChange={(e) => handleChange('title', e.target.value)}
              placeholder="Enter a clear, descriptive title..."
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="module-description">Description *</Label>
            <Textarea
              id="module-description"
              value={data.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Describe what learners will accomplish in this module..."
              rows={3}
              className="mt-1"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="module-category">Category *</Label>
              <Select value={data.category} onValueChange={(value) => handleChange('category', value)}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="module-difficulty">Difficulty Level *</Label>
              <Select value={data.difficulty} onValueChange={(value) => handleChange('difficulty', value)}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select difficulty" />
                </SelectTrigger>
                <SelectContent>
                  {DIFFICULTIES.map((difficulty) => (
                    <SelectItem key={difficulty.value} value={difficulty.value}>
                      <div className="flex flex-col">
                        <span>{difficulty.label}</span>
                        <span className="text-xs text-gray-500">{difficulty.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Time & Points
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="module-time">Estimated Time *</Label>
              <Select value={data.estimatedTime} onValueChange={(value) => handleChange('estimatedTime', value)}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select duration" />
                </SelectTrigger>
                <SelectContent>
                  {TIME_ESTIMATES.map((time) => (
                    <SelectItem key={time.value} value={time.value}>
                      {time.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="module-points">Point Value</Label>
              <div className="flex items-center gap-2 mt-1">
                <Input
                  id="module-points"
                  type="number"
                  value={data.pointValue}
                  onChange={(e) => handleChange('pointValue', parseInt(e.target.value) || 0)}
                  min="1"
                  max="100"
                />
                <Star className="h-4 w-4 text-yellow-500" />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Auto-calculated based on time and difficulty
              </p>
            </div>
          </div>

          <div>
            <Label htmlFor="custom-points">Custom Point Description (Optional)</Label>
            <Input
              id="custom-points"
              value={data.customPoints || ''}
              onChange={(e) => handleChange('customPoints', e.target.value)}
              placeholder="e.g., Certification credit, CEU points..."
              className="mt-1"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Sharing Options
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Share with Community
              </Label>
              <p className="text-sm text-gray-500">
                Allow other educators to discover and use your module
              </p>
            </div>
            <Switch
              checked={data.shareWithCommunity || false}
              onCheckedChange={(checked) => handleChange('shareWithCommunity', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {(onNext || onBack) && (
        <div className="flex justify-between pt-6">
          {onBack ? (
            <Button variant="outline" onClick={onBack}>
              Back
            </Button>
          ) : (
            <div />
          )}
          {onNext && (
            <Button 
              onClick={onNext}
              disabled={!isValid || !data.title?.trim() || !data.description?.trim()}
            >
              Next Step
            </Button>
          )}
        </div>
      )}
    </div>
  );
}