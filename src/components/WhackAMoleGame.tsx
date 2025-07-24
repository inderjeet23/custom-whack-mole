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
  moles: boolean[];
  holePositions: { x: number; y: number }[];
  difficultyPhase: number; // 0: static, 1: slow, 2: medium, 3: fast
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
  // Generate initial random hole positions with proper collision detection
  const generateHolePositions = () => {
    const positions = [];
    const safeMargin = 120; // Increased margin from edges
    const holeSize = 100; // Hole diameter + spacing buffer
    const minDistance = 120; // Minimum distance between hole centers
    
    for (let i = 0; i < 9; i++) {
      let attempts = 0;
      let position;
      let validPosition = false;
      
      do {
        const maxWidth = window.innerWidth - 2 * safeMargin - 80;
        const maxHeight = window.innerHeight - 2 * safeMargin - 80;
        
        position = {
          x: safeMargin + Math.random() * maxWidth,
          y: safeMargin + Math.random() * maxHeight
        };
        
        // Check distance from all existing positions
        validPosition = positions.every(existingPos => {
          const distance = Math.sqrt(
            Math.pow(position.x - existingPos.x, 2) + 
            Math.pow(position.y - existingPos.y, 2)
          );
          return distance >= minDistance;
        });
        
        attempts++;
      } while (!validPosition && attempts < 100);
      
      // If we can't find a valid position after 100 attempts, use a grid fallback
      if (!validPosition) {
        const gridCols = 3;
        const gridRows = 3;
        const gridIndex = i;
        const col = gridIndex % gridCols;
        const row = Math.floor(gridIndex / gridCols);
        
        position = {
          x: safeMargin + (col * (window.innerWidth - 2 * safeMargin) / gridCols) + 40,
          y: safeMargin + (row * (window.innerHeight - 2 * safeMargin) / gridRows) + 40
        };
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
    moles: Array(9).fill(false),
    holePositions: generateHolePositions(),
    difficultyPhase: 0
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
  const difficultyTimerRef = useRef<NodeJS.Timeout>();
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

  // Move holes to new positions with better collision detection
  const moveHoles = useCallback(() => {
    setGameState(prev => {
      if (!prev.isPlaying) return prev;
      
      // Only generate new positions when game is active
      const newPositions = generateHolePositions();
      return {
        ...prev,
        holePositions: newPositions
      };
    });
  }, []);

  // Update difficulty phase based on time
  const updateDifficulty = useCallback(() => {
    setGameState(prev => {
      if (!prev.isPlaying) return prev;
      
      const timeElapsed = 60 - prev.timeLeft;
      let newPhase = 0;
      
      if (timeElapsed >= 45) newPhase = 3; // Fast movement
      else if (timeElapsed >= 30) newPhase = 2; // Medium movement
      else if (timeElapsed >= 15) newPhase = 1; // Slow movement
      
      return { ...prev, difficultyPhase: newPhase };
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
      moles: Array(9).fill(false),
      holePositions: generateHolePositions(),
      difficultyPhase: 0
    });

    setHitEffects([]);
    setScoreAnimations([]);
    setParticles([]);

    // Clear any existing timers
    if (gameTimerRef.current) clearInterval(gameTimerRef.current);
    if (movementTimerRef.current) clearInterval(movementTimerRef.current);
    if (difficultyTimerRef.current) clearInterval(difficultyTimerRef.current);
    moleTimersRef.current.forEach(timer => timer && clearTimeout(timer));
    moleTimersRef.current = [];

    // Game timer
    gameTimerRef.current = setInterval(() => {
      setGameState(prev => {
        const newTimeLeft = prev.timeLeft - 1;
        if (newTimeLeft <= 0) {
          return { ...prev, timeLeft: 0, isPlaying: false, gameOver: true };
        }
        return { ...prev, timeLeft: newTimeLeft };
      });
    }, 1000);

    // Difficulty update timer
    difficultyTimerRef.current = setInterval(() => {
      updateDifficulty();
    }, 1000);

    // Hole movement timer
    movementTimerRef.current = setInterval(() => {
      const currentState = gameState;
      if (currentState.difficultyPhase > 0) {
        moveHoles();
      }
    }, 3000); // Base movement interval, will be adjusted by difficulty

    // Mole spawning timer
    const spawnInterval = setInterval(() => {
      if (Math.random() < 0.6) { // 60% chance to spawn each cycle
        spawnMole();
      }
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
      if (difficultyTimerRef.current) clearInterval(difficultyTimerRef.current);
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

  // Update movement timer when difficulty changes
  useEffect(() => {
    if (!gameState.isPlaying) return;
    
    if (movementTimerRef.current) {
      clearInterval(movementTimerRef.current);
    }

    if (gameState.difficultyPhase > 0) {
      let interval = 3000; // Base interval
      
      switch (gameState.difficultyPhase) {
        case 1: interval = 4000; break; // Slow
        case 2: interval = 2500; break; // Medium  
        case 3: interval = 1500; break; // Fast
      }
      
      movementTimerRef.current = setInterval(() => {
        moveHoles();
      }, interval);
    }
  }, [gameState.difficultyPhase, gameState.isPlaying, moveHoles]);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (gameTimerRef.current) clearInterval(gameTimerRef
