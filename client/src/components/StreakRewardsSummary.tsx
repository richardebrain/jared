import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Flame, Star, Medal, Check } from "lucide-react";

interface StreakRewardsSummaryProps {
  streakCount: number;
  className?: string;
}

export function StreakRewardsSummary({ streakCount }: StreakRewardsSummaryProps) {
  // Calculate the streak bonus points based on streak count
  const getStreakPoints = (days: number) => {
    if (days < 2) return 0;
    if (days >= 5) return 5;
    return days;
  };

  const currentBonus = getStreakPoints(streakCount);
  
  // Define the reward tiers
  const rewardTiers = [
    { days: 1, points: 0, label: "First Day", description: "Keep logging in!" },
    { days: 2, points: 2, label: "Day 2", description: "2 bonus points per day" },
    { days: 3, points: 3, label: "Day 3", description: "3 bonus points per day" },
    { days: 4, points: 4, label: "Day 4", description: "4 bonus points per day" },
    { days: 5, points: 5, label: "Day 5+", description: "5 bonus points per day" },
  ];

  return (
    <div className="space-y-3">
      {/* Current streak status with highlight */}
      <div className="flex items-center justify-between bg-gradient-to-r from-indigo-50 to-purple-50 p-3 rounded-lg border border-purple-200">
        <div className="flex items-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 text-white">
            <Flame className="h-5 w-5" />
          </div>
          <div className="ml-3">
            <div className="text-sm text-gray-500">Current Streak</div>
            <div className="font-bold text-lg">{streakCount} days</div>
          </div>
        </div>
        
        {currentBonus > 0 && (
          <Badge className="bg-gradient-to-r from-amber-500 to-amber-600 text-white px-3 py-1.5 text-sm">
            <Star className="h-3 w-3 mr-1.5" />
            {currentBonus} Bonus Points/Day
          </Badge>
        )}
      </div>
      
      {/* Reward tiers visualization */}
      <div className="grid grid-cols-5 gap-1">
        {rewardTiers.map((tier, index) => {
          // Determine if this tier is active (current or passed)
          const isActive = streakCount >= tier.days;
          // Determine if this is the current tier
          const isCurrent = 
            (streakCount >= tier.days) && 
            (index === rewardTiers.length - 1 || streakCount < rewardTiers[index + 1].days);
            
          return (
            <div 
              key={index}
              className={`relative p-2 rounded-md text-center ${
                isCurrent 
                  ? 'bg-gradient-to-b from-amber-100 to-amber-200 border-2 border-amber-400 shadow-md transform scale-105' 
                  : isActive
                    ? 'bg-gradient-to-b from-purple-100 to-purple-200 border border-purple-300'
                    : 'bg-gray-100 border border-gray-200 opacity-70'
              }`}
            >
              <div className="text-xs font-semibold mb-1">{tier.days === 5 ? "5+" : tier.days}</div>
              <div className={`text-xs ${isCurrent ? 'text-amber-700' : 'text-gray-600'}`}>
                {tier.points > 0 ? `+${tier.points}` : '-'}
              </div>
              
              {/* Show checkmark or current indicator */}
              {isActive && (
                <div className={`absolute -top-2 -right-2 w-5 h-5 rounded-full flex items-center justify-center ${
                  isCurrent ? 'bg-amber-500 text-white animate-pulse' : 'bg-purple-500 text-white'
                }`}>
                  {isCurrent ? (
                    <Star className="h-3 w-3" />
                  ) : (
                    <Check className="h-3 w-3" />
                  )}
                </div>
              )}
              
              {/* Highlight current tier with special indicator */}
              {isCurrent && (
                <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
                  <Badge className="bg-amber-500 text-white animate-pulse-slow">
                    YOU ARE HERE
                  </Badge>
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      {/* Streak info message */}
      <div className="text-xs text-gray-500 mt-8 flex items-start">
        <Medal className="h-3 w-3 mr-1 text-amber-500 mt-0.5 flex-shrink-0" />
        <span>
          Maintain your streak by logging in daily. Your current streak earns you 
          <span className="font-bold text-amber-600"> {currentBonus > 0 ? currentBonus : 'no'} bonus points </span> 
          each day!
        </span>
      </div>
    </div>
  );
}