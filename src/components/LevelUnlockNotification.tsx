import React, { useEffect } from 'react';
import {
  Trophy,
  Sparkles,
  Unlock,
  ArrowRight,
  X,
  CheckCircle2,
  Lock,
  Coins,
  Star,
} from 'lucide-react';
import {
  DIFFICULTY_LEVELS,
  LEVEL_UNLOCK_BONUS_COINS,
} from '../data/questions';
import { soundEngine } from '../utils/soundEngine';

export interface UnlockedLevelEvent {
  level: number;
  previousLevel: number;
  bonusCoins: number;
  bonusStars: number;
  reason: 'mission_clear' | 'coin_unlock';
}

interface LevelUnlockNotificationProps {
  event: UnlockedLevelEvent | null;
  showModal: boolean;
  unlockedLevel: number;
  levelStars: Record<number, number>;
  onCloseModal: () => void;
  onDismissAll: () => void;
  onReopenModal: () => void;
  onPlayUnlockedLevel: (level: number) => void;
}

export const LevelUnlockNotification: React.FC<LevelUnlockNotificationProps> = ({
  event,
  showModal,
  unlockedLevel,
  levelStars,
  onCloseModal,
  onDismissAll,
  onReopenModal,
  onPlayUnlockedLevel,
}) => {
  // Auto-dismiss floating toast after 12 seconds once modal is closed
  useEffect(() => {
    if (!event || showModal) return;
    const timer = setTimeout(() => {
      onDismissAll();
    }, 12000);
    return () => clearTimeout(timer);
  }, [event, showModal, onDismissAll]);

  if (!event) return null;

  const targetLevelInfo =
    DIFFICULTY_LEVELS.find((l) => l.level === event.level) || DIFFICULTY_LEVELS[0];
  const prevLevelInfo =
    DIFFICULTY_LEVELS.find((l) => l.level === event.previousLevel) || DIFFICULTY_LEVELS[0];

  return (
    <>
      {/* Floating Toast Notification Banner (Always visible at top-right when an unlock occurs) */}
      <div
        role="status"
        aria-live="polite"
        className="fixed top-20 right-4 sm:right-6 z-40 max-w-md w-[calc(100vw-2rem)] bg-[#0f1123]/95 backdrop-blur-md border-2 border-cyan-400/80 rounded-2xl p-4 shadow-2xl transition-all"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-400/20 border border-cyan-400/50 flex items-center justify-center shrink-0 text-cyan-300">
              <Unlock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-cyan-300">
                  NEW DIFFICULTY TIER UNLOCKED
                </span>
                <span className="text-xs font-mono text-amber-300">
                  {targetLevelInfo.starsDisplay}
                </span>
              </div>
              <div className="text-base font-black text-white mt-0.5">
                Level {targetLevelInfo.level}: {targetLevelInfo.name}
              </div>
              <div className="text-xs text-slate-300 mt-0.5">
                {targetLevelInfo.subtitle}
              </div>

              <div className="flex flex-wrap items-center gap-2 mt-3">
                <button
                  onClick={() => {
                    soundEngine.playClick();
                    onPlayUnlockedLevel(targetLevelInfo.level);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-mono font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                >
                  <span>Play Level {targetLevelInfo.level}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                {!showModal && (
                  <button
                    onClick={() => {
                      soundEngine.playClick();
                      onReopenModal();
                    }}
                    className="px-2.5 py-1.5 rounded-lg bg-[#080915] hover:bg-slate-800 border border-[#1f2444] text-slate-300 font-mono text-xs transition-colors cursor-pointer whitespace-nowrap shrink-0"
                  >
                    View Details
                  </button>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              soundEngine.playClick();
              onDismissAll();
            }}
            aria-label="Dismiss level unlock notification"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Celebratory Level Unlock Modal */}
      {showModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="level-unlock-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
        >
          <div className="relative w-full max-w-lg bg-[#0f1123] border-2 border-cyan-400 rounded-2xl p-6 sm:p-8 shadow-2xl text-center overflow-hidden">
            {/* Ambient Top Accent Line */}
            <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-[#00F0FF] via-[#B026FF] to-[#00FF66]" />

            {/* Close button */}
            <button
              onClick={() => {
                soundEngine.playClick();
                onCloseModal();
              }}
              aria-label="Close level unlock modal"
              className="absolute top-4 right-4 p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/70 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Emblem */}
            <div className="mx-auto mb-4 w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-400/20 via-purple-500/20 to-emerald-400/20 border-2 border-cyan-400/60 flex items-center justify-center text-cyan-300">
              <Unlock className="w-8 h-8" />
            </div>

            <div className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-cyan-300 tracking-wider uppercase mb-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>GRAMMAR ARCADE SECTOR UNLOCKED</span>
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            </div>

            <h2
              id="level-unlock-modal-title"
              className="text-2xl sm:text-3xl font-black text-white tracking-tight"
            >
              LEVEL {targetLevelInfo.level}: {targetLevelInfo.name.toUpperCase()}
            </h2>

            <div className="text-base font-mono text-amber-300 tracking-widest mt-1 mb-3">
              {targetLevelInfo.starsDisplay}
            </div>

            <p className="text-sm text-slate-300 max-w-md mx-auto leading-relaxed mb-5">
              {event.reason === 'mission_clear' ? (
                <>
                  Outstanding work clearing{' '}
                  <span className="text-white font-bold">
                    Level {prevLevelInfo.level} ({prevLevelInfo.name})
                  </span>
                  ! You have unlocked the next difficulty tier focusing on{' '}
                  <span className="text-cyan-300 font-semibold">
                    {targetLevelInfo.subtitle}
                  </span>
                  .
                </>
              ) : (
                <>
                  You have unlocked{' '}
                  <span className="text-white font-bold">
                    Level {targetLevelInfo.level} ({targetLevelInfo.name})
                  </span>
                  ! Get ready to master{' '}
                  <span className="text-cyan-300 font-semibold">
                    {targetLevelInfo.subtitle}
                  </span>
                  .
                </>
              )}
            </p>

            {/* Unlock Bonus Reward Banner */}
            {event.bonusCoins > 0 && (
              <div className="bg-[#080915] border border-amber-400/40 rounded-xl p-3.5 mb-5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 text-left">
                  <Trophy className="w-5 h-5 text-amber-300 shrink-0" />
                  <div>
                    <div className="text-[11px] font-mono text-slate-400">
                      TIER PROMOTION BONUS
                    </div>
                    <div className="text-xs font-bold text-white">
                      Automatically added to your career vault
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 font-mono text-xs font-bold shrink-0">
                  <span className="text-amber-300 flex items-center gap-1 tabular-nums">
                    <Coins className="w-3.5 h-3.5" />+{event.bonusCoins || LEVEL_UNLOCK_BONUS_COINS} Coins
                  </span>
                  <span className="text-emerald-300 flex items-center gap-1 tabular-nums">
                    <Star className="w-3.5 h-3.5" />+{event.bonusStars} Star
                  </span>
                </div>
              </div>
            )}

            {/* 5-Level Progression Roadmap */}
            <div className="bg-[#080915] border border-[#1f2444] rounded-xl p-4 mb-6 text-left">
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-3">
                <span>ARCADE DIFFICULTY PROGRESSION</span>
                <span className="text-cyan-300 font-bold tabular-nums">
                  {unlockedLevel} / 5 TIERS UNLOCKED
                </span>
              </div>
              <div className="grid grid-cols-5 gap-2">
                {DIFFICULTY_LEVELS.map((lvl) => {
                  const isNewlyUnlocked = lvl.level === targetLevelInfo.level;
                  const isUnlocked = lvl.level <= unlockedLevel;
                  const stars = levelStars[lvl.level] || 0;
                  return (
                    <div
                      key={lvl.level}
                      className={`p-2 rounded-lg border text-center transition-all ${
                        isNewlyUnlocked
                          ? 'bg-cyan-400/20 border-cyan-400 text-white shadow-md'
                          : isUnlocked
                          ? 'bg-purple-500/10 border-purple-500/40 text-slate-200'
                          : 'bg-[#0f1123] border-[#1f2444] text-slate-500 opacity-60'
                      }`}
                    >
                      <div className="flex items-center justify-center mb-1">
                        {isNewlyUnlocked ? (
                          <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
                        ) : isUnlocked ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Lock className="w-3.5 h-3.5 text-slate-500" />
                        )}
                      </div>
                      <div className="text-[11px] font-mono font-bold">
                        LVL {lvl.level}
                      </div>
                      <div className="text-[10px] truncate text-slate-400">
                        {lvl.name}
                      </div>
                      <div className="text-[10px] font-mono text-amber-300 mt-0.5">
                        {stars > 0 ? '★'.repeat(stars) : isUnlocked ? 'OPEN' : 'LOCKED'}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={() => {
                  soundEngine.playClick();
                  onPlayUnlockedLevel(targetLevelInfo.level);
                }}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-mono font-black text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
              >
                <span>Launch Level {targetLevelInfo.level} Now</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  soundEngine.playClick();
                  onCloseModal();
                }}
                className="w-full sm:w-auto px-5 py-3 rounded-xl bg-[#161936] hover:bg-[#1f244d] border border-[#1f2444] text-slate-200 font-mono font-bold text-sm transition-colors cursor-pointer whitespace-nowrap"
              >
                Continue Reviewing Results
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
