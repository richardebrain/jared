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
  
  // Helper function to ensure URLs are formatted correctly for embedding
  const formatYouTubeUrl = (url: string): string => {
    if (!url) return "";
    
    // Handle various YouTube URL formats
    if (url.includes('youtube.com/embed/')) {
      return url; // Already in embed format
    }
    
    // Extract video ID from different YouTube URL formats
    let videoId = '';
    
    if (url.includes('youtube.com/watch?v=')) {
      videoId = url.split('v=')[1]?.split('&')[0];
    } else if (url.includes('youtu.be/')) {
      videoId = url.split('youtu.be/')[1]?.split('?')[0];
    } else if (url.includes('youtube.com/v/')) {
      videoId = url.split('youtube.com/v/')[1]?.split('?')[0];
    } else {
      // If it looks like just a video ID, use it directly
      if (/^[a-zA-Z0-9_-]{11}$/.test(url)) {
        videoId = url;
      }
    }
    
    // Return the embed URL or fallback to a default educational video if invalid
    return videoId 
      ? `https://www.youtube.com/embed/${videoId}` 
      : "https://www.youtube.com/embed/5oP2__wXQ9U"; // Preschool educator tips backup video
  };

  // Curated external resources based on module type/name
  const getResourcesByTopic = () => {
    const topicLower = moduleName.toLowerCase();

    // Active Listening specific resources
    if (topicLower.includes('listen') || topicLower.includes('communication')) {
      return {
        videos: [
          { 
            url: "https://www.youtube.com/embed/ZwSHAIb_qO8", 
            title: "Active Listening Techniques for Preschool",
            source: "Early Childhood Education" 
          },
          { 
            url: "https://www.youtube.com/embed/5oP2__wXQ9U", 
            title: "Effective Listening in the Classroom",
            source: "Teaching Channel" 
          },
          { 
            url: "https://www.youtube.com/embed/3_dAkDsBQyk", 
            title: "Communication Skills in Early Childhood",
            source: "Early Years" 
          }
        ],
        articles: [
          {
            title: "Active Listening with Young Children",
            url: "https://www.naeyc.org/resources/pubs/tyc/feb2018/three-steps-learning-through-listening",
            source: "NAEYC"
          },
          {
            title: "Building Effective Communication with Children",
            url: "https://eclkc.ohs.acf.hhs.gov/teaching-practices/article/tips-talking-children",
            source: "Head Start ECLKC"
          },
          {
            title: "Improving Listening Skills in the Classroom",
            url: "https://teachingstrategies.com/blog/listening-skills-for-preschoolers/",
            source: "Teaching Strategies"
          }
        ],
        tools: [
          {
            title: "Active Listening Skills Assessment",
            url: "https://csefel.vanderbilt.edu/resources/strategies.html",
            source: "CSEFEL Vanderbilt"
          },
          {
            title: "Listening Activity Cards for Preschoolers",
            url: "https://challengingbehavior.cbcs.usf.edu/Implementation/Program/strategies.html",
            source: "Center for Inclusive Child Care"
          },
          {
            title: "Communication Development Milestones",
            url: "https://www.zerotothree.org/resources/series/developing-early-communication-skills",
            source: "ZERO TO THREE"
          }
        ]
      };
    }
    
    // Empathy specific resources
    if (topicLower.includes('empathy') || topicLower.includes('perspective')) {
      return {
        videos: [
          { 
            url: "https://www.youtube.com/embed/9_1Rt1R4xbM", 
            title: "Teaching Empathy to Young Children",
            source: "Early Childhood Education" 
          },
          { 
            url: "https://www.youtube.com/embed/aU3QfyqvHk8", 
            title: "Building Empathy in Preschoolers",
            source: "Edutopia" 
          },
          { 
            url: "https://www.youtube.com/embed/cTOhzcSYMlM", 
            title: "Promoting Social-Emotional Skills",
            source: "PBS Kids" 
          }
        ],
        articles: [
          {
            title: "Developing Empathy in the Early Years",
            url: "https://www.naeyc.org/resources/pubs/tyc/apr2019/developing-empathy-inclusive-classrooms",
            source: "NAEYC"
          },
          {
            title: "Teaching Children to Care",
            url: "https://eclkc.ohs.acf.hhs.gov/school-readiness/article/self-regulation-skills-help-children-manage-behavior",
            source: "Head Start ECLKC"
          },
          {
            title: "Empathy Activities for Early Childhood",
            url: "https://www.teachingstrategies.com/blog/empathy-in-early-childhood-education/",
            source: "Teaching Strategies"
          }
        ],
        tools: [
          {
            title: "Empathy Building Toolkit",
            url: "https://csefel.vanderbilt.edu/resources/strategies.html",
            source: "CSEFEL Vanderbilt"
          },
          {
            title: "Perspective-Taking Activity Cards",
            url: "https://challengingbehavior.cbcs.usf.edu/docs/PosterTeachingRules_preschool.pdf",
            source: "Center for Inclusive Child Care"
          },
          {
            title: "Social-Emotional Development Guide",
            url: "https://www.zerotothree.org/resources/series/developing-social-emotional-skills",
            source: "ZERO TO THREE"
          }
        ]
      };
    }
    
    // Default resources (positive behavior/attitude focus)
    return {
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
    };
  };
  
  const externalResources = {
    ...getResourcesByTopic(),
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
                        src={formatYouTubeUrl(url)} 
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