import React, { useState, useEffect, useCallback } from 'react';
import {
  Volume2,
  Play,
  BookOpen,
  Target,
  Zap,
  Trophy,
  RotateCcw,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  Flame,
  Lock,
  Unlock,
  Coins,
} from 'lucide-react';
import {
  QUESTION_BANK,
  GAME_MODES,
  DIFFICULTY_LEVELS,
  GameModeId,
  ToBeQuestion,
  PlayerStats,
  LEVEL_UNLOCK_COIN_COST,
} from '../data/questions';
import { soundEngine } from '../utils/soundEngine';

interface GrammarArcadeViewProps {
  playerStats: PlayerStats;
  onSessionComplete: (result: {
    score: number;
    correctCount: number;
    maxStreak: number;
    level: number;
    mode: GameModeId;
  }) => void;
  onNavigateTab: (tab: 'arcade' | 'balloon' | 'rules' | 'audio' | 'achievements') => void;
  onTriggerCyberBurst: () => void;
  onUnlockLevelWithCoins: (targetLevel: number) => void;
  pendingLaunchLevel?: number | null;
  onClearPendingLaunchLevel?: () => void;
}

type ArcadeSubScreen = 'menu' | 'select' | 'game' | 'result';

export const GrammarArcadeView: React.FC<GrammarArcadeViewProps> = ({
  playerStats,
  onSessionComplete,
  onNavigateTab,
  onTriggerCyberBurst,
  onUnlockLevelWithCoins,
  pendingLaunchLevel,
  onClearPendingLaunchLevel,
}) => {
  const [subScreen, setSubScreen] = useState<ArcadeSubScreen>('menu');
  const [selectedMode, setSelectedMode] = useState<GameModeId>('mode1');
  const [selectedLevel, setSelectedLevel] = useState<number>(1);
  const [isPractice, setIsPractice] = useState<boolean>(false);

  // Active gameplay state
  const [questions, setQuestions] = useState<ToBeQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [currentScore, setCurrentScore] = useState<number>(0);
  const [currentStreak, setCurrentStreak] = useState<number>(0);
  const [maxSessionStreak, setMaxSessionStreak] = useState<number>(0);
  const [correctCount, setCorrectCount] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(15);

  // Question interaction state
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [assembledWords, setAssembledWords] = useState<Array<{ word: string; poolIdx: number }>>([]);
  const [shuffledPool, setShuffledPool] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<{
    isCorrect: boolean;
    headline: string;
    explanation: string;
  } | null>(null);
  const [isNewHighRecord, setIsNewHighRecord] = useState<boolean>(false);
  const [justUnlockedNextLevel, setJustUnlockedNextLevel] = useState<number | null>(null);

  const currentQuestion = questions[currentIndex];
  const maxUnlockedLevel = Math.max(1, playerStats.unlockedLevel || 1);

  const setupQuestionState = useCallback((q: ToBeQuestion, mode: GameModeId) => {
    setSelectedOption(null);
    setFeedback(null);
    setAssembledWords([]);
    if (mode === 'mode3') {
      const copy = [...q.words];
      for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
      }
      setShuffledPool(copy);
    } else {
      setShuffledPool([]);
    }
    setTimeLeft(15);
  }, []);

  const launchMission = useCallback(
    (modeOverride?: GameModeId, levelOverride?: number, practiceOverride?: boolean) => {
      soundEngine.playClick();
      const activeMode = modeOverride ?? selectedMode;
      const activeLevel = levelOverride ?? selectedLevel;
      const practiceFlag = practiceOverride ?? isPractice;

      setSelectedMode(activeMode);
      setSelectedLevel(activeLevel);
      setIsPractice(practiceFlag);

      const bank = QUESTION_BANK[activeLevel] || QUESTION_BANK[1];
      const shuffled = [...bank].sort(() => Math.random() - 0.5);
      setQuestions(shuffled);
      setCurrentIndex(0);
      setCurrentScore(0);
      setCurrentStreak(0);
      setMaxSessionStreak(0);
      setCorrectCount(0);
      setIsNewHighRecord(false);
      setJustUnlockedNextLevel(null);

      setupQuestionState(shuffled[0], activeMode);
      setSubScreen('game');
    },
    [selectedMode, selectedLevel, isPractice, setupQuestionState]
  );

  useEffect(() => {
    if (pendingLaunchLevel && pendingLaunchLevel >= 1 && pendingLaunchLevel <= 5) {
      launchMission(selectedMode, pendingLaunchLevel, false);
      onClearPendingLaunchLevel?.();
    }
  }, [pendingLaunchLevel, launchMission, selectedMode, onClearPendingLaunchLevel]);

  // Timer effect for Mode 5 (Timed Blitz)
  useEffect(() => {
    if (subScreen !== 'game' || selectedMode !== 'mode5' || feedback !== null) {
      return;
    }
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          soundEngine.playWrong();
          setCurrentStreak(0);
          const q = questions[currentIndex];
          if (q) {
            setFeedback({
              isCorrect: false,
              headline: "TIME'S UP! (0 PTS)",
              explanation: `Correct answer: "${q.subject} ${q.correct} ${q.complement}" — ${q.explanation}`,
            });
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [subScreen, selectedMode, feedback, questions, currentIndex]);

  const evaluateSubmission = (isCorrect: boolean, q: ToBeQuestion) => {
    if (feedback !== null) return;

    let newScore = currentScore;
    let newStreak = currentStreak;
    let newMaxStreak = maxSessionStreak;
    let newCorrectCount = correctCount;

    if (isCorrect) {
      soundEngine.playCorrect();
      newScore += 10;
      newStreak += 1;
      newCorrectCount += 1;
      if (newStreak > newMaxStreak) {
        newMaxStreak = newStreak;
      }
      setCurrentScore(newScore);
      setCurrentStreak(newStreak);
      setMaxSessionStreak(newMaxStreak);
      setCorrectCount(newCorrectCount);
      setFeedback({
        isCorrect: true,
        headline: 'CORRECT! +10 PTS',
        explanation: q.explanation,
      });
    } else {
      soundEngine.playWrong();
      setCurrentStreak(0);
      setFeedback({
        isCorrect: false,
        headline: `INCORRECT — Correct verb is "${q.correct}"`,
        explanation: q.explanation,
      });
    }

    // Read full correct sentence aloud
    const spoken =
      selectedMode === 'mode3'
        ? q.words.join(' ')
        : selectedMode === 'mode4'
        ? q.tf_statement
        : `${q.subject.replace('___', q.correct)} ${q.subject.includes('___') ? '' : q.correct} ${q.complement}`;
    soundEngine.speak(spoken.replace(/\s+/g, ' ').trim());
  };

  const handleChoiceSelect = (opt: 'AM' | 'IS' | 'ARE') => {
    if (!currentQuestion || feedback !== null) return;
    setSelectedOption(opt);
    evaluateSubmission(opt === currentQuestion.correct, currentQuestion);
  };

  const handleTrueFalseSelect = (userSaysTrue: boolean) => {
    if (!currentQuestion || feedback !== null) return;
    setSelectedOption(userSaysTrue ? 'TRUE' : 'FALSE');
    const isCorrect = userSaysTrue === currentQuestion.tf_is_correct;
    evaluateSubmission(isCorrect, currentQuestion);
  };

  const handleWordClick = (word: string, poolIdx: number) => {
    if (feedback !== null) return;
    soundEngine.playClick();
    if (assembledWords.some((item) => item.poolIdx === poolIdx)) {
      setAssembledWords((prev) => prev.filter((item) => item.poolIdx !== poolIdx));
    } else {
      setAssembledWords((prev) => [...prev, { word, poolIdx }]);
    }
  };

  const handleCheckSentence = () => {
    if (!currentQuestion || feedback !== null) return;
    const userSentence = assembledWords.map((w) => w.word).join(' ');
    const targetSentence = currentQuestion.words.join(' ');
    const isCorrect = userSentence.toLowerCase() === targetSentence.toLowerCase();
    evaluateSubmission(isCorrect, currentQuestion);
  };

  const handleNextQuestion = () => {
    soundEngine.playClick();
    if (currentIndex + 1 < questions.length) {
      const nextIdx = currentIndex + 1;
      setCurrentIndex(nextIdx);
      setupQuestionState(questions[nextIdx], selectedMode);
    } else {
      // Finish session
      soundEngine.playWin();
      const beatHigh = currentScore > playerStats.highScore;
      setIsNewHighRecord(beatHigh);
      if (selectedLevel < 5 && correctCount >= 6 && selectedLevel + 1 > maxUnlockedLevel) {
        setJustUnlockedNextLevel(selectedLevel + 1);
      } else {
        setJustUnlockedNextLevel(null);
      }
      onSessionComplete({
        score: currentScore,
        correctCount,
        maxStreak: maxSessionStreak,
        level: selectedLevel,
        mode: selectedMode,
      });
      if (correctCount >= 8) {
        onTriggerCyberBurst();
      }
      setSubScreen('result');
    }
  };

  const speakCurrentPrompt = () => {
    if (!currentQuestion) return;
    if (selectedMode === 'mode3') {
      soundEngine.speak(currentQuestion.words.join(' '));
    } else if (selectedMode === 'mode4') {
      soundEngine.speak(currentQuestion.tf_statement);
    } else {
      soundEngine.speak(`${currentQuestion.subject.replace('___', 'blank')} ${currentQuestion.complement}`);
    }
  };

  const currentModeObj = GAME_MODES.find((m) => m.id === selectedMode) || GAME_MODES[0];
  const currentLevelObj = DIFFICULTY_LEVELS.find((l) => l.level === selectedLevel) || DIFFICULTY_LEVELS[0];

  return (
    <div className="w-full">
      {/* ==================== 1. MAIN MENU SCREEN ==================== */}
      {subScreen === 'menu' && (
        <div className="py-4 md:py-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            {/* Left Column: Hero & Primary Arcade Launchpad */}
            <div className="lg:col-span-7 bg-[#0f1123] border border-[#1f2444] rounded-2xl p-6 md:p-8 flex flex-col justify-between">
              <div>
                <div className="text-xs font-mono text-cyan-400 mb-3">
                  ENGLISH GRAMMAR ARCADE · 5 MODES · 5 DIFFICULTY LEVELS
                </div>
                <h1
                  className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight mb-4"
                  style={{ textWrap: 'balance' }}
                >
                  MASTER{' '}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00F0FF] via-[#B026FF] to-[#00FF66]">
                    AM · IS · ARE
                  </span>
                </h1>
                <p className="text-slate-300 text-sm sm:text-base max-w-xl leading-relaxed mb-6">
                  Power up your English grammar reflexes. Conquer the verb &ldquo;TO BE&rdquo; and subject-verb agreement with instant syntax verification, synthesized Web Audio feedback, and progressive difficulty tiers.
                </p>

                {/* Unboxed Clean Formula Reference Strip */}
                <div className="grid grid-cols-3 gap-3 p-4 rounded-xl bg-[#080915] border border-[#1f2444] mb-6">
                  <div>
                    <div className="text-xs text-slate-400">First Person</div>
                    <div className="font-mono font-bold text-sm sm:text-base text-[#00F0FF] mt-0.5">
                      I → AM
                    </div>
                  </div>
                  <div className="border-x border-[#1f2444] px-3">
                    <div className="text-xs text-slate-400">3rd Singular</div>
                    <div className="font-mono font-bold text-sm sm:text-base text-[#B026FF] mt-0.5">
                      HE / SHE / IT → IS
                    </div>
                  </div>
                  <div className="pl-1">
                    <div className="text-xs text-slate-400">Plural & You</div>
                    <div className="font-mono font-bold text-sm sm:text-base text-[#00FF66] mt-0.5">
                      YOU / WE / THEY → ARE
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <button
                  onClick={() => {
                    soundEngine.playClick();
                    setIsPractice(false);
                    setSubScreen('select');
                  }}
                  className="group flex items-center justify-between p-4 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <Play className="w-5 h-5 fill-current shrink-0" />
                    <div className="text-left">
                      <div className="text-base font-extrabold leading-tight whitespace-nowrap">
                        PLAY GAME
                      </div>
                      <div className="text-xs font-medium text-slate-800">
                        Select Mode & Level ({maxUnlockedLevel}/5 Unlocked)
                      </div>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform shrink-0" />
                </button>

                <button
                  onClick={() => onNavigateTab('rules')}
                  className="group flex items-center justify-between p-4 rounded-xl bg-[#161936] hover:bg-[#1d2247] border border-purple-500/40 text-white font-bold transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <BookOpen className="w-5 h-5 text-purple-400 shrink-0" />
                    <div className="text-left">
                      <div className="text-base font-extrabold leading-tight whitespace-nowrap">
                        LEARN TO BE
                      </div>
                      <div className="text-xs font-normal text-slate-400">
                        Rules & Audio Examples
                      </div>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-purple-300 group-hover:translate-x-1 transition-transform shrink-0" />
                </button>

                <button
                  onClick={() => launchMission('mode1', maxUnlockedLevel, true)}
                  className="group flex items-center justify-between p-4 rounded-xl bg-[#161936] hover:bg-[#1d2247] border border-emerald-500/40 text-white font-bold transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <Target className="w-5 h-5 text-emerald-400 shrink-0" />
                    <div className="text-left">
                      <div className="text-base font-extrabold leading-tight whitespace-nowrap">
                        PRACTICE MODE
                      </div>
                      <div className="text-xs font-normal text-slate-400">
                        Stress-Free No Timer
                      </div>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-emerald-300 group-hover:translate-x-1 transition-transform shrink-0" />
                </button>

                <button
                  onClick={() => launchMission('mode5', maxUnlockedLevel, false)}
                  className="group flex items-center justify-between p-4 rounded-xl bg-[#161936] hover:bg-[#1d2247] border border-pink-500/40 text-white font-bold transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <Zap className="w-5 h-5 text-pink-400 shrink-0" />
                    <div className="text-left">
                      <div className="text-base font-extrabold leading-tight whitespace-nowrap">
                        CHALLENGE BLITZ
                      </div>
                      <div className="text-xs font-normal text-slate-400">
                        15s Countdown Survival
                      </div>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-pink-300 group-hover:translate-x-1 transition-transform shrink-0" />
                </button>
              </div>
            </div>

            {/* Right Column: Featured Companion Mode (Subject-Verb POP! Cartoon Adventure) & Live Stats */}
            <div className="lg:col-span-5 flex flex-col justify-between gap-6">
              <div className="bg-gradient-to-br from-amber-500/15 via-rose-500/10 to-purple-600/15 border border-amber-400/40 rounded-2xl p-6 flex flex-col justify-between flex-1">
                <div>
                  <div className="text-xs font-mono text-amber-300 mb-2">
                    FEATURED ARENA · SUBJECT-VERB POP!
                  </div>
                  <h2 className="text-2xl font-extrabold text-white mb-2">
                    Cartoon Balloon & Golden Fireworks Quest
                  </h2>
                  <p className="text-sm text-slate-300 leading-relaxed mb-4">
                    Pop floating subject-verb balloons with cartoon voice reactions (&ldquo;Wheee!&rdquo;), unlock Bonus Golden Balloons (+50 Coins), and ignite the 5-Golden Streak Fireworks Grand Slam.
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-amber-200/90 font-mono bg-[#080915]/70 px-3.5 py-2.5 rounded-xl border border-amber-400/20">
                    <span>5-Golden Fireworks Quest</span>
                    <span className="tabular-nums font-bold">
                      {Math.min(playerStats.goldenBalloonsMastered, 5)} / 5 Mastered
                    </span>
                  </div>
                  <button
                    onClick={() => onNavigateTab('balloon')}
                    className="w-full py-3 px-5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4" />
                    Launch Subject-Verb POP! Arena
                  </button>
                </div>
              </div>

              {/* Player Career Telemetry Card */}
              <div className="bg-[#0f1123] border border-[#1f2444] rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="text-xs font-mono text-slate-400">PLAYER CAREER RECORD</div>
                    <h3 className="text-lg font-bold text-white">Arcade Progress & Trophies</h3>
                  </div>
                  <button
                    onClick={() => onNavigateTab('achievements')}
                    className="text-xs font-mono text-cyan-400 hover:text-cyan-300 underline cursor-pointer whitespace-nowrap"
                  >
                    View All Badges
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="p-3 rounded-xl bg-[#080915] border border-[#1f2444]">
                    <div className="text-xs text-slate-400">High Score</div>
                    <div className="text-lg font-mono font-bold text-cyan-400 tabular-nums mt-0.5">
                      {playerStats.highScore}
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-[#080915] border border-[#1f2444]">
                    <div className="text-xs text-slate-400">Best Streak</div>
                    <div className="text-lg font-mono font-bold text-amber-400 tabular-nums mt-0.5">
                      {playerStats.bestStreak}
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-[#080915] border border-[#1f2444]">
                    <div className="text-xs text-slate-400">Tier Unlocked</div>
                    <div className="text-lg font-mono font-bold text-emerald-400 tabular-nums mt-0.5">
                      Lvl {maxUnlockedLevel}/5
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== 2. MODE & LEVEL SELECT SCREEN ==================== */}
      {subScreen === 'select' && (
        <div className="py-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-[#1f2444]">
            <div>
              <div className="text-xs font-mono text-cyan-400">MISSION CONFIGURATION</div>
              <h2 className="text-2xl sm:text-3xl font-black text-white">
                Select Game Mode & Difficulty Level
              </h2>
              <p className="text-slate-400 text-sm">
                Score 6/10+ on your highest unlocked level to unlock the next difficulty tier, or unlock early with Gold Coins.
              </p>
            </div>
            <button
              onClick={() => {
                soundEngine.playClick();
                setSubScreen('menu');
              }}
              className="self-start sm:self-auto px-4 py-2 rounded-xl bg-[#0f1123] border border-[#1f2444] hover:border-slate-500 text-xs font-mono text-slate-300 transition-colors cursor-pointer whitespace-nowrap"
            >
              Back to Menu
            </button>
          </div>

          {/* Step 1: 5 Game Modes */}
          <div className="mb-8">
            <div className="text-xs font-mono text-slate-400 mb-3">
              01. Choose Your Game Mode
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
              {GAME_MODES.map((m) => {
                const isSelected = selectedMode === m.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => {
                      soundEngine.playClick();
                      setSelectedMode(m.id);
                    }}
                    className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
                      isSelected
                        ? 'bg-cyan-500/15 border-cyan-400 text-white shadow-lg'
                        : 'bg-[#0f1123] border-[#1f2444] hover:border-slate-600 text-slate-300'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-base text-white">{m.title}</div>
                      <div className="text-xs text-slate-400 mt-1">{m.subtitle}</div>
                    </div>
                    <div className="mt-4 pt-2 border-t border-white/5 text-[11px] font-mono text-cyan-300">
                      {m.badge}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 2: 5 Difficulty Levels */}
          <div className="mb-8">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <div className="text-xs font-mono text-slate-400">
                02. Choose Difficulty Level (10 Questions per Mission)
              </div>
              <div className="text-xs font-mono text-cyan-300 tabular-nums">
                Unlocked Tiers: {maxUnlockedLevel} / 5
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
              {DIFFICULTY_LEVELS.map((lvl) => {
                const isUnlocked = lvl.level <= maxUnlockedLevel;
                const isNextToUnlock = lvl.level === maxUnlockedLevel + 1;
                const isSelected = selectedLevel === lvl.level && isUnlocked;
                const earnedStars = playerStats.levelStars[lvl.level] || 0;
                const canAffordUnlock = playerStats.coins >= LEVEL_UNLOCK_COIN_COST;

                return (
                  <div
                    key={lvl.level}
                    onClick={() => {
                      if (!isUnlocked) return;
                      soundEngine.playClick();
                      setSelectedLevel(lvl.level);
                    }}
                    className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'bg-purple-500/15 border-purple-400 text-white shadow-lg cursor-pointer'
                        : isUnlocked
                        ? 'bg-[#0f1123] border-[#1f2444] hover:border-slate-600 text-slate-300 cursor-pointer'
                        : 'bg-[#080915]/90 border-[#1f2444]/70 text-slate-400'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span
                          className={`font-mono font-black text-base flex items-center gap-1.5 ${
                            isUnlocked ? 'text-purple-300' : 'text-slate-500'
                          }`}
                        >
                          {isUnlocked ? (
                            <Unlock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          ) : (
                            <Lock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          )}
                          <span>LEVEL {lvl.level}</span>
                        </span>
                        <span className="text-xs font-mono text-amber-300">{lvl.starsDisplay}</span>
                      </div>
                      <div
                        className={`font-bold text-base mt-1.5 ${
                          isUnlocked ? 'text-white' : 'text-slate-400'
                        }`}
                      >
                        {lvl.name}
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">{lvl.subtitle}</div>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-white/5">
                      {isUnlocked ? (
                        <div className="text-[11px] font-mono text-slate-400 flex items-center justify-between">
                          <span>Best Record:</span>
                          <span className="text-amber-300 font-bold">
                            {earnedStars > 0 ? `${earnedStars}/3 Stars` : 'Unlocked'}
                          </span>
                        </div>
                      ) : isNextToUnlock ? (
                        <div className="space-y-2">
                          <div className="text-[11px] font-mono text-slate-500">
                            Clear Lvl {lvl.level - 1} (6/10+) or unlock:
                          </div>
                          <button
                            type="button"
                            disabled={!canAffordUnlock}
                            onClick={(e) => {
                              e.stopPropagation();
                              onUnlockLevelWithCoins(lvl.level);
                              setSelectedLevel(lvl.level);
                            }}
                            className={`w-full py-1.5 px-2.5 rounded-lg font-mono font-bold text-[11px] flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap ${
                              canAffordUnlock
                                ? 'bg-cyan-400 hover:bg-cyan-300 text-slate-950 cursor-pointer'
                                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                            }`}
                          >
                            <Coins className="w-3.5 h-3.5 shrink-0" />
                            <span>Unlock · {LEVEL_UNLOCK_COIN_COST} Coins</span>
                          </button>
                        </div>
                      ) : (
                        <div className="text-[11px] font-mono text-slate-500">
                          Locked · Unlock Lvl {lvl.level - 1} first
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Ready Launch Bar */}
          <div className="bg-[#0f1123] border border-[#1f2444] rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <div className="text-xs font-mono text-slate-400">Selected Mission Configuration</div>
              <div className="text-lg font-bold text-white mt-0.5">
                {currentModeObj.title} · Level {currentLevelObj.level} ({currentLevelObj.name})
              </div>
              <div className="text-xs font-mono text-emerald-400 mt-1">
                10 Questions · Score 6/10+ to Unlock Next Difficulty Tier · Instant Grammar Explanation
              </div>
            </div>
            <button
              onClick={() => launchMission(selectedMode, selectedLevel, false)}
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-black font-mono text-base transition-colors cursor-pointer whitespace-nowrap"
            >
              START MISSION NOW
            </button>
          </div>
        </div>
      )}

      {/* ==================== 3. ACTIVE GAMEPLAY ARENA ==================== */}
      {subScreen === 'game' && currentQuestion && (
        <div className="py-2">
          {/* HUD Status Bar */}
          <div className="bg-[#0f1123] border border-[#1f2444] rounded-xl p-4 mb-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-xs font-mono">
              <span className="text-cyan-400 font-bold">
                {isPractice ? 'FREE PRACTICE' : currentModeObj.title.toUpperCase()}
              </span>
              <span aria-hidden="true" className="text-slate-600">·</span>
              <span className="text-purple-300 font-bold">LEVEL {selectedLevel}</span>
              <span aria-hidden="true" className="text-slate-600">·</span>
              <span className="text-slate-300 tabular-nums">
                Question {currentIndex + 1} of {questions.length}
              </span>
            </div>

            <div className="flex items-center gap-5 font-mono text-sm">
              {selectedMode === 'mode5' && (
                <div
                  className={`flex items-center gap-1.5 font-bold tabular-nums ${
                    timeLeft <= 5 ? 'text-rose-400' : 'text-amber-300'
                  }`}
                >
                  <Clock className="w-4 h-4" />
                  <span>{timeLeft}s</span>
                </div>
              )}
              <div className="flex items-center gap-1.5 text-amber-300 font-bold tabular-nums">
                <Flame className="w-4 h-4" />
                <span>Streak: {currentStreak}</span>
              </div>
              <div className="text-emerald-400 font-bold tabular-nums">
                {currentScore} PTS
              </div>
              <button
                onClick={() => {
                  soundEngine.playClick();
                  setSubScreen('menu');
                }}
                className="px-3 py-1.5 rounded-lg bg-[#080915] hover:bg-slate-800 border border-[#1f2444] text-xs text-slate-300 transition-colors cursor-pointer whitespace-nowrap"
              >
                Exit Mission
              </button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-2 bg-[#0f1123] rounded-full overflow-hidden mb-6 border border-[#1f2444]">
            <div
              className="h-full bg-gradient-to-r from-cyan-400 via-purple-400 to-emerald-400 transition-all duration-300"
              style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
            />
          </div>

          {/* Main Question Card */}
          <div
            className={`bg-[#0f1123] border-2 rounded-2xl p-6 md:p-10 transition-colors ${
              feedback
                ? feedback.isCorrect
                  ? 'border-emerald-500/80'
                  : 'border-rose-500/80'
                : 'border-[#1f2444]'
            }`}
          >
            <div className="flex items-center justify-between gap-4 mb-6">
              <div className="text-xs font-mono text-slate-400">
                {selectedMode === 'mode1' && 'Select the correct form of TO BE (AM, IS, ARE):'}
                {selectedMode === 'mode2' && 'Slot the missing verb into the sentence blank:'}
                {selectedMode === 'mode3' && 'Click the words in order to assemble a grammatically valid sentence:'}
                {selectedMode === 'mode4' && 'Grammar Radar: Inspect the statement below and judge TRUE or FALSE:'}
                {selectedMode === 'mode5' && 'Timed Speed Blitz: Lock in your answer before the 15s clock expires!'}
              </div>
              <button
                onClick={speakCurrentPrompt}
                className="px-3 py-1.5 rounded-lg bg-[#080915] hover:bg-slate-800 border border-[#1f2444] text-xs font-mono text-cyan-300 flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 whitespace-nowrap"
              >
                <Volume2 className="w-4 h-4" />
                Listen
              </button>
            </div>

            {/* Prompt Display */}
            <div className="text-center my-6">
              {(selectedMode === 'mode1' || selectedMode === 'mode2' || selectedMode === 'mode5') && (
                <div className="text-2xl sm:text-4xl font-extrabold text-white leading-relaxed">
                  {currentQuestion.subject.includes('___') ? (
                    <>
                      {currentQuestion.subject.split('___')[0]}
                      <span
                        className={`inline-block px-4 py-1 mx-2 rounded-xl font-mono border-2 border-dashed ${
                          feedback
                            ? feedback.isCorrect
                              ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                              : 'bg-rose-500/20 border-rose-400 text-rose-300'
                            : 'bg-cyan-500/10 border-cyan-400 text-cyan-300'
                        }`}
                      >
                        {selectedOption || '___'}
                      </span>
                      {currentQuestion.subject.split('___')[1]}{' '}
                      <span>{currentQuestion.complement}</span>
                    </>
                  ) : (
                    <>
                      <span>{currentQuestion.subject}</span>
                      <span
                        className={`inline-block px-4 py-1 mx-2 rounded-xl font-mono border-2 border-dashed ${
                          feedback
                            ? feedback.isCorrect
                              ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                              : 'bg-rose-500/20 border-rose-400 text-rose-300'
                            : 'bg-cyan-500/10 border-cyan-400 text-cyan-300'
                        }`}
                      >
                        {selectedOption || '___'}
                      </span>
                      <span>{currentQuestion.complement}</span>
                    </>
                  )}
                </div>
              )}

              {selectedMode === 'mode3' && (
                <div className="max-w-2xl mx-auto">
                  <div className="min-h-[68px] p-4 rounded-xl bg-[#080915] border-2 border-dashed border-emerald-500/50 flex flex-wrap items-center justify-center gap-2 mb-6">
                    {assembledWords.length === 0 ? (
                      <span className="text-sm text-slate-500 font-mono">
                        Click word tiles below to construct the sentence...
                      </span>
                    ) : (
                      assembledWords.map((item, idx) => (
                        <button
                          key={`${item.poolIdx}-${idx}`}
                          onClick={() => handleWordClick(item.word, item.poolIdx)}
                          className="px-3.5 py-2 rounded-lg bg-emerald-500/20 border border-emerald-400 text-emerald-200 font-mono font-bold text-base cursor-pointer"
                        >
                          {item.word}
                        </button>
                      ))
                    )}
                  </div>

                  <div className="flex flex-wrap items-center justify-center gap-2.5 mb-6">
                    {shuffledPool.map((word, poolIdx) => {
                      const isUsed = assembledWords.some((item) => item.poolIdx === poolIdx);
                      return (
                        <button
                          key={poolIdx}
                          disabled={isUsed || feedback !== null}
                          onClick={() => handleWordClick(word, poolIdx)}
                          className={`px-4 py-2.5 rounded-xl font-mono font-bold text-base border transition-all cursor-pointer ${
                            isUsed
                              ? 'opacity-30 bg-slate-900 border-slate-800 text-slate-600 cursor-not-allowed'
                              : 'bg-[#080915] border-[#1f2444] hover:border-cyan-400 text-white'
                          }`}
                        >
                          {word}
                        </button>
                      );
                    })}
                  </div>

                  {feedback === null && (
                    <div className="flex items-center justify-center gap-3">
                      <button
                        onClick={() => setAssembledWords([])}
                        className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-mono text-slate-300 cursor-pointer"
                      >
                        Clear Words
                      </button>
                      <button
                        disabled={assembledWords.length === 0}
                        onClick={handleCheckSentence}
                        className="px-6 py-2.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 disabled:opacity-40 text-slate-950 font-mono font-bold text-sm cursor-pointer"
                      >
                        Check Sentence
                      </button>
                    </div>
                  )}
                </div>
              )}

              {selectedMode === 'mode4' && (
                <div className="max-w-xl mx-auto">
                  <div className="p-6 rounded-2xl bg-[#080915] border border-[#1f2444] mb-6">
                    <div className="text-xs font-mono text-pink-400 mb-2">
                      INSPECT STATEMENT FOR GRAMMAR ACCURACY
                    </div>
                    <div className="text-2xl sm:text-3xl font-extrabold text-white">
                      &ldquo;{currentQuestion.tf_statement}&rdquo;
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
                    <button
                      disabled={feedback !== null}
                      onClick={() => handleTrueFalseSelect(true)}
                      className={`p-4 rounded-xl font-mono font-black text-lg border-2 transition-all cursor-pointer ${
                        selectedOption === 'TRUE'
                          ? currentQuestion.tf_is_correct
                            ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                            : 'bg-rose-500/20 border-rose-400 text-rose-300'
                          : 'bg-[#080915] border-[#1f2444] hover:border-emerald-400 text-emerald-300'
                      }`}
                    >
                      TRUE (Correct)
                    </button>
                    <button
                      disabled={feedback !== null}
                      onClick={() => handleTrueFalseSelect(false)}
                      className={`p-4 rounded-xl font-mono font-black text-lg border-2 transition-all cursor-pointer ${
                        selectedOption === 'FALSE'
                          ? !currentQuestion.tf_is_correct
                            ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                            : 'bg-rose-500/20 border-rose-400 text-rose-300'
                          : 'bg-[#080915] border-[#1f2444] hover:border-rose-400 text-rose-300'
                      }`}
                    >
                      FALSE (Mistake)
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Option Buttons for Modes 1, 2, 5 */}
            {(selectedMode === 'mode1' || selectedMode === 'mode2' || selectedMode === 'mode5') && (
              <div className="grid grid-cols-3 gap-4 max-w-md mx-auto my-4">
                {currentQuestion.options.map((opt) => {
                  const isPicked = selectedOption === opt;
                  const isRightOpt = opt === currentQuestion.correct;
                  let btnStyle =
                    'bg-[#080915] border-[#1f2444] hover:border-cyan-400 text-white';
                  if (feedback !== null) {
                    if (isRightOpt) {
                      btnStyle = 'bg-emerald-500/20 border-emerald-400 text-emerald-300';
                    } else if (isPicked && !isRightOpt) {
                      btnStyle = 'bg-rose-500/20 border-rose-400 text-rose-300';
                    } else {
                      btnStyle = 'bg-[#080915] border-[#1f2444] text-slate-500 opacity-60';
                    }
                  }
                  return (
                    <button
                      key={opt}
                      disabled={feedback !== null}
                      onClick={() => handleChoiceSelect(opt)}
                      className={`py-4 px-6 rounded-xl border-2 font-mono font-black text-xl transition-all cursor-pointer ${btnStyle}`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Instant Feedback & Explanation Banner */}
            {feedback && (
              <div
                className={`mt-8 p-5 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                  feedback.isCorrect
                    ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-200'
                    : 'bg-rose-500/10 border-rose-500/50 text-rose-200'
                }`}
              >
                <div className="flex items-start gap-3">
                  {feedback.isCorrect ? (
                    <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-6 h-6 text-rose-400 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <div className="font-mono font-bold text-base text-white">
                      {feedback.headline}
                    </div>
                    <div className="text-sm text-slate-300 mt-0.5">
                      {feedback.explanation}
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleNextQuestion}
                  className="w-full sm:w-auto px-6 py-3 rounded-xl bg-white hover:bg-slate-200 text-slate-950 font-mono font-bold text-sm transition-colors cursor-pointer shrink-0 whitespace-nowrap"
                >
                  {currentIndex + 1 < questions.length ? 'Next Question ➜' : 'Finish Mission ➜'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================== 4. MISSION RESULT SCREEN ==================== */}
      {subScreen === 'result' && (
        <div className="py-6 max-w-2xl mx-auto">
          <div className="bg-[#0f1123] border border-[#1f2444] rounded-2xl p-6 md:p-10 text-center">
            <div className="mx-auto mb-4 w-16 h-16 rounded-2xl bg-cyan-400/10 border border-cyan-400/30 flex items-center justify-center text-cyan-300">
              <Trophy className="w-9 h-9" />
            </div>

            {justUnlockedNextLevel !== null && (
              <div className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-cyan-300 mb-2">
                <Unlock className="w-3.5 h-3.5 text-emerald-400" />
                <span>
                  NEW DIFFICULTY TIER UNLOCKED: LEVEL {justUnlockedNextLevel}!
                </span>
              </div>
            )}

            {isNewHighRecord && (
              <div className="text-xs font-mono font-bold text-amber-300 mb-2">
                NEW PERSONAL HIGH SCORE RECORD!
              </div>
            )}

            <h2 className="text-3xl sm:text-4xl font-black text-white mb-2">
              {correctCount === 10
                ? 'FLAWLESS VICTORY!'
                : correctCount >= 7
                ? 'MISSION ACCOMPLISHED!'
                : 'TRAINING COMPLETE'}
            </h2>
            <p className="text-slate-400 text-sm mb-6">
              {correctCount === 10
                ? 'You answered every single question with 100% grammar accuracy!'
                : correctCount >= 7
                ? 'Strong command of AM, IS, and ARE rules across this sector!'
                : 'Score 6/10 or higher to unlock the next difficulty tier. Review the Rules Guide and try again!'}
            </p>

            {/* Star Rating Display */}
            <div className="text-3xl mb-6 font-mono tracking-widest text-amber-300">
              {correctCount >= 9 ? '★★★' : correctCount >= 6 ? '★★☆' : '★☆☆'}
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="p-4 rounded-xl bg-[#080915] border border-[#1f2444]">
                <div className="text-xs text-slate-400">Mission Score</div>
                <div className="text-2xl font-mono font-black text-cyan-400 tabular-nums mt-1">
                  {currentScore}
                </div>
              </div>
              <div className="p-4 rounded-xl bg-[#080915] border border-[#1f2444]">
                <div className="text-xs text-slate-400">Accuracy</div>
                <div className="text-2xl font-mono font-black text-emerald-400 tabular-nums mt-1">
                  {Math.round((correctCount / Math.max(1, questions.length)) * 100)}%
                </div>
                <div className="text-[11px] font-mono text-slate-400">
                  {correctCount}/{questions.length} Correct
                </div>
              </div>
              <div className="p-4 rounded-xl bg-[#080915] border border-[#1f2444]">
                <div className="text-xs text-slate-400">Best Streak</div>
                <div className="text-2xl font-mono font-black text-amber-400 tabular-nums mt-1">
                  {maxSessionStreak}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={() => launchMission(selectedMode, selectedLevel, isPractice)}
                className="px-5 py-3 rounded-xl bg-[#161936] hover:bg-[#1f244d] border border-[#1f2444] text-white font-mono font-bold text-sm flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
              >
                <RotateCcw className="w-4 h-4" />
                Replay Level {selectedLevel}
              </button>

              {selectedLevel < 5 && selectedLevel + 1 <= maxUnlockedLevel && (
                <button
                  onClick={() => launchMission(selectedMode, selectedLevel + 1, false)}
                  className="px-6 py-3 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-mono font-black text-sm flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
                >
                  Next: Level {selectedLevel + 1}
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}

              <button
                onClick={() => onTriggerCyberBurst()}
                className="px-4 py-3 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 border border-purple-400/40 text-purple-200 font-mono font-bold text-sm flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
              >
                <Sparkles className="w-4 h-4" />
                Matrix Burst FX
              </button>

              <button
                onClick={() => setSubScreen('menu')}
                className="px-4 py-3 rounded-xl bg-[#080915] hover:bg-slate-800 border border-[#1f2444] text-slate-300 font-mono text-sm transition-colors cursor-pointer whitespace-nowrap"
              >
                Main Menu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
