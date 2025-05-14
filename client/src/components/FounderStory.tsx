import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useSoundEffects } from "@/hooks/useSoundEffects";
import { Heart, HeartHandshake, Quote } from "lucide-react";

interface FounderStoryProps {
  onComplete: () => void;
}

export default function FounderStory({ onComplete }: FounderStoryProps) {
  const [showStory, setShowStory] = useState(true);
  const { playCelebrationSound } = useSoundEffects();
  
  const handleComplete = () => {
    playCelebrationSound();
    onComplete();
  };
  
  return (
    <div className="max-w-4xl mx-auto py-6 px-4">
      <Card className="border-primary/20 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-t-lg">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white rounded-full shadow-sm">
              <Quote className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-2xl">A Letter from Our Founder</CardTitle>
              <CardDescription>The Story Behind Raising Arizona</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6 pb-2 prose prose-indigo">
          <div className="space-y-4">
            <p className="font-medium leading-relaxed">
              When Craig first walked into our school-age room, he carried more pain than a five-year-old should ever know. He'd been expelled from preschool after preschool, labeled "too disruptive," "too loud," "too much." Our teachers—exhausted and underpaid—felt they were fighting a losing battle.
            </p>
            
            <p className="leading-relaxed">
              Yet one gray Monday, our team made a promise: we would look for something good in Craig, no matter how small.
            </p>
            
            <div className="flex items-start gap-4 my-6">
              <div className="pt-1">
                <Heart className="h-5 w-5 text-rose-500" />
              </div>
              <div>
                <p className="italic"><span className="font-medium">Day 1:</span> The only thing positive we spotted was his bright red shirt. We smiled and shouted, "Cool shirt, Craig!" A tiny flicker of pride in his eyes.</p>
              </div>
            </div>
            
            <div className="flex items-start gap-4 my-6">
              <div className="pt-1">
                <Heart className="h-5 w-5 text-rose-500" />
              </div>
              <div>
                <p className="italic"><span className="font-medium">Week 2:</span> He helped a classmate pick up spilled crayons. We cheered his kindness, and Craig's back straightened just a bit.</p>
              </div>
            </div>
            
            <div className="flex items-start gap-4 my-6">
              <div className="pt-1">
                <Heart className="h-5 w-5 text-rose-500" />
              </div>
              <div>
                <p className="italic"><span className="font-medium">Month 1:</span> During story time, Craig asked to read aloud. His voice shook—but we clapped so loudly his face broke into a grin.</p>
              </div>
            </div>
            
            <p className="leading-relaxed">
              Every "win" was a victory lap: a calm moment, a helpful gesture, a brave attempt. Some days our list of positives was laughably short—"He shared one block," "He said please," or simply "He put his book away." But we stuck with it, and each tiny spark built momentum.
            </p>
            
            <div className="bg-amber-50 p-4 rounded-lg border border-amber-100 my-6">
              <h4 className="font-bold text-amber-800 mb-2">Then came the day that changed everything:</h4>
              <p className="text-amber-900">
                During art class, a younger child began to cry. Without hesitation, Craig rose from his seat and knelt beside her. Gently, he offered her his paintbrush and said, <span className="italic font-medium">"It's okay. We can share."</span> In that instant, the entire room fell silent. Craig had discovered a new way to get attention— not by acting out, but by caring for others.
              </p>
            </div>
            
            <p className="leading-relaxed">
              He became our unofficial "line leader," proudly guiding friends down the hallway. At circle time, teachers leaned in, watchful: this was the same boy who once barreled into tantrums, now offering tissues to classmates who sniffled.
            </p>
            
            <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100 my-6">
              <h4 className="font-bold text-indigo-800 mb-2">The Pinnacle Moment</h4>
              <p className="text-indigo-900">
                A few years later, I received an invitation to Craig's wedding. In that elegant ceremony, he stood tall in a sharp suit—no longer the boy in the red shirt, but a man shaped by kindness and consistency. When I hugged him at the reception, he whispered, <span className="italic font-medium">"I still remember you cheering for my red shirt."</span> I realized then that our daily commitment—finding good, praising small steps—had rewritten his story forever.
              </p>
            </div>
            
            <p className="leading-relaxed">
              Craig's journey taught me that slow, steady encouragement can turn even the toughest beginnings into bright futures. And as Raising Arizona's Mindful Morning practice continues, we remember that for every Craig out there, the smallest act of belief can become the cornerstone of a lifetime.
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between pt-4 pb-6">
          <div className="flex items-center text-muted-foreground">
            <HeartHandshake className="h-5 w-5 mr-2" />
            <span className="text-sm">Our CORE values in action</span>
          </div>
          <Button onClick={handleComplete} className="bg-indigo-600 hover:bg-indigo-700">
            Continue to Training
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}