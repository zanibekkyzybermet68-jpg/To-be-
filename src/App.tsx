import { useState, useEffect, useCallback } from 'react';
import { Volume2, VolumeX, Sparkles, Flame } from 'lucide-react';
import {
  DEFAULT_PLAYER_STATS,
  ACHIEVEMENTS,
  PlayerStats,
  GameModeId,
  STREAK_FREEZE_COST,
  MAX_STREAK_FREEZES,
  LEVEL_UNLOCK_COIN_COST,
  LEVEL_UNLOCK_BONUS_COINS,
  DailyGoalHistoryEntry,
} from './data/questions';
import { soundEngine } from './utils/soundEngine';
import { GrammarArcadeView } from './components/GrammarArcadeView';
import { BalloonPopView } from './components/BalloonPopView';
import { RulesGuideView } from './components/RulesGuideView';
import { AudioStudioView } from './components/AudioStudioView';
import { AchievementsView } from './components/AchievementsView';
import { FireworksOverlay } from './components/FireworksOverlay';
import { DailyGoalStatus, calculateAdaptiveDailyGoal } from './components/DailyGoalStatus';
import {
  LevelUnlockNotification,
  UnlockedLevelEvent,
} from './components/LevelUnlockNotification';

type ActiveTab = 'arcade' | 'balloon' | 'rules' | 'audio' | 'achievements';

const STORAGE_KEY = 'tobe_challenge_stitch_v1';
const LAST_LOGIN_STORAGE_KEY = 'tobe_last_login_date';
const DAILY_STREAK_STORAGE_KEY = 'tobe_daily_streak';

function getTodayDateString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getCalendarDayDifference(prevDateStr: string, currDateStr: string): number | null {
  const prevParts = prevDateStr.split('-').map(Number);
  const currParts = currDateStr.split('-').map(Number);
  if (prevParts.length !== 3 || currParts.length !== 3) return null;
  if (prevParts.some(isNaN) || currParts.some(isNaN)) return null;

  const prevUtc = Date.UTC(prevParts[0], prevParts[1] - 1, prevParts[2]);
  const currUtc = Date.UTC(currParts[0], currParts[1] - 1, currParts[2]);
  return Math.round((currUtc - prevUtc) / (1000 * 60 * 60 * 24));
}

function deriveUnlockedLevel(stats: PlayerStats): number {
  let highest = typeof stats.unlockedLevel === 'number' && stats.unlockedLevel >= 1 ? stats.unlockedLevel : 1;
  const starsMap = stats.levelStars || {};
  for (let lvl = 1; lvl < 5; lvl++) {
    if ((starsMap[lvl] || 0) >= 2 && lvl + 1 > highest) {
      highest = lvl + 1;
    }
  }
  return Math.min(5, Math.max(1, highest));
}

function upsertDailyHistory(
  history: DailyGoalHistoryEntry[] | undefined,
  dateStr: string,
  solved: number,
  target: number
): DailyGoalHistoryEntry[] {
  const existing = Array.isArray(history) ? [...history] : [];
  const idx = existing.findIndex((item) => item.date === dateStr);
  const entry: DailyGoalHistoryEntry = {
    date: dateStr,
    solved: Math.max(0, solved),
    target: Math.max(5, target || 10),
  };
  if (idx >= 0) {
    existing[idx] = entry;
  } else {
    existing.push(entry);
  }
  existing.sort((a, b) => a.date.localeCompare(b.date));
  return existing.slice(-14);
}

