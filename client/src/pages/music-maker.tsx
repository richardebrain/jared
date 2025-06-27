import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Music, Sparkles, Clock, AlertTriangle, CheckCircle, Library, Play } from 'lucide-react';
import { Link } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useQuery } from '@tanstack/react-query';

interface SongStatus {
  usedThisWeek: boolean;
  requestsThisWeek: number;
  currentWeek: string;
}

interface Song {
  id: number;
  userId: number;
  title: string;
  prompt: string;
  audioUrl: string;
  taskId?: string;
  status: string;
  generatedAt: string;
  createdAt: string;
}

interface SongGenerationResponse {
  success: boolean;
  audioUrl?: string;
  taskId?: string;
  status?: string;
  message?: string;
}

export default function MusicMaker() {
  const [prompt, setPrompt] = useState('');
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [songStatus, setSongStatus] = useState<SongStatus | null>(null);
  const [taskId, setTaskId] = useState<string | null>(null);
  const { toast } = useToast();

  // Query to fetch user's saved songs
  const { data: userSongs = [], isLoading: songsLoading } = useQuery({
    queryKey: ['/api/musicmaker/songs'],
  });

  // Fetch song generation status on component mount
  useEffect(() => {
    fetchSongStatus();
  }, []);

  // Poll for song completion if we have a taskId
  useEffect(() => {
    if (taskId && isGenerating) {
      const pollInterval = setInterval(async () => {
        try {
          const response = await apiRequest(`/api/musicmaker/status/${taskId}`);
          
          if (response.status === 'completed' && response.audioUrl) {
            setAudioUrl(response.audioUrl);
            setIsGenerating(false);
            setTaskId(null);
            clearInterval(pollInterval);
            
            toast({
              title: "Song Ready!",
              description: "Your custom song has been generated successfully.",
            });
          } else if (response.status === 'failed') {
            setError('Song generation failed. Please try again.');
            setIsGenerating(false);
            setTaskId(null);
            clearInterval(pollInterval);
          }
        } catch (error) {
          console.error('Error polling song status:', error);
        }
      }, 3000); // Poll every 3 seconds

      // Clear interval after 2 minutes to avoid infinite polling
      setTimeout(() => clearInterval(pollInterval), 120000);

      return () => clearInterval(pollInterval);
    }
  }, [taskId, isGenerating, toast]);

  const fetchSongStatus = async () => {
    try {
      const response = await apiRequest('/api/musicmaker/status');
      setSongStatus(response);
    } catch (error) {
      console.error('Error fetching song status:', error);
    }
  };

  const generateSong = async () => {
    if (!prompt.trim()) {
      setError('Please enter a song theme or prompt');
      return;
    }

    setError('');
    setIsGenerating(true);
    setAudioUrl(null);

    try {
      const response: SongGenerationResponse = await apiRequest('/api/musicmaker/generate', {
        method: 'POST',
        data: { prompt: prompt.trim() }
      });

      if (response.success) {
        // Update song status to reflect usage
        setSongStatus(prev => prev ? {
          ...prev,
          usedThisWeek: true,
          requestsThisWeek: (prev.requestsThisWeek || 0) + 1
        } : null);

        if (response.audioUrl) {
          // Song is immediately available
          setAudioUrl(response.audioUrl);
          setIsGenerating(false);
          toast({
            title: "Song Generated!",
            description: "Your custom song is ready to play.",
          });
        } else if (response.taskId) {
          // Song is being processed
          setTaskId(response.taskId);
          toast({
            title: "Generating Song...",
            description: "Your song is being created. This may take a few moments.",
          });
        }
      }
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to generate song. Please try again.');
      setIsGenerating(false);
      
      toast({
        title: "Generation Failed",
        description: error.response?.data?.error || "Please try again with a different prompt.",
        variant: "destructive"
      });
    }
  };

  const examplePrompts = [
    "A happy cleanup song for preschoolers",
    "A gentle transition song for naptime",
    "An energetic good morning circle time song",
    "A counting song that goes from 1 to 10",
    "A friendship song about sharing and caring",
    "A goodbye song for the end of the day"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link href="/director-toolkit">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Director Toolkit
            </Button>
          </Link>
          
          <div className="flex items-center gap-3 mb-2">
            <Music className="h-8 w-8 text-purple-600" />
            <h1 className="text-3xl font-bold text-gray-900">MusicMakerPrek</h1>
            <Badge variant="secondary" className="bg-purple-100 text-purple-700">
              AI-Powered
            </Badge>
          </div>
          
          <p className="text-gray-600 text-lg">
            Create custom songs for your classroom with AI. Perfect for transitions, learning, and fun!
          </p>
        </div>

        {/* Usage Status */}
        {songStatus && (
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {songStatus.usedThisWeek ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <Clock className="h-5 w-5 text-blue-600" />
                  )}
                  <div>
                    <p className="font-medium">
                      {songStatus.usedThisWeek 
                        ? "You've used your song for this week" 
                        : "Ready to create your weekly song"}
                    </p>
                    <p className="text-sm text-gray-600">
                      Week {songStatus.currentWeek} • {songStatus.requestsThisWeek}/1 songs used
                    </p>
                  </div>
                </div>
                <Badge variant={songStatus.usedThisWeek ? "secondary" : "default"}>
                  {songStatus.usedThisWeek ? "Used" : "Available"}
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Song Generator */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-purple-600" />
                Create Your Song
              </CardTitle>
              <CardDescription>
                Describe the type of song you want and AI will create it for you
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {songStatus?.usedThisWeek ? (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    You've already generated your song for this week. Come back next week for a new tune!
                  </AlertDescription>
                </Alert>
              ) : (
                <>
                  <div>
                    <label htmlFor="prompt" className="block text-sm font-medium mb-2">
                      Song Theme or Description
                    </label>
                    <Textarea
                      id="prompt"
                      placeholder="Enter a theme, child's name, age group, or specific need (e.g., 'A happy cleanup song for 3-year-olds')"
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      disabled={isGenerating}
                      className="min-h-[100px]"
                    />
                  </div>

                  {error && (
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <Button 
                    onClick={generateSong} 
                    disabled={!prompt.trim() || isGenerating}
                    className="w-full bg-purple-600 hover:bg-purple-700"
                  >
                    {isGenerating ? (
                      <>
                        <Clock className="h-4 w-4 mr-2 animate-spin" />
                        {taskId ? 'Creating Song...' : 'Starting Generation...'}
                      </>
                    ) : (
                      <>
                        <Music className="h-4 w-4 mr-2" />
                        Generate Song
                      </>
                    )}
                  </Button>
                </>
              )}

              {/* Audio Player */}
              {audioUrl && (
                <div className="pt-4 border-t">
                  <h3 className="font-medium mb-3">Your Generated Song</h3>
                  <audio 
                    controls 
                    src={audioUrl} 
                    className="w-full"
                    controlsList="nodownload"
                  >
                    Your browser does not support audio playback.
                  </audio>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Examples and Tips */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Example Prompts</CardTitle>
                <CardDescription>
                  Get inspired with these classroom-tested ideas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {examplePrompts.map((example, index) => (
                    <button
                      key={index}
                      onClick={() => !songStatus?.usedThisWeek && setPrompt(example)}
                      disabled={songStatus?.usedThisWeek || isGenerating}
                      className="text-left w-full p-3 rounded-lg bg-gray-50 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <p className="text-sm font-medium text-gray-700">{example}</p>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tips for Great Songs</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2 text-sm text-gray-600">
                  <p>• Be specific about the age group (toddlers, preschoolers, etc.)</p>
                  <p>• Include the purpose (cleanup, transitions, learning)</p>
                  <p>• Mention preferred style (upbeat, gentle, silly)</p>
                  <p>• Add specific details like names or classroom themes</p>
                  <p>• Keep content appropriate and positive</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Usage Policy</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm text-gray-600">
                  <p>• One song per week per director account</p>
                  <p>• Content must be appropriate for children</p>
                  <p>• Songs are generated using AI technology</p>
                  <p>• Resets every Monday for new weekly allowance</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* My Songs Section */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Library className="h-5 w-5 text-purple-600" />
              My Songs
            </CardTitle>
            <CardDescription>
              Your previously generated songs
            </CardDescription>
          </CardHeader>
          <CardContent>
            {songsLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-gray-500">Loading your songs...</div>
              </div>
            ) : userSongs.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Music className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>No songs generated yet</p>
                <p className="text-sm">Create your first song above!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {userSongs.map((song: Song) => (
                  <Card key={song.id} className="p-4">
                    <div className="space-y-3">
                      <div>
                        <h3 className="font-medium text-gray-900">{song.title}</h3>
                        <p className="text-sm text-gray-600 line-clamp-2">{song.prompt}</p>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">
                          {new Date(song.createdAt).toLocaleDateString()}
                        </span>
                        
                        {song.audioUrl && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const audio = new Audio(song.audioUrl);
                              audio.play().catch(console.error);
                            }}
                            className="flex items-center gap-1"
                          >
                            <Play className="h-3 w-3" />
                            Play
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}