import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Newspaper, Calendar } from "lucide-react";

interface Newsletter {
  id: number;
  title: string;
  subtitle: string;
  content: {
    sections: Array<{
      id: string;
      type: 'text' | 'image' | 'event' | 'announcement' | 'staff_spotlight';
      title?: string;
      content?: string;
      imageUrl?: string;
      date?: string;
      location?: string;
    }>;
  };
  publishedAt: string;
  status: string;
}

export function MonthlyNewsletter() {
  const currentMonth = new Date().toLocaleString('default', { month: 'long' });
  const [expanded, setExpanded] = useState(false);

  const { data: newsletters, isLoading } = useQuery<Newsletter[]>({
    queryKey: ['/api/newsletters'],
    select: (data) => data?.filter(newsletter => newsletter.status === 'published') || []
  });

  const latestNewsletter = newsletters?.[0];

  const renderNewsletterContent = () => {
    if (!latestNewsletter?.content?.sections) {
      return (
        <div>
          <h3 className="font-semibold text-lg mb-2">No Published Newsletters</h3>
          <p className="text-sm text-gray-600">
            Check back soon for the latest updates from your school.
          </p>
        </div>
      );
    }

    return (
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-lg">{latestNewsletter.title}</h3>
          {latestNewsletter.publishedAt && (
            <span className="text-xs text-gray-500 flex items-center">
              <Calendar className="h-3 w-3 mr-1" />
              {new Date(latestNewsletter.publishedAt).toLocaleDateString()}
            </span>
          )}
        </div>
        
        {latestNewsletter.subtitle && (
          <p className="text-sm text-gray-600 mb-3 italic">{latestNewsletter.subtitle}</p>
        )}

        <div className={expanded ? "" : "line-clamp-6"}>
          {latestNewsletter.content.sections.map((section, index) => {
            if (section.type === 'text' && section.content) {
              return (
                <div key={section.id || index} className="mb-3">
                  {section.title && (
                    <h4 className="font-medium text-sm mb-1">{section.title}</h4>
                  )}
                  <p className="text-sm text-gray-700">{section.content}</p>
                </div>
              );
            }
            
            if (section.type === 'announcement' && section.content) {
              return (
                <div key={section.id || index} className="mb-3 p-2 bg-yellow-50 border-l-4 border-yellow-400 rounded">
                  {section.title && (
                    <h4 className="font-medium text-sm mb-1 text-yellow-800">{section.title}</h4>
                  )}
                  <p className="text-sm text-yellow-700">{section.content}</p>
                </div>
              );
            }

            if (section.type === 'event' && section.content) {
              return (
                <div key={section.id || index} className="mb-3 p-2 bg-blue-50 border-l-4 border-blue-400 rounded">
                  {section.title && (
                    <h4 className="font-medium text-sm mb-1 text-blue-800">{section.title}</h4>
                  )}
                  <p className="text-sm text-blue-700">{section.content}</p>
                  {section.date && (
                    <p className="text-xs text-blue-600 mt-1">📅 {section.date}</p>
                  )}
                  {section.location && (
                    <p className="text-xs text-blue-600">📍 {section.location}</p>
                  )}
                </div>
              );
            }

            return null;
          })}
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <Card className="border border-blue-200 overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 pb-3">
          <div className="flex items-center">
            <Newspaper className="h-5 w-5 text-blue-500 mr-2" />
            <CardTitle className="text-lg">Monthly Newsletter</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-5/6"></div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="border border-blue-200 overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Newspaper className="h-5 w-5 text-blue-500 mr-2" />
            <CardTitle className="text-lg">Latest Newsletter</CardTitle>
          </div>
          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">{currentMonth}</span>
        </div>
        <CardDescription>
          Stay updated with the latest news from your school
        </CardDescription>
      </CardHeader>
      
      <CardContent className="p-4">
        {renderNewsletterContent()}
        
        {latestNewsletter?.content?.sections && latestNewsletter.content.sections.length > 0 && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setExpanded(!expanded)}
            className="mt-2 w-full text-blue-600 hover:text-blue-800 hover:bg-blue-50"
          >
            {expanded ? "Show Less" : "Read More"}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}