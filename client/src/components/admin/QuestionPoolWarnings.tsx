import React, { useState, useEffect } from 'react';
import { AlertTriangle, AlertCircle, Info, RefreshCw } from 'lucide-react';

interface DomainGap {
  domainId: number;
  domainName: string;
  difficulty: number;
  currentCount: number;
  requiredCount: number;
  gap: number;
}

interface PoolAnalysis {
  totalQuestions: number;
  totalApprovedQuestions: number;
  questionsPerAssessment: number;
  isCriticallyLow: boolean;
  isSeverelyLow: boolean;
  hasMajorGaps: boolean;
  criticalThreshold: number;
  severeThreshold: number;
  domainGaps: DomainGap[];
  warningLevel: 'none' | 'gaps' | 'severe' | 'critical';
  warningMessage: string;
  recommendations: string[];
}

interface QuestionPoolWarningsProps {
  onRefresh?: () => void;
}

export default function QuestionPoolWarnings({ onRefresh }: QuestionPoolWarningsProps) {
  const [analysis, setAnalysis] = useState<PoolAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const fetchAnalysis = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/admin/question-pool/analysis?admin_password=BIGSURF55', {
        credentials: 'include'
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch analysis');
      }
      
      setAnalysis(result.data);
    } catch (err: any) {
      console.error('Error fetching pool analysis:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalysis();
  }, []);

  const handleRefresh = () => {
    fetchAnalysis();
    onRefresh?.();
  };

  if (isLoading) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center space-x-2">
          <RefreshCw className="h-4 w-4 animate-spin text-blue-600" />
          <span className="text-sm text-blue-800">Analyzing question pool...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <span className="text-sm text-red-800">Failed to analyze question pool: {error}</span>
          </div>
          <button
            onClick={handleRefresh}
            className="text-red-600 hover:text-red-800 text-sm font-medium"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!analysis) return null;

  // Don't show anything if there are no warnings
  if (analysis.warningLevel === 'none') {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Info className="h-4 w-4 text-green-600" />
            <span className="text-sm text-green-800">
              Question pool appears adequate ({analysis.totalApprovedQuestions} approved questions)
            </span>
          </div>
          <button
            onClick={handleRefresh}
            className="text-green-600 hover:text-green-800 text-sm font-medium"
          >
            Refresh
          </button>
        </div>
      </div>
    );
  }

  // Determine styling based on warning level
  const getWarningStyles = () => {
    switch (analysis.warningLevel) {
      case 'critical':
        return {
          containerClass: 'bg-red-50 border-red-300',
          iconColor: 'text-red-600',
          textColor: 'text-red-800',
          buttonColor: 'text-red-600 hover:text-red-800',
          icon: AlertTriangle
        };
      case 'severe':
        return {
          containerClass: 'bg-orange-50 border-orange-300',
          iconColor: 'text-orange-600',
          textColor: 'text-orange-800',
          buttonColor: 'text-orange-600 hover:text-orange-800',
          icon: AlertTriangle
        };
      case 'gaps':
        return {
          containerClass: 'bg-yellow-50 border-yellow-300',
          iconColor: 'text-yellow-600',
          textColor: 'text-yellow-800',
          buttonColor: 'text-yellow-600 hover:text-yellow-800',
          icon: AlertCircle
        };
      default:
        return {
          containerClass: 'bg-gray-50 border-gray-300',
          iconColor: 'text-gray-600',
          textColor: 'text-gray-800',
          buttonColor: 'text-gray-600 hover:text-gray-800',
          icon: Info
        };
    }
  };

  const styles = getWarningStyles();
  const IconComponent = styles.icon;

  return (
    <div className={`border rounded-lg p-4 ${styles.containerClass}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <IconComponent className={`h-5 w-5 ${styles.iconColor}`} />
          <span className={`font-medium text-sm ${styles.textColor}`}>
            Question Pool Warning
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={`text-sm font-medium ${styles.buttonColor}`}
          >
            {isExpanded ? 'Hide Details' : 'Show Details'}
          </button>
          <button
            onClick={handleRefresh}
            className={`${styles.buttonColor}`}
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Warning Message */}
      <div className={`text-sm ${styles.textColor} mb-3`}>
        {analysis.warningMessage}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-4 mb-3 text-xs">
        <div className={`${styles.textColor}`}>
          <div className="font-medium">Total Questions</div>
          <div>{analysis.totalQuestions}</div>
        </div>
        <div className={`${styles.textColor}`}>
          <div className="font-medium">Approved & Enabled</div>
          <div>{analysis.totalApprovedQuestions}</div>
        </div>
        <div className={`${styles.textColor}`}>
          <div className="font-medium">Per Assessment</div>
          <div>{analysis.questionsPerAssessment}</div>
        </div>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="border-t pt-3 space-y-3">
          {/* Recommendations */}
          <div>
            <h4 className={`font-medium text-sm ${styles.textColor} mb-2`}>
              Recommendations:
            </h4>
            <ul className={`text-xs ${styles.textColor} space-y-1`}>
              {analysis.recommendations.map((rec, index) => (
                <li key={index} className="flex items-start space-x-1">
                  <span>•</span>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Domain Gaps */}
          {analysis.domainGaps.length > 0 && (
            <div>
              <h4 className={`font-medium text-sm ${styles.textColor} mb-2`}>
                Domain-Difficulty Gaps:
              </h4>
              <div className="max-h-32 overflow-y-auto">
                <div className="grid grid-cols-1 gap-1 text-xs">
                  {analysis.domainGaps.map((gap, index) => (
                    <div key={index} className={`flex justify-between items-center p-1 rounded ${styles.textColor}`}>
                      <span>{gap.domainName} (Level {gap.difficulty})</span>
                      <span className="font-mono">
                        {gap.currentCount}/{gap.requiredCount} (-{gap.gap})
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Thresholds */}
          <div>
            <h4 className={`font-medium text-sm ${styles.textColor} mb-2`}>
              Thresholds:
            </h4>
            <div className={`text-xs ${styles.textColor} space-y-1`}>
              <div>Critical: ≤ {analysis.criticalThreshold} questions</div>
              <div>Severe: &lt; {analysis.severeThreshold} questions</div>
              <div>Gaps: &lt; 2 questions per domain-difficulty combination</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 