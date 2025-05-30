import { useState, useEffect } from 'react';
import { Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface VideoRatingProps {
  videoId: string;
  showReviews?: boolean;
  compact?: boolean;
}

interface VideoRating {
  id: number;
  userId: number;
  videoId: string;
  rating: number;
  review?: string;
  createdAt: string;
  updatedAt: string;
  user?: {
    firstName: string;
    lastName: string;
    school?: string;
  };
}

interface VideoRatingData {
  ratings: VideoRating[];
  averageRating: number;
  totalRatings: number;
}

export function VideoRating({ videoId, showReviews = false, compact = false }: VideoRatingProps) {
  const [isRatingDialogOpen, setIsRatingDialogOpen] = useState(false);
  const [selectedRating, setSelectedRating] = useState(0);
  const [review, setReview] = useState('');
  const [hoveredStar, setHoveredStar] = useState(0);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch video ratings
  const { data: ratingsData } = useQuery<VideoRatingData>({
    queryKey: [`/api/videos/${videoId}/ratings`],
  });

  // Fetch user's rating for this video
  const { data: userRating } = useQuery<VideoRating | null>({
    queryKey: [`/api/videos/${videoId}/rating`],
  });

  // Set initial rating and review if user has already rated
  useEffect(() => {
    if (userRating) {
      setSelectedRating(userRating.rating);
      setReview(userRating.review || '');
    }
  }, [userRating]);

  // Create or update rating mutation
  const ratingMutation = useMutation({
    mutationFn: async (data: { rating: number; review?: string }) => {
      const method = userRating ? 'PUT' : 'POST';
      const response = await fetch(`/api/videos/${videoId}/rating`, {
        method,
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) {
        throw new Error('Failed to save rating');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Rating saved",
        description: "Your video rating has been saved successfully.",
      });
      setIsRatingDialogOpen(false);
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: [`/api/videos/${videoId}/ratings`] });
      queryClient.invalidateQueries({ queryKey: [`/api/videos/${videoId}/rating`] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save your rating. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmitRating = () => {
    if (selectedRating === 0) {
      toast({
        title: "Please select a rating",
        description: "You need to select at least one star to rate this video.",
        variant: "destructive",
      });
      return;
    }

    ratingMutation.mutate({
      rating: selectedRating,
      review: review.trim() || undefined,
    });
  };

  const StarDisplay = ({ rating, interactive = false, size = 16 }: { rating: number; interactive?: boolean; size?: number }) => {
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={size}
            className={`${
              star <= rating
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-300'
            } ${interactive ? 'cursor-pointer hover:scale-110 transition-transform' : ''}`}
            onClick={interactive ? () => setSelectedRating(star) : undefined}
            onMouseEnter={interactive ? () => setHoveredStar(star) : undefined}
            onMouseLeave={interactive ? () => setHoveredStar(0) : undefined}
          />
        ))}
      </div>
    );
  };

  if (compact) {
    return (
      <div className="flex items-center space-x-2">
        <StarDisplay rating={ratingsData?.averageRating || 0} />
        <span className="text-sm text-gray-600">
          {ratingsData?.averageRating ? Number(ratingsData.averageRating).toFixed(1) : '0.0'}
        </span>
        <span className="text-xs text-gray-500">
          ({ratingsData?.totalRatings || 0})
        </span>
        <Dialog open={isRatingDialogOpen} onOpenChange={setIsRatingDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              {userRating ? 'Update Rating' : 'Rate Video'}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Rate This Video</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="text-center">
                <StarDisplay 
                  rating={hoveredStar || selectedRating} 
                  interactive={true} 
                  size={24}
                />
                <p className="text-sm text-gray-600 mt-2">
                  Click the stars to rate this video
                </p>
              </div>
              
              <div>
                <label className="text-sm font-medium">Review (optional)</label>
                <Textarea
                  value={review}
                  onChange={(e) => setReview(e.target.value)}
                  placeholder="Share your thoughts about this video..."
                  className="mt-1"
                  rows={3}
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsRatingDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleSubmitRating}
                  disabled={ratingMutation.isPending}
                >
                  {ratingMutation.isPending ? 'Saving...' : 'Save Rating'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <StarDisplay rating={ratingsData?.averageRating || 0} size={20} />
          <div>
            <div className="font-medium">
              {ratingsData?.averageRating ? ratingsData.averageRating.toFixed(1) : '0.0'} out of 5
            </div>
            <div className="text-sm text-gray-600">
              {ratingsData?.totalRatings || 0} rating{ratingsData?.totalRatings !== 1 ? 's' : ''}
            </div>
          </div>
        </div>
        
        <Dialog open={isRatingDialogOpen} onOpenChange={setIsRatingDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline">
              {userRating ? 'Update Your Rating' : 'Rate This Video'}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Rate This Video</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="text-center">
                <StarDisplay 
                  rating={hoveredStar || selectedRating} 
                  interactive={true} 
                  size={32}
                />
                <p className="text-sm text-gray-600 mt-2">
                  Click the stars to rate this video
                </p>
              </div>
              
              <div>
                <label className="text-sm font-medium">Review (optional)</label>
                <Textarea
                  value={review}
                  onChange={(e) => setReview(e.target.value)}
                  placeholder="Share your thoughts about this video..."
                  className="mt-1"
                  rows={4}
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsRatingDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleSubmitRating}
                  disabled={ratingMutation.isPending}
                >
                  {ratingMutation.isPending ? 'Saving...' : 'Save Rating'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {showReviews && ratingsData?.ratings && ratingsData.ratings.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Reviews</h4>
            <span className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded">
              Global ratings from all schools
            </span>
          </div>
          <div className="space-y-3">
            {ratingsData.ratings.slice(0, 5).map((rating) => (
              <div key={rating.id} className="border-l-2 border-gray-200 pl-4">
                <div className="flex items-center space-x-2 mb-1">
                  <StarDisplay rating={rating.rating} size={14} />
                  <span className="text-sm font-medium">
                    {rating.user ? `${rating.user.firstName} ${rating.user.lastName}` : 'Anonymous'}
                  </span>
                  {rating.user?.school && (
                    <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                      {rating.user.school}
                    </span>
                  )}
                  <span className="text-xs text-gray-500">
                    {new Date(rating.createdAt).toLocaleDateString()}
                  </span>
                </div>
                {rating.review && (
                  <p className="text-sm text-gray-700">{rating.review}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}