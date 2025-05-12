import React, { useState } from 'react';
import { 
  ResponsiveContainer, 
  Tooltip, 
  XAxis, 
  YAxis, 
  ScatterChart, 
  Scatter, 
  Cell,
  ZAxis,
  Legend,
  Rectangle
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LearningModule, UserProgress } from '@shared/schema';
// Define types here so we don't have issues with importing
interface Milestone {
  id: number;
  name: string;
  x: number;
  y: number;
  value: number;
  description: string;
  icon: any;
  achieved?: boolean;
}

interface AchievementLevel {
  level: number;
  title: string;
  color: string;
  icon: any;
  requiredModules: number;
  requiredPoints: number;
}
import { formatDistanceToNow } from 'date-fns';
import { 
  Award, 
  Star, 
  TrendingUp, 
  BookOpen, 
  Trophy, 
  CheckCircle2, 
  GraduationCap 
} from 'lucide-react';

// Achievement levels with corresponding colors and titles
const achievementLevels: AchievementLevel[] = [
  { 
    level: 0, 
    title: "Teacher in Training", 
    color: "#94a3b8", 
    icon: BookOpen,
    requiredModules: 0,
    requiredPoints: 0 
  },
  { 
    level: 1, 
    title: "Assistant Teacher", 
    color: "#60a5fa", 
    icon: CheckCircle2,
    requiredModules: 3,
    requiredPoints: 300 
  },
  { 
    level: 2, 
    title: "Associate Teacher", 
    color: "#34d399", 
    icon: TrendingUp,
    requiredModules: 8,
    requiredPoints: 800 
  },
  { 
    level: 3, 
    title: "Lead Teacher", 
    color: "#fbbf24", 
    icon: Star,
    requiredModules: 15,
    requiredPoints: 1500 
  },
  { 
    level: 4, 
    title: "Master Lead Teacher", 
    color: "#f43f5e", 
    icon: Trophy,
    requiredModules: 25,
    requiredPoints: 2500 
  },
  { 
    level: 5, 
    title: "Mentor Teacher", 
    color: "#8b5cf6", 
    icon: GraduationCap,
    requiredModules: 35,
    requiredPoints: 3500 
  }
];

// Milestone data with tooltips and visual indicators
const milestones: Milestone[] = [
  { id: 1, name: "First Module", x: 1, y: 10, value: 50, description: "Completed your first learning module", icon: BookOpen },
  { id: 2, name: "5 Modules", x: 5, y: 30, value: 150, description: "Completed 5 learning modules", icon: TrendingUp },
  { id: 3, name: "Assistant Teacher", x: 8, y: 50, value: 300, description: "Reached Assistant Teacher level", icon: CheckCircle2 },
  { id: 4, name: "10 Modules", x: 10, y: 60, value: 400, description: "Completed 10 learning modules", icon: Star },
  { id: 5, name: "Associate Teacher", x: 15, y: 75, value: 800, description: "Reached Associate Teacher level", icon: Trophy },
  { id: 6, name: "Lead Teacher", x: 22, y: 85, value: 1500, description: "Reached Lead Teacher level", icon: Award },
  { id: 7, name: "Master Teacher", x: 30, y: 95, value: 2500, description: "Reached Master Lead Teacher level", icon: GraduationCap },
];

interface ProgressHeatmapProps {
  modules: LearningModule[];
  progress: UserProgress[];
  level: string;
  totalPoints: number;
}

// Custom tooltip component for the heatmap
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    
    return (
      <div className="bg-white/90 backdrop-blur-sm p-3 rounded-lg shadow-lg border border-border">
        <p className="font-bold text-foreground">{data.name}</p>
        <p className="text-sm text-muted-foreground">{data.description}</p>
        {data.module && (
          <div className="mt-1 pt-1 border-t border-border">
            <p className="text-xs font-medium">{data.module.title}</p>
            <p className="text-xs text-muted-foreground">
              {data.lastAccessed ? 
                `Last accessed ${formatDistanceToNow(new Date(data.lastAccessed), { addSuffix: true })}` : 
                'Not started'}
            </p>
            <div className="w-full bg-muted h-1 mt-1 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary"
                style={{ width: `${data.progressValue}%` }}
              />
            </div>
          </div>
        )}
        {data.milestone && (
          <div className="mt-1 pt-1 border-t border-border">
            <p className="text-xs font-medium">{data.milestone.name}</p>
            <p className="text-xs text-muted-foreground">{data.milestone.description}</p>
            <p className="text-xs font-semibold mt-1">+{data.milestone.value} points</p>
          </div>
        )}
      </div>
    );
  }

  return null;
};

