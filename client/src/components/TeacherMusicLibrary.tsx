import React from 'react';
import { AudioPlayer } from './AudioPlayer';
import { Card, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Music, BookOpen, Volume, PlayCircle, Clock } from 'lucide-react';

interface MusicTrack {
  id: string;
  title: string;
  description: string;
  category: 'mindful' | 'classroom' | 'chapter-one' | 'transition';
  src: string;
  moduleId?: number;
}

export function TeacherMusicLibrary() {
  
  // Sample tracks
  const tracks: MusicTrack[] = [
    {
      id: 'mindful-morning',
      title: 'Mindful Morning Song',
      description: 'A calming melody to start the day with peaceful mindfulness',
      category: 'mindful',
      src: '/Mindful Morning Song.mp3',
      moduleId: 2 // Mindful Morning module ID
    },
    {
      id: 'mindful-morning-extended',
      title: 'Mindful Morning Extended',
      description: 'An extended version of the Mindful Morning song for longer sessions',
      category: 'mindful',
      src: '/Mindful Morning Extended.mp3'
    },
    {
      id: 'chapter-one',
      title: 'Chapter 1: In the hands of a Teacher',
      description: 'Music to accompany the Building a Human training module',
      category: 'chapter-one',
      src: '/Chapter 1_ In the hands of a Teacher.mp3',
      moduleId: 3 // Chapter One module ID
    },
    {
      id: 'clean-up-time',
      title: 'Clean Up Time',
      description: 'A fun song to encourage children to clean up the classroom',
      category: 'classroom',
      src: '/Clean Up Time.mp3'
    },
    {
      id: 'time-to-change',
      title: 'Time to Change Activities',
      description: 'Signal transitions between activities with this upbeat tune',
      category: 'transition',
      src: '/Time to Change Activities.mp3'
    },
    {
      id: 'wash-up',
      title: 'Wash Up For Lunch',
      description: 'Encourage proper handwashing before mealtime',
      category: 'transition',
      src: '/Wash Up For Lunch.mp3'
    },
    {
      id: 'welcome-aboard',
      title: 'Welcome Aboard',
      description: 'A welcoming song for greeting children at the start of the day',
      category: 'classroom',
      src: '/Welcome Aboard.mp3'
    },
    {
      id: 'im-closing-my-eyes',
      title: 'I\'m Closing My Eyes',
      description: 'A soothing song for rest time or mindfulness moments',
      category: 'mindful',
      src: '/I\'m Closing My Eyes.mp3'
    }
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-primary">Teacher Music Library</h1>
      <p className="text-muted-foreground">
        Access and play music for your classroom activities and professional development.
        Listen to songs to inspire your teaching and engage children in daily routines.
      </p>
      
      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">
            <Music className="mr-2 h-4 w-4" />
            All Music
          </TabsTrigger>
          <TabsTrigger value="mindful">
            <Volume className="mr-2 h-4 w-4" />
            Mindfulness
          </TabsTrigger>
          <TabsTrigger value="classroom">
            <PlayCircle className="mr-2 h-4 w-4" />
            Classroom
          </TabsTrigger>
          <TabsTrigger value="transition">
            <Clock className="mr-2 h-4 w-4" />
            Transitions
          </TabsTrigger>
          <TabsTrigger value="chapter-one">
            <BookOpen className="mr-2 h-4 w-4" />
            Chapter One
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="pt-4 space-y-4">
          {tracks.map(track => (
            <Card key={track.id} className="overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle>{track.title}</CardTitle>
                <CardDescription>{track.description}</CardDescription>
              </CardHeader>
              <AudioPlayer 
                src={track.src}
                title={track.title}
                description={track.description}
                moduleId={track.moduleId}
                showInModule={false}
                pointsValue={3}
              />
            </Card>
          ))}
        </TabsContent>
        
        <TabsContent value="mindful" className="pt-4 space-y-4">
          {tracks.filter(t => t.category === 'mindful').map(track => (
            <Card key={track.id} className="overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle>{track.title}</CardTitle>
                <CardDescription>{track.description}</CardDescription>
              </CardHeader>
              <AudioPlayer 
                src={track.src}
                title={track.title}
                description={track.description}
                moduleId={track.moduleId}
                showInModule={false}
                pointsValue={3}
              />
            </Card>
          ))}
        </TabsContent>
        
        <TabsContent value="classroom" className="pt-4 space-y-4">
          {tracks.filter(t => t.category === 'classroom').map(track => (
            <Card key={track.id} className="overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle>{track.title}</CardTitle>
                <CardDescription>{track.description}</CardDescription>
              </CardHeader>
              <AudioPlayer 
                src={track.src}
                title={track.title}
                description={track.description}
                moduleId={track.moduleId}
                showInModule={false}
                pointsValue={3}
              />
            </Card>
          ))}
          {tracks.filter(t => t.category === 'classroom').length === 0 && (
            <div className="text-center py-8">
              <Music className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
              <p className="mt-4 text-muted-foreground">Classroom music coming soon!</p>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="transition" className="pt-4 space-y-4">
          {tracks.filter(t => t.category === 'transition').map(track => (
            <Card key={track.id} className="overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle>{track.title}</CardTitle>
                <CardDescription>{track.description}</CardDescription>
              </CardHeader>
              <AudioPlayer 
                src={track.src}
                title={track.title}
                description={track.description}
                moduleId={track.moduleId}
                showInModule={false}
                pointsValue={3}
              />
            </Card>
          ))}
        </TabsContent>
        
        <TabsContent value="chapter-one" className="pt-4 space-y-4">
          {tracks.filter(t => t.category === 'chapter-one').map(track => (
            <Card key={track.id} className="overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle>{track.title}</CardTitle>
                <CardDescription>{track.description}</CardDescription>
              </CardHeader>
              <AudioPlayer 
                src={track.src}
                title={track.title}
                description={track.description}
                moduleId={track.moduleId}
                showInModule={false}
                pointsValue={3}
              />
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}