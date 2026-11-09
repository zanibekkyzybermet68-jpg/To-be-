import React, { useState, useEffect } from 'react';
import {
  Volume2,
  Sparkles,
  Flame,
  Zap,
  Target,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Trophy,
  X,
  ArrowRight,
  RotateCcw,
} from 'lucide-react';
import {
  BALLOON_QUESTIONS,
  GOLDEN_QUESTIONS,
  SPEED_RUSH_QUESTIONS,
  BOSS_QUESTIONS,
  CARTOON_FLOAT_REACTIONS,
  CARTOON_WRONG_REACTIONS,
  PlayerStats,
} from '../data/questions';
import { soundEngine } from '../utils/soundEngine';

interface BalloonPopViewProps {
  playerStats: PlayerStats;
  onUpdateBalloonRewards: (deltaCoins: number, deltaStars: number, goldenSolvedDelta?: number) => void;
  onTriggerGoldenFireworks: () => void;
}

type BalloonArenaMode = 'balloon' | 'speed' | 'practice' | 'boss';

export const BalloonPopView: React.FC<BalloonPopViewProps> = ({
  playerStats,
  onUpdateBalloonRewards,
  onTriggerGoldenFireworks,
}) => {
  const [arenaMode, setArenaMode] = useState<BalloonArenaMode>('balloon');

  // Balloon Pop Quest state
  const [balloonIdx, setBalloonIdx] = useState<number>(0);
  const [streak, setStreak] = useState<number>(0);
  const [goldenMeter, setGoldenMeter] = useState<number>(0);
  const [selectedChoice, setSelectedChoice] = useState<number | null>(null);
  const [wrongBalloonIdx, setWrongBalloonIdx] = useState<number | null>(null);
  const [floatAnimKey, setFloatAnimKey] = useState<number>(0);

  // Comic Speech Bubble state
  const [comicBubble, setComicBubble] = useState<{
    category: string;
    text: string;
    isWrong: boolean;
  }>({
    category: 'Cartoon Voice',
    text: 'Wheee! Pop the right verb!',
    isWrong: false,
  });

  // Golden Bonus Modal state
  const [showGoldenModal, setShowGoldenModal] = useState<boolean>(false);
  const [goldenIdx, setGoldenIdx] = useState<number>(0);
  const [goldenFeedback, setGoldenFeedback] = useState<{
    isCorrect: boolean;
    message: string;
  } | null>(null);

  // Treasure Room Modal state
  const [showTreasureModal, setShowTreasureModal] = useState<boolean>(false);

  // 30s Speed Rush state
  const [speedRunning, setSpeedRunning] = useState<boolean>(false);
  const [speedTimeLeft, setSpeedTimeLeft] = useState<number>(30);
  const [speedScore, setSpeedScore] = useState<number>(0);
  const [speedIdx, setSpeedIdx] = useState<number>(0);
  const [speedSummary, setSpeedSummary] = useState<string | null>(null);

  // Free Practice state
  const [practiceIdx, setPracticeIdx] = useState<number>(0);
  const [practicePicked, setPracticePicked] = useState<number | null>(null);

  // Boss Battle state
  const [bossHp, setBossHp] = useState<number>(100);
  const [bossIdx, setBossIdx] = useState<number>(0);
  const [bossFeedback, setBossFeedback] = useState<{
    isCorrect: boolean;
    text: string;
  } | null>(null);

  const currentBalloonQ = BALLOON_QUESTIONS[balloonIdx % BALLOON_QUESTIONS.length];
  const currentGoldenQ = GOLDEN_QUESTIONS[goldenIdx % GOLDEN_QUESTIONS.length];
  const currentSpeedQ = SPEED_RUSH_QUESTIONS[speedIdx % SPEED_RUSH_QUESTIONS.length];
  const currentPracticeQ = BALLOON_QUESTIONS[practiceIdx % BALLOON_QUESTIONS.length];
  const currentBossQ = BOSS_QUESTIONS[bossIdx % BOSS_QUESTIONS.length];

  // Speed Rush Timer
  useEffect(() => {
    if (!speedRunning) return;
    const timer = setInterval(() => {
      setSpeedTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setSpeedRunning(false);
          soundEngine.playGoldenPopSound();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [speedRunning]);

  useEffect(() => {
    if (!speedRunning && speedTimeLeft === 0 && speedScore > 0) {
      onUpdateBalloonRewards(speedScore, Math.max(1, Math.floor(speedScore / 20)));
      setSpeedSummary(
        `Time is up! You scored ${speedScore} points and earned +${speedScore} Gold Coins!`
      );
    }
  }, [speedRunning, speedTimeLeft, speedScore, onUpdateBalloonRewards]);

  const triggerWhooshAndVoice = () => {
    soundEngine.playCartoonWhooshSound();
    const item = CARTOON_FLOAT_REACTIONS[(balloonIdx + floatAnimKey) % CARTOON_FLOAT_REACTIONS.length];
    setTimeout(() => {
      soundEngine.playCartoonVocalChirp(item.pattern);
      soundEngine.speak(item.speech, 1.5, 1.2);
    }, 140);
    setComicBubble({
      category: 'Cartoon Voice',
      text: item.text,
      isWrong: false,
    });
    setFloatAnimKey((k) => k + 1);
  };

  const triggerWrongBalloonReaction = (idx: number) => {
    setWrongBalloonIdx(idx);
    const wrongItem = CARTOON_WRONG_REACTIONS[(balloonIdx + idx) % CARTOON_WRONG_REACTIONS.length];
    if (wrongItem.soundType === 'boing') soundEngine.playCartoonBoingSound();
    else if (wrongItem.soundType === 'womp') soundEngine.playCartoonWompWompSound();
    else if (wrongItem.soundType === 'deflate') soundEngine.playCartoonDeflateRaspSound();
    else soundEngine.playCartoonQuackSound();

    soundEngine.speak(wrongItem.speech, 1.55, 1.2);
    setComicBubble({
      category: 'Oops! Try Again',
      text: wrongItem.text,
      isWrong: true,
    });
    setTimeout(() => {
      setWrongBalloonIdx(null);
    }, 1100);
  };

  const handleBalloonChoice = (idx: 0 | 1) => {
    if (selectedChoice !== null) return;
    setSelectedChoice(idx);

    if (idx === currentBalloonQ.correctIndex) {
      soundEngine.playPopSound();
      soundEngine.playCorrect();
      const nextMeter = goldenMeter + 1;
      setStreak((s) => s + 1);
      setGoldenMeter(nextMeter);
      onUpdateBalloonRewards(10, 1, 0);
      setComicBubble({
        category: 'Pop-tastic!',
        text: `Correct! "${currentBalloonQ.choices[idx]}" matches "${currentBalloonQ.subject}" (+10 Coins)`,
        isWrong: false,
      });
      if (nextMeter >= 3) {
        setTimeout(() => soundEngine.playGoldenPopSound(), 250);
      }
    } else {
      setStreak(0);
      triggerWrongBalloonReaction(idx);
    }
  };

  const handleNextBalloonQuestion = () => {
    setSelectedChoice(null);
    setWrongBalloonIdx(null);
    setBalloonIdx((i) => (i + 1) % BALLOON_QUESTIONS.length);
    triggerWhooshAndVoice();
  };

  const handleOpenGoldenModal = () => {
    soundEngine.playGoldenPopSound();
    setGoldenFeedback(null);
    setShowGoldenModal(true);
    soundEngine.speak(currentGoldenQ.sentence.replace('______', 'blank'));
  };

  const handleGoldenAnswer = (choiceIdx: 0 | 1) => {
    if (goldenFeedback?.isCorrect) return;
    if (choiceIdx === currentGoldenQ.correctIndex) {
      soundEngine.playGoldenPopSound();
      const newGoldenTotal = playerStats.goldenBalloonsMastered + 1;
      onUpdateBalloonRewards(50, 3, 1);
      setGoldenMeter(0);
      setGoldenFeedback({
        isCorrect: true,
        message: `JACKPOT! +50 Gold Coins & +3 Stars! ${currentGoldenQ.explanation}`,
      });
      setTimeout(() => {
        setShowGoldenModal(false);
        setGoldenFeedback(null);
        setGoldenIdx((i) => (i + 1) % GOLDEN_QUESTIONS.length);
        if (newGoldenTotal >= 5 && newGoldenTotal % 5 === 0) {
          onTriggerGoldenFireworks();
        }
      }, 1600);
    } else {
      soundEngine.playCartoonWompWompSound();
      setGoldenFeedback({
        isCorrect: false,
        message: `Almost! ${currentGoldenQ.explanation}`,
      });
    }
  };

  const startSpeedRushGame = () => {
    soundEngine.playClick();
    setSpeedScore(0);
    setSpeedTimeLeft(30);
    setSpeedIdx(0);
    setSpeedSummary(null);
    setSpeedRunning(true);
  };

  const handleSpeedAnswer = (choiceIdx: 0 | 1) => {
    if (!speedRunning) return;
    if (choiceIdx === currentSpeedQ.correctIndex) {
      soundEngine.playPopSound();
      setSpeedScore((s) => s + 15);
    } else {
      soundEngine.playCartoonBoingSound();
    }
    setSpeedIdx((i) => i + 1);
  };

  const handleBossStrike = (choice: string) => {
    if (bossHp <= 0) return;
    if (choice === currentBossQ.correct) {
      soundEngine.playGoldenPopSound();
      const nextHp = Math.max(0, bossHp - 20);
      setBossHp(nextHp);
      setBossFeedback({
        isCorrect: true,
        text: `CRITICAL GRAMMAR HIT (-20 HP)! ${currentBossQ.explanation}`,
      });
      onUpdateBalloonRewards(20, 1, 0);
      if (nextHp === 0) {
        onTriggerGoldenFireworks();
      }
    } else {
      soundEngine.playCartoonWompWompSound();
      setBossFeedback({
        isCorrect: false,
        text: `SHIELD DEFLECTED! ${currentBossQ.explanation}`,
      });
    }
  };

  const sentenceParts = currentBalloonQ.sentence.split('______');
  const fiveGoldenProgress = Math.min(playerStats.goldenBalloonsMastered, 5);

  return (
    <div className="w-full py-2">
      {/* Sub-Navigation & Sound FX Quick Audition Bar */}
      <div className="bg-[#0f1123] border border-[#1f2444] rounded-2xl p-4 mb-6 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        {/* Arena Mode Selector Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-[#080915] rounded-xl border border-[#1f2444]">
          <button
            onClick={() => {
              soundEngine.playClick();
              setArenaMode('balloon');
            }}
            className={`px-3.5 py-2 rounded-lg text-xs font-mono font-bold transition-colors cursor-pointer whitespace-nowrap ${
              arenaMode === 'balloon'
                ? 'bg-amber-400 text-slate-950'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            Balloon Pop Quest
          </button>
          <button
            onClick={() => {
              soundEngine.playClick();
              setArenaMode('speed');
            }}
            className={`px-3.5 py-2 rounded-lg text-xs font-mono font-bold transition-colors cursor-pointer whitespace-nowrap ${
              arenaMode === 'speed'
                ? 'bg-cyan-400 text-slate-950'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            30s Speed Rush
          </button>
          <button
            onClick={() => {
              soundEngine.playClick();
              setArenaMode('practice');
            }}
            className={`px-3.5 py-2 rounded-lg text-xs font-mono font-bold transition-colors cursor-pointer whitespace-nowrap ${
              arenaMode === 'practice'
                ? 'bg-emerald-400 text-slate-950'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            Free Practice
          </button>
          <button
            onClick={() => {
              soundEngine.playClick();
              setArenaMode('boss');
            }}
            className={`px-3.5 py-2 rounded-lg text-xs font-mono font-bold transition-colors cursor-pointer whitespace-nowrap ${
              arenaMode === 'boss'
                ? 'bg-rose-500 text-white'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            Professor Verb Boss
          </button>
        </div>

        {/* Direct SFX & Prototype Feature Triggers */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={triggerWhooshAndVoice}
            className="px-3 py-1.5 rounded-lg bg-[#080915] hover:bg-slate-800 border border-[#1f2444] text-xs font-mono text-cyan-300 transition-colors cursor-pointer whitespace-nowrap"
          >
            Whoosh &ldquo;Wheee!&rdquo; SFX
          </button>
          <button
            onClick={() => triggerWrongBalloonReaction(1)}
            className="px-3 py-1.5 rounded-lg bg-[#080915] hover:bg-slate-800 border border-[#1f2444] text-xs font-mono text-rose-300 transition-colors cursor-pointer whitespace-nowrap"
          >
            Wrong Balloon SFX
          </button>
          <button
            onClick={handleOpenGoldenModal}
            className="px-3 py-1.5 rounded-lg bg-amber-400/15 hover:bg-amber-400/25 border border-amber-400/40 text-xs font-mono text-amber-300 transition-colors cursor-pointer whitespace-nowrap"
          >
            Bonus Golden Balloon
          </button>
          <button
            onClick={() => setShowTreasureModal(true)}
            className="px-3 py-1.5 rounded-lg bg-purple-500/15 hover:bg-purple-500/25 border border-purple-400/40 text-xs font-mono text-purple-200 transition-colors cursor-pointer whitespace-nowrap"
          >
            Treasure Room ({playerStats.coins} Coins)
          </button>
        </div>
      </div>

      {/* ==================== MODE 1: BALLOON POP QUEST ==================== */}
      {arenaMode === 'balloon' && (
        <div className="space-y-5">
          {/* Top Progress & Golden Balloon Meter Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Golden Bonus Meter (3 Pops) */}
            <div className="bg-[#0f1123] border border-[#1f2444] rounded-2xl p-4 flex items-center justify-between gap-4">
              <div>
                <div className="text-xs font-mono text-amber-300">
                  GOLDEN BALLOON METER · +50 COINS & +3 STARS
                </div>
                <div className="text-sm font-bold text-white mt-0.5">
                  {goldenMeter >= 3
                    ? 'Bonus Golden Balloon Ready! Pop it below!'
                    : `Pop ${3 - goldenMeter} more correct balloon${3 - goldenMeter === 1 ? '' : 's'} to spawn Golden Bonus`}
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <div className="w-28 h-3 bg-[#080915] rounded-full overflow-hidden border border-amber-400/30 p-0.5">
                  <div
                    className="h-full bg-gradient-to-r from-amber-400 to-yellow-300 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, (goldenMeter / 3) * 100)}%` }}
                  />
                </div>
                <span className="font-mono font-bold text-xs text-amber-300 tabular-nums">
                  {Math.min(goldenMeter, 3)} / 3
                </span>
              </div>
            </div>

            {/* 5-Golden Balloon Fireworks Grand Slam Tracker */}
            <div className="bg-[#0f1123] border border-[#1f2444] rounded-2xl p-4 flex items-center justify-between gap-4">
              <div>
                <div className="text-xs font-mono text-purple-300">
                  5-GOLDEN FIREWORKS GRAND SLAM · +250 COINS
                </div>
                <div className="text-sm font-bold text-white mt-0.5">
                  Solve 5 Golden Balloons to ignite the Fireworks Celebration
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <div className="w-24 h-3 bg-[#080915] rounded-full overflow-hidden border border-purple-400/30 p-0.5">
                  <div
                    className="h-full bg-gradient-to-r from-purple-400 via-pink-400 to-amber-300 rounded-full transition-all duration-300"
                    style={{ width: `${(fiveGoldenProgress / 5) * 100}%` }}
                  />
                </div>
                <span className="font-mono font-bold text-xs text-purple-200 tabular-nums">
                  {fiveGoldenProgress} / 5
                </span>
                <button
                  onClick={onTriggerGoldenFireworks}
                  className="px-2.5 py-1 rounded-lg bg-amber-400/20 hover:bg-amber-400/30 border border-amber-400/40 text-[11px] font-mono text-amber-200 cursor-pointer whitespace-nowrap"
                >
                  Fireworks FX
                </button>
              </div>
            </div>
          </div>

          {/* Main Sky Arena Card */}
          <div className="bg-[#0f1123] border border-[#1f2444] rounded-2xl p-6 md:p-8">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-6 border-b border-[#1f2444]">
              <div className="flex items-center gap-3 text-xs font-mono">
                <span className="text-amber-300 font-bold">
                  QUESTION {(balloonIdx % BALLOON_QUESTIONS.length) + 1} OF {BALLOON_QUESTIONS.length}
                </span>
                <span aria-hidden="true" className="text-slate-600">·</span>
                <span className="text-cyan-300">{currentBalloonQ.ruleTag}</span>
                <span aria-hidden="true" className="text-slate-600">·</span>
                <span className="text-emerald-300 flex items-center gap-1 tabular-nums">
                  <Flame className="w-3.5 h-3.5" /> Streak: {streak}
                </span>
              </div>

              <button
                onClick={() => soundEngine.speak(currentBalloonQ.sentence.replace('______', 'blank'))}
                className="px-3 py-1.5 rounded-lg bg-[#080915] hover:bg-slate-800 border border-[#1f2444] text-xs font-mono text-cyan-300 flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
              >
                <Volume2 className="w-4 h-4" />
                Listen to Sentence
              </button>
            </div>

            {/* Sentence Display */}
            <div className="text-center my-4">
              <div className="text-xs font-mono text-slate-400 mb-2">
                Subject Focus: <span className="text-amber-300 font-bold">{currentBalloonQ.subject}</span>
              </div>
              <div className="text-2xl sm:text-4xl font-extrabold text-white leading-relaxed">
                {sentenceParts[0]}
                <span
                  className={`inline-block px-5 py-1 mx-2 rounded-xl font-mono border-2 border-dashed ${
                    selectedChoice !== null
                      ? selectedChoice === currentBalloonQ.correctIndex
                        ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                        : 'bg-rose-500/20 border-rose-400 text-rose-300'
                      : 'bg-amber-400/10 border-amber-400 text-amber-300'
                  }`}
                >
                  {selectedChoice !== null ? currentBalloonQ.choices[selectedChoice] : '______'}
                </span>
                {sentenceParts[1]}
              </div>
            </div>

            {/* Playful Comic Speech Bubble */}
            <div className="my-6 flex justify-center">
              <button
                onClick={triggerWhooshAndVoice}
                className={`px-5 py-2.5 rounded-2xl border-2 flex items-center gap-3 transition-transform hover:scale-105 cursor-pointer ${
                  comicBubble.isWrong
                    ? 'bg-rose-500/15 border-rose-400 text-rose-200'
                    : 'bg-amber-400/15 border-amber-400 text-amber-200'
                }`}
              >
                <Volume2 className="w-5 h-5 shrink-0" />
                <div className="text-left">
                  <div className="text-[10px] font-mono uppercase opacity-80">
                    {comicBubble.category}
                  </div>
                  <div className="text-sm sm:text-base font-extrabold text-white">
                    {comicBubble.text}
                  </div>
                </div>
              </button>
            </div>

            {/* Floating Balloons Arena */}
            <div
              key={floatAnimKey}
              className="py-6 flex flex-wrap items-center justify-center gap-8 md:gap-14 animate-balloon-in"
            >
              {/* Balloon A (Option 0) */}
              <div
                onClick={() => handleBalloonChoice(0)}
                className="group cursor-pointer flex flex-col items-center animate-float-slow"
              >
                <div
                  className={`relative w-32 h-40 sm:w-36 sm:h-44 rounded-[50%_50%_50%_50%/60%_60%_40%_40%] bg-gradient-to-t from-pink-600 to-rose-400 border-2 border-pink-300 shadow-xl flex flex-col items-center justify-center p-4 transition-transform group-hover:scale-105 ${
                    wrongBalloonIdx === 0 ? 'animate-wrong-wobble' : ''
                  }`}
                >
                  {/* Cartoon Eyes */}
                  <div className="flex items-center gap-2.5 mb-2">
                    {wrongBalloonIdx === 0 ? (
                      <>
                        <span className="text-xs font-mono font-black text-slate-950">X</span>
                        <span className="text-xs font-mono font-black text-slate-950">O</span>
                      </>
                    ) : (
                      <>
                        <div className="w-3 h-3.5 bg-white rounded-full flex items-center justify-center">
                          <div className="w-1.5 h-1.5 bg-slate-950 rounded-full" />
                        </div>
                        <div className="w-3 h-3.5 bg-white rounded-full flex items-center justify-center">
                          <div className="w-1.5 h-1.5 bg-slate-950 rounded-full" />
                        </div>
                      </>
                    )}
                  </div>
                  <span className="font-mono font-black text-2xl text-white drop-shadow">
                    {currentBalloonQ.choices[0]}
                  </span>
                  <div className="absolute -bottom-2 w-4 h-3 bg-pink-700 rounded-sm" />
                  <div className="absolute -bottom-8 w-0.5 h-7 bg-slate-500" />
                </div>
                <span className="mt-9 text-xs font-mono text-pink-300">Balloon A</span>
              </div>

              {/* Center Bonus Golden Balloon */}
              <div
                onClick={handleOpenGoldenModal}
                className="group cursor-pointer flex flex-col items-center animate-float-slow"
              >
                <div className="relative w-36 h-44 sm:w-40 sm:h-48 rounded-[50%_50%_50%_50%/60%_60%_40%_40%] bg-gradient-to-t from-amber-500 via-yellow-400 to-amber-200 border-2 border-white shadow-[0_0_30px_rgba(251,191,36,0.45)] flex flex-col items-center justify-center p-4 transition-transform group-hover:scale-110">
                  <Sparkles className="w-5 h-5 text-slate-950 mb-1" />
                  <span className="text-[11px] font-mono font-black text-slate-900">
                    GOLDEN BONUS
                  </span>
                  <span className="font-mono font-black text-lg text-slate-950 mt-0.5">
                    +50 COINS
                  </span>
                  <span className="text-[11px] font-mono font-bold text-amber-950 mt-1">
                    Pop for Riddle!
                  </span>
                  <div className="absolute -bottom-2 w-4 h-3 bg-amber-600 rounded-sm" />
                  <div className="absolute -bottom-8 w-0.5 h-7 bg-amber-400/70" />
                </div>
                <span className="mt-9 text-xs font-mono font-bold text-amber-300">
                  Bonus Golden Balloon
                </span>
              </div>

              {/* Balloon B (Option 1) */}
              <div
                onClick={() => handleBalloonChoice(1)}
                className="group cursor-pointer flex flex-col items-center animate-float-slow"
              >
                <div
                  className={`relative w-32 h-40 sm:w-36 sm:h-44 rounded-[50%_50%_50%_50%/60%_60%_40%_40%] bg-gradient-to-t from-cyan-600 to-sky-400 border-2 border-cyan-200 shadow-xl flex flex-col items-center justify-center p-4 transition-transform group-hover:scale-105 ${
                    wrongBalloonIdx === 1 ? 'animate-wrong-wobble' : ''
                  }`}
                >
                  {/* Cartoon Eyes */}
                  <div className="flex items-center gap-2.5 mb-2">
                    {wrongBalloonIdx === 1 ? (
                      <>
                        <span className="text-xs font-mono font-black text-slate-950">X</span>
                        <span className="text-xs font-mono font-black text-slate-950">O</span>
                      </>
                    ) : (
                      <>
                        <div className="w-3 h-3.5 bg-white rounded-full flex items-center justify-center">
                          <div className="w-1.5 h-1.5 bg-slate-950 rounded-full" />
                        </div>
                        <div className="w-3 h-3.5 bg-white rounded-full flex items-center justify-center">
                          <div className="w-1.5 h-1.5 bg-slate-950 rounded-full" />
                        </div>
                      </>
                    )}
                  </div>
                  <span className="font-mono font-black text-2xl text-white drop-shadow">
                    {currentBalloonQ.choices[1]}
                  </span>
                  <div className="absolute -bottom-2 w-4 h-3 bg-cyan-700 rounded-sm" />
                  <div className="absolute -bottom-8 w-0.5 h-7 bg-slate-500" />
                </div>
                <span className="mt-9 text-xs font-mono text-cyan-300">Balloon B</span>
              </div>
            </div>

            {/* Answer Explanation & Next Balloon Button */}
            {selectedChoice !== null && (
              <div
                className={`mt-6 p-5 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                  selectedChoice === currentBalloonQ.correctIndex
                    ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-200'
                    : 'bg-rose-500/10 border-rose-500/50 text-rose-200'
                }`}
              >
                <div className="flex items-start gap-3">
                  {selectedChoice === currentBalloonQ.correctIndex ? (
                    <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-6 h-6 text-rose-400 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <div className="font-mono font-bold text-base text-white">
                      {selectedChoice === currentBalloonQ.correctIndex
                        ? 'POP-TASTIC! +10 Gold Coins & +1 Star'
                        : 'OOPSIE! Wrong Balloon Popped'}
                    </div>
                    <div className="text-sm text-slate-300 mt-0.5">
                      {currentBalloonQ.explanation}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  {selectedChoice !== currentBalloonQ.correctIndex && (
                    <button
                      onClick={() => setSelectedChoice(null)}
                      className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-mono text-white cursor-pointer whitespace-nowrap"
                    >
                      Try Again
                    </button>
                  )}
                  <button
                    onClick={handleNextBalloonQuestion}
                    className="px-6 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-mono font-bold text-sm cursor-pointer whitespace-nowrap"
                  >
                    Next Balloon ➜
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================== MODE 2: 30-SECOND SPEED RUSH ==================== */}
      {arenaMode === 'speed' && (
        <div className="bg-[#0f1123] border border-[#1f2444] rounded-2xl p-6 md:p-10 max-w-3xl mx-auto">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 mb-6 border-b border-[#1f2444]">
            <div>
              <div className="text-xs font-mono text-cyan-400">30-SECOND BLITZ ARENA</div>
              <h3 className="text-2xl font-black text-white flex items-center gap-2">
                <Zap className="w-6 h-6 text-amber-400" />
                30-Second Speed Rush!
              </h3>
            </div>
            <div className="flex items-center gap-4 font-mono">
              <div className="px-4 py-2 rounded-xl bg-[#080915] border border-[#1f2444] text-amber-300 font-bold tabular-nums">
                Time: {speedTimeLeft}s
              </div>
              <div className="px-4 py-2 rounded-xl bg-[#080915] border border-[#1f2444] text-emerald-400 font-bold tabular-nums">
                Score: {speedScore} pts
              </div>
            </div>
          </div>

          {speedSummary && (
            <div className="mb-6 p-4 rounded-xl bg-amber-400/15 border border-amber-400/40 text-amber-200 font-mono text-sm">
              {speedSummary}
            </div>
          )}

          {speedRunning ? (
            <div className="text-center py-6">
              <div className="text-2xl sm:text-3xl font-extrabold text-white mb-8">
                {currentSpeedQ.sentence}
              </div>
              <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
                {currentSpeedQ.choices.map((c, idx) => (
                  <button
                    key={c}
                    onClick={() => handleSpeedAnswer(idx as 0 | 1)}
                    className="py-4 px-6 rounded-xl bg-[#080915] hover:bg-cyan-500/20 border-2 border-[#1f2444] hover:border-cyan-400 font-mono font-black text-xl text-white transition-all cursor-pointer"
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-slate-300 text-base max-w-md mx-auto mb-6">
                Answer as many subject-verb agreement challenges as you can before the 30-second clock hits zero! Every correct answer awards +15 Points & Gold Coins.
              </p>
              <button
                onClick={startSpeedRushGame}
                className="px-8 py-4 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-mono font-black text-base transition-colors cursor-pointer"
              >
                {speedSummary ? 'Play Speed Rush Again' : 'Start 30s Speed Rush'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* ==================== MODE 3: FREE PRACTICE ARENA ==================== */}
      {arenaMode === 'practice' && (
        <div className="bg-[#0f1123] border border-[#1f2444] rounded-2xl p-6 md:p-10 max-w-3xl mx-auto">
          <div className="flex items-center justify-between pb-4 mb-6 border-b border-[#1f2444]">
            <div>
              <div className="text-xs font-mono text-emerald-400">UNTIMED SANDBOX</div>
              <h3 className="text-2xl font-black text-white flex items-center gap-2">
                <Target className="w-6 h-6 text-emerald-400" />
                Chill Free Practice Arena
              </h3>
            </div>
            <span className="text-xs font-mono text-slate-400">
              Item {(practiceIdx % BALLOON_QUESTIONS.length) + 1} of {BALLOON_QUESTIONS.length}
            </span>
          </div>

          <div className="text-center py-6">
            <div className="text-xs font-mono text-emerald-300 mb-2">
              {currentPracticeQ.ruleTag}
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-white mb-8">
              {currentPracticeQ.sentence}
            </div>

            <div className="grid grid-cols-2 gap-4 max-w-md mx-auto mb-6">
              {currentPracticeQ.choices.map((c, idx) => {
                const isPicked = practicePicked === idx;
                const isRight = idx === currentPracticeQ.correctIndex;
                return (
                  <button
                    key={c}
                    onClick={() => {
                      setPracticePicked(idx);
                      if (isRight) soundEngine.playCorrect();
                      else soundEngine.playCartoonBoingSound();
                    }}
                    className={`py-4 px-6 rounded-xl font-mono font-black text-xl border-2 transition-all cursor-pointer ${
                      isPicked
                        ? isRight
                          ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                          : 'bg-rose-500/20 border-rose-400 text-rose-300'
                        : 'bg-[#080915] border-[#1f2444] hover:border-emerald-400 text-white'
                    }`}
                  >
                    {c}
                  </button>
                );
              })}
            </div>

            {practicePicked !== null && (
              <div className="p-4 rounded-xl bg-[#080915] border border-[#1f2444] text-left flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-sm text-slate-200">
                  <strong className="text-emerald-400 font-mono">Grammar Rule: </strong>
                  {currentPracticeQ.explanation}
                </div>
                <button
                  onClick={() => {
                    setPracticePicked(null);
                    setPracticeIdx((i) => i + 1);
                  }}
                  className="px-5 py-2.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-mono font-bold text-xs cursor-pointer shrink-0 whitespace-nowrap"
                >
                  Next Practice Item ➜
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================== MODE 4: PROFESSOR VERB BOSS BATTLE ==================== */}
      {arenaMode === 'boss' && (
        <div className="bg-[#0f1123] border border-rose-500/40 rounded-2xl p-6 md:p-10 max-w-3xl mx-auto">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 mb-6 border-b border-[#1f2444]">
            <div>
              <div className="text-xs font-mono text-rose-400">SECTOR BOSS ENCOUNTER</div>
              <h3 className="text-2xl font-black text-white flex items-center gap-2">
                <ShieldAlert className="w-6 h-6 text-rose-400" />
                Professor Verb Mech Boss Battle
              </h3>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs text-rose-300 font-bold tabular-nums">
                BOSS HP: {bossHp} / 100
              </span>
              <div className="w-36 h-3.5 bg-[#080915] rounded-full overflow-hidden border border-rose-500/40 p-0.5">
                <div
                  className="h-full bg-gradient-to-r from-rose-600 to-amber-400 rounded-full transition-all duration-300"
                  style={{ width: `${bossHp}%` }}
                />
              </div>
            </div>
          </div>

          {bossHp <= 0 ? (
            <div className="text-center py-8">
              <Trophy className="w-14 h-14 text-amber-400 mx-auto mb-3" />
              <h4 className="text-3xl font-black text-white mb-2">
                PROFESSOR VERB DEFEATED!
              </h4>
              <p className="text-slate-300 text-sm mb-6">
                Your mastery of advanced subject-verb agreement shattered the Boss Mech’s shields!
              </p>
              <button
                onClick={() => {
                  setBossHp(100);
                  setBossIdx(0);
                  setBossFeedback(null);
                }}
                className="px-6 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-mono font-bold text-sm flex items-center gap-2 mx-auto cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                Rematch Professor Verb
              </button>
            </div>
          ) : (
            <div className="text-center py-4">
              <div className="text-2xl sm:text-3xl font-extrabold text-white mb-8">
                {currentBossQ.prompt}
              </div>
              <div className="grid grid-cols-3 gap-4 max-w-md mx-auto mb-6">
                {currentBossQ.choices.map((c) => (
                  <button
                    key={c}
                    onClick={() => handleBossStrike(c)}
                    className="py-4 px-5 rounded-xl bg-[#080915] hover:bg-rose-500/20 border-2 border-[#1f2444] hover:border-rose-400 font-mono font-black text-xl text-white uppercase transition-all cursor-pointer"
                  >
                    {c}
                  </button>
                ))}
              </div>

              {bossFeedback && (
                <div
                  className={`p-4 rounded-xl border text-left flex flex-col sm:flex-row items-center justify-between gap-4 ${
                    bossFeedback.isCorrect
                      ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-200'
                      : 'bg-rose-500/10 border-rose-500/40 text-rose-200'
                  }`}
                >
                  <div className="text-sm font-mono">{bossFeedback.text}</div>
                  <button
                    onClick={() => {
                      setBossFeedback(null);
                      setBossIdx((i) => i + 1);
                    }}
                    className="px-5 py-2 rounded-lg bg-white text-slate-950 font-mono font-bold text-xs cursor-pointer shrink-0 whitespace-nowrap"
                  >
                    Next Attack <ArrowRight className="w-3.5 h-3.5 inline" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ==================== GOLDEN BONUS RIDDLE MODAL ==================== */}
      {showGoldenModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="relative w-full max-w-lg rounded-2xl bg-[#0f1123] border-2 border-amber-400 p-6 md:p-8 text-center shadow-2xl">
            <button
              onClick={() => setShowGoldenModal(false)}
              aria-label="Close modal"
              className="absolute top-4 right-4 p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-xs font-mono text-amber-300 mb-1">
              BONUS GOLDEN BALLOON CHALLENGE · +50 COINS & +3 STARS
            </div>
            <h3 className="text-2xl font-black text-white mb-4">
              Solve the Golden Grammar Riddle!
            </h3>

            <div className="p-5 rounded-xl bg-[#080915] border border-amber-400/30 text-xl sm:text-2xl font-extrabold text-white mb-6">
              {currentGoldenQ.sentence}
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              {currentGoldenQ.choices.map((c, idx) => (
                <button
                  key={c}
                  onClick={() => handleGoldenAnswer(idx as 0 | 1)}
                  className="py-4 px-6 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-mono font-black text-xl transition-colors cursor-pointer"
                >
                  {c}
                </button>
              ))}
            </div>

            {goldenFeedback && (
              <div
                className={`p-3.5 rounded-xl border text-sm font-mono ${
                  goldenFeedback.isCorrect
                    ? 'bg-emerald-500/15 border-emerald-400 text-emerald-200'
                    : 'bg-rose-500/15 border-rose-400 text-rose-200'
                }`}
              >
                {goldenFeedback.message}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================== TREASURE ROOM MODAL ==================== */}
      {showTreasureModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="relative w-full max-w-lg rounded-2xl bg-[#0f1123] border border-[#1f2444] p-6 md:p-8 shadow-2xl">
            <button
              onClick={() => setShowTreasureModal(false)}
              aria-label="Close modal"
              className="absolute top-4 right-4 p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-xs font-mono text-amber-300 mb-1">ROYAL VAULT</div>
            <h3 className="text-2xl font-black text-white mb-4">
              Golden Balloon Treasure Room
            </h3>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="p-4 rounded-xl bg-[#080915] border border-amber-400/30 text-center">
                <div className="text-xs text-slate-400">Total Gold Coins</div>
                <div className="text-2xl font-mono font-black text-amber-300 tabular-nums mt-1">
                  {playerStats.coins}
                </div>
              </div>
              <div className="p-4 rounded-xl bg-[#080915] border border-cyan-400/30 text-center">
                <div className="text-xs text-slate-400">Total Royal Stars</div>
                <div className="text-2xl font-mono font-black text-cyan-300 tabular-nums mt-1">
                  {playerStats.stars}
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#080915] border border-purple-400/30 mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-sm text-white">
                  5-Golden Streak Treasure Badge
                </span>
                <span className="text-xs font-mono text-amber-300 tabular-nums">
                  {fiveGoldenProgress} / 5 Mastered
                </span>
              </div>
              <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden mb-3">
                <div
                  className="h-full bg-gradient-to-r from-amber-400 to-purple-400 rounded-full"
                  style={{ width: `${(fiveGoldenProgress / 5) * 100}%` }}
                />
              </div>
              <p className="text-xs text-slate-400">
                {fiveGoldenProgress >= 5
                  ? 'UNLOCKED! You have earned the Golden Firework Sovereign badge!'
                  : `Pop and solve ${5 - fiveGoldenProgress} more Bonus Golden Balloons to unlock the Grand Fireworks celebration.`}
              </p>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowTreasureModal(false);
                  onTriggerGoldenFireworks();
                }}
                className="px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-mono font-bold text-xs cursor-pointer"
              >
                Preview Grand Fireworks
              </button>
              <button
                onClick={() => setShowTreasureModal(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono text-xs cursor-pointer"
              >
                Close Vault
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
