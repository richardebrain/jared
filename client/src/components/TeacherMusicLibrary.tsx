import React, { useState } from 'react';
import { AudioPlayer } from './AudioPlayer';
import { Card, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Music, BookOpen, Volume, PlayCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

interface MusicTrack {
  id: string;
  title: string;
  description: string;
  category: 'mindful' | 'classroom' | 'chapter-one' | 'transition';
  src: string;
  moduleId?: number;
}

export function TeacherMusicLibrary() {
  const [activeTab, setActiveTab] = useState('all');
  const { user } = useAuth();

  // Music tracks available in the library
  const musicTracks: MusicTrack[] = [
    {
      id: 'mindful-morning-song',
      title: 'Mindful Morning Song',
      description: 'A calming song to start the day with mindfulness and positive intention.',
      category: 'mindful',
      src: '/audio/Mindful Morning Song.mp3',
      moduleId: 13 // Assuming module ID for Mindful Mornings
    },
    {
      id: 'mindful-morning-extended',
      title: 'Mindful Morning Extended',
      description: 'An extended version of the mindfulness morning song for longer meditation sessions.',
      category: 'mindful',
      src: '/audio/Mindful Morning Extended.mp3',
      moduleId: 13
    },
    {
      id: 'chapter-one-teacher',
      title: 'Chapter 1: In the Hands of a Teacher',
      description: 'An inspiring song about the impact teachers have on child development and growth.',
      category: 'chapter-one',
      src: '/audio/Chapter 1_ In the hands of a Teacher.mp3',
      moduleId: 28 // Assuming module ID for Chapter One
    }
  ];

  // Filter tracks based on active tab
  const filteredTracks = activeTab === 'all' 
    ? musicTracks 
    : musicTracks.filter(track => track.category === activeTab);

  return (
    <div className="bg-white rounded-lg border shadow-sm p-4 md:p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900 mb-2 flex items-center">
          <Music className="w-6 h-6 mr-2 text-primary" />
          Teacher Music Library
        </h2>
        <p className="text-slate-600">
          Access songs and audio resources to use in your classroom. Listen to earn points!
        </p>
      </div>

      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 mb-6">
          <TabsTrigger value="all" className="flex items-center gap-1">
            <PlayCircle className="h-4 w-4" /> All
          </TabsTrigger>
          <TabsTrigger value="mindful" className="flex items-center gap-1">
            <Volume className="h-4 w-4" /> Mindfulness
          </TabsTrigger>
          <TabsTrigger value="classroom" className="flex items-center gap-1">
            <Music className="h-4 w-4" /> Classroom
          </TabsTrigger>
          <TabsTrigger value="chapter-one" className="flex items-center gap-1">
            <BookOpen className="h-4 w-4" /> Chapter One
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="mt-0">
          <Card className="bg-slate-50 border-slate-100">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">All Music</CardTitle>
              <CardDescription>
                Browse all available music tracks ({filteredTracks.length})
              </CardDescription>
            </CardHeader>
          </Card>
        </TabsContent>
        
        <TabsContent value="mindful" className="mt-0">
          <Card className="bg-slate-50 border-slate-100">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Mindfulness Music</CardTitle>
              <CardDescription>
                Calming tracks for mindful moments in the classroom
              </CardDescription>
            </CardHeader>
          </Card>
        </TabsContent>
        
        <TabsContent value="classroom" className="mt-0">
          <Card className="bg-slate-50 border-slate-100">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Classroom Music</CardTitle>
              <CardDescription>
                Upbeat tracks for classroom management and activities
              </CardDescription>
            </CardHeader>
          </Card>
        </TabsContent>
        
        <TabsContent value="chapter-one" className="mt-0">
          <Card className="bg-slate-50 border-slate-100">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Chapter One Music</CardTitle>
              <CardDescription>
                Inspirational tracks for child development training
              </CardDescription>
            </CardHeader>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
        {filteredTracks.map(track => (
          <AudioPlayer
            key={track.id}
            src={track.src}
            title={track.title}
            description={track.description}
            moduleId={track.moduleId}
            pointsValue={5}
            className="h-full"
          />
        ))}
      </div>
      
      {filteredTracks.length === 0 && (
        <div className="text-center py-12 text-slate-500">
          <Music className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium">Coming Soon</p>
          <p className="text-sm mt-1">More music will be added to this category soon!</p>
        </div>
      )}
    </div>
  );
}