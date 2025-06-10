import React, { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import {
  BookOpen,
  Sparkles,
  Play,
  Pause,
  Volume2,
  Download,
  Loader2,
  Heart,
  Star,
  Wand2,
  Users,
  Globe,
  Mic
} from 'lucide-react';

const STORY_TOPICS = [
  {
    id: 'teeth-not-biting',
    title: 'Teeth Are Not For Biting',
    description: 'A gentle story about using teeth for eating yummy food',
    prompt: 'using teeth for eating delicious snacks and meals, not for biting friends. Make it fun with silly food sounds and happy eating.'
  },
  {
    id: 'walking-feet',
    title: 'Walking Feet Adventures',
    description: 'Fun story about slow walking feet inside',
    prompt: 'using walking feet inside like a quiet mouse, and running feet outside like a happy puppy. Include fun animal movements.'
  },
  {
    id: 'gentle-hands',
    title: 'Magic Gentle Hands',
    description: 'Sweet story about hands that help and hug',
    prompt: 'having magic gentle hands that give the best hugs, pet soft animals, and help friends. Make the hands feel special and magical.'
  },
  {
    id: 'listening-ears',
    title: 'Super Listening Ears',
    description: 'Story about ears that hear wonderful things',
    prompt: 'having super listening ears that can hear birds singing, friends laughing, and important words. Make listening fun and exciting.'
  },
  {
    id: 'sharing-caring',
    title: 'The Sharing Star',
    description: 'Happy story about sharing makes everyone smile',
    prompt: 'being a sharing star who makes friends happy by sharing toys and snacks. Include how good it feels to share.'
  },
  {
    id: 'cleanup-helper',
    title: 'Cleanup Superhero',
    description: 'Fun story about being a cleanup superhero',
    prompt: 'being a cleanup superhero who saves the day by putting toys in their homes. Make cleanup feel like a fun game.'
  },
  {
    id: 'big-feelings',
    title: 'Feeling Rainbow',
    description: 'Colorful story about different feelings',
    prompt: 'having different colored feelings like red mad, blue sad, and yellow happy. Include simple ways to feel better with deep breaths.'
  },
  {
    id: 'potty-time',
    title: 'Potty Champion',
    description: 'Celebrating being a big kid',
    prompt: 'becoming a potty champion and feeling so proud and grown-up. Include a happy celebration and big kid pride.'
  },
  {
    id: 'bedtime-routine',
    title: 'Sleepy Time Adventure',
    description: 'Cozy story about bedtime routines',
    prompt: 'having a magical bedtime routine with brushing teeth, putting on pajamas, and snuggling with favorite stuffed animals.'
  },
  {
    id: 'trying-new-foods',
    title: 'Food Explorer',
    description: 'Brave story about trying new foods',
    prompt: 'being a brave food explorer who tries new foods like a superhero. Make trying new foods feel like an exciting adventure.'
  }
];

const VOICE_OPTIONS = [
  { id: 'rachel', name: 'Rachel', description: 'Warm storytelling voice', gender: 'female' },
  { id: 'drew', name: 'Drew', description: 'Friendly narrative voice', gender: 'male' },
  { id: 'clyde', name: 'Clyde', description: 'Gentle character voice', gender: 'male' },
  { id: 'bella', name: 'Bella', description: 'Expressive storytelling', gender: 'female' },
  { id: 'josh', name: 'Josh', description: 'Animated character voice', gender: 'male' }
];

const LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Spanish', flag: '🇪🇸' },
  { code: 'fr', name: 'French', flag: '🇫🇷' },
  { code: 'de', name: 'German', flag: '🇩🇪' },
  { code: 'it', name: 'Italian', flag: '🇮🇹' },
  { code: 'pt', name: 'Portuguese', flag: '🇵🇹' },
  { code: 'zh', name: 'Chinese', flag: '🇨🇳' },
  { code: 'ja', name: 'Japanese', flag: '🇯🇵' }
];

