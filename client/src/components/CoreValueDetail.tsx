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
  const [selectedStoryIndex, setSelectedStoryIndex] = useState(0);
  const [storySelections, setStorySelections] = useState<Record<string, number>>({});
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
      stories: [
        {
          title: "Mr. Julian's Monday Morning",
          text: `The classroom door swung open at 6:45 AM as Mr. Julian arrived, a full hour before his preschoolers would bounce through the same door. He set his coffee down and surveyed the quiet room with a satisfied smile. Yesterday evening, he had stayed an extra thirty minutes to arrange everything for today's volcano science activity.

The red and orange tissue paper strips were neatly cut and stored in labeled containers. The baking soda and vinegar sat ready on the counter, safely out of reach. A plastic tarp covered the demonstration table. The children's science journals—simple stapled pages with their names carefully written—were stacked and ready for their observations and drawings.

But Mr. Julian's preparation went beyond materials. He had practiced the demonstration at home with his own children, noting exactly how much baking soda created the perfect eruption. He had prepared simple scientific vocabulary cards with pictures to introduce words like "eruption," "lava," and "chemical reaction." And knowing that four-year-old Zuri had a sensitivity to loud noises, he had brought noise-canceling headphones for her to wear during the demonstration.

At 7:15 AM, his teaching assistant Ms. Rebecca arrived. "Wow, everything's ready to go!" she exclaimed.

"I learned my lesson last year," Mr. Julian laughed. "Remember the butterfly release when I forgot to check if the larvae had all formed chrysalides? Half the children were in tears when they saw caterpillars instead of butterflies!"

The morning flowed smoothly until an unexpected fire drill interrupted their science time. While other classrooms scrambled to line up, Mr. Julian calmly reached for the emergency backpack he kept updated and hanging by the door. Inside were current attendance sheets, emergency contact information, first aid supplies, and even small comfort toys for children who might become anxious.

After returning from the drill, he seamlessly transitioned the children to their volcano activity, pulling out a backup lesson plan he had adjusted for shorter time. Though they had less time for the activity, the children were engaged and excited, their learning undiminished by the interruption.

At pickup time, parent after parent commented on their children's enthusiasm about volcanoes. "Jayden couldn't stop talking about 'chemical reactions,'" one mother shared with a smile.

As Mr. Julian tidied up, his director stepped in. "That fire drill could have derailed your whole morning, but your class hardly missed a beat. What's your secret?"

Mr. Julian smiled. "No secret—just preparation. When I'm prepared, I can handle whatever comes our way, and the children feel that security. They know that even when things change unexpectedly, they're still in capable hands."

That evening, as he planned for tomorrow's extension activity, Mr. Julian reflected on how being prepared wasn't just about having materials ready—it was about creating an environment where children felt secure enough to focus on learning rather than worrying about what might happen next. And that kind of preparation was always worth the extra time.`,
          duration: "5 minutes"
        },
        {
          title: "Ms. June's Prepared Morning",
          text: `"Ms. June's Prepared Morning"

The Story:
Ms. June loved teaching toddlers—tiny shoes, tiny chairs, and big feelings everywhere. One afternoon at nap time, she did her prep:

Sketched tomorrow's songs and fingerplays on a sticky note.

Restocked her "oops" bag with diapers, wipes, spare clothes, and a small toy.

Took three deep breaths, thinking of one thing she was grateful for.

The next morning, the classroom door barely opened when little Rosa toddled in—barely awake and with a fresh diaper rash. Rosa screamed at circle time, wiggling so much Ms. June almost lost her patience.

But because Ms. June had prepared:

Spare Clothes & Comfort Toy: She slipped Rosa into clean shorts and handed her the soft frog toy. Instantly, Rosa's crying slowed to sniffles.

Planned Calming Song: When the group got noisy, Ms. June started the "Quiet as a Mouse" fingerplay she'd jotted down. The toddlers hushed, watched her calm movements, and joined in.

Mindful Moment: Before snack time, she led the children in "five little breaths"—breathe in like smelling cookies, breathe out like blowing out candles. Even Rosa joined, sitting quietly.

The Difference:

For Rosa: She felt seen and safe—her discomfort soothed by quick care and gentle rhythm.

For Ms. June: No tears of frustration—just relief and pride in a smooth morning. She knew her prep had turned chaos into calm.

Takeaway:
A few minutes of nap-time planning, a well-stocked bag, and a mindful breath can transform a rocky morning into a loving, laughter-filled day—for both teacher and child.`,
          duration: "3 minutes"
        }
      ],
      story: {
        title: "Mr. Julian's Monday Morning",
        text: `The classroom door swung open at 6:45 AM as Mr. Julian arrived, a full hour before his preschoolers would bounce through the same door. He set his coffee down and surveyed the quiet room with a satisfied smile. Yesterday evening, he had stayed an extra thirty minutes to arrange everything for today's volcano science activity.

The red and orange tissue paper strips were neatly cut and stored in labeled containers. The baking soda and vinegar sat ready on the counter, safely out of reach. A plastic tarp covered the demonstration table. The children's science journals—simple stapled pages with their names carefully written—were stacked and ready for their observations and drawings.

But Mr. Julian's preparation went beyond materials. He had practiced the demonstration at home with his own children, noting exactly how much baking soda created the perfect eruption. He had prepared simple scientific vocabulary cards with pictures to introduce words like "eruption," "lava," and "chemical reaction." And knowing that four-year-old Zuri had a sensitivity to loud noises, he had brought noise-canceling headphones for her to wear during the demonstration.

At 7:15 AM, his teaching assistant Ms. Rebecca arrived. "Wow, everything's ready to go!" she exclaimed.

"I learned my lesson last year," Mr. Julian laughed. "Remember the butterfly release when I forgot to check if the larvae had all formed chrysalides? Half the children were in tears when they saw caterpillars instead of butterflies!"

The morning flowed smoothly until an unexpected fire drill interrupted their science time. While other classrooms scrambled to line up, Mr. Julian calmly reached for the emergency backpack he kept updated and hanging by the door. Inside were current attendance sheets, emergency contact information, first aid supplies, and even small comfort toys for children who might become anxious.

After returning from the drill, he seamlessly transitioned the children to their volcano activity, pulling out a backup lesson plan he had adjusted for shorter time. Though they had less time for the activity, the children were engaged and excited, their learning undiminished by the interruption.

At pickup time, parent after parent commented on their children's enthusiasm about volcanoes. "Jayden couldn't stop talking about 'chemical reactions,'" one mother shared with a smile.

As Mr. Julian tidied up, his director stepped in. "That fire drill could have derailed your whole morning, but your class hardly missed a beat. What's your secret?"

Mr. Julian smiled. "No secret—just preparation. When I'm prepared, I can handle whatever comes our way, and the children feel that security. They know that even when things change unexpectedly, they're still in capable hands."

That evening, as he planned for tomorrow's extension activity, Mr. Julian reflected on how being prepared wasn't just about having materials ready—it was about creating an environment where children felt secure enough to focus on learning rather than worrying about what might happen next. And that kind of preparation was always worth the extra time.`,
        duration: "5 minutes"
      },
      examples: [
        "Create weekly lesson plans with clear objectives",
        "Prepare materials before children arrive",
        "Have backup activities ready for unexpected schedule changes",
        "Know each child's developmental needs and preferences",
        "Review curriculum and educational goals regularly",
        "Keep emergency procedures and materials updated and accessible"
      ],
      reflection: [
        "How does planning ahead impact your teaching effectiveness?",
        "What systems do you use to stay prepared?",
        "How do you handle unexpected situations?",
        "What areas of preparation could you improve upon?",
        "How does your preparation affect children's sense of security?"
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
      story: {
        title: "Commitment's Whistle-Stop Rap",
        text: `"Commitment's Whistle-Stop Rap (Extended)"

Rain or shine, snow or heat,
I lace my boots—won't face defeat.
6AM rise, coffee in hand,
Promise made—I take my stand.

Cold or hot, glitch or flop,
A promise kept means you don't stop.
Blocks may crash—bam!, songs may skip,
But I stay true—no quick flip.

When you say "I'm here," kids feel safe,
Their hearts light up—no shadow's chafe.
Miss one day—thud!—their trust shakes,
A lonely tear is what it takes.

In preschool halls or office rooms,
Keeping your word brightens the glooms.
Show up for work, show up for life,
Your "I will" cuts through any strife.

Story-time call—tap, tap, they wait,
When you break that word, they feel the weight.
A broken promise—a child can cry,
Their little world asks "why, oh why?"

So rain or shine, day or night,
Commitment means you hold the light.
Your promise gold, your word the key—
Be the guard of someone's dream, always be`,
        duration: "3 minutes"
      },
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
      story: {
        title: "The Power of Positivity",
        text: `Being positive in a preschool means bringing warmth, encouragement, and a calm presence into the classroom every day—even on tough mornings—so each child feels safe, valued, and ready to learn. Even when you're not at your best, showing up with a steady smile tells children they can count on you no matter what.

Why this matters:

• Builds trust and security, so children feel comfortable exploring and growing

• Models emotional resilience, teaching kids how to handle big feelings

• Creates a joyful atmosphere that fuels curiosity and engagement

• Ensures consistency, which is essential for healthy attachment and development

• Reinforces the idea that everyone deserves care and attention, even when life gets hard

Tool for staying positive when you're sad:

"Three Good Things" Practice: At the end of each day, write down or share with a colleague three small moments that went well—no matter how simple (a child's smile, a funny story, a peaceful moment). Focusing on positives rewires your brain to notice joy, making it easier to show up with genuine warmth tomorrow.`,
        duration: "3 minutes"
      },
      examples: [
        "Use encouraging language that focuses on effort",
        "Model positive self-talk and problem-solving",
        "Frame challenges as opportunities for growth",
        "Celebrate progress and small victories",
        "Find joy in everyday moments with children",
        "Practice the 'Three Good Things' exercise daily"
      ],
      reflection: [
        "How does your attitude affect classroom atmosphere?",
        "What strategies do you use to maintain positivity during difficult days?",
        "How do you balance positivity with authenticity?",
        "What is one way you could bring more positivity to your teaching?",
        "How might you implement the 'Three Good Things' practice in your routine?"
      ]
    }
  ];

  const actorVoices = [
    { id: "morgan-freeman", name: "Morgan Freeman", description: "Deep, calming voice" },
    { id: "jennifer-lawrence", name: "Jennifer Lawrence", description: "Engaging, warm voice" },
    { id: "preschool-teacher", name: "Preschool Teacher", description: "Authentic teacher voice" },
    { id: "storyteller", name: "Professional Storyteller", description: "Expressive with good cadence" },
    { id: "viola-davis", name: "Viola Davis", description: "Powerful, emotional voice" },
    { id: "robert-downey-jr", name: "Robert Downey Jr.", description: "Charismatic voice" },
    { id: "samuel-l-jackson", name: "Samuel L. Jackson", description: "Bold, commanding voice" },
    { id: "meryl-streep", name: "Meryl Streep", description: "Nuanced, expressive voice" }
  ];

  const handleTabChange = (value: string) => {
    setCurrentTab(value);
    setActiveStory(null);
    setAudioPlaying(false);
    
    // Use saved story selection for this tab if available, otherwise default to 0
    const savedSelection = storySelections[value] || 0;
    setSelectedStoryIndex(savedSelection);
  };

  const playStoryAudio = (valueId: string) => {
    const currentValue = coreValues.find(value => value.id === valueId);
    if (!currentValue) return;
    
    let storyText = '';
    
    // Get the appropriate story text based on what's available
    if (currentValue.stories && currentValue.stories.length > 0) {
      storyText = currentValue.stories[selectedStoryIndex].text;
    } else if (currentValue.story) {
      storyText = currentValue.story.text;
    } else {
      return; // No story available
    }
    
    setActiveStory(valueId);
    setAudioPlaying(true);
    
    // Get the actor's voice name for display and speech
    const actorVoice = actorVoices.find(a => a.id === selectedActor);
    const actorName = actorVoice?.name || 'Default Voice';
    
    // Start text-to-speech narration
    narrationRef.current = speakText(
      storyText,
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
                  
                  {(value.story || (value.stories && value.stories.length > 0)) && (
                    <div className="mt-6">
                      {value.stories && value.stories.length > 0 ? (
                        <>
                          <div className="flex justify-between items-center mb-2">
                            <div className="flex items-center gap-2">
                              <h3 className="text-lg font-semibold">Story:</h3>
                              <Select 
                                value={selectedStoryIndex.toString()} 
                                onValueChange={(val) => {
                                  const index = parseInt(val);
                                  setSelectedStoryIndex(index);
                                  // Save the selection for this tab
                                  setStorySelections({
                                    ...storySelections,
                                    [value.id]: index
                                  });
                                }}
                              >
                                <SelectTrigger className="w-[250px]">
                                  <SelectValue placeholder="Select a story" />
                                </SelectTrigger>
                                <SelectContent>
                                  {value.stories.map((story, index) => (
                                    <SelectItem key={index} value={index.toString()}>
                                      {story.title}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              <Clock className="h-3 w-3 mr-1 inline" />
                              {value.stories[selectedStoryIndex].duration}
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
                                <div className={audioPlaying && activeStory === value.id ? "story-narrating" : ""}>
                                  {audioPlaying && activeStory === value.id && (
                                    <div className="flex items-center justify-center mb-4 bg-blue-50 p-2 rounded-lg">
                                      <div className="animate-pulse mr-2">
                                        <Volume2 className="h-5 w-5 text-primary" />
                                      </div>
                                      <p className="text-sm text-primary font-medium">
                                        {actorVoices.find(a => a.id === selectedActor)?.name} is narrating this story
                                      </p>
                                    </div>
                                  )}
                                  <p className="whitespace-pre-line text-sm">{value.stories[selectedStoryIndex].text}</p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </>
                      ) : value.story && (
                        <>
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
                        </>
                      )}
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