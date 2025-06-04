import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface PoolAnalysis {
  totalQuestions: number;
  totalApprovedQuestions: number;
  questionsPerAssessment: number;
  warningLevel: 'none' | 'gaps' | 'severe' | 'critical';
  warningMessage: string;
  recommendations: string[];
}

export function QuestionPoolWarning() {
  const { data: analysisData, isLoading } = useQuery<{ success: boolean; data: PoolAnalysis }>({
    queryKey: ['question-pool-analysis'],
    queryFn: async () => {
      return await apiRequest('/api/admin/question-pool/analysis?admin_password=BIGSURF55');
    },
    staleTime: 300000, // 5 minutes - don't refresh frequently since this is global warning
    refetchOnWindowFocus: false, // Don't auto-refresh
    refetchInterval: false, // No automatic polling
  });

  // Don't show anything if loading or no critical/severe issues
  if (isLoading || !analysisData?.data) {
    return null;
  }

  const analysis = analysisData.data;
  
  // Only show for critical and severe warnings
  if (analysis.warningLevel !== 'critical' && analysis.warningLevel !== 'severe') {
    return null;
  }

  const isCritical = analysis.warningLevel === 'critical';

  return (
    <Card className={`border-l-4 ${isCritical ? 'border-l-red-500 bg-red-50' : 'border-l-orange-500 bg-orange-50'}`}>
      <CardHeader className="pb-3">
        <CardTitle className={`flex items-center gap-2 ${isCritical ? 'text-red-700' : 'text-orange-700'}`}>
          {isCritical ? (
            <AlertCircle className="h-5 w-5" />
          ) : (
            <AlertTriangle className="h-5 w-5" />
          )}
          Question Pool {isCritical ? 'Critical' : 'Severe'} Warning
          <Badge variant={isCritical ? 'destructive' : 'secondary'} className="ml-2">
            {analysis.totalApprovedQuestions} approved questions
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className={`text-sm ${isCritical ? 'text-red-700' : 'text-orange-700'} mb-3`}>
          {analysis.warningMessage}
        </p>
        
        {analysis.recommendations.length > 0 && (
          <div>
            <p className={`text-sm font-medium ${isCritical ? 'text-red-700' : 'text-orange-700'} mb-2`}>
              Immediate Actions Required:
            </p>
            <ul className={`text-sm ${isCritical ? 'text-red-600' : 'text-orange-600'} space-y-1`}>
              {analysis.recommendations.slice(0, 3).map((rec, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-xs mt-1">•</span>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 