import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Lightbulb, Smile, CloudSun, Heart, StarIcon } from "lucide-react";
import mindfulMorningsLogo from '@assets/images/mindful-mornings-logo.jpg';

export default function MindfulnessTraining() {
  return (
    <Card className="w-full shadow-lg border-2 border-primary/10">
      <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl font-bold">Mindful Mornings Training</CardTitle>
            <CardDescription className="mt-1">
              Learn how to implement the three core components of our mindfulness program
            </CardDescription>
          </div>
          <div className="h-16 w-16 rounded-full overflow-hidden border-2 border-primary/20">
            <img 
              src={mindfulMorningsLogo} 
              alt="Mindful Mornings Logo" 
              className="h-full w-full object-cover"
            />
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-6">
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-start gap-3">
            <Lightbulb className="h-5 w-5 text-amber-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-amber-800">Easter Egg Alert!</h3>
              <p className="text-sm text-amber-700">
                Memorize the phrase "Breathe, Smile, Be Present" and mention it to your director 
                to receive a free lunch reward!
              </p>
            </div>
          </div>
        </div>
        
        <Tabs defaultValue="breathing" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="breathing">Breathing Exercises</TabsTrigger>
            <TabsTrigger value="affirmations">Self-Affirmations</TabsTrigger>
            <TabsTrigger value="gratitude">Gratitude Practice</TabsTrigger>
          </TabsList>
          
          <TabsContent value="breathing" className="mt-6 space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                <CloudSun className="h-5 w-5 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold">Breathing Exercises for Children</h3>
            </div>
            
            <p className="text-muted-foreground">
              Breathing exercises help children regulate emotions, reduce stress, and improve focus. 
              These simple techniques can be practiced daily in the classroom.
            </p>
            
            <Separator className="my-4" />
            
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-blue-50 border border-blue-100">
                <h4 className="font-medium text-blue-800 mb-2">Balloon Breathing</h4>
                <p className="text-sm text-blue-700">
                  Have children imagine their belly is a balloon. When they breathe in, the balloon inflates. 
                  When they breathe out, the balloon deflates. Guide them through 5 slow inflations and deflations.
                </p>
              </div>
              
              <div className="p-4 rounded-lg bg-blue-50 border border-blue-100">
                <h4 className="font-medium text-blue-800 mb-2">Five Finger Breathing</h4>
                <p className="text-sm text-blue-700">
                  Have children hold up one hand and trace along their fingers with the index finger of their other hand. 
                  As they trace up a finger, they breathe in. As they trace down, they breathe out.
                </p>
              </div>
              
              <div className="p-4 rounded-lg bg-blue-50 border border-blue-100">
                <h4 className="font-medium text-blue-800 mb-2">Rainbow Breath</h4>
                <p className="text-sm text-blue-700">
                  Children start with arms at their sides. As they breathe in, they raise their arms up and over in an arc, like a rainbow. 
                  As they breathe out, they lower their arms back down to their sides.
                </p>
              </div>
            </div>
            
            <Alert className="mt-6 bg-blue-50 border-blue-100">
              <AlertDescription className="text-blue-800">
                <strong>Teaching Tip:</strong> Practice these exercises as a daily morning ritual for 3-5 minutes. 
                Consistency is key for helping children develop self-regulation skills.
              </AlertDescription>
            </Alert>
          </TabsContent>
          
          <TabsContent value="affirmations" className="mt-6 space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                <Smile className="h-5 w-5 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold">Self-Affirmations for Young Learners</h3>
            </div>
            
            <p className="text-muted-foreground">
              Self-affirmations help children develop a positive self-image and build confidence.
              Teaching children to speak kindly to themselves from an early age helps establish healthy thought patterns.
            </p>
            
            <Separator className="my-4" />
            
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-purple-50 border border-purple-100">
                <h4 className="font-medium text-purple-800 mb-2">Morning Affirmation Circle</h4>
                <p className="text-sm text-purple-700">
                  Start each day with an affirmation circle. Have children repeat positive phrases like 
                  "I am kind," "I am brave," "I can learn new things," or "I am a good friend." Let children 
                  create their own affirmations to share.
                </p>
              </div>
              
              <div className="p-4 rounded-lg bg-purple-50 border border-purple-100">
                <h4 className="font-medium text-purple-800 mb-2">Affirmation Jar</h4>
                <p className="text-sm text-purple-700">
                  Create a classroom affirmation jar filled with positive statements written on colorful paper strips. 
                  Each day, select a child to draw an affirmation to read to the class.
                </p>
              </div>
              
              <div className="p-4 rounded-lg bg-purple-50 border border-purple-100">
                <h4 className="font-medium text-purple-800 mb-2">Mirror Exercise</h4>
                <p className="text-sm text-purple-700">
                  Set up a special mirror in the classroom. Guide children to look in the mirror and say something 
                  positive about themselves. Example: "I see someone who is helpful" or "I see someone who is creative."
                </p>
              </div>
            </div>
            
            <Alert className="mt-6 bg-purple-50 border-purple-100">
              <AlertDescription className="text-purple-800">
                <strong>Teaching Tip:</strong> Model positive self-talk in your daily interactions. When facing a challenge, 
                verbalize your thought process: "This is tricky, but I'll try my best. I can do hard things!"
              </AlertDescription>
            </Alert>
          </TabsContent>
          
          <TabsContent value="gratitude" className="mt-6 space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                <Heart className="h-5 w-5 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold">Gratitude Practice for Classrooms</h3>
            </div>
            
            <p className="text-muted-foreground">
              Practicing gratitude helps children focus on the positive aspects of their lives, fostering optimism and happiness.
              Regular gratitude exercises can improve classroom climate and peer relationships.
            </p>
            
            <Separator className="my-4" />
            
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-green-50 border border-green-100">
                <h4 className="font-medium text-green-800 mb-2">Gratitude Circle</h4>
                <p className="text-sm text-green-700">
                  During circle time, pass around a special object (like a "talking stone"). When holding the object, 
                  each child shares something they are thankful for. Start with "I am grateful for..." and let each child complete the sentence.
                </p>
              </div>
              
              <div className="p-4 rounded-lg bg-green-50 border border-green-100">
                <h4 className="font-medium text-green-800 mb-2">Gratitude Tree</h4>
                <p className="text-sm text-green-700">
                  Create a classroom gratitude tree display. Children write or draw what they're thankful for on leaf-shaped papers 
                  and add them to the tree. Watch the tree fill up throughout the year!
                </p>
              </div>
              
              <div className="p-4 rounded-lg bg-green-50 border border-green-100">
                <h4 className="font-medium text-green-800 mb-2">Thank You Notes</h4>
                <p className="text-sm text-green-700">
                  Teach children to write or draw simple thank you notes to people who help them. This could be to 
                  classmates, teachers, family members, or community helpers.
                </p>
              </div>
            </div>
            
            <Alert className="mt-6 bg-green-50 border-green-100">
              <AlertDescription className="text-green-800">
                <strong>Teaching Tip:</strong> End each day with a gratitude reflection. Ask children to share one thing they appreciated 
                about the day before heading home. This creates a positive end to the school day.
              </AlertDescription>
            </Alert>
          </TabsContent>
        </Tabs>
        
        <div className="mt-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h3 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
            <StarIcon className="h-5 w-5 text-amber-500" />
            Remember
          </h3>
          <p className="text-sm text-gray-700">
            The key phrase to integrate all three mindfulness practices is: <span className="font-semibold">Breathe, Smile, Be Present</span>. 
            This simple motto helps children remember to use their breathing exercises, practice positive self-talk, and stay present with gratitude.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}