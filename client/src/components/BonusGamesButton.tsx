import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";

export default function BonusGamesButton() {
  const { user } = useAuth();
  const [gamePlayed, setGamePlayed] = useState(false);
  
  // Fetch game history to check if a game was played today
  const { data: gameHistory } = useQuery({
    queryKey: ["/api/games/history"],
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
  });
  
  // Also check localStorage for immediate update after playing a game
  useEffect(() => {
    const lastGamePlayedDate = localStorage.getItem('lastGamePlayedDate');
    const today = new Date().toDateString();
    
    if (lastGamePlayedDate === today) {
      setGamePlayed(true);
    } else if (gameHistory && gameHistory.length > 0) {
      // Check if any game was played today from API data
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const playedToday = gameHistory.some((game) => {
        const gameDate = new Date(game.completedAt);
        return gameDate.toDateString() === today.toDateString();
      });
      
      setGamePlayed(playedToday);
    }
  }, [gameHistory]);

  if (gamePlayed) {
    // Disabled/greyed out state
    return (
      <div className="group relative overflow-hidden bg-gradient-to-r from-gray-500 via-gray-600 to-gray-700 text-white font-bold py-3 px-6 rounded-xl border-2 border-gray-400 opacity-90 cursor-not-allowed">
        <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-gray-400 rounded"></div>
        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-gray-400 rounded"></div>
        <div className="absolute -top-1 -left-1 w-3 h-3 bg-gray-400 rounded"></div>
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-gray-400 rounded"></div>
        
        <div className="relative flex items-center justify-center">
          <span className="mr-2 text-gray-300 text-lg">🎮</span>
          <span className="text-gray-100 text-sm tracking-wider pb-1">BONUS GAMES</span>
          <span className="ml-2 text-gray-300 text-lg">🎰</span>
        </div>
        
        <div className="absolute top-0 right-0 -mt-1 -mr-1 bg-gray-600 text-gray-200 text-xs font-bold px-2 py-1 rounded-bl-lg rounded-tr-lg shadow-sm">PLAYED</div>
      </div>
    );
  }
  
  // Active state with hover effects
  return (
    <Link href="/casino">
      <div className="group relative overflow-hidden bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-500 hover:via-indigo-500 hover:to-blue-500 text-white font-bold py-3 px-6 rounded-xl border-2 border-indigo-400 transform transition duration-200 ease-in-out hover:scale-105 cursor-pointer">
        {/* Corner decorations */}
        <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-yellow-300 rounded"></div>
        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-yellow-300 rounded"></div>
        <div className="absolute -top-1 -left-1 w-3 h-3 bg-yellow-300 rounded"></div>
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-300 rounded"></div>
        
        {/* Shiny effect */}
        <div className="absolute inset-0 w-full h-full opacity-30 bg-gradient-to-r from-transparent via-white to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-all duration-1000 ease-in-out"></div>
        
        {/* Button text */}
        <div className="relative flex items-center justify-center">
          <span className="mr-2 text-yellow-200 text-lg">🎮</span>
          <span className="text-white text-sm tracking-wider pb-1">BONUS GAMES</span>
          <span className="ml-2 text-yellow-200 text-lg">🎰</span>
        </div>
        
        <div className="absolute top-0 right-0 -mt-1 -mr-1 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded-bl-lg rounded-tr-lg shadow-sm">PLAY!</div>
      </div>
    </Link>
  );
}