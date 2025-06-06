import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trophy, Flame, Star, MessageCircle, Gift } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { soundManager } from "@/utils/soundManager";
import type { User } from "@shared/schema";

interface WelcomeDashboardProps {
  user: User;
  onClose: () => void;
}

interface StreakReward {
  type: string;
  amount: number;
  message: string;
}

export function WelcomeDashboard({ user, onClose }: WelcomeDashboardProps) {
  const { toast } = useToast();
  const [showStreakCelebration, setShowStreakCelebration] = useState(false);
  const [directorMessages, setDirectorMessages] = useState<any[]>([]);
  const [todayRewards, setTodayRewards] = useState<StreakReward[]>([]);

  useEffect(() => {
    // Always show streak information, regardless of streak count
    setShowStreakCelebration(true);
    
    // Calculate rewards based on streak
    const rewards: StreakReward[] = [];
    
    // Daily streak points - everyone gets these for logging in
    const userStreak = user.streak || 0;
    const dailyStreakPoints = userStreak >= 2 ? Math.min(userStreak, 5) : 0;
    if (dailyStreakPoints > 0) {
      rewards.push({
        type: "points",
        amount: dailyStreakPoints,
        message: `🎯 Daily Streak Bonus: ${dailyStreakPoints} points!`
      });
    }
    
    // Special milestone bonuses
    if (userStreak === 7) {
      rewards.push({
        type: "points",
        amount: 25,
        message: "🎉 7-Day Streak Milestone Bonus!"
      });
    }
    
    if (userStreak === 30) {
      rewards.push({
        type: "points",
        amount: 100,
        message: "🏆 30-Day Streak Milestone Bonus!"
      });
    }
    
    if (userStreak && userStreak % 5 === 0 && userStreak >= 5) {
      rewards.push({
        type: "points",
        amount: 15,
        message: `🔥 ${userStreak}-Day Streak Achievement!`
      });
    }
    
    setTodayRewards(rewards);

    // Play sound effects for rewards
    if (rewards.length > 0) {
      // Play appropriate sound based on highest reward
      const maxReward = Math.max(...rewards.map(r => r.amount));
      soundManager.playCoinSound(maxReward);
      
      // Special sound for streak milestones
      if (userStreak >= 5) {
        soundManager.playStreakSound(userStreak);
      }
    }

    // Load any director messages
    loadDirectorMessages();
  }, [user.streak]);

  const loadDirectorMessages = async () => {
    try {
      console.log("Loading director messages for user:", user?.id);
      const response = await apiRequest("/api/director-messages");
      console.log("Director messages response:", response);
      // Ensure we have an array
      setDirectorMessages(Array.isArray(response) ? response : []);
    } catch (error) {
      console.error("API Error:", error);
      // No messages available
      setDirectorMessages([]);
    }
  };

  const getStreakIcon = (streak: number) => {
    if (streak >= 30) return "🏆";
    if (streak >= 14) return "🔥";
    if (streak >= 7) return "⭐";
    return "📅";
  };

  const getStreakColor = (streak: number) => {
    if (streak >= 30) return "bg-yellow-500";
    if (streak >= 14) return "bg-orange-500";
    if (streak >= 7) return "bg-blue-500";
    return "bg-gray-500";
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="space-y-6">
          {/* Welcome Header */}
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Welcome back, {user.firstName}! 👋
            </h2>
            <p className="text-gray-600">
              Ready for another day of inspiring young minds?
            </p>
          </div>

          {/* Streak Celebration */}
          {showStreakCelebration && user.streak && (
            <Card className="border-blue-200 bg-blue-50">
              <CardHeader className="text-center">
                <div className="flex items-center justify-center space-x-2">
                  <span className="text-3xl">{getStreakIcon(user.streak)}</span>
                  <CardTitle className="text-blue-800">
                    {user.streak} Day Learning Streak!
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="text-center">
                <div className="flex justify-center mb-4">
                  <Badge className={`${getStreakColor(user.streak)} text-white px-4 py-2 text-lg`}>
                    Day {user.streak}
                  </Badge>
                </div>
                <p className="text-blue-700 mb-4">
                  Your dedication to professional growth is amazing! Keep up the fantastic work.
                </p>
                
                {/* Today's Rewards */}
                {todayRewards.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-semibold text-blue-800">Today's Rewards:</h4>
                    {todayRewards.map((reward, index) => (
                      <div key={index} className="flex items-center justify-center space-x-2 bg-white rounded-lg p-2">
                        <Gift className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium">{reward.message}</span>
                        <Badge variant="secondary">+{reward.amount} {reward.type.replace('_', ' ')}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Director Messages */}
          {directorMessages.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <MessageCircle className="h-5 w-5 text-blue-600" />
                  <span>Messages from Leadership</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {directorMessages.map((message, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <Star className="h-4 w-4 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{message.title}</p>
                        <p className="text-sm text-gray-600 mt-1">{message.content}</p>
                        <p className="text-xs text-gray-400 mt-2">
                          From: {message.senderName} • {new Date(message.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-4">
            <Card className="text-center">
              <CardContent className="pt-4">
                <div className="text-2xl font-bold text-blue-600">{user.points}</div>
                <div className="text-sm text-gray-600">Points</div>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="pt-4">
                <div className="text-2xl font-bold text-green-600">{user.bearBucks}</div>
                <div className="text-sm text-gray-600">Bear Bucks</div>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="pt-4">
                <div className="text-2xl font-bold text-purple-600">Level {user.level}</div>
                <div className="text-sm text-gray-600">Current Level</div>
              </CardContent>
            </Card>
          </div>

          {/* Action Button */}
          <div className="text-center">
            <Button 
              onClick={onClose}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3"
            >
              Start Your Day! 🚀
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}