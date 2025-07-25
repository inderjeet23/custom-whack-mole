import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Upload, Trophy, RotateCcw } from 'lucide-react';
import moleImage from '@/assets/mole.png';
import { supabase } from '@/integrations/supabase/client';

interface GameState {
  score: number;
  timeLeft: number;
  isPlaying: boolean;
  gameOver: boolean;
  isPaused: boolean;
  moles: boolean[];
  holePositions: { x: number; y: number }[];
}

interface ScoreEntry {
  id: string;
  player_name: string;
  score: number;
  created_at: string;
}

interface HitEffect {
  id: number;
  position: number;
}

interface ScoreAnimation {
  id: number;
  points: number;
}

interface ParticleEffect {
  id: number;
  position: number;
  type: 'star' | 'spark';
}

const WhackAMoleGame: React.FC = () => {
  // Generate initial uniform grid positions for the holes
  const generateInitialGridPositions = () => {
    const positions = [];
    const isMobile = window.innerWidth < 768;
    const safeMargin = isMobile ? 20 : 120;
    const holeSize = 80;
    
    const gridCols = 3;
    const gridRows = 3;
    
    const gridWidth = window.innerWidth - 2 * safeMargin;
    const gridHeight = window.innerHeight - 2 * safeMargin;

    for (let i = 0; i < 9; i++) {
      const col = i % gridCols;
      const row = Math.floor(i / gridCols);
      
      const position = {
        x: safeMargin + (col * gridWidth / gridCols) + (gridWidth / gridCols - holeSize) / 2,
        y: safeMargin + (row * gridHeight / gridRows) + (gridHeight / gridRows - holeSize) / 2
      };
      
      positions.push(position);
    }
    return positions;
  };

  // Generate random hole positions with expansion ratio for smooth area growth
  const generateRandomHolePositions = (expansionRatio: number = 1.0) => {
    const positions = [];
    const isMobile = window.innerWidth < 768;
    const safeMargin = isMobile ? 30 : 120;
    const holeSize = 80;
    // Increased minimum distance to prevent any overlap
    const minDistance = holeSize + 40; // Ensure plenty of space between holes
    
    // Calculate expanded area based on ratio (0.0 = center only, 1.0 = full screen)
    const baseWidth = 400; // Starting area width (increased for better spacing)
    const baseHeight = 400; // Starting area height (increased for better spacing)
    const maxWidth = window.innerWidth - 2 * safeMargin - holeSize;
    const maxHeight = window.innerHeight - 2 * safeMargin - holeSize;
    
    const currentWidth = Math.max(baseWidth, baseWidth + (maxWidth - baseWidth) * expansionRatio);
    const currentHeight = Math.max(baseHeight, baseHeight + (maxHeight - baseHeight) * expansionRatio);
    
    // Center the expanded area
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    const areaLeft = Math.max(safeMargin, centerX - currentWidth / 2);
    const areaTop = Math.max(safeMargin, centerY - currentHeight / 2);

    // Use a more systematic approach with better collision detection
    for (let i = 0; i < 9; i++) {
      let attempts = 0;
      let position;
      let validPosition = false;
      const maxAttempts = 200; // Increased attempts

      do {
        position = {
          x: areaLeft + Math.random() * Math.max(0, currentWidth - holeSize),
          y: areaTop + Math.random() * Math.max(0, currentHeight - holeSize)
        };

        // Enhanced collision detection - check distance from all existing positions
        validPosition = positions.every(existingPos => {
          const distance = Math.sqrt(
            Math.pow(position.x - existingPos.x, 2) +
            Math.pow(position.y - existingPos.y, 2)
          );
          return distance >= minDistance;
        });

        // Also ensure the position is within safe bounds
        if (validPosition) {
          validPosition = position.x >= areaLeft && 
                         position.y >= areaTop &&
                         position.x + holeSize <= areaLeft + currentWidth &&
                         position.y + holeSize <= areaTop + currentHeight;
        }

        attempts++;
      } while (!validPosition && attempts < maxAttempts);

      // Enhanced grid fallback with guaranteed no overlaps
      if (!validPosition) {
        const gridCols = 3;
        const gridRows = 3;
        const gridIndex = i;
        const col = gridIndex % gridCols;
        const row = Math.floor(gridIndex / gridCols);
        
        // Calculate grid cell size ensuring minimum distance
        const cellWidth = currentWidth / gridCols;
        const cellHeight = currentHeight / gridRows;
        
        // Center the hole in its grid cell with padding
        const padding = Math.min(cellWidth, cellHeight) * 0.1; // 10% padding
        
        position = {
          x: areaLeft + (col * cellWidth) + padding + ((cellWidth - 2 * padding - holeSize) / 2),
          y: areaTop + (row * cellHeight) + padding + ((cellHeight - 2 * padding - holeSize) / 2)
        };
        
        // Final safety check for grid positions
        if (positions.some(existingPos => {
          const distance = Math.sqrt(
            Math.pow(position.x - existingPos.x, 2) +
            Math.pow(position.y - existingPos.y, 2)
          );
          return distance < minDistance;
        })) {
          // If even grid position conflicts, offset it
          position.x += (i % 2) * 20;
          position.y += Math.floor(i / 2) * 20;
        }
      }
      
      positions.push(position);
    }
    return positions;
  };
  const [gameState, setGameState] = useState<GameState>({
    score: 0,
    timeLeft: 60,
    isPlaying: false,
    gameOver: false,
    isPaused: false,
    moles: Array(9).fill(false),
    holePositions: generateInitialGridPositions()
  });

  const [customImage, setCustomImage] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showNamePrompt, setShowNamePrompt] = useState(false);
  const [playerName, setPlayerName] = useState('');
  const [hitEffects, setHitEffects] = useState<HitEffect[]>([]);
  const [scoreAnimations, setScoreAnimations] = useState<ScoreAnimation[]>([]);
  const [particles, setParticles] = useState<ParticleEffect[]>([]);
  const [leaderboard, setLeaderboard] = useState<ScoreEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const gameTimerRef = useRef<NodeJS.Timeout>();
  const moleTimersRef = useRef<NodeJS.Timeout[]>([]);
  const movementTimerRef = useRef<NodeJS.Timeout>();
  const effectIdRef = useRef(0);
  const objectUrlRef = useRef<string | null>(null);

  // Load leaderboard from Supabase
  const loadLeaderboard = async () => {
    try {
      const { data, error } = await supabase
        .from('leaderboard')
        .select('*')
        .order('score', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Error loading leaderboard:', error);
        toast.error('Failed to load leaderboard');
        return;
      }

      setLeaderboard(data || []);
    } catch (error) {
      console.error('Error loading leaderboard:', error);
      toast.error('Failed to load leaderboard');
    }
  };

  // Add score to Supabase leaderboard
  const addToLeaderboard = async (name: string, score: number) => {
    try {
      setIsLoading(true);
      const { error } = await supabase
        .from('leaderboard')
        .insert({
          player_name: name,
          score: score,
          game_duration: 60
        });

      if (error) {
        console.error('Error adding to leaderboard:', error);
        toast.error('Failed to save score');
        return;
      }

      toast.success('Score saved to leaderboard!');
      // Reload leaderboard to show updated scores
      await loadLeaderboard();
    } catch (error) {
      console.error('Error adding to leaderboard:', error);
      toast.error('Failed to save score');
    } finally {
      setIsLoading(false);
    }
  };

  // Check if score qualifies for leaderboard
  const isTopScore = (score: number): boolean => {
    if (leaderboard.length < 10) return true; // Less than 10 entries, always qualify
    return score > leaderboard[leaderboard.length - 1].score;
  };

  // Handle image upload
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Please upload a valid image file.');
        return;
      }
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error('Image file must be smaller than 5MB');
        return;
      }

      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }

      const url = URL.createObjectURL(file);
      objectUrlRef.current = url;
      setPreviewImage(url);
      setCustomImage(url);
      toast.success('Custom image uploaded!');
    }
  };


  // Clear uploaded image
  const clearCustomImage = () => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    setCustomImage(null);
    setPreviewImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    toast.success('Using default mole image');
  };

  // Toggle pause function
  const togglePause = () => {
    setGameState(prev => ({
      ...prev,
      isPaused: !prev.isPaused
    }));
  };

  // Move holes to new positions with expansion ratio
  const moveHoles = useCallback((expansionRatio: number = 1.0) => {
    setGameState(prev => {
      if (!prev.isPlaying || prev.isPaused) return prev;
      
      const newPositions = generateRandomHolePositions(expansionRatio);
      return {
        ...prev,
        holePositions: newPositions
      };
    });
  }, []);

  // Spawn a mole at random position
  const spawnMole = useCallback(() => {
    setGameState(prev => {
      if (!prev.isPlaying) return prev;

      const availableHoles = prev.moles
        .map((mole, index) => !mole ? index : -1)
        .filter(index => index !== -1);

      if (availableHoles.length === 0) return prev;

      const randomHole = availableHoles[Math.floor(Math.random() * availableHoles.length)];
      const popDuration = Math.random() * 1000 + 1000; // 1-2 seconds

      // Hide mole after pop duration
      const timer = setTimeout(() => {
        setGameState(current => ({
          ...current,
          moles: current.moles.map((mole, index) => index === randomHole ? false : mole)
        }));
      }, popDuration);

      moleTimersRef.current[randomHole] = timer;

      return {
        ...prev,
        moles: prev.moles.map((mole, index) => index === randomHole ? true : mole)
      };
    });
  }, []);

  // Hit a mole
  const hitMole = (position: number) => {
    if (!gameState.moles[position] || !gameState.isPlaying) return;

    // Clear the timer for this mole
    if (moleTimersRef.current[position]) {
      clearTimeout(moleTimersRef.current[position]);
    }

    // Hide the mole
    setGameState(prev => ({
      ...prev,
      score: prev.score + 10,
      moles: prev.moles.map((mole, index) => index === position ? false : mole)
    }));

    // Add hit effect
    const effectId = effectIdRef.current++;
    setHitEffects(prev => [...prev, { id: effectId, position }]);
    setTimeout(() => {
      setHitEffects(prev => prev.filter(effect => effect.id !== effectId));
    }, 400);

    // Add particle effects
    const particleId1 = effectIdRef.current++;
    const particleId2 = effectIdRef.current++;
    setParticles(prev => [
      ...prev, 
      { id: particleId1, position, type: 'star' },
      { id: particleId2, position, type: 'spark' }
    ]);
    setTimeout(() => {
      setParticles(prev => prev.filter(p => p.id !== particleId1 && p.id !== particleId2));
    }, 600);

    // Add score animation to scoreboard
    const animationId = effectIdRef.current++;
    setScoreAnimations(prev => [...prev, { id: animationId, points: 10 }]);
    setTimeout(() => {
      setScoreAnimations(prev => prev.filter(anim => anim.id !== animationId));
    }, 800);
  };

  // Start the game
  const startGame = () => {
    setGameState({
      score: 0,
      timeLeft: 60,
      isPlaying: true,
      gameOver: false,
      isPaused: false,
      moles: Array(9).fill(false),
      holePositions: generateInitialGridPositions()
    });

    setHitEffects([]);
    setScoreAnimations([]);
    setParticles([]);

    // Clear any existing timers
    if (gameTimerRef.current) clearInterval(gameTimerRef.current);
    if (movementTimerRef.current) clearInterval(movementTimerRef.current);
    moleTimersRef.current.forEach(timer => timer && clearTimeout(timer));
    moleTimersRef.current = [];

    // Game timer with pause support and continuous expansion
    gameTimerRef.current = setInterval(() => {
      setGameState(prev => {
        if (prev.isPaused) return prev;
        
        const newTimeLeft = prev.timeLeft - 1;
        if (newTimeLeft <= 0) {
          return { ...prev, timeLeft: 0, isPlaying: false, gameOver: true };
        }
        
        // Calculate expansion ratio (0.0 to 1.0)
        const expansionRatio = (60 - newTimeLeft) / 60;
        
        // Update hole positions with smooth expansion
        const newPositions = generateRandomHolePositions(expansionRatio);
        
        return { 
          ...prev, 
          timeLeft: newTimeLeft,
          holePositions: newPositions
        };
      });
    }, 1000);

    // Mole spawning timer with pause support
    const spawnInterval = setInterval(() => {
      setGameState(prev => {
        if (prev.isPaused) return prev;
        if (Math.random() < 0.6) { // 60% chance to spawn each cycle
          spawnMole();
        }
        return prev;
      });
    }, 800);

    moleTimersRef.current.push(spawnInterval);

    toast.success('Game started! Whack those moles!');
  };

  // End game
  useEffect(() => {
    if (gameState.gameOver && gameState.score > 0) {
      // Clear all timers
      if (gameTimerRef.current) clearInterval(gameTimerRef.current);
      if (movementTimerRef.current) clearInterval(movementTimerRef.current);
      moleTimersRef.current.forEach(timer => timer && clearTimeout(timer));

      // Check if it's a high score
      if (isTopScore(gameState.score)) {
        setShowNamePrompt(true);
      }
    }
  }, [gameState.gameOver, gameState.score]);

  // Handle name submission
  const handleNameSubmit = async () => {
    if (playerName.trim()) {
      await addToLeaderboard(playerName.trim(), gameState.score);
      setShowNamePrompt(false);
      setPlayerName('');
      setShowLeaderboard(true);
    }
  };

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (gameTimerRef.current) clearInterval(gameTimerRef.current);
      if (movementTimerRef.current) clearInterval(movementTimerRef.current);
      moleTimersRef.current.forEach(timer => timer && clearTimeout(timer));
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }
    };
  }, []);


  // Load leaderboard on component mount
  useEffect(() => {
    loadLeaderboard();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-sky flex flex-col">
      {/* Game UI - Hidden during gameplay */}
      {!gameState.isPlaying && (
        <div className="p-4 flex flex-col items-center">
          <div className="w-full max-w-md">
            {/* Header */}
            <Card className="mb-4 shadow-card-game animate-bounce-in border-primary/20">
              <CardContent className="p-4 text-center">
                <h1 className="text-3xl font-bold text-primary mb-2">Welcome To Whack-A-Mole!</h1>
                <p className="text-muted-foreground">Hit the moles before they disappear!</p>
              </CardContent>
            </Card>

            {/* Custom Image Upload */}
            <Card className="mb-4 shadow-card-game border-secondary/20">
              <CardContent className="p-4">
                <Label className="text-sm font-semibold text-foreground mb-2 block">
                  Custom Mole Image (Optional)
                </Label>
                
                {previewImage ? (
                  <div className="text-center">
                    <img 
                      src={previewImage} 
                      alt="Custom mole preview" 
                      className="w-16 h-16 object-cover rounded-lg mx-auto mb-2 border-2 border-primary shadow-mole"
                    />
                    <div className="flex gap-2 justify-center">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => fileInputRef.current?.click()}
                        className="border-primary/30 hover:bg-primary/10"
                      >
                        <Upload className="w-4 h-4 mr-1" />
                        Change
                      </Button>
                      <Button 
                        variant="destructive" 
                        size="sm" 
                        onClick={clearCustomImage}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button 
                    variant="outline" 
                    className="w-full border-primary/30 hover:bg-primary/10"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Custom Image
                  </Button>
                )}
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Game Stats - Always visible but positioned for gameplay */}
      <div className={`w-full max-w-md ${gameState.isPlaying ? 'fixed top-4 left-1/2 transform -translate-x-1/2 z-20' : 'px-4'} ${!gameState.isPlaying ? 'mx-auto' : ''}`}>
        <Card className="mb-4 shadow-card-game border-primary/20 bg-card/95 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex justify-between items-center relative">
              <div className="text-center">
                <div className="relative">
                  <p className="text-2xl font-bold text-primary">
                    {gameState.score}
                  </p>
                  {/* Score animations */}
                  {scoreAnimations.map(anim => (
                    <div 
                      key={anim.id}
                      className="absolute -top-8 left-1/2 transform -translate-x-1/2 pointer-events-none animate-score-popup"
                    >
                      <span className="text-accent font-bold text-lg drop-shadow-lg">
                        +{anim.points}
                      </span>
                    </div>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground">Score</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-secondary">
                  {gameState.timeLeft}s
                </p>
                <p className="text-sm text-muted-foreground">Time Left</p>
              </div>
              {gameState.isPlaying && (
                <div className="text-center">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={togglePause}
                    className="border-primary/30 hover:bg-primary/10"
                  >
                    {gameState.isPaused ? 'Resume' : 'Pause'}
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Game Controls - Hidden during gameplay */}
      {!gameState.isPlaying && (
        <div className="px-4 flex flex-col items-center">
          <div className="w-full max-w-md">
            <div className="flex gap-2 mb-6">
              <Button 
                onClick={startGame} 
                disabled={gameState.isPlaying}
                className="flex-1 bg-gradient-grass text-white shadow-lg hover:shadow-xl transition-shadow"
              >
                {gameState.isPlaying ? 'Playing...' : 'Start Game'}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  loadLeaderboard();
                  setShowLeaderboard(true);
                }}
                className="border-primary/30 hover:bg-primary/10"
              >
                <Trophy className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Game Board - Only show holes during gameplay */}
      {gameState.isPlaying && (
        <div className="fixed inset-0 pointer-events-none z-10">
          {gameState.moles.map((hasMole, index) => {
            // Calculate safe boundaries to avoid scoreboard
            const safeTop = 140; // Leave space for fixed scoreboard during gameplay
            const safeBottom = 80; // Leave space for bottom
            const safeLeft = 20;
            const safeRight = 20;
            
            const position = gameState.holePositions[index];
            
            // Ensure holes don't cover the scoreboard area
            const adjustedY = position 
              ? Math.max(safeTop, Math.min(position.y, window.innerHeight - safeBottom - 80))
              : safeTop;
            
            const adjustedX = position
              ? Math.max(safeLeft, Math.min(position.x, window.innerWidth - safeRight - 80))
              : safeLeft;
            
            return (
              <div 
                key={index} 
                className="absolute transition-all duration-1000 ease-in-out pointer-events-auto"
                style={{
                  left: `${adjustedX}px`,
                  top: `${adjustedY}px`,
                }}
              >
                {/* Enhanced Hole with realistic depth */}
                <div className="w-20 h-20 rounded-full bg-gradient-hole shadow-hole border-4 border-secondary/20 relative overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-hole animate-hole-depth">
                  
                  {/* Mole with anticipation animation */}
                  {hasMole && (
                    <div 
                      className="absolute inset-0 flex items-center justify-center animate-mole-pop cursor-pointer"
                      onClick={() => hitMole(index)}
                    >
                      <img 
                        src={customImage || moleImage}
                        alt="Mole"
                        className="w-16 h-16 object-cover rounded-full shadow-mole hover:animate-wiggle transition-all duration-200"
                      />
                    </div>
                  )}

                  {/* Enhanced Hit Effect with glow */}
                  {hitEffects.some(effect => effect.position === index) && (
                    <div className="absolute inset-0 pointer-events-none">
                      <div className="w-full h-full rounded-full bg-accent/80 animate-hit-effect shadow-hit-effect" />
                    </div>
                  )}

                  {/* Particle Effects */}
                  {particles.filter(p => p.position === index).map(particle => (
                    <div key={particle.id} className="absolute inset-0 pointer-events-none">
                      {particle.type === 'star' ? (
                        <div className="absolute top-2 left-2 text-accent animate-sparkle text-xl">тнР</div>
                      ) : (
                        <div className="absolute top-1 right-2 w-2 h-2 bg-accent rounded-full animate-particle-burst shadow-particle" />
                      )}
                    </div>
                  ))}
                </div>
                
              </div>
            );
          })}
        </div>
      )}

      {/* Pause Overlay */}
      {gameState.isPlaying && gameState.isPaused && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-30">
          <Card className="shadow-card-game animate-bounce-in border-primary/20 bg-card/95 backdrop-blur-sm">
            <CardContent className="p-6 text-center">
              <h2 className="text-3xl font-bold text-primary mb-4">Paused</h2>
              <p className="text-muted-foreground mb-4">Click Resume to continue playing</p>
              <Button 
                onClick={togglePause}
                className="bg-gradient-grass text-white shadow-lg hover:shadow-xl transition-shadow"
              >
                Resume Game
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Game Over Message */}
      {gameState.gameOver && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-30">
          <Card className="shadow-card-game animate-bounce-in border-primary/20 bg-card/95 backdrop-blur-sm">
            <CardContent className="p-6 text-center">
              <h2 className="text-2xl font-bold text-primary mb-2">Game Over!</h2>
              <p className="text-lg text-secondary font-semibold mb-2">
                Final Score: {gameState.score}
              </p>
              <p className="text-muted-foreground mb-4">
                {gameState.score >= 100 ? 'Excellent work!' : 
                 gameState.score >= 50 ? 'Good job!' : 'Keep practicing!'}
              </p>
              <Button onClick={startGame} className="bg-gradient-grass text-white shadow-lg hover:shadow-xl transition-shadow">
                <RotateCcw className="w-4 h-4 mr-2" />
                Play Again
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Name Prompt Dialog */}
      <Dialog open={showNamePrompt} onOpenChange={setShowNamePrompt}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>High Score!</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-center">
              Congratulations! You scored <span className="font-bold text-accent">{gameState.score}</span> points!
            </p>
            <p className="text-center text-muted-foreground">
              Enter your name for the leaderboard:
            </p>
            <Input
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Your name"
              maxLength={20}
              onKeyPress={(e) => e.key === 'Enter' && handleNameSubmit()}
            />
            <div className="flex gap-2">
            <Button 
              onClick={handleNameSubmit}
              disabled={!playerName.trim() || isLoading}
              className="flex-1"
            >
                {isLoading ? 'Saving...' : 'Save Score'}
              </Button>
              <Button 
                variant="outline"
                onClick={() => setShowNamePrompt(false)}
              >
                Skip
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Leaderboard Dialog */}
      <Dialog open={showLeaderboard} onOpenChange={setShowLeaderboard}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ЁЯПЖ Leaderboard</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2" />
                <p className="text-muted-foreground">Loading scores...</p>
              </div>
            ) : leaderboard.length > 0 ? (
              leaderboard.map((entry, index) => (
                <div 
                  key={entry.id}
                  className="flex justify-between items-center p-3 rounded-lg bg-muted"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-accent">
                      #{index + 1}
                    </span>
                    <span className="font-semibold">{entry.player_name}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-primary">{entry.score}</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(entry.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-8">
                No scores yet. Be the first to play!
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WhackAMoleGame;
