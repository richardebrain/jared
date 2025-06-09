import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ExternalLink, X } from 'lucide-react';

interface GameWindowProps {
  gameId: string;
  title: string;
  component: React.ComponentType;
  icon: React.ReactNode;
}

interface OpenWindow {
  id: string;
  title: string;
  window: Window;
}

export function GameWindowManager({ gameId, title, component: GameComponent, icon }: GameWindowProps) {
  const [openWindows, setOpenWindows] = useState<OpenWindow[]>([]);

  const openGameWindow = () => {
    // Check if window is already open
    const existingWindow = openWindows.find(w => w.id === gameId);
    if (existingWindow && !existingWindow.window.closed) {
      existingWindow.window.focus();
      return;
    }

    // Create new window
    const newWindow = window.open(
      '',
      `game-${gameId}`,
      'width=1200,height=800,scrollbars=yes,resizable=yes,menubar=no,toolbar=no,location=no,status=no'
    );

    if (!newWindow) {
      alert('Please allow popups for this site to open games in new windows');
      return;
    }

    // Set up the new window
    newWindow.document.title = `${title} - Learning Game`;
    newWindow.document.head.innerHTML = `
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title} - Learning Game</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
          padding: 20px;
        }
        #game-container {
          max-width: 1000px;
          margin: 0 auto;
          background: white;
          border-radius: 12px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.2);
          overflow: hidden;
        }
        .game-header {
          background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
          color: white;
          padding: 20px;
          text-align: center;
        }
        .game-title {
          font-size: 24px;
          font-weight: bold;
          margin-bottom: 8px;
        }
        .game-subtitle {
          opacity: 0.9;
          font-size: 14px;
        }
        .game-content {
          padding: 20px;
        }
        .close-button {
          position: fixed;
          top: 20px;
          right: 20px;
          background: rgba(255,255,255,0.9);
          border: none;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        }
        .close-button:hover {
          background: white;
        }
        /* Mobile responsive styles */
        @media (max-width: 768px) {
          body {
            padding: 10px;
          }
          .game-header {
            padding: 15px;
          }
          .game-title {
            font-size: 20px;
          }
          .game-content {
            padding: 15px;
          }
          .close-button {
            top: 10px;
            right: 10px;
            width: 35px;
            height: 35px;
          }
        }
      </style>
    `;

    newWindow.document.body.innerHTML = `
      <button class="close-button" onclick="window.close()">×</button>
      <div id="game-container">
        <div class="game-header">
          <div class="game-title">${title}</div>
          <div class="game-subtitle">Educational Learning Game</div>
        </div>
        <div class="game-content">
          <div id="game-root"></div>
        </div>
      </div>
    `;

    // Add the window to our tracking
    const windowData: OpenWindow = {
      id: gameId,
      title,
      window: newWindow
    };

    setOpenWindows(prev => [...prev.filter(w => w.id !== gameId), windowData]);

    // Clean up when window closes
    const checkClosed = setInterval(() => {
      if (newWindow.closed) {
        clearInterval(checkClosed);
        setOpenWindows(prev => prev.filter(w => w.id !== gameId));
      }
    }, 1000);

    // Focus the new window
    newWindow.focus();

    // Return the window for the game component to render into
    return newWindow;
  };

  const closeGameWindow = (windowId: string) => {
    const windowData = openWindows.find(w => w.id === windowId);
    if (windowData && !windowData.window.closed) {
      windowData.window.close();
    }
    setOpenWindows(prev => prev.filter(w => w.id !== windowId));
  };

  useEffect(() => {
    // Clean up all windows when component unmounts
    return () => {
      openWindows.forEach(w => {
        if (!w.window.closed) {
          w.window.close();
        }
      });
    };
  }, []);

  const isWindowOpen = openWindows.some(w => w.id === gameId && !w.window.closed);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4">
          <p className="text-gray-600">
            Click the button below to open this game in a new window for the best experience.
          </p>
          
          <div className="flex gap-2">
            <Button 
              onClick={openGameWindow}
              className="flex items-center gap-2"
              disabled={isWindowOpen}
            >
              <ExternalLink className="h-4 w-4" />
              {isWindowOpen ? 'Game Window Open' : 'Open Game Window'}
            </Button>
            
            {isWindowOpen && (
              <Button 
                onClick={() => closeGameWindow(gameId)}
                variant="outline"
                className="flex items-center gap-2"
              >
                <X className="h-4 w-4" />
                Close Window
              </Button>
            )}
          </div>

          {openWindows.length > 0 && (
            <div className="mt-4">
              <h4 className="font-semibold mb-2">Open Game Windows:</h4>
              <div className="space-y-2">
                {openWindows.map(w => (
                  <div key={w.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-sm">{w.title}</span>
                    <Button
                      onClick={() => closeGameWindow(w.id)}
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Hook for games to use the window system
export function useGameWindow(gameId: string) {
  const [gameWindow, setGameWindow] = useState<Window | null>(null);

  const openWindow = () => {
    const newWindow = window.open(
      '',
      `game-${gameId}`,
      'width=1200,height=800,scrollbars=yes,resizable=yes,menubar=no,toolbar=no,location=no,status=no'
    );

    if (newWindow) {
      setGameWindow(newWindow);
      return newWindow;
    }
    return null;
  };

  const closeWindow = () => {
    if (gameWindow && !gameWindow.closed) {
      gameWindow.close();
    }
    setGameWindow(null);
  };

  useEffect(() => {
    return () => {
      if (gameWindow && !gameWindow.closed) {
        gameWindow.close();
      }
    };
  }, [gameWindow]);

  return {
    gameWindow,
    openWindow,
    closeWindow,
    isOpen: gameWindow && !gameWindow.closed
  };
}