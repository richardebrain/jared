import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Youtube, BookOpen, FileText } from 'lucide-react';

interface VideoResourcesProps {
  videoUrls?: string[];
  moduleName: string;
}

export function VideoResources({ videoUrls = [], moduleName }: VideoResourcesProps) {
  const [activeTab, setActiveTab] = useState("videos");
  
  // Curated external resources based on module topic
  const externalResources = {
    videos: [
      { 
        url: "https://www.youtube.com/embed/ckZt33Ymbpg", 
        title: "Positive Behavior Support in ECE",
        source: "Vanderbilt IRIS Center"
      },
      { 
        url: "https://www.youtube.com/embed/4PSRP98mtJY", 
        title: "Creating a Positive Classroom Environment",
        source: "PBS Teachers" 
      },
      { 
        url: "https://www.youtube.com/embed/HQT6u-tFKZ4", 
        title: "Positive Teacher-Child Interactions",
        source: "Head Start" 
      }
    ],
    articles: [
      {
        title: "The Power of Positive Attitudes in Early Education",
        url: "https://www.naeyc.org/resources/pubs/tyc/positive-guidance",
        source: "NAEYC"
      },
      {
        title: "Creating a Positive Classroom Climate",
        url: "https://eclkc.ohs.acf.hhs.gov/teaching-practices/article/creating-positive-learning-climate",
        source: "Head Start ECLKC"
      },
      {
        title: "Strategies for Promoting Positive Behavior",
        url: "https://www.cdc.gov/ncbddd/childdevelopment/positiveparenting/index.html",
        source: "CDC"
      }
    ],
    tools: [
      {
        title: "Positive Behavior Reflection Tool",
        url: "https://challengingbehavior.cbcs.usf.edu/Implementation/Program/strategies.html",
        source: "Center for Inclusive Child Care"
      },
      {
        title: "Printable Positive Reinforcement Charts",
        url: "https://csefel.vanderbilt.edu/resources/strategies.html",
        source: "CSEFEL Vanderbilt"
      },
      {
        title: "Interactive Social-Emotional Learning Activities",
        url: "https://www.zerotothree.org/resources/series/developing-social-emotional-skills",
        source: "ZERO TO THREE"
      }
    ]
  };

  return (
    <Card className="border-t-4 border-t-primary shadow-md">
      <CardHeader className="bg-muted/50 pb-2">
        <CardTitle className="text-lg font-medium flex items-center">
          <Youtube className="h-5 w-5 mr-2 text-red-500" />
          {moduleName} Resources
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        <Tabs defaultValue="videos" className="w-full" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="videos" className="flex items-center">
              <Youtube className="h-4 w-4 mr-2" />
              Videos
            </TabsTrigger>
            <TabsTrigger value="articles" className="flex items-center">
              <BookOpen className="h-4 w-4 mr-2" />
              Articles
            </TabsTrigger>
            <TabsTrigger value="tools" className="flex items-center">
              <FileText className="h-4 w-4 mr-2" />
              Tools
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="videos" className="mt-4">
            <div className="space-y-4">
              {videoUrls && videoUrls.length > 0 ? (
                videoUrls.map((url, index) => (
                  <div key={index} className="mb-4">
                    <div className="aspect-w-16 aspect-h-9 mb-2 rounded-md overflow-hidden">
                      <iframe 
                        src={url} 
                        title={`Video resource ${index + 1}`}
                        className="w-full h-full" 
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                        allowFullScreen
                      ></iframe>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {externalResources.videos[index]?.title || `Resource ${index + 1}`}
                      {externalResources.videos[index]?.source && 
                        <span className="font-medium text-primary"> • {externalResources.videos[index].source}</span>
                      }
                    </p>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <Youtube className="h-12 w-12 mx-auto text-muted-foreground/50 mb-2" />
                  <p className="text-muted-foreground">No video resources available</p>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="articles" className="mt-4">
            <div className="space-y-3">
              {externalResources.articles.map((article, index) => (
                <a 
                  key={index}
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-3 rounded-md hover:bg-muted transition-colors border flex items-start"
                >
                  <BookOpen className="h-5 w-5 mr-3 text-blue-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">{article.title}</p>
                    <p className="text-sm text-muted-foreground">{article.source}</p>
                  </div>
                </a>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="tools" className="mt-4">
            <div className="space-y-3">
              {externalResources.tools.map((tool, index) => (
                <a 
                  key={index}
                  href={tool.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-3 rounded-md hover:bg-muted transition-colors border flex items-start"
                >
                  <FileText className="h-5 w-5 mr-3 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">{tool.title}</p>
                    <p className="text-sm text-muted-foreground">{tool.source}</p>
                  </div>
                </a>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}