import React, { useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';

interface GameRendererProps {
  gameWindow: Window;
  gameComponent: React.ComponentType;
  title: string;
}

export function GameRenderer({ gameWindow, gameComponent: GameComponent, title }: GameRendererProps) {
  const mountedRef = useRef(false);

  useEffect(() => {
    if (!gameWindow || gameWindow.closed || mountedRef.current) return;

    const gameRoot = gameWindow.document.getElementById('game-root');
    if (!gameRoot) return;

    // Create React root and render the game
    const root = createRoot(gameRoot);
    root.render(<GameComponent />);
    mountedRef.current = true;

    // Copy styles from parent window
    const parentStyles = Array.from(document.head.querySelectorAll('style, link[rel="stylesheet"]'));
    parentStyles.forEach(style => {
      const clonedStyle = style.cloneNode(true) as HTMLElement;
      gameWindow.document.head.appendChild(clonedStyle);
    });

    // Add additional game-specific styles
    const gameStyles = gameWindow.document.createElement('style');
    gameStyles.textContent = `
      /* Ensure game content is properly contained */
      #game-root {
        width: 100%;
        height: 100%;
      }
      
      /* Override any conflicting styles */
      .game-content {
        overflow: visible;
      }
      
      /* Ensure mobile controls work in new window */
      @media (max-width: 768px) {
        .mobile-controls {
          position: fixed;
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 1000;
        }
      }
    `;
    gameWindow.document.head.appendChild(gameStyles);

    // Handle window close cleanup
    const handleBeforeUnload = () => {
      root.unmount();
      mountedRef.current = false;
    };

    gameWindow.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      if (!gameWindow.closed) {
        gameWindow.removeEventListener('beforeunload', handleBeforeUnload);
        root.unmount();
      }
      mountedRef.current = false;
    };
  }, [gameWindow, GameComponent, title]);

  return null; // This component doesn't render anything in the parent window
}

// Utility function to open a game in a new window
export function openGameInWindow(
  gameComponent: React.ComponentType,
  title: string,
  gameId: string
): Window | null {
  const newWindow = window.open(
    '',
    `game-${gameId}`,
    'width=1200,height=800,scrollbars=yes,resizable=yes,menubar=no,toolbar=no,location=no,status=no'
  );

  if (!newWindow) {
    alert('Please allow popups for this site to open games in new windows');
    return null;
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
        min-height: calc(100vh - 40px);
      }
      .game-header {
        background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
        color: white;
        padding: 20px;
        text-align: center;
        position: relative;
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
        min-height: 600px;
      }
      .close-button {
        position: absolute;
        top: 15px;
        right: 15px;
        background: rgba(255,255,255,0.2);
        border: none;
        border-radius: 50%;
        width: 35px;
        height: 35px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 18px;
        color: white;
        transition: background-color 0.2s;
      }
      .close-button:hover {
        background: rgba(255,255,255,0.3);
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
        #game-container {
          min-height: calc(100vh - 20px);
        }
      }
    </style>
  `;

  newWindow.document.body.innerHTML = `
    <div id="game-container">
      <div class="game-header">
        <button class="close-button" onclick="window.close()">×</button>
        <div class="game-title">${title}</div>
        <div class="game-subtitle">Educational Learning Game</div>
      </div>
      <div class="game-content">
        <div id="game-root"></div>
      </div>
    </div>
  `;

  // Focus the new window
  newWindow.focus();

  return newWindow;
}