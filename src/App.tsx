import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, SkipForward, SkipBack, Volume2, VolumeX, Terminal, Skull } from 'lucide-react';
import { motion } from 'motion/react';

const GRID_SIZE = 20;
const INITIAL_SNAKE = [{ x: 10, y: 10 }];
const INITIAL_DIRECTION = { x: 0, y: -1 };
const INITIAL_SPEED = 100;

const TRACKS = [
  { id: 1, title: 'DATA_STREAM_0X1.WAV', src: 'https://actions.google.com/sounds/v1/science_fiction/sci_fi_drone.ogg' },
  { id: 2, title: 'MEM_CORRUPT_A.DAT', src: 'https://actions.google.com/sounds/v1/science_fiction/alien_breath.ogg' },
  { id: 3, title: 'KERNEL_PANIC_99.SYS', src: 'https://actions.google.com/sounds/v1/science_fiction/space_ambience.ogg' }
];

export default function App() {
  const [snake, setSnake] = useState<{ x: number, y: number }[]>(INITIAL_SNAKE);
  const [food, setFood] = useState({ x: 5, y: 5 });
  const [dir, setDir] = useState(INITIAL_DIRECTION);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [isPlayingGame, setIsPlayingGame] = useState(false);
  
  const dirRef = useRef(dir);
  const foodRef = useRef(food);
  const speedRef = useRef(INITIAL_SPEED);

  useEffect(() => { dirRef.current = dir; }, [dir]);
  useEffect(() => { foodRef.current = food; }, [food]);

  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const generateFood = useCallback((currentSnake: {x: number, y: number}[]) => {
    let newFood;
    while (true) {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE)
      };
      // eslint-disable-next-line no-loop-func
      if (!currentSnake.some(segment => segment.x === newFood.x && segment.y === newFood.y)) {
        break;
      }
    }
    return newFood;
  }, []);

  const resetGame = () => {
    setSnake(INITIAL_SNAKE);
    setDir(INITIAL_DIRECTION);
    dirRef.current = INITIAL_DIRECTION;
    speedRef.current = INITIAL_SPEED;
    setFood(generateFood(INITIAL_SNAKE));
    setScore(0);
    setGameOver(false);
    setIsPlayingGame(true);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }

      if (!isPlayingGame && e.key === ' ' && !gameOver) {
        setIsPlayingGame(true);
        return;
      }
      
      if (gameOver && e.key === ' ') {
        resetGame();
        return;
      }

      const { x: dx, y: dy } = dirRef.current;
      
      switch (e.key) {
        case 'ArrowUp':
        case 'w':
          if (dy !== 1) setDir({ x: 0, y: -1 });
          break;
        case 'ArrowDown':
        case 's':
          if (dy !== -1) setDir({ x: 0, y: 1 });
          break;
        case 'ArrowLeft':
        case 'a':
          if (dx !== 1) setDir({ x: -1, y: 0 });
          break;
        case 'ArrowRight':
        case 'd':
          if (dx !== -1) setDir({ x: 1, y: 0 });
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlayingGame, gameOver, generateFood]);

  useEffect(() => {
    if (!isPlayingGame || gameOver) return;

    const moveSnake = () => {
      setSnake(prev => {
        const head = prev[0];
        const newHead = { 
          x: head.x + dirRef.current.x, 
          y: head.y + dirRef.current.y 
        };

        if (
          newHead.x < 0 || newHead.x >= GRID_SIZE || 
          newHead.y < 0 || newHead.y >= GRID_SIZE ||
          prev.some(segment => segment.x === newHead.x && segment.y === newHead.y)
        ) {
          setGameOver(true);
          setIsPlayingGame(false);
          return prev;
        }

        const newSnake = [newHead, ...prev];

        if (newHead.x === foodRef.current.x && newHead.y === foodRef.current.y) {
          setScore(s => {
            const newScore = s + 10;
            if (newScore % 50 === 0) {
                speedRef.current = Math.max(50, speedRef.current - 5);
            }
            return newScore;
          });
          setFood(generateFood(newSnake));
        } else {
          newSnake.pop();
        }

        return newSnake;
      });
    };

    const intervalId = setInterval(moveSnake, speedRef.current);
    return () => clearInterval(intervalId);
  }, [isPlayingGame, gameOver, generateFood]);

  const touchStartRef = useRef<{x: number, y: number} | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
      touchStartRef.current = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY
      };
      if (!isPlayingGame && !gameOver) setIsPlayingGame(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
      if (!touchStartRef.current || !isPlayingGame || gameOver) return;

      const touchEndX = e.touches[0].clientX;
      const touchEndY = e.touches[0].clientY;
      const dx = touchEndX - touchStartRef.current.x;
      const dy = touchEndY - touchStartRef.current.y;

      if (Math.abs(dx) > Math.abs(dy)) {
          if (dx > 30 && dirRef.current.x !== -1) setDir({ x: 1, y: 0 });
          else if (dx < -30 && dirRef.current.x !== 1) setDir({ x: -1, y: 0 });
      } else {
          if (dy > 30 && dirRef.current.y !== -1) setDir({ x: 0, y: 1 });
          else if (dy < -30 && dirRef.current.y !== 1) setDir({ x: 0, y: -1 });
      }

      if (Math.abs(dx) > 30 || Math.abs(dy) > 30) {
          touchStartRef.current = { x: touchEndX, y: touchEndY };
      }
  };

  const handleTouchEnd = () => { touchStartRef.current = null; };

  useEffect(() => {
    if (audioRef.current) {
        audioRef.current.volume = isMuted ? 0 : 0.5;
    }
  }, [isMuted]);

  useEffect(() => {
    if (audioRef.current) {
      if (isPlayingAudio) {
        audioRef.current.play().catch(ev => {
            console.warn('Auto-play caught', ev);
            setIsPlayingAudio(false);
        });
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlayingAudio, currentTrackIndex]);

  const togglePlayAudio = () => setIsPlayingAudio(!isPlayingAudio);
  const nextTrack = () => { setCurrentTrackIndex((prev) => (prev + 1) % TRACKS.length); setIsPlayingAudio(true); };
  const prevTrack = () => { setCurrentTrackIndex((prev) => (prev === 0 ? TRACKS.length - 1 : prev - 1)); setIsPlayingAudio(true); };
  const handleTrackEnded = () => nextTrack();

  return (
    <div 
        className="w-full h-screen bg-[#000] flex flex-col items-center p-4 relative text-[#00FFFF] screen-tear z-0 overflow-hidden font-mono text-[10px] sm:text-xs tracking-widest"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
    >
      <div className="static-noise-bg"></div>
      
      {/* HEADER SECTION */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, x: [-10, 10, -5, 5, 0] }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-2xl flex items-end justify-between mt-4 border-b-4 border-[#FF00FF] pb-4 z-10"
      >
        <div className="flex items-center gap-4">
            <Terminal className="text-[#FF00FF] w-8 h-8 border-2 border-[#00FFFF] p-1 bg-[#000] brutal-shadow-magenta max-sm:hidden" strokeWidth={3} />
            <div className="flex flex-col">
              <span className="text-[#00FFFF] text-[8px] mb-1 opacity-50 tracking-tighter">PROCESS_ID: 0X9A4F</span>
              <h1 className="text-sm sm:text-xl font-bold glitch-text text-[#00FFFF]" data-text="SYS.SNAKE_OVR">
                  SYS.SNAKE_OVR
              </h1>
            </div>
        </div>
        <div className="text-right flex flex-col">
            <span className="text-[8px] text-[#FF00FF] tracking-widest mb-1">ALLOC_MEM //</span>
            <span className="text-lg sm:text-2xl glitch-text text-[#00FFFF]" data-text={score.toString().padStart(4, '0')}>
                {score.toString().padStart(4, '0')}
            </span>
        </div>
      </motion.div>

      {/* GAME AREA */}
      <div className="flex-1 flex items-center justify-center w-full max-w-2xl relative min-h-0 py-8 z-10">
        <div className="bg-[#000] border-4 border-[#00FFFF] brutal-shadow-magenta relative p-1 mix-blend-screen w-full max-w-[400px] aspect-square flex items-center justify-center">
            
            <div 
                className="relative w-full h-full bg-[#050505]"
                style={{ 
                    gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
                    display: 'grid',
                    backgroundImage: 'linear-gradient(rgba(0, 255, 255, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 255, 255, 0.1) 1px, transparent 1px)',
                    backgroundSize: `${100 / GRID_SIZE}% ${100 / GRID_SIZE}%`
                }}
            >
                {snake.map((segment, i) => (
                    <div 
                        key={i}
                        className="absolute border border-[#000] z-10"
                        style={{
                            width: `${100 / GRID_SIZE}%`, 
                            height: `${100 / GRID_SIZE}%`,
                            left: `${(segment.x * 100) / GRID_SIZE}%`,
                            top: `${(segment.y * 100) / GRID_SIZE}%`,
                            backgroundColor: i === 0 ? '#FFFFFF' : '#00FFFF'
                        }}
                    />
                ))}

                <div 
                    className="absolute bg-[#FF00FF] border border-[#000] z-10 animate-pulse"
                    style={{
                        width: `${100 / GRID_SIZE}%`,
                        height: `${100 / GRID_SIZE}%`,
                        left: `${(food.x * 100) / GRID_SIZE}%`,
                        top: `${(food.y * 100) / GRID_SIZE}%`,
                    }}
                />

                {!isPlayingGame && !gameOver && (
                    <div 
                        className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-20 cursor-pointer border-2 border-[#00FFFF]"
                        onClick={() => setIsPlayingGame(true)}
                    >
                        <h2 className="text-base sm:text-lg text-[#FF00FF] glitch-text mb-6" data-text="WAITING_IO...">WAITING_IO...</h2>
                        <p className="text-[#00FFFF] text-[8px] sm:text-[10px] text-center border-2 border-[#00FFFF] p-2 bg-[#00FFFF]/10 tracking-widest hover:bg-[#00FFFF] hover:text-[#000] transition-colors">
                            [EXECUTE: SPACE/TAP]
                        </p>
                    </div>
                )}

                {gameOver && (
                    <div 
                        className="absolute inset-0 bg-[#FF00FF]/20 flex flex-col items-center justify-center z-20 border-4 border-[#FF00FF]"
                    >
                        <Skull className="w-10 h-10 text-[#FF00FF] mb-4 animate-bounce" />
                        <h2 className="text-xl sm:text-2xl font-bold text-[#FF00FF] mb-6 glitch-text" data-text="FATAL_ERR">FATAL_ERR</h2>
                        <button 
                            onClick={resetGame}
                            className="px-4 py-3 bg-[#00FFFF] text-[#000] text-[8px] sm:text-[10px] tracking-widest font-bold hover:bg-[#FF00FF] hover:text-[#000] transition-none border-2 border-[#000]"
                        >
                            REBOOT_SEQ
                        </button>
                    </div>
                )}
            </div>
        </div>
      </div>

      {/* AUDIO PLAYER FOOTER */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.1 }}
        className="w-full max-w-2xl bg-[#000] border-4 border-[#FF00FF] brutal-shadow-cyan p-4 flex flex-col sm:flex-row items-center justify-between gap-6 relative z-10 mt-auto sm:mb-4"
      >
          <div className="flex flex-row items-center gap-4 w-full sm:w-auto">
              <div className="w-12 h-12 border-2 border-[#00FFFF] text-[#FF00FF] flex items-center justify-center font-bold relative overflow-hidden flex-shrink-0 bg-[#00FFFF]/10 text-sm">
                  {isPlayingAudio ? (
                      <motion.div 
                          className="absolute inset-0 bg-[#FF00FF]/50" 
                          animate={{ scaleY: [0.1, 1, 0.4, 0.8, 0.2] }} 
                          transition={{ duration: 0.4, repeat: Infinity }} 
                          style={{ originY: 1 }}
                      />
                  ) : null}
                  <span className="relative z-10 tracking-tighter mix-blend-difference">A{'>'}</span>
              </div>
              <div className="flex flex-col overflow-hidden w-full">
                  <span className="text-[8px] text-[#FF00FF] mb-2">AUDIO_NODE</span>
                  <span className="text-[8px] sm:text-[10px] text-[#00FFFF] glitch-text truncate max-w-[160px] sm:max-w-xs" data-text={TRACKS[currentTrackIndex].title}>
                      {TRACKS[currentTrackIndex].title}
                  </span>
              </div>
          </div>

          <div className="flex items-center gap-4 border-2 border-[#00FFFF] p-2 bg-black shrink-0">
              <button onClick={prevTrack} className="px-2 py-1 hover:bg-[#FF00FF] hover:text-[#000] transition-none text-[#00FFFF]">
                  <SkipBack className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" />
              </button>
              <button 
                  onClick={togglePlayAudio} 
                  className="px-3 py-2 bg-[#00FFFF] text-[#000] hover:bg-[#FF00FF] transition-none"
              >
                  {isPlayingAudio ? <Pause className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" /> : <Play className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" />}
              </button>
              <button onClick={nextTrack} className="px-2 py-1 hover:bg-[#FF00FF] hover:text-[#000] transition-none text-[#00FFFF]">
                  <SkipForward className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" />
              </button>
          </div>

          <div className="absolute right-4 top-4 sm:static shrink-0">
              <button onClick={() => setIsMuted(!isMuted)} className="p-2 border border-transparent hover:border-[#FF00FF] text-[#00FFFF]">
                  {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <audio ref={audioRef} src={TRACKS[currentTrackIndex].src} onEnded={handleTrackEnded} loop={false} />
          </div>

      </motion.div>
    </div>
  );
}

