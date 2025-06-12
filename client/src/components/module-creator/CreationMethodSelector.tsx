import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import {
  Wand2,
  Upload,
  Edit,
  CheckCircle2
} from 'lucide-react';

interface CreationMethodSelectorProps {
  onMethodSelect: (method: 'ai-assisted' | 'powerPoint' | 'manual') => void;
}

export default function CreationMethodSelector({ onMethodSelect }: CreationMethodSelectorProps) {
  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Choose Your Module Creation Method</h2>
        <p className="text-gray-600">Select the approach that works best for your content and style</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* AI Assisted */}
        <Card className="cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-105 border-2 hover:border-purple-300">
          <CardContent className="p-6 text-center" onClick={() => onMethodSelect('ai-assisted')}>
            <div className="mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Wand2 className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">AI Assisted</h3>
              <p className="text-gray-600 text-sm mb-4">
                Start with proven templates, then build step-by-step with AI assistance. Perfect for structured, engaging content creation.
              </p>
            </div>
            <div className="space-y-2 text-left">
              <div className="flex items-center text-sm text-gray-600">
                <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
                Choose from proven templates
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
                Step-by-step AI section building
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
                Professional module creation workflow
              </div>
            </div>
            <Button className="w-full mt-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
              Start with Templates
            </Button>
          </CardContent>
        </Card>

        {/* PowerPoint Import */}
        <Card className="cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-105 border-2 hover:border-blue-300">
          <CardContent className="p-6 text-center" onClick={() => onMethodSelect('powerPoint')}>
            <div className="mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Upload className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">PowerPoint Import</h3>
              <p className="text-gray-600 text-sm mb-4">
                Transform your existing PowerPoint presentations into interactive learning modules with AI enhancement.
              </p>
            </div>
            <div className="space-y-2 text-left">
              <div className="flex items-center text-sm text-gray-600">
                <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
                Upload .ppt or .pptx files
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
                AI converts static slides to interactive content
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
                Automatic quiz generation from content
              </div>
            </div>
            <Button className="w-full mt-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
              Import Presentation
            </Button>
          </CardContent>
        </Card>

        {/* Manual Creation */}
        <Card className="cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-105 border-2 hover:border-green-300">
          <CardContent className="p-6 text-center" onClick={() => onMethodSelect('manual')}>
            <div className="mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-teal-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Edit className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Manual Creation</h3>
              <p className="text-gray-600 text-sm mb-4">
                Build your module from scratch with full control over every section. Includes AI templates and content suggestions.
              </p>
            </div>
            <div className="space-y-2 text-left">
              <div className="flex items-center text-sm text-gray-600">
                <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
                Complete creative control
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
                AI content templates available
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
                Multiple section types and formats
              </div>
            </div>
            <Button className="w-full mt-4 bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700">
              Create Manually
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}