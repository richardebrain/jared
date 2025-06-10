import { useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  BookOpen, Wand2, Mic, Volume2, Download, Play, Pause, 
  Loader2, Sparkles, Star, Users, Globe, Heart, ArrowLeft, FileText 
} from "lucide-react";
import { Link } from "wouter";

// Story topics with character themes for ages 2-5
const STORY_TOPICS = [
  {
    id: "spiderman-sharing",
    title: "Spider-Man and the Magic of Sharing",
    description: "Learn about sharing toys and taking turns with Spider-Man's help"
  },
  {
    id: "unicorn-kindness",
    title: "Rainbow Unicorn's Kindness Adventure",
    description: "Discover how being kind to friends makes everyone happy"
  },
  {
    id: "superhero-listening",
    title: "Captain Listening Ears",
    description: "Practice using listening ears during story time and circle time"
  },
  {
    id: "princess-cleanup",
    title: "Princess Clean-Up Power",
    description: "Make cleaning up toys feel like a magical quest"
  },
  {
    id: "dragon-feelings",
    title: "Friendly Dragon's Big Feelings",
    description: "Learn about emotions and how to express feelings safely"
  },
  {
    id: "robot-routines",
    title: "Robot Helper's Daily Adventures",
    description: "Practice daily routines like washing hands and following schedules"
  }
];

// Supported languages with flag emojis
const LANGUAGES = [
  { code: "en", name: "English", flag: "🇺🇸" },
  { code: "es", name: "Spanish", flag: "🇪🇸" },
  { code: "fr", name: "French", flag: "🇫🇷" },
  { code: "de", name: "German", flag: "🇩🇪" },
  { code: "it", name: "Italian", flag: "🇮🇹" },
  { code: "pt", name: "Portuguese", flag: "🇵🇹" },
  { code: "ja", name: "Japanese", flag: "🇯🇵" },
  { code: "ko", name: "Korean", flag: "🇰🇷" },
  { code: "zh", name: "Chinese", flag: "🇨🇳" },
  { code: "ar", name: "Arabic", flag: "🇸🇦" },
  { code: "hi", name: "Hindi", flag: "🇮🇳" },
  { code: "ru", name: "Russian", flag: "🇷🇺" }
];

// Voice options for narration
const VOICE_OPTIONS = [
  {
    id: "sarah",
    name: "Miss Sarah",
    description: "Warm, nurturing teacher voice perfect for story time",
    gender: "Female"
  },
  {
    id: "michael",
    name: "Mr. Michael",
    description: "Friendly, energetic voice great for adventure stories",
    gender: "Male"
  },
  {
    id: "elena",
    name: "Señora Elena",
    description: "Bilingual storyteller with gentle, soothing tones",
    gender: "Female"
  },
  {
    id: "james",
    name: "Captain James",
    description: "Dramatic narrator perfect for superhero adventures",
    gender: "Male"
  },
  {
    id: "lily",
    name: "Princess Lily",
    description: "Magical, whimsical voice for fairy tale stories",
    gender: "Female"
  }
];

