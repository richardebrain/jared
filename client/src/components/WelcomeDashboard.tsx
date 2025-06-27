import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trophy, Flame, Star, MessageCircle, Gift, Award, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { soundManager } from "@/utils/soundManager";
import type { User } from "@shared/schema";
import BonusBoxPopup from "@/components/BonusBoxPopup";

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
  const [bonusBoxes, setBonusBoxes] = useState<any[]>([]);
  const [showBonusBoxPopup, setShowBonusBoxPopup] = useState(false);

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

    // Only load director messages for admin users to reduce API calls
    if (user?.isAdmin || user?.isSchoolAdmin || user?.isOwner) {
      loadDirectorMessages();
    }

    // Load bonus boxes for all users
    loadBonusBoxes();
  }, [user.streak, user.isAdmin, user.isSchoolAdmin, user.isOwner]);

  const loadBonusBoxes = async () => {
    try {
      const response = await apiRequest("/api/bonus-boxes/pending");
      const boxes = Array.isArray(response) ? response : [];
      setBonusBoxes(boxes);
      
      // Show popup if there are pending boxes
      if (boxes.length > 0) {
        setShowBonusBoxPopup(true);
      }
    } catch (error) {
      // Silently fail to not disrupt user experience
      setBonusBoxes([]);
    }
  };

  const loadDirectorMessages = async () => {
    try {
      // Use cached query instead of direct API call for better performance
      const response = await apiRequest("/api/director-messages");
      // Only show unread messages to reduce clutter
      const unreadMessages = Array.isArray(response) ? response.filter(msg => !msg.isRead).slice(0, 3) : [];
      setDirectorMessages(unreadMessages);
    } catch (error) {
      // Silently fail to not disrupt user experience
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

          {/* Bonus Boxes Alert */}
          {bonusBoxes.length > 0 && !showBonusBoxPopup && (
            <Card className="border-purple-200 bg-purple-50">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Gift className="h-5 w-5 text-purple-600" />
                  <span>You Got Bonus Boxes!</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {bonusBoxes.map((box, index) => (
                  <div key={index} className="bg-white rounded-lg p-3 border border-purple-200">
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                        {box.box_type === 'gold' && <Trophy className="h-4 w-4 text-yellow-600" />}
                        {box.box_type === 'silver' && <Award className="h-4 w-4 text-gray-600" />}
                        {box.box_type === 'bronze' && <Star className="h-4 w-4 text-orange-600" />}
                        {box.box_type === 'bonus' && <Sparkles className="h-4 w-4 text-purple-600" />}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {box.box_type.charAt(0).toUpperCase() + box.box_type.slice(1)} Box from {box.sender_first_name} {box.sender_last_name}
                        </p>
                        {box.message && (
                          <p className="text-sm text-gray-600 mt-1">"{box.message}"</p>
                        )}
                        <p className="text-xs text-gray-400 mt-2">
                          Click "Start Your Day" to open your surprise!
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Director Messages */}
          {directorMessages.filter(msg => !msg.isRead).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <MessageCircle className="h-5 w-5 text-blue-600" />
                  <span>Messages from Leadership</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {directorMessages.filter(msg => !msg.isRead).map((message, index) => (
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
              onClick={() => {
                if (bonusBoxes.length > 0) {
                  setShowBonusBoxPopup(true);
                } else {
                  onClose();
                }
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3"
            >
              {bonusBoxes.length > 0 ? "Open Bonus Boxes! 🎁" : "Start Your Day! 🚀"}
            </Button>
          </div>
        </div>
      </div>

      {/* Bonus Box Popup */}
      {showBonusBoxPopup && bonusBoxes.length > 0 && (
        <BonusBoxPopup
          bonusBox={bonusBoxes[0]}
          onComplete={(pointsAwarded) => {
            // Remove the opened box from the list
            setBonusBoxes(prev => prev.slice(1));
            
            // If no more boxes, close popup and main welcome
            if (bonusBoxes.length <= 1) {
              setShowBonusBoxPopup(false);
              onClose();
            }
          }}
        />
      )}
    </div>
  );
}