function syncDailyStreakWithStorage(stats: PlayerStats): PlayerStats {
  const todayStr = getTodayDateString();
  let storedLastLogin = stats.lastLoginDate;
  let storedStreak = stats.dailyStreak || 0;
  let nextFreezes =
    typeof stats.streakFreezes === 'number'
      ? Math.max(0, Math.min(MAX_STREAK_FREEZES, stats.streakFreezes))
      : DEFAULT_PLAYER_STATS.streakFreezes;

  if (typeof window !== 'undefined') {
    try {
      const rawDate = localStorage.getItem(LAST_LOGIN_STORAGE_KEY);
      const rawStreak = localStorage.getItem(DAILY_STREAK_STORAGE_KEY);
      if (rawDate) storedLastLogin = rawDate;
      if (rawStreak && !isNaN(Number(rawStreak))) {
        storedStreak = Math.max(storedStreak, Number(rawStreak));
      }
    } catch {}
  }

  let nextStreak = 1;
  const isSameDay = storedLastLogin === todayStr;

  if (!storedLastLogin) {
    nextStreak = 1;
  } else if (isSameDay) {
    nextStreak = Math.max(1, storedStreak);
  } else {
    const diffDays = getCalendarDayDifference(storedLastLogin, todayStr);
    if (diffDays === 1) {
      nextStreak = Math.max(1, storedStreak) + 1;
    } else if (diffDays !== null && diffDays > 1) {
      const missedDays = diffDays - 1;
      if (missedDays > 0 && nextFreezes >= missedDays) {
        nextFreezes -= missedDays;
        nextStreak = Math.max(1, storedStreak);
      } else {
        nextStreak = 1;
        nextFreezes = 0;
      }
    } else {
      nextStreak = 1;
    }
  }

  const calculatedTarget = calculateAdaptiveDailyGoal(nextStreak, stats.gamesPlayed || 0);
  const nextDailySolved = isSameDay ? stats.dailyQuestionsSolved || 0 : 0;
  const nextDailyTarget = isSameDay && stats.dailyGoalTarget ? stats.dailyGoalTarget : calculatedTarget;
  const nextRewardClaimed = isSameDay ? Boolean(stats.dailyGoalRewardClaimed) : false;
  const nextHistory = upsertDailyHistory(
    stats.dailyHistory,
    todayStr,
    nextDailySolved,
    nextDailyTarget
  );

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(LAST_LOGIN_STORAGE_KEY, todayStr);
      localStorage.setItem(DAILY_STREAK_STORAGE_KEY, String(nextStreak));
    } catch {}
  }

  return {
    ...stats,
    dailyStreak: nextStreak,
    lastLoginDate: todayStr,
    dailyQuestionsSolved: nextDailySolved,
    dailyGoalTarget: nextDailyTarget,
    dailyGoalRewardClaimed: nextRewardClaimed,
    streakFreezes: nextFreezes,
    unlockedLevel: deriveUnlockedLevel(stats),
    dailyHistory: nextHistory,
  };
}

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('arcade');
  const [muted, setMuted] = useState<boolean>(false);
  const [playerStats, setPlayerStats] = useState<PlayerStats>(() => {
    if (typeof window === 'undefined') return DEFAULT_PLAYER_STATS;
    let initialStats = DEFAULT_PLAYER_STATS;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        initialStats = { ...DEFAULT_PLAYER_STATS, ...JSON.parse(saved) };
      }
    } catch {}
    return syncDailyStreakWithStorage(initialStats);
  });

  // Celebratory Fireworks & Matrix Burst Overlay State
  const [fireworksMode, setFireworksMode] = useState<'golden' | 'cyber' | null>(null);
  const [showFiveGoldenModal, setShowFiveGoldenModal] = useState<boolean>(false);

  // Celebratory Difficulty Level Unlock Modal & Toast State
  const [levelUnlockEvent, setLevelUnlockEvent] = useState<UnlockedLevelEvent | null>(null);
  const [showLevelUnlockModal, setShowLevelUnlockModal] = useState<boolean>(false);
  const [pendingLaunchLevel, setPendingLaunchLevel] = useState<number | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(playerStats));
      if (playerStats.lastLoginDate) {
        localStorage.setItem(LAST_LOGIN_STORAGE_KEY, playerStats.lastLoginDate);
      }
      localStorage.setItem(DAILY_STREAK_STORAGE_KEY, String(playerStats.dailyStreak));
    } catch {}
  }, [playerStats]);

  // Re-verify daily streak if user returns to tab on a new calendar day
  useEffect(() => {
    const handleVisibilityOrFocus = () => {
      const todayStr = getTodayDateString();
      setPlayerStats((prev) => {
        if (prev.lastLoginDate === todayStr) return prev;
        return syncDailyStreakWithStorage(prev);
      });
    };
    window.addEventListener('focus', handleVisibilityOrFocus);
    document.addEventListener('visibilitychange', handleVisibilityOrFocus);
    return () => {
      window.removeEventListener('focus', handleVisibilityOrFocus);
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
    };
  }, []);

  const toggleMute = () => {
    const nextMuted = !muted;
    soundEngine.muted = nextMuted;
    setMuted(nextMuted);
    if (!nextMuted) {
      soundEngine.playClick();
    } else if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  };

  const handleSessionComplete = useCallback(
    (result: {
      score: number;
      correctCount: number;
      maxStreak: number;
      level: number;
      mode: GameModeId;
    }) => {
      setPlayerStats((prev) => {
        const currentMaxUnlocked = Math.max(1, prev.unlockedLevel || 1);
        const passedLevel = result.correctCount >= 6;
        const newlyUnlockedLevel =
          passedLevel && result.level < 5 && result.level + 1 > currentMaxUnlocked
            ? result.level + 1
            : null;

        const unlockBonusCoins = newlyUnlockedLevel ? LEVEL_UNLOCK_BONUS_COINS : 0;
        const unlockBonusStars = newlyUnlockedLevel ? 1 : 0;
        const earnedMissionStars =
          result.correctCount >= 9 ? 3 : result.correctCount >= 6 ? 2 : 1;

        if (newlyUnlockedLevel) {
          soundEngine.playGoldenPopSound();
          setLevelUnlockEvent({
            level: newlyUnlockedLevel,
            previousLevel: result.level,
            bonusCoins: unlockBonusCoins,
            bonusStars: unlockBonusStars,
            reason: 'mission_clear',
          });
          setShowLevelUnlockModal(true);
        }

        const nextDailySolved = (prev.dailyQuestionsSolved || 0) + result.correctCount;
        const todayStr = prev.lastLoginDate || getTodayDateString();
        const next: PlayerStats = {
          ...prev,
          gamesPlayed: prev.gamesPlayed + 1,
          questionsSolved: prev.questionsSolved + result.correctCount,
          dailyQuestionsSolved: nextDailySolved,
          dailyHistory: upsertDailyHistory(
            prev.dailyHistory,
            todayStr,
            nextDailySolved,
            prev.dailyGoalTarget
          ),
          totalScore: prev.totalScore + result.score + unlockBonusCoins,
          highScore: Math.max(prev.highScore, result.score),
          bestStreak: Math.max(prev.bestStreak, result.maxStreak),
          perfectRuns: result.correctCount === 10 ? prev.perfectRuns + 1 : prev.perfectRuns,
          clearedLevel5:
            prev.clearedLevel5 || (result.level === 5 && result.correctCount >= 7),
          timedChallengesWon:
            result.mode === 'mode5' && result.correctCount >= 7
              ? prev.timedChallengesWon + 1
              : prev.timedChallengesWon,
          coins: prev.coins + result.score + unlockBonusCoins,
          stars: prev.stars + earnedMissionStars + unlockBonusStars,
          unlockedLevel: newlyUnlockedLevel
            ? Math.max(currentMaxUnlocked, newlyUnlockedLevel)
            : currentMaxUnlocked,
          levelStars: {
            ...prev.levelStars,
            [result.level]: Math.max(
              prev.levelStars[result.level] || 0,
              earnedMissionStars
            ),
          },
          unlockedAchievements: { ...prev.unlockedAchievements },
        };

        ACHIEVEMENTS.forEach((ach) => {
          if (ach.condition(next)) {
            next.unlockedAchievements[ach.id] = true;
          }
        });

        return next;
      });
    },
    []
  );

  const handleUnlockLevelWithCoins = useCallback((targetLevel: number) => {
    setPlayerStats((prev) => {
      const currentMaxUnlocked = Math.max(1, prev.unlockedLevel || 1);
      if (
        targetLevel <= currentMaxUnlocked ||
        targetLevel > 5 ||
        prev.coins < LEVEL_UNLOCK_COIN_COST
      ) {
        return prev;
      }
      soundEngine.playGoldenPopSound();
      setLevelUnlockEvent({
        level: targetLevel,
        previousLevel: currentMaxUnlocked,
        bonusCoins: 0,
        bonusStars: 1,
        reason: 'coin_unlock',
      });
      setShowLevelUnlockModal(true);

      return {
        ...prev,
        coins: prev.coins - LEVEL_UNLOCK_COIN_COST,
        stars: prev.stars + 1,
        unlockedLevel: targetLevel,
      };
    });
  }, []);

  const handleUpdateBalloonRewards = useCallback(
    (deltaCoins: number, deltaStars: number, goldenSolvedDelta = 0) => {
      setPlayerStats((prev) => {
        const nextDailySolved = (prev.dailyQuestionsSolved || 0) + 1;
        const todayStr = prev.lastLoginDate || getTodayDateString();
        const next: PlayerStats = {
          ...prev,
          coins: prev.coins + deltaCoins,
          stars: prev.stars + deltaStars,
          totalScore: prev.totalScore + deltaCoins,
          highScore: Math.max(prev.highScore, prev.totalScore + deltaCoins),
          questionsSolved: prev.questionsSolved + 1,
          dailyQuestionsSolved: nextDailySolved,
          dailyHistory: upsertDailyHistory(
            prev.dailyHistory,
            todayStr,
            nextDailySolved,
            prev.dailyGoalTarget
          ),
          goldenBalloonsMastered: prev.goldenBalloonsMastered + goldenSolvedDelta,
          unlockedAchievements: { ...prev.unlockedAchievements },
        };
        ACHIEVEMENTS.forEach((ach) => {
          if (ach.condition(next)) {
            next.unlockedAchievements[ach.id] = true;
          }
        });
        return next;
      });
    },
    []
  );

  const triggerGoldenFireworks = useCallback(() => {
    soundEngine.playGrandFireworksFanfare();
    setFireworksMode('golden');
    setShowFiveGoldenModal(true);
  }, []);

  const triggerCyberBurst = useCallback(() => {
    soundEngine.playWin();
    setFireworksMode('cyber');
    setShowFiveGoldenModal(false);
  }, []);

  const handleClaimFiveGoldenReward = () => {
    soundEngine.playGoldenPopSound();
    handleUpdateBalloonRewards(250, 10, 0);
    setShowFiveGoldenModal(false);
  };

  const handleBuyStreakFreeze = useCallback(() => {
    setPlayerStats((prev) => {
      if (prev.coins < STREAK_FREEZE_COST || prev.streakFreezes >= MAX_STREAK_FREEZES) {
        return prev;
      }
      soundEngine.playGoldenPopSound();
      return {
        ...prev,
        coins: prev.coins - STREAK_FREEZE_COST,
        streakFreezes: prev.streakFreezes + 1,
      };
    });
  }, []);

  const handleResetAllStats = () => {
    soundEngine.playClick();
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(LAST_LOGIN_STORAGE_KEY);
    localStorage.removeItem(DAILY_STREAK_STORAGE_KEY);
    setLevelUnlockEvent(null);
    setShowLevelUnlockModal(false);
    setPlayerStats(syncDailyStreakWithStorage(DEFAULT_PLAYER_STATS));
  };

  return (
    <div className="min-h-screen cyber-grid-bg text-slate-100 flex flex-col">
      {/* Strict 3-Zone Top Bar Contract */}
      <header className="sticky top-0 z-30 bg-[#080915]/90 backdrop-blur-md border-b border-[#1f2444]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-8">
          {/* Zone 1: Single text element wordmark */}
          <a
            href="#arcade"
            onClick={(e) => {
              e.preventDefault();
              soundEngine.playClick();
              setActiveTab('arcade');
            }}
            className="text-lg sm:text-xl font-black tracking-tight text-white whitespace-nowrap shrink-0"
          >
            TO BE CHALLENGE
          </a>

          {/* Zone 2: 5 concise single-line text navigation links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300">
            <a
              href="#arcade"
              onClick={(e) => {
                e.preventDefault();
                soundEngine.playClick();
                setActiveTab('arcade');
              }}
              className={`transition-colors whitespace-nowrap shrink-0 hover:underline underline-offset-8 ${
                activeTab === 'arcade' ? 'text-cyan-400 font-bold underline' : 'hover:text-white'
              }`}
            >
              Grammar Arcade
            </a>
            <a
              href="#balloon"
              onClick={(e) => {
                e.preventDefault();
                soundEngine.playClick();
                setActiveTab('balloon');
              }}
              className={`transition-colors whitespace-nowrap shrink-0 hover:underline underline-offset-8 ${
                activeTab === 'balloon' ? 'text-amber-300 font-bold underline' : 'hover:text-white'
              }`}
            >
              Balloon Pop
            </a>
            <a
              href="#rules"
              onClick={(e) => {
                e.preventDefault();
                soundEngine.playClick();
                setActiveTab('rules');
              }}
              className={`transition-colors whitespace-nowrap shrink-0 hover:underline underline-offset-8 ${
                activeTab === 'rules' ? 'text-purple-300 font-bold underline' : 'hover:text-white'
              }`}
            >
              Rules Guide
            </a>
            <a
              href="#audio"
              onClick={(e) => {
                e.preventDefault();
                soundEngine.playClick();
                setActiveTab('audio');
              }}
              className={`transition-colors whitespace-nowrap shrink-0 hover:underline underline-offset-8 ${
                activeTab === 'audio' ? 'text-emerald-300 font-bold underline' : 'hover:text-white'
              }`}
            >
              Audio Studio
            </a>
            <a
              href="#achievements"
              onClick={(e) => {
                e.preventDefault();
                soundEngine.playClick();
                setActiveTab('achievements');
              }}
              className={`transition-colors whitespace-nowrap shrink-0 hover:underline underline-offset-8 ${
                activeTab === 'achievements' ? 'text-pink-300 font-bold underline' : 'hover:text-white'
              }`}
            >
              Achievements
            </a>
          </nav>

          {/* Zone 3: 1 primary action */}
          <div className="flex items-center shrink-0">
            <button
              onClick={() => {
                soundEngine.playClick();
                setActiveTab(activeTab === 'arcade' ? 'balloon' : 'arcade');
              }}
              className="px-4 py-2 text-xs font-mono font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {activeTab === 'arcade' ? 'Play Balloon Pop' : 'Play Grammar Arcade'}
            </button>
          </div>
        </div>
      </header>

      {/* Workspace Status & Mobile Mode Switcher Strip (Below the Fold) */}
      <div className="border-b border-[#1f2444] bg-[#0f1123]/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3">
          {/* Mobile Navigation Links */}
          <div className="flex md:hidden items-center gap-2 overflow-x-auto py-1">
            {(
              [
                { id: 'arcade', label: 'Arcade' },
                { id: 'balloon', label: 'Balloon Pop' },
                { id: 'rules', label: 'Rules' },
                { id: 'audio', label: '5-Band EQ' },
                { id: 'achievements', label: 'Records' },
              ] as Array<{ id: ActiveTab; label: string }>
            ).map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  soundEngine.playClick();
                  setActiveTab(item.id);
                }}
                className={`px-2.5 py-1 rounded-md text-xs font-mono whitespace-nowrap shrink-0 cursor-pointer ${
                  activeTab === item.id
                    ? 'bg-cyan-400 text-slate-950 font-bold'
                    : 'text-slate-300 bg-[#080915]'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Unboxed Telemetry Readout with Typographic Separators & Daily Goal */}
          <div className="flex flex-wrap items-center gap-2.5 text-xs font-mono text-slate-300">
            <span
              title={`Last login date: ${playerStats.lastLoginDate || getTodayDateString()}`}
              className="text-orange-400 font-bold tabular-nums inline-flex items-center gap-1"
            >
              <Flame className="w-3.5 h-3.5 text-orange-400 shrink-0" />
              <span>
                STREAK: {playerStats.dailyStreak} {playerStats.dailyStreak === 1 ? 'DAY' : 'DAYS'}
              </span>
            </span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <DailyGoalStatus
              solvedToday={playerStats.dailyQuestionsSolved}
              targetQuestions={playerStats.dailyGoalTarget}
              dailyStreak={playerStats.dailyStreak}
              rewardClaimed={playerStats.dailyGoalRewardClaimed}
              streakFreezes={playerStats.streakFreezes}
              coins={playerStats.coins}
              dailyHistory={playerStats.dailyHistory}
              onBuyStreakFreeze={handleBuyStreakFreeze}
              onClaimBonus={() => {
                setPlayerStats((prev) => ({
                  ...prev,
                  coins: prev.coins + 30,
                  stars: prev.stars + 2,
                  totalScore: prev.totalScore + 30,
                  highScore: Math.max(prev.highScore, prev.totalScore + 30),
                  dailyGoalRewardClaimed: true,
                }));
              }}
              onChangeTarget={(newTarget) => {
                setPlayerStats((prev) => {
                  const todayStr = prev.lastLoginDate || getTodayDateString();
                  return {
                    ...prev,
                    dailyGoalTarget: newTarget,
                    dailyHistory: upsertDailyHistory(
                      prev.dailyHistory,
                      todayStr,
                      prev.dailyQuestionsSolved,
                      newTarget
                    ),
                  };
                });
              }}
            />
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span className="text-cyan-300 font-bold tabular-nums">
              {playerStats.totalScore} PTS
            </span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span className="text-purple-300 font-bold tabular-nums">
              HIGH: {playerStats.highScore}
            </span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span className="text-amber-300 font-bold tabular-nums">
              {playerStats.coins} Coins
            </span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span className="text-emerald-300 font-bold tabular-nums">
              {playerStats.stars} Stars
            </span>
          </div>

          {/* Utility Controls: Audio Mute & Quick Fireworks */}
          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={triggerGoldenFireworks}
              className="px-3 py-1.5 rounded-lg bg-[#080915] hover:bg-slate-800 border border-[#1f2444] text-xs font-mono text-amber-300 flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <Sparkles className="w-3.5 h-3.5" />
              5-Gold Fireworks
            </button>
            <button
              onClick={toggleMute}
              aria-label={muted ? 'Unmute Audio' : 'Mute Audio'}
              className="px-3 py-1.5 rounded-lg bg-[#080915] hover:bg-slate-800 border border-[#1f2444] text-xs font-mono text-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              {muted ? (
                <>
                  <VolumeX className="w-3.5 h-3.5 text-rose-400" />
                  <span>Muted</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Audio On</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
        {activeTab === 'arcade' && (
          <GrammarArcadeView
            playerStats={playerStats}
            onSessionComplete={handleSessionComplete}
            onNavigateTab={setActiveTab}
            onTriggerCyberBurst={triggerCyberBurst}
            onUnlockLevelWithCoins={handleUnlockLevelWithCoins}
            pendingLaunchLevel={pendingLaunchLevel}
            onClearPendingLaunchLevel={() => setPendingLaunchLevel(null)}
          />
        )}

        {activeTab === 'balloon' && (
          <BalloonPopView
            playerStats={playerStats}
            onUpdateBalloonRewards={handleUpdateBalloonRewards}
            onTriggerGoldenFireworks={triggerGoldenFireworks}
          />
        )}

        {activeTab === 'rules' && (
          <RulesGuideView
            onStartArcade={() => setActiveTab('arcade')}
            onStartBalloonPop={() => setActiveTab('balloon')}
          />
        )}

        {activeTab === 'audio' && (
          <AudioStudioView
            onTriggerGoldenFireworks={triggerGoldenFireworks}
            onTriggerCyberBurst={triggerCyberBurst}
          />
        )}

        {activeTab === 'achievements' && (
          <AchievementsView
            playerStats={playerStats}
            onResetAllStats={handleResetAllStats}
            onTriggerGoldenFireworks={triggerGoldenFireworks}
            onBuyStreakFreeze={handleBuyStreakFreeze}
          />
        )}
      </main>

      {/* Quiet Footer */}
      <footer className="border-t border-[#1f2444] py-5 px-4 sm:px-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>TO BE CHALLENGE · English Grammar & Subject-Verb Agreement Arcade</span>
          <span>5 Syntax Modes · Subject-Verb Pop Adventure · 5-Band Web Audio Synthesizer</span>
        </div>
      </footer>

      {/* Celebratory Difficulty Level Unlock Notification (Modal + Floating Toast) */}
      <LevelUnlockNotification
        event={levelUnlockEvent}
        showModal={showLevelUnlockModal}
        unlockedLevel={Math.max(1, playerStats.unlockedLevel || 1)}
        levelStars={playerStats.levelStars}
        onCloseModal={() => setShowLevelUnlockModal(false)}
        onDismissAll={() => {
          setShowLevelUnlockModal(false);
          setLevelUnlockEvent(null);
        }}
        onReopenModal={() => setShowLevelUnlockModal(true)}
        onPlayUnlockedLevel={(targetLevel) => {
          setShowLevelUnlockModal(false);
          setLevelUnlockEvent(null);
          setActiveTab('arcade');
          setPendingLaunchLevel(targetLevel);
        }}
      />

      {/* Fireworks & Celebration Canvas Overlay */}
      <FireworksOverlay
        active={fireworksMode !== null}
        mode={fireworksMode}
        showFiveGoldenModal={showFiveGoldenModal}
        onClaimFiveGoldenReward={handleClaimFiveGoldenReward}
        onCloseModalOnly={() => setShowFiveGoldenModal(false)}
        onStopFireworks={() => {
          setFireworksMode(null);
          setShowFiveGoldenModal(false);
        }}
      />
    </div>
  );
}
