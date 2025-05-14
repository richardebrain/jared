import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Lightbulb, Book, Volume2, PauseCircle, Clock, CheckCircle, Award } from "lucide-react";
import { useSoundEffects } from "@/hooks/useSoundEffects";

interface CoreValueDetailProps {
  onComplete: () => void;
}

export default function CoreValueDetail({ onComplete }: CoreValueDetailProps) {
  const [currentTab, setCurrentTab] = useState("be-consistent");
  const [activeStory, setActiveStory] = useState<string | null>(null);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [selectedActor, setSelectedActor] = useState("morgan-freeman");
  const [completedValues, setCompletedValues] = useState<string[]>([]);
  const { speakText } = useSoundEffects();
  const narrationRef = useRef<{ cancel: () => void } | null>(null);

  const coreValues = [
    {
      id: "be-consistent",
      title: "Be Consistent",
      icon: <Clock className="h-6 w-6 text-blue-500" />,
      color: "blue",
      description: "Provide stable, predictable environments where children can thrive",
      keyPoints: [
        "Children thrive when they know what to expect",
        "Consistent routines create a sense of security",
        "Predictable environments reduce anxiety and behavioral issues",
        "Regular schedules help build healthy habits and independence"
      ],
      story: {
        title: "Miss Rosa's Unbroken Circle",
        text: `"Miss Rosa's Unbroken Circle"

From the very first morning, Lila clung to the classroom door, eyes wide with worry. Her home was always shifting—new houses, new faces—but here, every sunrise brought Miss Rosa's familiar smile. Each day, Miss Rosa knelt beside Lila, gently brushing a stray curl from her forehead. "You're safe here, Lila," she whispered, "and I'm not going anywhere."

Miss Rosa wasn't just a teacher—she was a steady presence in each child's life. She learned the exact way Mason folded his favorite blanket at nap time, and she hummed Sophia's favorite tune whenever tears welled up. At snack time, she remembered who loved grapes and who preferred carrots. These small details wove a deep web of trust: the children knew she saw them, truly saw them.

The Turning Point:
One rainy Tuesday, the classroom buzzed with nervous energy. It was craft day, and every child came with scissors, glue sticks, and construction paper. Lila's hands trembled as she approached the art table—today was "Family Collage," and she had no picture of "family" to share. Her heart pounded; she backed away, tears brimming.

Miss Rosa noticed instantly. Without hesitation, she slipped from her desk, gathered Lila into a soft embrace, and said, "Let's make your collage of people who love you." She led Lila to a basket filled with photos Miss Rosa had secretly collected over weeks—snapshots of Lila laughing with classmates, planting seeds in the school garden, and playing dress-up at the dramatic play corner.

As Lila's eyes widened, understanding bloomed. Miss Rosa knelt beside her, whispering, "Love isn't just a photo—it's the laughter you share, the hands that hold yours, the moments we build together." With gentle guidance, they arranged images of classroom friends, a caregiver from drop-off, and even Miss Rosa herself, beaming as she read to the whole class.

When the collage was complete, Lila held it close, her tears turning to a bright smile. In that moment, the other children gathered round, offering glue and glitter with shy hands. The room glowed not just with colored paper, but with the warmth of belonging.

Weeks later, when a new family moved in and Lila once again felt unmoored, she carried her collage in her backpack like a shield. At the first tear of uncertainty, she pulled it out—her circle of love, unbroken. Because Miss Rosa had done more than teach letters or numbers: she had taught Lila that consistency is an unspoken promise to see every child's worth, hold them in every storm, and help them build a world of their own making.`,
        duration: "4 minutes"
      },
      examples: [
        "Follow the same daily schedule and routines",
        "Keep classroom rules and expectations the same day-to-day",
        "Ensure all teachers enforce the same behavioral expectations",
        "Give children warnings before transitions",
        "Follow through on promises and stated consequences"
      ],
      reflection: [
        "How do you currently provide consistency in your classroom?",
        "What areas of your teaching practice could benefit from more consistency?",
        "Have you noticed how children respond to changes in routine?",
        "What tools or strategies could help you maintain consistency?"
      ]
    },
    {
      id: "be-prepared",
      title: "Be Prepared",
      icon: <CheckCircle className="h-6 w-6 text-green-500" />,
      color: "green",
      description: "Plan effectively and come ready to deliver excellent educational experiences",
      keyPoints: [
        "Preparation eliminates unnecessary stress and confusion",
        "Well-prepared teachers can adapt to unexpected situations",
        "Having backup plans ensures learning continues despite disruptions",
        "Thoughtful preparation allows for deeper, more meaningful activities"
      ],
      examples: [
        "Create weekly lesson plans with clear objectives",
        "Prepare materials before children arrive",
        "Have backup activities ready for unexpected schedule changes",
        "Know each child's developmental needs and preferences",
        "Review curriculum and educational goals regularly"
      ],
      reflection: [
        "How does planning ahead impact your teaching effectiveness?",
        "What systems do you use to stay prepared?",
        "How do you handle unexpected situations?",
        "What areas of preparation could you improve upon?"
      ]
    },
    {
      id: "be-committed",
      title: "Be Committed",
      icon: <Award className="h-6 w-6 text-purple-500" />,
      color: "purple",
      description: "Demonstrate dedication to each child's growth and development",
      keyPoints: [
        "Commitment means showing up consistently for each child",
        "Dedicated teachers continue learning and improving their skills",
        "Long-term commitment allows for deeper understanding of each child's needs",
        "Commitment often means going above and beyond basic requirements"
      ],
      examples: [
        "Pursue professional development opportunities",
        "Adapt teaching approaches to meet individual needs",
        "Maintain communication with families about child progress",
        "Set and work toward personal teaching goals",
        "Advocate for children's needs and well-being"
      ],
      reflection: [
        "How do you demonstrate commitment to your role?",
        "What motivates you to remain dedicated to early childhood education?",
        "How do you balance commitment with preventing burnout?",
        "What is one way you could deepen your commitment to each child's development?"
      ]
    },
    {
      id: "be-caring",
      title: "Be Caring",
      icon: <Lightbulb className="h-6 w-6 text-red-500" />,
      color: "red",
      description: "Show genuine compassion and empathy for every child",
      keyPoints: [
        "Caring creates the emotional foundation for learning",
        "Empathetic responses help children develop emotional intelligence",
        "Genuine care builds trust between teachers and children",
        "A caring environment promotes social-emotional development"
      ],
      story: {
        title: "Ms. Elena's Whispered Promise",
        text: `"Ms. Elena's Whispered Promise"

Tiny footsteps echoed in the cubby‐lined hallway as four-year-old Jaylen shuffled toward the block corner. The morning's tears still glistened on his cheeks—each collapse of his wobbly tower a fresh reminder that he didn't belong. His chest tightened until Ms. Elena, the kind-eyed teacher with the softest voice in the world, knelt beside him.

She laid a gentle hand on his shoulder and whispered, "Each block you place makes you stronger—and you're already strong, Jaylen." Her words floated around him like a summer breeze, and in that moment, his heart unclenched. He took a deep breath, picked up a new block, and placed it with trembling pride.

Years Passed
• At six, Jaylen struggled with reading—and each time his eyes filled with doubt, he heard Ms. Elena's whisper, urging him on.
• At eight, he wrestled with loneliness on the playground—and again, her voice reminded him of his own resilience.
• At ten, when his family moved and he faced a brand-new school, he carried her words like a secret shield in his pocket.

The Turning Point
On her final day before retirement, Ms. Elena stood in front of the preschool class, her usual spark dimmed by tears she tried to hide. News had come that she was very ill, and today's tear-stained smocks and trembling hugs felt like the end of something sacred.

When the students brought her gifts of handmade cards and painted rocks, Jaylen paused outside the door—now a tall teenager with careful eyes. In his hands was something else: a simple wooden block, painted gold, on which he'd written two words in his neatest script:

"Already Strong."

He placed it in her hand. "You taught me how," he said, voice thick. "And I never forgot."

The Finale
Ms. Elena's tears flowed freely as she held the block close to her heart. The classroom fell silent, every child sensing the magic in that moment. She leaned forward, her voice a fragile whisper but just as powerful: "You have been my greatest lesson, Jaylen. You are already strong."

Years from now, Jaylen—now a teacher himself—would keep that golden block on his desk. And on hard days, when a child's tears threatened to wash away their confidence, he'd repeat Ms. Elena's promise, offering it like a lifeline. Because in those two simple words, he carried forward the most caring gift a teacher can give: the belief that a child is already strong, and always worthy of unwavering faith`,
        duration: "4 minutes"
      },
      examples: [
        "Respond warmly to children's emotional needs",
        "Show interest in each child's life outside school",
        "Use gentle, respectful tones even during challenging moments",
        "Get down to child's eye level when talking",
        "Celebrate each child's unique qualities and achievements"
      ],
      reflection: [
        "How do you demonstrate care for children who are challenging?",
        "What does showing care look like in your classroom?",
        "How do you balance care with maintaining professional boundaries?",
        "How does caring impact children's learning outcomes?"
      ]
    },
    {
      id: "be-positive",
      title: "Be Positive",
      icon: <Book className="h-6 w-6 text-yellow-500" />,
      color: "yellow",
      description: "Maintain an optimistic attitude that inspires and encourages children",
      keyPoints: [
        "Positive environments promote brain development and learning",
        "Optimistic teachers model resilience and problem-solving",
        "Positive reinforcement is more effective than punishment",
        "A positive approach builds children's confidence and self-esteem"
      ],
      examples: [
        "Use encouraging language that focuses on effort",
        "Model positive self-talk and problem-solving",
        "Frame challenges as opportunities for growth",
        "Celebrate progress and small victories",
        "Find joy in everyday moments with children"
      ],
      reflection: [
        "How does your attitude affect classroom atmosphere?",
        "What strategies do you use to maintain positivity during difficult days?",
        "How do you balance positivity with authenticity?",
        "What is one way you could bring more positivity to your teaching?"
      ]
    }
  ];

  const actorVoices = [
    { id: "morgan-freeman", name: "Morgan Freeman" },
    { id: "jennifer-lawrence", name: "Jennifer Lawrence" },
    { id: "robert-downey-jr", name: "Robert Downey Jr." },
    { id: "viola-davis", name: "Viola Davis" },
    { id: "samuel-l-jackson", name: "Samuel L. Jackson" },
    { id: "meryl-streep", name: "Meryl Streep" }
  ];

  const handleTabChange = (value: string) => {
    setCurrentTab(value);
    setActiveStory(null);
    setAudioPlaying(false);
  };

  const playStoryAudio = (valueId: string) => {
    const currentValue = coreValues.find(value => value.id === valueId);
    if (!currentValue || !currentValue.story) return;
    
    setActiveStory(valueId);
    setAudioPlaying(true);
    
    // Get the actor's voice name for display
    const actorName = actorVoices.find(a => a.id === selectedActor)?.name || 'Default Voice';
    
    // Start text-to-speech narration
    narrationRef.current = speakText(
      currentValue.story.text,
      actorName,
      () => {
        // When narration is complete
        setAudioPlaying(false);
        if (!completedValues.includes(valueId)) {
          setCompletedValues([...completedValues, valueId]);
        }
      }
    );
  };

  const stopStoryAudio = () => {
    if (narrationRef.current) {
      narrationRef.current.cancel();
      narrationRef.current = null;
    }
    setAudioPlaying(false);
  };

  const markValueAsCompleted = (valueId: string) => {
    if (!completedValues.includes(valueId)) {
      setCompletedValues([...completedValues, valueId]);
    }
  };

  const allValuesCompleted = completedValues.length === coreValues.length;

  const currentValue = coreValues.find(value => value.id === currentTab) || coreValues[0];

  return (
    <div className="core-value-detail p-4">
      <h2 className="text-2xl font-bold mb-6">Raising Arizona's CORE Values</h2>
      
      <p className="mb-6 text-lg">
        Now that you've identified our CORE values in the company song, let's explore each one in depth. 
        Navigate through each value, read the stories, and reflect on how you can implement these values in your teaching practice.
      </p>
      
      <div className="my-6 bg-amber-50 p-4 rounded-lg border border-amber-200">
        <div className="flex items-start">
          <div className="bg-amber-100 p-2 rounded-full mr-3">
            <Lightbulb className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <h3 className="font-semibold">Complete All Core Values</h3>
            <p className="text-sm text-amber-800">
              Visit each tab and complete the activities to earn your CORE Values certificate.
              Progress: {completedValues.length} of {coreValues.length} values completed.
            </p>
          </div>
        </div>
      </div>
      
      <Tabs value={currentTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid grid-cols-5 mb-6">
          {coreValues.map(value => (
            <TabsTrigger 
              key={value.id} 
              value={value.id}
              className={`relative ${completedValues.includes(value.id) ? 'text-emerald-700' : ''}`}
            >
              {value.title}
              {completedValues.includes(value.id) && (
                <span className="absolute -top-1 -right-1">
                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                </span>
              )}
            </TabsTrigger>
          ))}
        </TabsList>
        
        {coreValues.map(value => (
          <TabsContent key={value.id} value={value.id} className="space-y-6">
            <Card>
              <CardHeader className={`bg-${value.color}-50 border-b border-${value.color}-100`}>
                <div className="flex items-center">
                  {value.icon}
                  <CardTitle className="ml-2">{value.title}</CardTitle>
                </div>
                <CardDescription>{value.description}</CardDescription>
              </CardHeader>
              
              <CardContent className="pt-6">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Key Points</h3>
                    <ul className="list-disc pl-6 space-y-1">
                      {value.keyPoints.map((point, index) => (
                        <li key={index}>{point}</li>
                      ))}
                    </ul>
                  </div>
                  
                  {value.story && (
                    <div className="mt-6">
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="text-lg font-semibold">Story: {value.story.title}</h3>
                        <Badge variant="outline" className="text-xs">
                          <Clock className="h-3 w-3 mr-1 inline" />
                          {value.story.duration}
                        </Badge>
                      </div>
                      
                      <Card className="bg-slate-50">
                        <CardHeader className="pb-2">
                          <div className="flex justify-between items-center">
                            <div className="flex space-x-4">
                              <div>
                                <Label htmlFor="actor-voice" className="text-xs">Listen in your favorite actor's voice</Label>
                                <Select value={selectedActor} onValueChange={setSelectedActor}>
                                  <SelectTrigger id="actor-voice" className="w-[180px] mt-1">
                                    <SelectValue placeholder="Select actor" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {actorVoices.map(actor => (
                                      <SelectItem key={actor.id} value={actor.id}>
                                        {actor.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              
                              <div className="flex items-end">
                                {audioPlaying && activeStory === value.id ? (
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={stopStoryAudio}
                                    className="flex items-center"
                                  >
                                    <PauseCircle className="h-4 w-4 mr-1" />
                                    Stop Narration
                                  </Button>
                                ) : (
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={() => playStoryAudio(value.id)}
                                    className="flex items-center"
                                  >
                                    <Volume2 className="h-4 w-4 mr-1" />
                                    Read Aloud
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        </CardHeader>
                        
                        <CardContent>
                          <div className="prose max-w-none">
                            {audioPlaying && activeStory === value.id ? (
                              <div className="text-center py-6">
                                <div className="animate-pulse mb-2">
                                  <Volume2 className="h-8 w-8 mx-auto text-primary" />
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  {actorVoices.find(a => a.id === selectedActor)?.name} is narrating the story...
                                </p>
                              </div>
                            ) : (
                              <p className="whitespace-pre-line text-sm">{value.story.text}</p>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )}
                  
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Examples in Practice</h3>
                    <ul className="list-disc pl-6 space-y-1">
                      {value.examples.map((example, index) => (
                        <li key={index}>{example}</li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Reflection Questions</h3>
                    <div className="bg-slate-50 p-4 rounded-lg">
                      <ul className="space-y-2">
                        {value.reflection.map((question, index) => (
                          <li key={index} className="border-b border-slate-200 pb-2 last:border-0 last:pb-0">
                            <p className="italic">{question}</p>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
              
              <CardFooter className="justify-between border-t pt-4">
                <div className="text-sm text-muted-foreground">
                  {completedValues.includes(value.id) ? (
                    <span className="text-emerald-600 flex items-center">
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Completed
                    </span>
                  ) : (
                    <span>Read and reflect on this core value</span>
                  )}
                </div>
                <Button 
                  onClick={() => markValueAsCompleted(value.id)}
                  disabled={completedValues.includes(value.id)}
                >
                  Mark as Completed
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
      
      <div className="mt-8 flex justify-end">
        <Button 
          onClick={onComplete}
          disabled={!allValuesCompleted}
          className={`${allValuesCompleted ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-gray-400'}`}
          size="lg"
        >
          {allValuesCompleted ? 'Continue to Quiz' : `Complete All Values (${completedValues.length}/${coreValues.length})`}
        </Button>
      </div>
    </div>
  );
}