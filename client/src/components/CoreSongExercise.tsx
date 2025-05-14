import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Check, X } from "lucide-react";
import { useSoundEffects } from "@/hooks/useSoundEffects";

interface CoreSongExerciseProps {
  onComplete: (success: boolean) => void;
}

export default function CoreSongExercise({ onComplete }: CoreSongExerciseProps) {
  const [values, setValues] = useState(["", "", "", "", ""]);
  const [submitted, setSubmitted] = useState(false);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [showLyrics, setShowLyrics] = useState(false);
  const { playSuccessSound, playWrongSound } = useSoundEffects();
  
  const coreValues = [
    "Prepared",
    "Consistent",
    "Caring",
    "Positive",
    "Committed"
  ];
  
  const handleValueChange = (index: number, value: string) => {
    const newValues = [...values];
    newValues[index] = value;
    setValues(newValues);
  };
  
  const checkAnswers = () => {
    setSubmitted(true);
    
    // Create an array of normalized user values (lowercase and trimmed)
    const normalizedUserValues = values.map(value => value.toLowerCase().trim());
    
    // Create an array of normalized expected values (lowercase)
    const normalizedCoreValues = coreValues.map(value => value.toLowerCase());
    
    // Check if all expected values are present in user input (regardless of order)
    const allValuesPresent = normalizedCoreValues.every(expectedValue => 
      normalizedUserValues.includes(expectedValue)
    );
    
    // Also check if user provided exactly 5 valid values (no duplicates or empty inputs)
    const uniqueValues = new Set(normalizedUserValues.filter(value => value !== ""));
    const hasCorrectCount = uniqueValues.size === coreValues.length;
    
    // User is correct if they found all values and provided exactly 5 unique answers
    const isCorrect = allValuesPresent && hasCorrectCount;
    
    if (isCorrect) {
      playSuccessSound();
      onComplete(true);
    } else {
      playWrongSound();
    }
  };
  
  const resetExercise = () => {
    setValues(["", "", "", "", ""]);
    setSubmitted(false);
  };
  
  const togglePlayAudio = () => {
    const audio = document.getElementById("core-song-audio") as HTMLAudioElement;
    
    if (audioPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    
    setAudioPlaying(!audioPlaying);
  };
  
  useEffect(() => {
    const audio = document.getElementById("core-song-audio") as HTMLAudioElement;
    
    audio.addEventListener("ended", () => {
      setAudioPlaying(false);
    });
    
    return () => {
      audio.removeEventListener("ended", () => {
        setAudioPlaying(false);
      });
    };
  }, []);
  
  return (
    <div className="flex flex-col gap-6 p-4">
      <h2 className="text-2xl font-bold">Raising Arizona's Core Values Song Exercise</h2>
      
      <p className="text-lg">
        Listen to our company song "Sunrise paints the Glendale sky gold" and identify the 5 core values mentioned in the lyrics. Type each core value in any of the boxes below. You can enter the values in any order! <span className="text-primary font-semibold">Just enter the value (Prepared, Caring, etc.) - you don't need to add "Be" before each value.</span>
      </p>
      
      <Card className="p-4 bg-amber-50">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <audio 
            id="core-song-audio" 
            src="/assets/Sunrise paints the Glendale sky gold.mp3"
            className="w-full"
            controls
            onError={(e) => console.error("Audio error:", e)}
          />
          
          <Button 
            onClick={togglePlayAudio}
            variant="outline"
            className="min-w-[120px]"
          >
            {audioPlaying ? "Pause" : "Play"} Song
          </Button>
          
          <Button
            onClick={() => setShowLyrics(!showLyrics)}
            variant="outline"
            className="min-w-[120px]"
          >
            {showLyrics ? "Hide" : "Show"} Lyrics
          </Button>
        </div>
      </Card>
      
      {showLyrics && (
        <Card className="p-4 max-h-[400px] overflow-y-auto">
          <h3 className="text-xl font-bold mb-2">Raising Arizona Goes Country</h3>
          <Separator className="my-2" />
          
          <pre className="whitespace-pre-wrap text-base">
{`Sunrise paints the Glendale sky gold
Another story waitin' to unfold
Got the lesson plan, circle time chairs
Ready for the laughter, ready for the tears
Got the tissues and the picture books stacked high
Know the schedule like the back of my eye
Can't just wing it, gotta think it through, yeah
Know exactly what we're gonna do
(Need to be Prepared)

'Cause tiny hands hold futures bright
Gotta fill their world with guiding light
Every moment counts, every single day...

So we'll Bee Prepared, meet 'em where they are,
Bee Consistent, be their guiding star.
Bee Caring, healin' every little scar,
Bee Positive, whether near or far.
Bee Committed, raisin' up the bar,
At Raising Arizona, that's just who we are!

Same sweet chaos when the doorbell rings
Know the names, the fears, the joy each morning brings
Patching scraped knees, celebrating art
Playing such a vital, fundamental part
See that shy one startin' to join in
That's the kind of everyday small win
Gotta mean it when you praise their try
Meet their gaze right in the eye
(Need to be Consistent, need to be Caring)

'Cause tiny hands hold futures bright
Gotta fill their world with guiding light
Every moment counts, every single day...

So we'll Bee Prepared, meet 'em where they are,
Bee Consistent, be their guiding star.
Bee Caring, healin' every little scar,
Bee Positive, whether near or far.
Bee Committed, raisin' up the bar,
At Raising Arizona, that's just who we are!

Some days feel long, the energy drains low
But you look around at the seeds you sow
This team, this place, this important work we share
More than just a job, we truly, deeply care
Gotta dig down deep, find that extra gear...

So we'll Bee Prepared, meet 'em where they are,
Bee Consistent, be their guiding star.
Bee Caring, healin' every little scar,
Bee Positive, whether near or far.
Bee Committed, raisin' up the bar,
At Raising Arizona, that's just who we are!

Watch them glow... Oh-oh-oh...
At Raising Arizona... yeah...
Watch them grow..`}
          </pre>
        </Card>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mt-4">
        {[0, 1, 2, 3, 4].map((index) => (
          <div key={index} className="flex flex-col gap-2">
            <Label htmlFor={`value-${index}`}>Core Value {index + 1}</Label>
            <div className="relative">
              <Input
                id={`value-${index}`}
                value={values[index]}
                onChange={(e) => handleValueChange(index, e.target.value)}
                disabled={submitted}
                className={
                  submitted
                    ? coreValues.some(value => 
                        value.toLowerCase() === values[index].toLowerCase().trim()
                      )
                      ? "pr-10 border-green-500"
                      : "pr-10 border-red-500"
                    : ""
                }
              />
              {submitted && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  {coreValues.some(value => 
                    value.toLowerCase() === values[index].toLowerCase().trim()
                  ) ? (
                    <Check className="h-5 w-5 text-green-500" />
                  ) : (
                    <X className="h-5 w-5 text-red-500" />
                  )}
                </div>
              )}
              {submitted && 
                !coreValues.some(value => 
                  value.toLowerCase() === values[index].toLowerCase().trim()
                ) && (
                <p className="text-sm text-red-500 mt-1">
                  Must be one of: {coreValues.join(", ")}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
      
      <div className="flex justify-end gap-2 mt-4">
        {submitted ? (
          <Button onClick={resetExercise} variant="outline">
            Try Again
          </Button>
        ) : (
          <Button onClick={checkAnswers} variant="default">
            Check Answers
          </Button>
        )}
      </div>
    </div>
  );
}