// Custom legend for achievement levels
const CustomLegend = () => {
  return (
    <div className="flex flex-wrap justify-center gap-2 mt-2">
      {achievementLevels.map((level) => {
        const Icon = level.icon;
        return (
          <Badge 
            key={level.level} 
            variant="outline" 
            className="flex items-center gap-1 px-2 py-1"
          >
            <Icon className="h-3 w-3" style={{ color: level.color }} />
            <span style={{ color: level.color }}>{level.title}</span>
          </Badge>
        );
      })}
    </div>
  );
};

export default function ProgressHeatmap({ modules, progress, level, totalPoints }: ProgressHeatmapProps) {
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);

  // Process data for the heatmap
  const progressData = progress.map((p) => {
    const module = modules.find(m => m.id === p.moduleId);
    if (!module) return null;
    
    // Calculate position based on module difficulty and category
    const difficultyValue = 
      module.difficulty === 'beginner' ? 1 : 
      module.difficulty === 'intermediate' ? 2 : 
      3;
    
    const categoryMapping: Record<string, number> = {
      'classroom-management': 1,
      'child-development': 2,
      'curriculum': 3,
      'assessment': 4,
      'family-engagement': 5,
      'professional-development': 6,
      'mindfulness': 7
    };
    
    const categoryValue = categoryMapping[module.category.toLowerCase()] || 0;
    
    return {
      x: categoryValue * 3 + difficultyValue,
      y: p.progress || 1,
      z: 10,
      progressValue: p.progress,
      name: module.title,
      description: module.description,
      completed: p.completed,
      module,
      lastAccessed: p.lastAccessed,
      id: p.id
    };
  }).filter(Boolean);

  // Determine the user's current achievement level
  const currentLevelData = achievementLevels.find(l => l.title === level) || achievementLevels[0];
  const nextLevel = achievementLevels.find(l => l.level === currentLevelData.level + 1);
  
  // Calculate progress to next level
  const pointsToNextLevel = nextLevel ? nextLevel.requiredPoints - totalPoints : 0;
  const progressToNextLevel = nextLevel 
    ? Math.min(100, Math.round((totalPoints - currentLevelData.requiredPoints) / (nextLevel.requiredPoints - currentLevelData.requiredPoints) * 100))
    : 100;

  // Determine which milestones have been achieved
  const achievedMilestones = milestones
    .filter(milestone => totalPoints >= milestone.value)
    .map(milestone => ({ ...milestone, achieved: true }));
  
  const unachievedMilestones = milestones
    .filter(milestone => totalPoints < milestone.value)
    .map(milestone => ({ ...milestone, achieved: false }));

  const allMilestonesWithStatus = [...achievedMilestones, ...unachievedMilestones];

  // Combined data for the chart
  const combinedData = [
    ...progressData,
    ...allMilestonesWithStatus.map(milestone => ({
      x: milestone.x,
      y: milestone.y,
      z: milestone.achieved ? 20 : 7,
      name: milestone.name,
      description: milestone.description,
      isMilestone: true,
      milestone,
      achieved: milestone.achieved,
      id: `milestone-${milestone.id}`
    }))
  ];

  const CurrentLevelIcon = currentLevelData.icon;

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl">Learning Progress</CardTitle>
            <CardDescription>Your learning journey and achievements</CardDescription>
          </div>
          <div className="flex gap-2 items-center">
            <Badge className="capitalize font-medium" style={{ backgroundColor: currentLevelData.color }}>
              <CurrentLevelIcon className="h-3.5 w-3.5 mr-1" />
              {currentLevelData.title}
            </Badge>
            <div className="flex flex-col">
              <span className="text-sm font-medium">{totalPoints} points</span>
              {nextLevel && (
                <span className="text-xs text-muted-foreground">
                  {pointsToNextLevel} points to {nextLevel.title}
                </span>
              )}
            </div>
          </div>
        </div>
        
        {nextLevel && (
          <div className="mt-2">
            <div className="flex justify-between text-xs mb-1">
              <span>{currentLevelData.title}</span>
              <span>{nextLevel.title}</span>
            </div>
            <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
              <div 
                className="h-full transition-all duration-1000 ease-in-out animate-pulse-slow"
                style={{ 
                  width: `${progressToNextLevel}%`,
                  backgroundColor: nextLevel.color
                }}
              />
            </div>
          </div>
        )}
      </CardHeader>
      
      <CardContent>
        <div className="w-full h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart
              margin={{
                top: 20,
                right: 20,
                bottom: 40,
                left: 20,
              }}
            >
              <XAxis type="number" dataKey="x" name="Category" tick={false} axisLine={false} />
              <YAxis type="number" dataKey="y" name="Progress" tick={false} axisLine={false} />
              <ZAxis type="number" dataKey="z" range={[50, 400]} />
              <Tooltip content={<CustomTooltip />} />
              <Legend content={<CustomLegend />} />
              <Scatter 
                name="Progress" 
                data={combinedData} 
                shape={(props) => {
                  const { cx, cy, r, index } = props;
                  const item = combinedData[index];
                  const isHovered = hoveredPoint === index;
                  const isAchieved = item.achieved !== false;
                  const isMilestone = item.isMilestone;
                  
                  // Determine fill color
                  let fillColor = "#94a3b8"; // default color
                  
                  if (isMilestone) {
                    fillColor = isAchieved ? "#fbbf24" : "#94a3b8";
                  } else if (item.completed) {
                    // Completed modules
                    fillColor = "#34d399";
                  } else if (item.progressValue > 0) {
                    // In-progress modules
                    fillColor = "#60a5fa";
                  }
                  
                  // Highlight when hovered
                  if (isHovered) {
                    return (
                      <g>
                        <circle
                          cx={cx}
                          cy={cy}
                          r={r * 1.2}
                          fill={fillColor}
                          fillOpacity={0.8}
                          className="animate-pulse-fast"
                        />
                        <circle
                          cx={cx}
                          cy={cy}
                          r={r}
                          stroke="#ffffff"
                          strokeWidth={2}
                          fill={fillColor}
                        />
                      </g>
                    );
                  }
                  
                  // Different shape for milestones
                  if (isMilestone) {
                    return (
                      <g>
                        <polygon
                          points={`${cx},${cy-r} ${cx+r},${cy} ${cx},${cy+r} ${cx-r},${cy}`}
                          fill={fillColor}
                          stroke={isAchieved ? "#ffffff" : "none"}
                          strokeWidth={isAchieved ? 2 : 0}
                          fillOpacity={isAchieved ? 0.9 : 0.5}
                          className={isAchieved ? "animate-pulse-slow" : ""}
                        />
                        {isAchieved && (
                          <circle
                            cx={cx}
                            cy={cy}
                            r={r/2}
                            fill="#ffffff"
                          />
                        )}
                      </g>
                    );
                  }
                  
                  // Regular circle for modules
                  return (
                    <circle
                      cx={cx}
                      cy={cy}
                      r={r}
                      fill={fillColor}
                      stroke={item.completed ? "#ffffff" : "none"}
                      strokeWidth={1}
                      fillOpacity={0.8}
                    />
                  );
                }}
                onMouseOver={(data, index) => {
                  setHoveredPoint(index);
                }}
                onMouseLeave={() => {
                  setHoveredPoint(null);
                }}
              />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
        
        <div className="flex justify-between items-center text-sm mt-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#60a5fa]"></div>
            <span>In Progress</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#34d399]"></div>
            <span>Completed</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#fbbf24]"></div>
            <span>Milestone Achieved</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#94a3b8]"></div>
            <span>Future Milestone</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}