export default function PersonalizedStories() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [childName, setChildName] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('');
  const [customTopic, setCustomTopic] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [selectedVoice, setSelectedVoice] = useState('rachel');
  const [generatedStory, setGeneratedStory] = useState('');
  const [audioUrl, setAudioUrl] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);

  const handleGenerateStory = async () => {
    if (!childName.trim()) {
      toast({
        title: "Child's Name Required",
        description: "Please enter the child's name to create a personalized story.",
        variant: "destructive"
      });
      return;
    }

    if (!selectedTopic && !customTopic.trim()) {
      toast({
        title: "Topic Required",
        description: "Please select a topic or enter a custom topic for the story.",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    
    try {
      const topic = selectedTopic ? 
        STORY_TOPICS.find(t => t.id === selectedTopic)?.prompt : 
        customTopic;

      const response = await apiRequest('POST', '/api/personalized-stories/generate', {
        childName: childName.trim(),
        topic: topic,
        language: selectedLanguage,
        storyTitle: selectedTopic ? 
          STORY_TOPICS.find(t => t.id === selectedTopic)?.title : 
          'Custom Story'
      });

      setGeneratedStory(response.story);
      setAudioUrl(''); // Clear previous audio
      
      toast({
        title: "Story Generated!",
        description: `Created a personalized story for ${childName}`,
      });
    } catch (error) {
      console.error('Error generating story:', error);
      toast({
        title: "Generation Failed",
        description: "Unable to generate the story. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateAudio = async () => {
    if (!generatedStory) {
      toast({
        title: "No Story Available",
        description: "Please generate a story first before creating audio.",
        variant: "destructive"
      });
      return;
    }

    setIsGeneratingAudio(true);
    
    try {
      const response = await apiRequest('POST', '/api/voice/generate-dramatic-story', {
        text: generatedStory,
        voice: selectedVoice,
        language: selectedLanguage,
        style: 'dramatic_storytelling',
        childName: childName
      });

      setAudioUrl(response.audioUrl);
      
      toast({
        title: "Audio Generated!",
        description: "Your dramatic story narration is ready to play",
      });
    } catch (error) {
      console.error('Error generating audio:', error);
      toast({
        title: "Audio Generation Failed",
        description: "Unable to generate audio. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingAudio(false);
    }
  };

  const handlePlayPause = () => {
    if (!audioUrl) return;

    if (audioElement) {
      if (isPlaying) {
        audioElement.pause();
        setIsPlaying(false);
      } else {
        audioElement.play();
        setIsPlaying(true);
      }
    } else {
      const audio = new Audio(audioUrl);
      audio.addEventListener('ended', () => setIsPlaying(false));
      audio.addEventListener('error', () => {
        toast({
          title: "Playback Error",
          description: "Unable to play audio. Please try regenerating.",
          variant: "destructive"
        });
        setIsPlaying(false);
      });
      
      audio.play();
      setAudioElement(audio);
      setIsPlaying(true);
    }
  };

  const handleDownload = () => {
    if (audioUrl) {
      const link = document.createElement('a');
      link.href = audioUrl;
      link.download = `${childName}-story.mp3`;
      link.click();
    }
  };

  const selectedTopicData = STORY_TOPICS.find(t => t.id === selectedTopic);
  const selectedLanguageData = LANGUAGES.find(l => l.code === selectedLanguage);
  const selectedVoiceData = VOICE_OPTIONS.find(v => v.id === selectedVoice);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <Card className="border-purple-200 bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2 text-2xl text-purple-800">
              <BookOpen className="h-6 w-6" />
              Personalized Stories
            </CardTitle>
            <CardDescription className="text-purple-600">
              Create custom stories with children's names and have them dramatically narrated in multiple languages
            </CardDescription>
          </CardHeader>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Story Generator */}
          <Card className="border-purple-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-purple-800">
                <Wand2 className="h-5 w-5" />
                Create Story
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Child's Name */}
              <div>
                <Label className="text-sm font-medium text-purple-700">Child's Name</Label>
                <Input
                  value={childName}
                  onChange={(e) => setChildName(e.target.value)}
                  placeholder="Enter the child's name..."
                  className="mt-1 border-purple-200 focus:border-purple-400"
                />
              </div>

              {/* Topic Selection */}
              <div>
                <Label className="text-sm font-medium text-purple-700">Story Topic</Label>
                <Select value={selectedTopic} onValueChange={setSelectedTopic}>
                  <SelectTrigger className="mt-1 border-purple-200">
                    <SelectValue placeholder="Choose a story topic..." />
                  </SelectTrigger>
                  <SelectContent>
                    {STORY_TOPICS.map((topic) => (
                      <SelectItem key={topic.id} value={topic.id}>
                        <div>
                          <div className="font-medium">{topic.title}</div>
                          <div className="text-xs text-gray-500">{topic.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Custom Topic */}
              <div>
                <Label className="text-sm font-medium text-purple-700">Or Custom Topic</Label>
                <Textarea
                  value={customTopic}
                  onChange={(e) => setCustomTopic(e.target.value)}
                  placeholder="Describe what the story should teach (e.g., 'using inside voice when talking to friends')"
                  className="mt-1 border-purple-200 focus:border-purple-400"
                  rows={2}
                />
              </div>

              {/* Language Selection */}
              <div>
                <Label className="text-sm font-medium text-purple-700">Story Language</Label>
                <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                  <SelectTrigger className="mt-1 border-purple-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LANGUAGES.map((lang) => (
                      <SelectItem key={lang.code} value={lang.code}>
                        {lang.flag} {lang.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Generate Button */}
              <Button
                onClick={handleGenerateStory}
                disabled={isGenerating || !childName.trim()}
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating Story...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate Personalized Story
                  </>
                )}
              </Button>

              {/* Story Preview */}
              {selectedTopicData && (
                <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                  <h4 className="font-semibold text-purple-800 mb-1">{selectedTopicData.title}</h4>
                  <p className="text-sm text-purple-600">{selectedTopicData.description}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Voice Narration */}
          <Card className="border-pink-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-pink-800">
                <Mic className="h-5 w-5" />
                Dramatic Narration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Voice Selection */}
              <div>
                <Label className="text-sm font-medium text-pink-700">Narrator Voice</Label>
                <Select value={selectedVoice} onValueChange={setSelectedVoice}>
                  <SelectTrigger className="mt-1 border-pink-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {VOICE_OPTIONS.map((voice) => (
                      <SelectItem key={voice.id} value={voice.id}>
                        <div>
                          <div className="font-medium">{voice.name}</div>
                          <div className="text-xs text-gray-500">{voice.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Audio Generation */}
              <Button
                onClick={handleGenerateAudio}
                disabled={isGeneratingAudio || !generatedStory}
                className="w-full bg-pink-600 hover:bg-pink-700"
              >
                {isGeneratingAudio ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating Audio...
                  </>
                ) : (
                  <>
                    <Volume2 className="h-4 w-4 mr-2" />
                    Generate Dramatic Reading
                  </>
                )}
              </Button>

              {/* Audio Controls */}
              {audioUrl && (
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <Button
                      onClick={handlePlayPause}
                      variant="outline"
                      className="flex-1 border-pink-200 text-pink-700 hover:bg-pink-50"
                    >
                      {isPlaying ? (
                        <>
                          <Pause className="h-4 w-4 mr-2" />
                          Pause Story
                        </>
                      ) : (
                        <>
                          <Play className="h-4 w-4 mr-2" />
                          Play Story
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={handleDownload}
                      variant="outline"
                      className="border-pink-200 text-pink-700 hover:bg-pink-50"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="p-3 bg-pink-50 rounded-lg border border-pink-200">
                    <div className="flex items-center gap-2 text-sm text-pink-700">
                      <Volume2 className="h-4 w-4" />
                      <span className="font-medium">{selectedVoiceData?.name}</span>
                      <span>•</span>
                      <span>{selectedLanguageData?.flag} {selectedLanguageData?.name}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Voice Preview */}
              {selectedVoiceData && (
                <div className="p-3 bg-pink-50 rounded-lg border border-pink-200">
                  <h4 className="font-semibold text-pink-800 mb-1">{selectedVoiceData.name}</h4>
                  <p className="text-sm text-pink-600">{selectedVoiceData.description}</p>
                  <Badge variant="outline" className="mt-2 text-xs border-pink-300 text-pink-700">
                    {selectedVoiceData.gender}
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Generated Story Display */}
        {generatedStory && (
          <Card className="border-orange-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-800">
                <Star className="h-5 w-5" />
                {childName}'s Personalized Story
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-lg max-w-none">
                <div className="p-6 bg-orange-50 rounded-lg border border-orange-200 leading-relaxed">
                  {generatedStory.split('\n').map((paragraph, index) => (
                    <p key={index} className="mb-4 text-orange-900 last:mb-0">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </div>
              
              {audioUrl && (
                <div className="mt-4 flex items-center gap-2 text-sm text-orange-600">
                  <Heart className="h-4 w-4" />
                  <span>Audio narration ready for {childName}!</span>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Usage Tips */}
        <Card className="border-purple-200 bg-purple-50/50">
          <CardHeader>
            <CardTitle className="text-lg text-purple-800">Tips for Using Personalized Stories</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-purple-700 space-y-2">
            <div className="flex items-start gap-2">
              <Users className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>Use during circle time to address classroom behaviors with specific children</span>
            </div>
            <div className="flex items-start gap-2">
              <Globe className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>Create stories in children's home languages to build cultural connections</span>
            </div>
            <div className="flex items-start gap-2">
              <Heart className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>Play audio during rest time or as a calming transition activity</span>
            </div>
            <div className="flex items-start gap-2">
              <BookOpen className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>Save and share stories with families for home reinforcement</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}