import { useState } from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { 
  Book, 
  Brain, 
  Calculator, 
  HeartHandshake, 
  Languages, 
  Leaf, 
  Mountain, 
  Palette, 
  Sparkles,
  Star
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { User } from "@shared/schema";
import { useSimpleAuth } from "@/lib/simple-auth";
import { toast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

// Domain color mapping
const domainColors = {
  social: "bg-pink-100 text-pink-800 border-pink-300",
  emotional: "bg-purple-100 text-purple-800 border-purple-300",
  language: "bg-blue-100 text-blue-800 border-blue-300",
  literacy: "bg-indigo-100 text-indigo-800 border-indigo-300",
  math: "bg-green-100 text-green-800 border-green-300",
  science: "bg-teal-100 text-teal-800 border-teal-300",
  physical: "bg-orange-100 text-orange-800 border-orange-300",
  arts: "bg-amber-100 text-amber-800 border-amber-300",
};

// Game examples for each standard
const gameExamples = {
  social: [
    {
      title: "Friendship Builders",
      description: "Children take turns being the 'friendship detective', identifying ways to be a good friend in different scenarios.",
      points: 5,
    },
    {
      title: "Emotion Charades",
      description: "Children take turns acting out emotions while others guess, then discuss appropriate responses.",
      points: 10,
    }
  ],
  emotional: [
    {
      title: "Feelings Bingo",
      description: "Children play bingo with emotion cards, discussing strategies for managing each emotion when they get a match.",
      points: 5,
    },
    {
      title: "Self-Regulation Obstacle Course",
      description: "Children navigate physical obstacles while practicing breathing and calming techniques at each station.",
      points: 10,
    }
  ],
  language: [
    {
      title: "Word Collector",
      description: "Children collect new vocabulary words throughout the week and create a 'word museum' display.",
      points: 5,
    },
    {
      title: "Story Circle",
      description: "Children sit in a circle adding one sentence at a time to create a collaborative story.",
      points: 10,
    }
  ],
  literacy: [
    {
      title: "Letter Detectives",
      description: "Children use magnifying glasses to find letters hidden around the classroom, matching them to a master alphabet chart.",
      points: 5,
    },
    {
      title: "Book Creators",
      description: "Children create their own books with illustrations and simple text, then 'read' them to stuffed animal friends.",
      points: 10,
    }
  ],
  math: [
    {
      title: "Pattern Blocks Challenge",
      description: "Children create and extend patterns using colored blocks, competing to make the longest pattern.",
      points: 5,
    },
    {
      title: "Shape Scavenger Hunt",
      description: "Children search for real-world examples of different shapes, documenting their findings with drawings.",
      points: 10,
    }
  ],
  science: [
    {
      title: "Mini Scientists",
      description: "Children make predictions about simple experiments, then test their hypotheses and record results.",
      points: 5,
    },
    {
      title: "Nature Explorers",
      description: "Children collect natural items outdoors, creating a classification system and comparing properties.",
      points: 10,
    }
  ],
  physical: [
    {
      title: "Animal Movement Olympics",
      description: "Children move like different animals (hop like a frog, slither like a snake) in relay races.",
      points: 5,
    },
    {
      title: "Fine Motor Challenges",
      description: "Children compete in timed activities like bead threading, button fastening, and using tweezers to sort small objects.",
      points: 10,
    }
  ],
  arts: [
    {
      title: "Musical Feelings",
      description: "Children listen to different music styles and create art that expresses how the music makes them feel.",
      points: 5,
    },
    {
      title: "Collaborative Mural",
      description: "Children work together to create a mural representing a theme from another learning domain.",
      points: 10,
    }
  ],
};

// Domain icons mapping
const domainIcons = {
  social: <HeartHandshake className="h-5 w-5" />,
  emotional: <Brain className="h-5 w-5" />,
  language: <Languages className="h-5 w-5" />,
  literacy: <Book className="h-5 w-5" />,
  math: <Calculator className="h-5 w-5" />,
  science: <Leaf className="h-5 w-5" />,
  physical: <Mountain className="h-5 w-5" />,
  arts: <Palette className="h-5 w-5" />,
};

// Arizona Early Learning Standards
const azStandards = {
  social: {
    title: "Social Development",
    icon: domainIcons.social,
    description: "Children develop skills to build relationships, regulate emotions, and participate in social groups.",
    standards: [
      {
        id: "S1",
        title: "Positive Self-Concept",
        description: "Child demonstrates self-awareness, confidence, and a positive self-image.",
        examples: [
          "Shows pride in accomplishments",
          "Demonstrates knowledge of self-identity",
          "Makes independent choices and takes responsibility for actions"
        ]
      },
      {
        id: "S2",
        title: "Social Interactions",
        description: "Child relates positively to adults and peers.",
        examples: [
          "Responds when adults or other children initiate interactions",
          "Initiates and sustains positive interactions with adults and friends",
          "Demonstrates positive ways to resolve conflict"
        ]
      },
      {
        id: "S3",
        title: "Responsibility and Respect",
        description: "Child develops respect for self, others, and the environment.",
        examples: [
          "Respects the rights and property of others",
          "Shows empathy and caring for others",
          "Demonstrates responsible behavior in daily activities"
        ]
      }
    ]
  },
  emotional: {
    title: "Emotional Development",
    icon: domainIcons.emotional,
    description: "Children develop skills to understand and express their emotions appropriately.",
    standards: [
      {
        id: "E1",
        title: "Emotional Expression",
        description: "Child recognizes and expresses feelings in self and others.",
        examples: [
          "Identifies, describes, and expresses their own feelings",
          "Recognizes and responds to others' feelings",
          "Uses appropriate language to express emotions"
        ]
      },
      {
        id: "E2",
        title: "Self-Regulation",
        description: "Child manages emotions, attention, impulses, and behavior.",
        examples: [
          "Demonstrates ability to calm self after strong emotions",
          "Uses coping strategies to manage emotions",
          "Follows expectations for appropriate behavior"
        ]
      }
    ]
  },
  language: {
    title: "Language Development",
    icon: domainIcons.language,
    description: "Children develop skills in both understanding and communicating through language.",
    standards: [
      {
        id: "L1",
        title: "Receptive Language",
        description: "Child understands and responds to oral language.",
        examples: [
          "Follows directions that involve multiple steps",
          "Responds to questions with appropriate answers",
          "Demonstrates understanding of increasingly complex vocabulary"
        ]
      },
      {
        id: "L2",
        title: "Expressive Language",
        description: "Child uses language to express thoughts and needs.",
        examples: [
          "Uses increasingly complex sentences and grammar",
          "Engages in conversations with adults and peers",
          "Uses language to express needs, ideas, actions, and feelings"
        ]
      }
    ]
  },
  literacy: {
    title: "Early Literacy",
    icon: domainIcons.literacy,
    description: "Children develop knowledge and skills in early reading and writing.",
    standards: [
      {
        id: "LT1",
        title: "Print Awareness",
        description: "Child demonstrates knowledge and awareness of print concepts.",
        examples: [
          "Recognizes that print carries meaning",
          "Understands directional reading conventions",
          "Identifies book parts and their functions"
        ]
      },
      {
        id: "LT2",
        title: "Phonological Awareness",
        description: "Child demonstrates awareness of sounds in spoken language.",
        examples: [
          "Recognizes and identifies rhyming words",
          "Identifies beginning sounds in words",
          "Segments words into syllables"
        ]
      },
      {
        id: "LT3",
        title: "Early Writing",
        description: "Child uses writing materials to communicate ideas.",
        examples: [
          "Makes marks, scribbles, and letter-like forms",
          "Understands that writing conveys meaning",
          "Uses invented spelling to write words"
        ]
      }
    ]
  },
  math: {
    title: "Mathematics",
    icon: domainIcons.math,
    description: "Children develop knowledge and skills in mathematical thinking and problem-solving.",
    standards: [
      {
        id: "M1",
        title: "Number Sense",
        description: "Child uses numbers to describe relationships and solve problems.",
        examples: [
          "Counts with understanding",
          "Compares quantities using appropriate vocabulary",
          "Recognizes number symbols 1-10"
        ]
      },
      {
        id: "M2",
        title: "Patterns and Algebra",
        description: "Child recognizes, duplicates, creates patterns, and makes predictions.",
        examples: [
          "Recognizes and extends simple patterns",
          "Creates and duplicates patterns",
          "Sorts and classifies objects by attributes"
        ]
      },
      {
        id: "M3",
        title: "Geometry and Spatial Sense",
        description: "Child recognizes and uses shapes and space.",
        examples: [
          "Identifies common geometric shapes",
          "Describes positions using spatial words",
          "Creates and builds shapes using various materials"
        ]
      }
    ]
  },
  science: {
    title: "Science",
    icon: domainIcons.science,
    description: "Children develop skills for scientific inquiry and knowledge of the natural world.",
    standards: [
      {
        id: "SC1",
        title: "Scientific Inquiry",
        description: "Child asks questions and conducts investigations to find answers.",
        examples: [
          "Asks questions about objects and events",
          "Makes predictions and tests ideas",
          "Uses tools and instruments to gather information"
        ]
      },
      {
        id: "SC2",
        title: "The Physical World",
        description: "Child demonstrates knowledge of the physical world.",
        examples: [
          "Explores and describes properties of objects",
          "Investigates and describes motion",
          "Explores and describes sources of energy"
        ]
      },
      {
        id: "SC3",
        title: "The Natural World",
        description: "Child demonstrates knowledge of the natural world.",
        examples: [
          "Observes and describes living things",
          "Understands that living things change over time",
          "Demonstrates respect for the environment"
        ]
      }
    ]
  },
  physical: {
    title: "Physical Development",
    icon: domainIcons.physical,
    description: "Children develop physical skills through movement and activity.",
    standards: [
      {
        id: "P1",
        title: "Gross Motor Development",
        description: "Child demonstrates control, balance, and coordination of large muscles.",
        examples: [
          "Moves with balance and control",
          "Coordinates movements to perform tasks",
          "Demonstrates spatial awareness in movement activities"
        ]
      },
      {
        id: "P2",
        title: "Fine Motor Development",
        description: "Child demonstrates control, strength, and coordination of small muscles.",
        examples: [
          "Uses tools with control and precision",
          "Demonstrates hand-eye coordination",
          "Manipulates small objects with increasing control"
        ]
      }
    ]
  },
  arts: {
    title: "Creative Arts",
    icon: domainIcons.arts,
    description: "Children engage in creative expression through art, music, movement, and dramatic play.",
    standards: [
      {
        id: "A1",
        title: "Visual Arts",
        description: "Child creates, represents, and appreciates visual art forms.",
        examples: [
          "Uses a variety of materials and techniques for artistic expression",
          "Creates art to represent ideas, feelings, and experiences",
          "Appreciates and responds to the artwork of others"
        ]
      },
      {
        id: "A2",
        title: "Music and Movement",
        description: "Child creates, represents, and appreciates musical expressions.",
        examples: [
          "Participates in a variety of musical activities",
          "Responds to different types of music",
          "Uses music and movement to express ideas and feelings"
        ]
      },
      {
        id: "A3",
        title: "Dramatic Play",
        description: "Child engages in creative role-play and imaginative play.",
        examples: [
          "Assumes different roles in pretend play",
          "Creates props to support dramatic play",
          "Engages in cooperative pretend play with others"
        ]
      }
    ]
  }
};

interface ArizonaEarlyLearningStandardsProps {
  defaultDomain?: keyof typeof azStandards;
}

export default function ArizonaEarlyLearningStandards({ 
  defaultDomain = "social" 
}: ArizonaEarlyLearningStandardsProps) {
  const [selectedDomain, setSelectedDomain] = useState<keyof typeof azStandards>(defaultDomain);
  const [completedGames, setCompletedGames] = useState<string[]>([]);
  const { user } = useSimpleAuth();
  const queryClient = useQueryClient();
  
  // Update user points
  const updateUserPoints = useMutation({
    mutationFn: async (pointsToAdd: number) => {
      if (!user) return null;
      
      const response = await apiRequest("PATCH", `/api/users/${user.id}`, {
        points: (user.points || 0) + pointsToAdd
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
    }
  });
  
  const handleGameComplete = (domain: string, gameIndex: number) => {
    const gameId = `${domain}-${gameIndex}`;
    if (completedGames.includes(gameId)) {
      return; // Already completed
    }
    
    // Add to completed games
    setCompletedGames([...completedGames, gameId]);
    
    // Award points
    const points = gameExamples[domain as keyof typeof gameExamples][gameIndex].points;
    updateUserPoints.mutate(points);
    
    toast({
      title: "Game Completed!",
      description: `You earned ${points} Achievement Points!`,
      duration: 3000,
    });
  };
  
  // Calculate domain completion percentage
  const getDomainCompletion = (domain: string) => {
    const domainGames = gameExamples[domain as keyof typeof gameExamples];
    if (!domainGames) return 0;
    
    const completed = completedGames.filter(gameId => gameId.startsWith(domain)).length;
    return Math.round((completed / domainGames.length) * 100);
  };
  
  return (
    <Card className="w-full shadow-md border-primary/10">
      <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl font-bold flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Arizona Early Learning Standards
            </CardTitle>
            <CardDescription>
              Explore standards through fun, interactive games
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <Tabs 
        defaultValue={selectedDomain} 
        onValueChange={(value) => setSelectedDomain(value as keyof typeof azStandards)}
        className="w-full"
      >
        <div className="px-4 pt-2">
          <TabsList className="grid grid-cols-4 md:grid-cols-8 h-auto">
            {Object.entries(azStandards).map(([domain, { title, icon }]) => (
              <TabsTrigger
                key={domain}
                value={domain}
                className="flex flex-col gap-1 py-2 h-auto"
              >
                <span className="flex justify-center">{icon}</span>
                <span className="text-xs">{title.split(' ')[0]}</span>
                <div className="w-full bg-gray-200 rounded-full h-1 mt-1">
                  <div 
                    className="bg-primary h-1 rounded-full" 
                    style={{ width: `${getDomainCompletion(domain)}%` }}
                  ></div>
                </div>
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
        
        {Object.entries(azStandards).map(([domain, { title, description, standards }]) => (
          <TabsContent key={domain} value={domain} className="px-4 pb-6">
            <div className="mb-4">
              <h3 className="text-xl font-bold text-primary mb-1 flex items-center gap-2">
                {azStandards[domain as keyof typeof azStandards].icon}
                {title}
              </h3>
              <p className="text-muted-foreground">{description}</p>
            </div>
            
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <h4 className="text-lg font-semibold mb-2">Standards</h4>
                <Accordion type="single" collapsible className="w-full">
                  {standards.map((standard) => (
                    <AccordionItem key={standard.id} value={standard.id}>
                      <AccordionTrigger className="hover:bg-muted/50 px-3 rounded-lg">
                        <div className="flex items-center gap-2 text-left">
                          <Badge variant="outline">{standard.id}</Badge>
                          <span>{standard.title}</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-3">
                        <p className="mb-2 text-muted-foreground">{standard.description}</p>
                        <ul className="list-disc pl-5 space-y-1">
                          {standard.examples.map((example, i) => (
                            <li key={i} className="text-sm">{example}</li>
                          ))}
                        </ul>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
              
              <div>
                <h4 className="text-lg font-semibold mb-2">Learning Games</h4>
                <div className="space-y-3">
                  {gameExamples[domain as keyof typeof gameExamples]?.map((game, index) => {
                    const gameId = `${domain}-${index}`;
                    const isCompleted = completedGames.includes(gameId);
                    
                    return (
                      <Card key={index} className={`border ${isCompleted ? 'bg-green-50 border-green-200' : ''}`}>
                        <CardHeader className="py-3 px-4">
                          <div className="flex justify-between items-center">
                            <CardTitle className="text-base font-semibold">
                              {game.title}
                            </CardTitle>
                            <Badge className="ml-2">
                              <Star className="h-3 w-3 mr-1" />
                              {game.points} pts
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="py-0 px-4">
                          <p className="text-sm text-muted-foreground">
                            {game.description}
                          </p>
                        </CardContent>
                        <CardFooter className="py-3 px-4">
                          <Button 
                            variant={isCompleted ? "outline" : "default"}
                            className="w-full"
                            onClick={() => handleGameComplete(domain, index)}
                            disabled={isCompleted}
                          >
                            {isCompleted ? "Completed!" : "Complete Game"}
                          </Button>
                        </CardFooter>
                      </Card>
                    );
                  })}
                </div>
              </div>
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </Card>
  );
}