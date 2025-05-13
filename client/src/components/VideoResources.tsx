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
    if (!url) return "https://www.youtube.com/embed/5oP2__wXQ9U"; // Default video if none provided
    
    try {
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
      
      // If we couldn't extract a valid video ID, return a default
      if (!videoId || videoId.length !== 11) {
        console.warn("Invalid YouTube URL detected, using fallback video:", url);
        return getDefaultVideoForTopic();
      }
      
      return `https://www.youtube.com/embed/${videoId}`;
    } catch (error) {
      console.error("Error processing video URL:", url, error);
      return getDefaultVideoForTopic();
    }
  };
  
  // Get default video based on topic
  const getDefaultVideoForTopic = (): string => {
    const topicLower = moduleName.toLowerCase();
    
    if (topicLower.includes('listen') || topicLower.includes('communication')) {
      return "https://www.youtube.com/embed/ZwSHAIb_qO8"; // Active Listening video
    } else if (topicLower.includes('empathy')) {
      return "https://www.youtube.com/embed/9_1Rt1R4xbM"; // Empathy video
    } else {
      return "https://www.youtube.com/embed/5oP2__wXQ9U"; // General ECE video
    }
  };

  // Curated external resources based on module type/name
  const getResourcesByTopic = () => {
    const topicLower = moduleName.toLowerCase();

    // Active Listening specific resources
    // Transition Techniques Module
    if (topicLower.includes('transition')) {
      return {
        videos: [
          { 
            url: "https://www.youtube.com/embed/hEgzMURdd7Q", 
            title: "Smooth Transitions in the Classroom: Building Chapter One",
            source: "Raising Arizona Preschool" 
          },
          { 
            url: "https://www.youtube.com/embed/fm2RnvbPNvU", 
            title: "Using Songs for Preschool Transitions",
            source: "Early Childhood Education" 
          },
          { 
            url: "https://www.youtube.com/embed/1i1NnzPPdGI", 
            title: "Visual Schedules & Transition Strategies",
            source: "Mindful Mornings" 
          }
        ],
        articles: [
          {
            title: "Transition Strategies for Building Chapter One in Every Child",
            url: "https://www.naeyc.org/resources/pubs/tyc/oct2017/planning-transitions-prevent-challenging-behavior",
            source: "NAEYC"
          },
          {
            title: "Supporting Transitions: Using Classroom Routines",
            url: "https://eclkc.ohs.acf.hhs.gov/transitions/article/transition-resources-teachers-staff",
            source: "Head Start ECLKC"
          },
          {
            title: "Transition Time Management for Preschool Teachers",
            url: "https://www.edutopia.org/article/using-transitions-effectively",
            source: "Edutopia"
          }
        ],
        tools: [
          {
            title: "Visual Transition Cards Toolkit",
            url: "https://csefel.vanderbilt.edu/resources/strategies.html",
            source: "CSEFEL Vanderbilt"
          },
          {
            title: "Transition Songs and Chants Collection",
            url: "https://teachingstrategies.com/blog/classroom-transitions/",
            source: "Teaching Strategies"
          },
          {
            title: "Classroom Timer Tools for Transitions",
            url: "https://challengingbehavior.cbcs.usf.edu/Implementation/teachers.html",
            source: "Center on PBIS"
          }
        ]
      };
    }
    
    // Active Listening Module
    else if (topicLower.includes('listen') || topicLower.includes('communication')) {
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
              {/* Recommendation message */}
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 mb-6">
                <h3 className="text-blue-800 font-medium flex items-center mb-2">
                  <Youtube className="h-5 w-5 mr-2 text-blue-600" />
                  Enhance your learning
                </h3>
                <p className="text-blue-700 text-sm">
                  We recommend watching at least one video to improve your understanding of this topic. 
                  Research shows visual learning helps with retention and practical application of concepts.
                </p>
              </div>
              
              {/* Display recommended videos from topic resources */}
              <div className="grid gap-6">
                {externalResources.videos && externalResources.videos.length > 0 ? (
                  externalResources.videos.map((video, index) => (
                    <div key={index} className="mb-4">
                      <div className="relative pb-[56.25%] h-0 rounded-md overflow-hidden border">
                        <iframe 
                          src={video.url} 
                          title={video.title || `Resource ${index + 1}`}
                          className="absolute top-0 left-0 w-full h-full" 
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                          allowFullScreen
                        ></iframe>
                      </div>
                      <p className="text-sm mt-2 text-muted-foreground flex items-center">
                        <Youtube className="h-4 w-4 mr-1 text-red-500" />
                        {video.title || `Video Resource ${index + 1}`}
                        {video.source && 
                          <span className="font-medium text-primary ml-1"> • {video.source}</span>
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