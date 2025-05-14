import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle, CheckCircle, ExternalLink, X } from "lucide-react";
import { collectLinks, validateLinks, LinkInfo, ValidationResult } from '@/lib/linkValidator';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link } from 'wouter';

/**
 * LinkValidator component for testing and validating internal application links
 * Can be used as an admin tool for identifying 404 errors
 */
export default function LinkValidator() {
  const [results, setResults] = useState<ValidationResult[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  const [filter, setFilter] = useState<string>("all");
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Calculate stats about the validation results
  const validCount = results.filter(r => r.valid).length;
  const invalidCount = results.filter(r => !r.valid).length;
  const progressPercentage = results.length > 0 ? Math.round((validCount / results.length) * 100) : 0;
  
  // Filter results based on selected filter
  const filteredResults = (() => {
    if (filter === 'valid') return results.filter(r => r.valid);
    if (filter === 'invalid') return results.filter(r => !r.valid);
    if (filter === 'all') return results;
    if (filter !== 'all') return results.filter(r => r.link.source === filter);
    return results;
  })();
  
  // Get unique sources for filter options
  const sources = Array.from(new Set(results.map(r => r.link.source)));
  
  // Run validation on all links
  const runValidation = async () => {
    setIsValidating(true);
    try {
      const links = collectLinks();
      const validationResults = await validateLinks(links);
      setResults(validationResults);
    } catch (error) {
      console.error("Error validating links:", error);
    } finally {
      setIsValidating(false);
    }
  };
  
  // Attempt to visit a link and verify it loads properly
  const testLinkInBrowser = (path: string) => {
    const newWindow = window.open(path, '_blank');
    if (newWindow) {
      newWindow.addEventListener('load', () => {
        // In a real implementation, would need to check for 404 page markers
        const isNotFound = newWindow.location.pathname.includes('not-found') || 
                          newWindow.document.title.includes('Not Found');
        
        console.log(`Link test for ${path}: ${isNotFound ? 'FAILED - 404 detected' : 'SUCCESS'}`);
      });
    }
  };
  
  if (!isExpanded) {
    return (
      <div className="p-4 border border-amber-200 bg-amber-50 rounded-md">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <h3 className="text-sm font-medium">Link Validator</h3>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setIsExpanded(true)}
          >
            Open Tool
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Check for 404 errors in the application navigation
        </p>
      </div>
    );
  }
  
  return (
    <Card className="border-amber-200">
      <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Link Validator
          </CardTitle>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setIsExpanded(false)}
          >
            Minimize
          </Button>
        </div>
        <CardDescription>
          Test navigation links throughout the application to identify 404 errors
        </CardDescription>
      </CardHeader>
      
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="text-sm font-medium">Link validation status</div>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                <span>{validCount} valid</span>
              </div>
              <div className="flex items-center">
                <X className="h-4 w-4 text-red-500 mr-1" />
                <span>{invalidCount} invalid</span>
              </div>
            </div>
          </div>
          
          <Button 
            onClick={runValidation} 
            disabled={isValidating}
            size="sm"
          >
            {isValidating ? 'Validating...' : 'Validate Links'}
          </Button>
        </div>
        
        {results.length > 0 && (
          <>
            <Progress value={progressPercentage} />
            
            <div className="flex items-center justify-between">
              <div className="text-sm">
                {filteredResults.length} {filter === 'all' ? 'links' : filter === 'valid' ? 'valid links' : filter === 'invalid' ? 'invalid links' : `links from "${filter}"`}
              </div>
              
              <Select 
                value={filter} 
                onValueChange={(value) => setFilter(value)}
              >
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Filter links" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Links</SelectItem>
                  <SelectItem value="valid">Valid Links</SelectItem>
                  <SelectItem value="invalid">Invalid Links</SelectItem>
                  {sources.map(source => (
                    <SelectItem key={source} value={source}>
                      {source.charAt(0).toUpperCase() + source.slice(1)} Links
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <ScrollArea className="h-[300px] border rounded-md p-4">
              <div className="space-y-3">
                {filteredResults.map(result => (
                  <div 
                    key={result.link.id} 
                    className={`p-3 rounded-md border ${
                      result.valid ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-medium flex items-center">
                          {result.valid ? (
                            <CheckCircle className="h-4 w-4 text-green-500 mr-2 inline" />
                          ) : (
                            <X className="h-4 w-4 text-red-500 mr-2 inline" />
                          )}
                          {result.link.label} 
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          Path: {result.link.path}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {result.link.source}
                        </Badge>
                        
                        {result.valid ? (
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="h-7 px-2"
                            onClick={() => testLinkInBrowser(result.link.path)}
                          >
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        ) : null}
                      </div>
                    </div>
                    
                    {!result.valid && result.error && (
                      <div className="mt-2 text-sm text-red-600">
                        Error: {result.error}
                      </div>
                    )}
                  </div>
                ))}
                
                {filteredResults.length === 0 && (
                  <div className="text-center py-4 text-muted-foreground">
                    No links found matching the current filter
                  </div>
                )}
              </div>
            </ScrollArea>
          </>
        )}
      </CardContent>
      
      <CardFooter className="bg-muted/20 px-6 py-4">
        <div className="text-sm text-muted-foreground">
          <p>
            This tool helps identify potential navigation issues in the application.
            It validates routes against known valid paths and patterns.
          </p>
        </div>
      </CardFooter>
    </Card>
  );
}

// Already exported as default above