export default function PersonalizedStoriesPage() {
  const [childName, setChildName] = useState("");
  const [selectedTopic, setSelectedTopic] = useState("");
  const [customTopic, setCustomTopic] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("en");
  const [selectedVoice, setSelectedVoice] = useState("sarah");
  const [generatedStory, setGeneratedStory] = useState("");
  const [audioUrl, setAudioUrl] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const { toast } = useToast();

  const handleGenerateStory = async () => {
    if (!childName.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter the child's name to create a personalized story.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      const topic = selectedTopic || customTopic;
      const selectedTopicData = STORY_TOPICS.find(t => t.id === selectedTopic);
      
      const response = await fetch('/api/personalized-stories/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          childName: childName.trim(),
          topic: topic,
          topicDescription: selectedTopicData?.description || topic,
          language: selectedLanguage,
          ageGroup: "2-5"
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate story');
      }

      const data = await response.json();
      setGeneratedStory(data.story);
      setAudioUrl(""); // Reset audio when new story is generated
      
      toast({
        title: "Story Created!",
        description: `A magical story for ${childName} has been created!`,
      });
    } catch (error) {
      console.error('Error generating story:', error);
      toast({
        title: "Error",
        description: "Failed to generate story. Please try again.",
        variant: "destructive",
      });
    }
    setIsGenerating(false);
  };

  const handleGenerateAudio = async () => {
    if (!generatedStory) {
      toast({
        title: "No Story",
        description: "Please generate a story first before creating audio.",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingAudio(true);
    try {
      const selectedVoiceData = VOICE_OPTIONS.find(v => v.id === selectedVoice);
      
      const response = await fetch('/api/personalized-stories/generate-audio', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: generatedStory,
          voiceId: selectedVoice,
          language: selectedLanguage,
          childName: childName.trim()
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate audio');
      }

      const data = await response.json();
      setAudioUrl(data.audioUrl);
      
      toast({
        title: "Audio Ready!",
        description: `${selectedVoiceData?.name} is ready to tell ${childName}'s story!`,
      });
    } catch (error) {
      console.error('Error generating audio:', error);
      toast({
        title: "Error",
        description: "Failed to generate audio. Please try again.",
        variant: "destructive",
      });
    }
    setIsGeneratingAudio(false);
  };

  const handlePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleDownload = () => {
    if (audioUrl) {
      const link = document.createElement('a');
      link.href = audioUrl;
      link.download = `${childName}_story.mp3`;
      link.click();
    }
  };

  const handleDownloadText = () => {
    if (generatedStory) {
      const element = document.createElement('a');
      const file = new Blob([generatedStory], { type: 'text/plain' });
      element.href = URL.createObjectURL(file);
      element.download = `${childName}_story.txt`;
      element.click();
      URL.revokeObjectURL(element.href);
    }
  };

  const selectedTopicData = STORY_TOPICS.find(t => t.id === selectedTopic);
  const selectedLanguageData = LANGUAGES.find(l => l.code === selectedLanguage);
  const selectedVoiceData = VOICE_OPTIONS.find(v => v.id === selectedVoice);

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-100 via-blue-100 to-green-100 relative overflow-hidden">
      {/* Floating decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 w-8 h-8 bg-yellow-300 rounded-full opacity-60 animate-bounce"></div>
        <div className="absolute top-20 right-20 w-6 h-6 bg-pink-300 rounded-full opacity-60 animate-bounce" style={{animationDelay: '1s'}}></div>
        <div className="absolute bottom-20 left-16 w-10 h-10 bg-blue-300 rounded-full opacity-60 animate-bounce" style={{animationDelay: '2s'}}></div>
        <div className="absolute bottom-32 right-10 w-4 h-4 bg-green-300 rounded-full opacity-60 animate-bounce" style={{animationDelay: '0.5s'}}></div>
        <div className="absolute top-1/2 left-20 w-5 h-5 bg-purple-300 rounded-full opacity-60 animate-bounce" style={{animationDelay: '1.5s'}}></div>
        <div className="absolute top-1/3 right-16 w-7 h-7 bg-orange-300 rounded-full opacity-60 animate-bounce" style={{animationDelay: '2.5s'}}></div>
      </div>

      {/* Book-like container */}
      <div className="relative max-w-6xl mx-auto p-8">
        {/* Return to Dashboard Button - styled like a bookmark */}
        <div className="absolute top-4 left-4 z-10">
          <Link href="/dashboard">
            <Button 
              variant="outline" 
              className="flex items-center gap-2 bg-red-400 text-white border-red-500 hover:bg-red-500 rounded-t-lg rounded-b-none shadow-lg transform rotate-[-2deg] hover:rotate-0 transition-transform"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </Link>
        </div>

        {/* Main book pages */}
        <div className="bg-white rounded-3xl shadow-2xl border-8 border-amber-200 relative overflow-hidden">
          {/* Book binding effect */}
          <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-amber-300 to-amber-200 border-r-2 border-amber-400"></div>
          <div className="absolute left-2 top-4 bottom-4 w-1 bg-amber-400 rounded-full"></div>
          <div className="absolute left-4 top-4 bottom-4 w-1 bg-amber-500 rounded-full"></div>
          
          {/* Page content */}
          <div className="pl-16 pr-8 py-8">
            {/* Storybook Header */}
            <div className="text-center mb-8 relative">
              <div className="inline-block bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 text-transparent bg-clip-text">
                <h1 className="text-5xl font-bold font-serif mb-2 drop-shadow-lg">
                  ✨ Magical Story Creator ✨
                </h1>
              </div>
              <p className="text-2xl text-gray-700 font-serif italic">
                Where every child becomes the hero of their own adventure!
              </p>
              
              {/* Decorative stars */}
              <div className="absolute -top-4 -left-4 text-yellow-400 text-2xl animate-pulse">⭐</div>
              <div className="absolute -top-2 -right-6 text-pink-400 text-xl animate-pulse" style={{animationDelay: '0.5s'}}>🌟</div>
              <div className="absolute -bottom-2 left-1/4 text-blue-400 text-lg animate-pulse" style={{animationDelay: '1s'}}>✨</div>
              <div className="absolute -bottom-4 right-1/3 text-green-400 text-xl animate-pulse" style={{animationDelay: '1.5s'}}>⭐</div>
            </div>

            {/* Story Creation Pages */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* Left Page - Story Generator */}
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border-4 border-purple-200 shadow-lg relative overflow-hidden">
                {/* Page decoration */}
                <div className="absolute top-2 right-2 text-purple-300 text-6xl opacity-20 transform rotate-12">🎭</div>
                <div className="absolute bottom-2 left-2 text-pink-300 text-4xl opacity-20 transform -rotate-12">📖</div>
                
                <div className="relative z-10">
                  <h2 className="text-3xl font-bold text-purple-800 mb-2 font-serif flex items-center gap-2">
                    <Wand2 className="h-8 w-8 text-yellow-500" />
                    Create Your Story
                  </h2>
                  <p className="text-purple-600 mb-6 font-serif italic">Let's make magic happen!</p>
                  
                  <div className="space-y-4">
                    {/* Child's Name */}
                    <div>
                      <Label className="text-lg font-bold text-purple-700 font-serif">Child's Name</Label>
                      <Input
                        value={childName}
                        onChange={(e) => setChildName(e.target.value)}
                        placeholder="Enter the child's name..."
                        className="mt-2 border-2 border-purple-300 focus:border-purple-500 text-lg p-3 rounded-xl font-serif"
                      />
                    </div>

                    {/* Topic Selection */}
                    <div>
                      <Label className="text-lg font-bold text-purple-700 font-serif">Story Adventure</Label>
                      <Select value={selectedTopic} onValueChange={setSelectedTopic}>
                        <SelectTrigger className="mt-2 border-2 border-purple-300 text-lg p-3 rounded-xl">
                          <SelectValue placeholder="Choose a magical adventure..." />
                        </SelectTrigger>
                        <SelectContent>
                          {STORY_TOPICS.map((topic) => (
                            <SelectItem key={topic.id} value={topic.id}>
                              <div className="py-2">
                                <div className="font-bold text-purple-800">{topic.title}</div>
                                <div className="text-sm text-purple-600">{topic.description}</div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Custom Topic */}
                    <div>
                      <Label className="text-lg font-bold text-purple-700 font-serif">Or Create Your Own Adventure</Label>
                      <Textarea
                        value={customTopic}
                        onChange={(e) => setCustomTopic(e.target.value)}
                        placeholder="Describe what the story should teach (e.g., 'using inside voice when talking to friends')"
                        className="mt-2 border-2 border-purple-300 focus:border-purple-500 rounded-xl font-serif"
                        rows={3}
                      />
                    </div>

                    {/* Language Selection */}
                    <div>
                      <Label className="text-lg font-bold text-purple-700 font-serif">Story Language</Label>
                      <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                        <SelectTrigger className="mt-2 border-2 border-purple-300 text-lg p-3 rounded-xl">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {LANGUAGES.map((lang) => (
                            <SelectItem key={lang.code} value={lang.code}>
                              <span className="text-lg">{lang.flag} {lang.name}</span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Generate Button */}
                    <Button
                      onClick={handleGenerateStory}
                      disabled={isGenerating || !childName.trim()}
                      className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white text-xl py-4 rounded-xl font-bold shadow-lg transform hover:scale-105 transition-all"
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="h-6 w-6 mr-2 animate-spin" />
                          Creating Magic...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-6 w-6 mr-2" />
                          Create My Story!
                        </>
                      )}
                    </Button>

                    {/* Story Preview */}
                    {selectedTopicData && (
                      <div className="p-4 bg-gradient-to-r from-purple-100 to-pink-100 rounded-xl border-2 border-purple-200">
                        <h4 className="font-bold text-purple-800 mb-2 font-serif text-lg">{selectedTopicData.title}</h4>
                        <p className="text-purple-700 font-serif">{selectedTopicData.description}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Page - Voice Narration */}
              <div className="bg-gradient-to-br from-blue-50 to-green-50 rounded-2xl p-6 border-4 border-blue-200 shadow-lg relative overflow-hidden">
                {/* Page decoration */}
                <div className="absolute top-2 right-2 text-blue-300 text-6xl opacity-20 transform rotate-12">🎪</div>
                <div className="absolute bottom-2 left-2 text-green-300 text-4xl opacity-20 transform -rotate-12">🎵</div>
                
                <div className="relative z-10">
                  <h2 className="text-3xl font-bold text-blue-800 mb-2 font-serif flex items-center gap-2">
                    <Mic className="h-8 w-8 text-yellow-500" />
                    Story Theater
                  </h2>
                  <p className="text-blue-600 mb-6 font-serif italic">Bring your story to life!</p>
                  
                  <div className="space-y-4">
                    {/* Voice Selection */}
                    <div>
                      <Label className="text-lg font-bold text-blue-700 font-serif">Choose Your Narrator</Label>
                      <Select value={selectedVoice} onValueChange={setSelectedVoice}>
                        <SelectTrigger className="mt-2 border-2 border-blue-300 text-lg p-3 rounded-xl">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {VOICE_OPTIONS.map((voice) => (
                            <SelectItem key={voice.id} value={voice.id}>
                              <div className="py-2">
                                <div className="font-bold text-blue-800">{voice.name}</div>
                                <div className="text-sm text-blue-600">{voice.description}</div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Usage Limitation Notice */}
                    <div className="p-3 bg-amber-50 border-2 border-amber-200 rounded-xl">
                      <div className="flex items-center gap-2 text-amber-800 mb-1">
                        <Star className="h-4 w-4" />
                        <span className="font-bold text-sm">Voice Narration Limit</span>
                      </div>
                      <p className="text-amber-700 text-sm">
                        Story creation is unlimited! Voice narration is limited to 1 per week due to service costs.
                      </p>
                    </div>

                    {/* Audio Generation */}
                    <Button
                      onClick={handleGenerateAudio}
                      disabled={isGeneratingAudio || !generatedStory}
                      className="w-full bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-white text-xl py-4 rounded-xl font-bold shadow-lg transform hover:scale-105 transition-all"
                    >
                      {isGeneratingAudio ? (
                        <>
                          <Loader2 className="h-6 w-6 mr-2 animate-spin" />
                          Recording Story...
                        </>
                      ) : (
                        <>
                          <Volume2 className="h-6 w-6 mr-2" />
                          Record My Story!
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
                            className="flex-1 border-2 border-blue-300 text-blue-700 hover:bg-blue-50 text-lg py-3 rounded-xl font-bold"
                          >
                            {isPlaying ? (
                              <>
                                <Pause className="h-5 w-5 mr-2" />
                                Pause Story
                              </>
                            ) : (
                              <>
                                <Play className="h-5 w-5 mr-2" />
                                Play Story
                              </>
                            )}
                          </Button>
                          <Button
                            onClick={handleDownload}
                            variant="outline"
                            className="border-2 border-blue-300 text-blue-700 hover:bg-blue-50 text-lg py-3 px-4 rounded-xl"
                          >
                            <Download className="h-5 w-5" />
                          </Button>
                        </div>
                        
                        <div className="p-4 bg-gradient-to-r from-blue-100 to-green-100 rounded-xl border-2 border-blue-200">
                          <div className="flex items-center gap-2 text-blue-700 font-serif">
                            <Volume2 className="h-5 w-5" />
                            <span className="font-bold">{selectedVoiceData?.name}</span>
                            <span>•</span>
                            <span>{selectedLanguageData?.flag} {selectedLanguageData?.name}</span>
                          </div>
                        </div>
                        
                        <audio
                          ref={audioRef}
                          src={audioUrl}
                          onEnded={() => setIsPlaying(false)}
                          onPlay={() => setIsPlaying(true)}
                          onPause={() => setIsPlaying(false)}
                        />
                      </div>
                    )}

                    {/* Voice Preview */}
                    {selectedVoiceData && (
                      <div className="p-4 bg-gradient-to-r from-blue-100 to-green-100 rounded-xl border-2 border-blue-200">
                        <h4 className="font-bold text-blue-800 mb-2 font-serif text-lg">{selectedVoiceData.name}</h4>
                        <p className="text-blue-700 font-serif">{selectedVoiceData.description}</p>
                        <Badge variant="outline" className="mt-2 border-blue-400 text-blue-700 font-serif">
                          {selectedVoiceData.gender}
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Generated Story Display */}
            {generatedStory && (
              <div className="bg-gradient-to-br from-orange-50 to-yellow-50 rounded-2xl p-8 border-4 border-orange-200 shadow-lg mb-8 relative overflow-hidden">
                {/* Page decoration */}
                <div className="absolute top-4 right-4 text-orange-300 text-8xl opacity-20 transform rotate-12">📚</div>
                <div className="absolute bottom-4 left-4 text-yellow-300 text-6xl opacity-20 transform -rotate-12">✨</div>
                
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-4xl font-bold text-orange-800 font-serif flex items-center gap-2">
                      <Star className="h-8 w-8 text-yellow-500" />
                      {childName}'s Magical Story
                    </h2>
                    <Button
                      onClick={handleDownloadText}
                      variant="outline"
                      className="border-2 border-orange-300 text-orange-700 hover:bg-orange-50 text-lg py-3 px-6 rounded-xl font-bold shadow-lg"
                    >
                      <FileText className="h-5 w-5 mr-2" />
                      Download Story
                    </Button>
                  </div>
                  
                  <div className="prose prose-xl max-w-none">
                    <div className="p-6 bg-white/80 rounded-2xl border-2 border-orange-300 leading-relaxed shadow-inner">
                      {generatedStory.split('\n').map((paragraph, index) => (
                        <p key={index} className="mb-4 text-orange-900 text-xl font-serif last:mb-0 leading-relaxed">
                          {paragraph}
                        </p>
                      ))}
                    </div>
                  </div>
                  
                  {audioUrl && (
                    <div className="mt-6 flex items-center gap-2 text-orange-700 font-serif text-lg">
                      <Heart className="h-5 w-5" />
                      <span>Audio story ready for {childName}!</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Usage Tips */}
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-6 border-4 border-indigo-200 shadow-lg relative overflow-hidden">
              {/* Page decoration */}
              <div className="absolute top-2 right-2 text-indigo-300 text-6xl opacity-20 transform rotate-12">💡</div>
              <div className="absolute bottom-2 left-2 text-purple-300 text-4xl opacity-20 transform -rotate-12">🌟</div>
              
              <div className="relative z-10">
                <h2 className="text-3xl font-bold text-indigo-800 mb-4 font-serif">Magical Story Tips</h2>
                <div className="text-indigo-700 space-y-3 font-serif text-lg">
                  <div className="flex items-start gap-3">
                    <Users className="h-6 w-6 mt-1 flex-shrink-0 text-purple-500" />
                    <span>Use during circle time to address classroom behaviors with specific children</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Globe className="h-6 w-6 mt-1 flex-shrink-0 text-blue-500" />
                    <span>Create stories in children's home languages to build cultural connections</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Heart className="h-6 w-6 mt-1 flex-shrink-0 text-pink-500" />
                    <span>Play audio during rest time or as a calming transition activity</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <BookOpen className="h-6 w-6 mt-1 flex-shrink-0 text-green-500" />
                    <span>Save and share stories with families for home reinforcement</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}