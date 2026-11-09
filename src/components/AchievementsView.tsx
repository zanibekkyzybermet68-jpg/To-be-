import React, { useState } from 'react';
import { Trophy, RotateCcw, Sparkles, CheckCircle2, Lock, Snowflake, Coins } from 'lucide-react';
import {
  ACHIEVEMENTS,
  DIFFICULTY_LEVELS,
  PlayerStats,
  STREAK_FREEZE_COST,
  MAX_STREAK_FREEZES,
} from '../data/questions';
import { soundEngine } from '../utils/soundEngine';

interface AchievementsViewProps {
  playerStats: PlayerStats;
  onResetAllStats: () => void;
  onTriggerGoldenFireworks: () => void;
  onBuyStreakFreeze: () => void;
}

export const AchievementsView: React.FC<AchievementsViewProps> = ({
  playerStats,
  onResetAllStats,
  onTriggerGoldenFireworks,
  onBuyStreakFreeze,
}) => {
  const [confirmingReset, setConfirmingReset] = useState<boolean>(false);
  const canBuyFreeze =
    playerStats.coins >= STREAK_FREEZE_COST && playerStats.streakFreezes < MAX_STREAK_FREEZES;

  return (
    <div className="w-full py-2 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#1f2444]">
        <div>
          <div className="text-xs font-mono text-amber-300">
            HALL OF RECORDS · PERSISTENT CAREER STATS
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white">
            Player Stats, Star Records & Trophies
          </h2>
        </div>

        <div className="flex items-center gap-3">
          {!confirmingReset ? (
            <button
              onClick={() => {
                soundEngine.playClick();
                setConfirmingReset(true);
              }}
              className="px-4 py-2 rounded-xl bg-[#0f1123] hover:bg-rose-950/50 border border-rose-500/40 text-xs font-mono text-rose-300 flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Saved Records
            </button>
          ) : (
            <div className="flex items-center gap-2 bg-rose-950/60 border border-rose-500/60 px-3 py-1.5 rounded-xl">
              <span className="text-xs font-mono text-rose-200">Confirm reset?</span>
              <button
                onClick={() => {
                  onResetAllStats();
                  setConfirmingReset(false);
                }}
                className="px-2.5 py-1 rounded-lg bg-rose-500 hover:bg-rose-400 text-white font-mono font-bold text-xs cursor-pointer"
              >
                Yes, Reset
              </button>
              <button
                onClick={() => setConfirmingReset(false)}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono text-xs cursor-pointer"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Primary Career KPIs including Daily Login Streak & Streak Freezes */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
        <div className="p-4 rounded-2xl bg-[#0f1123] border border-orange-500/40">
          <div className="text-xs text-slate-400">Daily Streak</div>
          <div className="text-2xl font-mono font-black text-orange-400 tabular-nums mt-1">
            {playerStats.dailyStreak} {playerStats.dailyStreak === 1 ? 'Day' : 'Days'}
          </div>
          {playerStats.lastLoginDate && (
            <div className="text-[11px] font-mono text-slate-500 mt-0.5">
              Last: {playerStats.lastLoginDate}
            </div>
          )}
        </div>
        <div className="p-4 rounded-2xl bg-[#0f1123] border border-sky-500/40">
          <div className="text-xs text-slate-400">Streak Freezes</div>
          <div className="text-2xl font-mono font-black text-sky-300 tabular-nums mt-1">
            {playerStats.streakFreezes}/{MAX_STREAK_FREEZES}
          </div>
          <div className="text-[11px] font-mono text-slate-500 mt-0.5">
            Shields missed days
          </div>
        </div>
        <div className="p-4 rounded-2xl bg-[#0f1123] border border-[#1f2444]">
          <div className="text-xs text-slate-400">High Score</div>
          <div className="text-2xl font-mono font-black text-cyan-400 tabular-nums mt-1">
            {playerStats.highScore}
          </div>
        </div>
        <div className="p-4 rounded-2xl bg-[#0f1123] border border-[#1f2444]">
          <div className="text-xs text-slate-400">Total Points</div>
          <div className="text-2xl font-mono font-black text-purple-300 tabular-nums mt-1">
            {playerStats.totalScore}
          </div>
        </div>
        <div className="p-4 rounded-2xl bg-[#0f1123] border border-[#1f2444]">
          <div className="text-xs text-slate-400">Missions Played</div>
          <div className="text-2xl font-mono font-black text-white tabular-nums mt-1">
            {playerStats.gamesPlayed}
          </div>
        </div>
        <div className="p-4 rounded-2xl bg-[#0f1123] border border-[#1f2444]">
          <div className="text-xs text-slate-400">Questions Solved</div>
          <div className="text-2xl font-mono font-black text-emerald-400 tabular-nums mt-1">
            {playerStats.questionsSolved}
          </div>
        </div>
        <div className="p-4 rounded-2xl bg-[#0f1123] border border-[#1f2444]">
          <div className="text-xs text-slate-400">Best Answer Streak</div>
          <div className="text-2xl font-mono font-black text-amber-300 tabular-nums mt-1">
            {playerStats.bestStreak}
          </div>
        </div>
        <div className="p-4 rounded-2xl bg-[#0f1123] border border-[#1f2444]">
          <div className="text-xs text-slate-400">Gold Coins</div>
          <div className="text-2xl font-mono font-black text-yellow-300 tabular-nums mt-1">
            {playerStats.coins}
          </div>
        </div>
      </div>

      {/* Streak Freeze Store Banner */}
      <div className="bg-[#0f1123] border border-sky-500/30 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-sky-500/15 border border-sky-400/40 flex items-center justify-center shrink-0">
            <Snowflake className="w-5 h-5 text-sky-300" />
          </div>
          <div>
            <div className="text-xs font-mono text-sky-300 font-bold">
              STREAK FREEZE PROTECTION · {playerStats.streakFreezes} / {MAX_STREAK_FREEZES} EQUIPPED
            </div>
            <h3 className="text-lg font-bold text-white mt-0.5">
              Prevent Losing Your Daily Streak on Missed Days
            </h3>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl">
              Each Streak Freeze automatically shields your daily login streak for 1 missed calendar day. Stock up to {MAX_STREAK_FREEZES} shields using your earned Gold Coins.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onBuyStreakFreeze}
            disabled={!canBuyFreeze}
            className={`px-4 py-2.5 rounded-xl font-mono font-bold text-xs flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 ${
              playerStats.streakFreezes >= MAX_STREAK_FREEZES
                ? 'bg-slate-800/80 text-slate-400 border border-slate-700 cursor-not-allowed'
                : canBuyFreeze
                ? 'bg-sky-400 hover:bg-sky-300 text-slate-950 cursor-pointer'
                : 'bg-slate-800/80 text-slate-400 border border-slate-700 cursor-not-allowed'
            }`}
          >
            <Coins className="w-4 h-4" />
            {playerStats.streakFreezes >= MAX_STREAK_FREEZES
              ? `Max Freezes (${MAX_STREAK_FREEZES}/${MAX_STREAK_FREEZES})`
              : `Buy Streak Freeze · ${STREAK_FREEZE_COST} Coins`}
          </button>
        </div>
      </div>

      {/* Level 1-5 Star Records */}
      <div className="bg-[#0f1123] border border-[#1f2444] rounded-2xl p-6">
        <div className="text-xs font-mono text-cyan-400 mb-1">
          SECTOR PROGRESSION
        </div>
        <h3 className="text-xl font-bold text-white mb-4">
          Level 1–5 Star Rating Records
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3.5">
          {DIFFICULTY_LEVELS.map((lvl) => {
            const stars = playerStats.levelStars[lvl.level] || 0;
            return (
              <div
                key={lvl.level}
                className="p-4 rounded-xl bg-[#080915] border border-[#1f2444] text-center"
              >
                <div className="text-xs font-mono font-bold text-purple-300">
                  LEVEL {lvl.level}
                </div>
                <div className="text-sm font-bold text-white mt-0.5">
                  {lvl.name}
                </div>
                <div className="text-lg font-mono text-amber-300 mt-2 tracking-widest">
                  {stars > 0 ? '★'.repeat(stars) + '☆'.repeat(3 - stars) : '☆☆☆'}
                </div>
                <div className="text-[11px] font-mono text-slate-500 mt-1">
                  {stars > 0 ? `${stars}/3 Stars Earned` : 'Not Cleared Yet'}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Achievements Grid */}
      <div className="bg-[#0f1123] border border-[#1f2444] rounded-2xl p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div>
            <div className="text-xs font-mono text-amber-300">TROPHY CABINET</div>
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-300" />
              Unlocked Achievements & Milestones
            </h3>
          </div>
          <button
            onClick={onTriggerGoldenFireworks}
            className="px-4 py-2 rounded-xl bg-amber-400/15 hover:bg-amber-400/25 border border-amber-400/40 text-xs font-mono text-amber-300 flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            <Sparkles className="w-4 h-4" />
            Celebrate with Fireworks
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {ACHIEVEMENTS.map((ach) => {
            const unlocked =
              Boolean(playerStats.unlockedAchievements[ach.id]) || ach.condition(playerStats);
            return (
              <div
                key={ach.id}
                className={`p-4 rounded-xl border flex items-start justify-between gap-3 transition-all ${
                  unlocked
                    ? 'bg-purple-500/10 border-purple-400/60 text-white'
                    : 'bg-[#080915] border-[#1f2444] text-slate-400 opacity-75'
                }`}
              >
                <div>
                  <div className="font-bold text-base text-white">
                    {ach.title}
                  </div>
                  <div className="text-xs text-slate-300 mt-0.5">
                    {ach.desc}
                  </div>
                  <div className="mt-2.5 flex items-center gap-1.5 text-[11px] font-mono">
                    {unlocked ? (
                      <span className="text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> UNLOCKED
                      </span>
                    ) : (
                      <span className="text-slate-500 flex items-center gap-1">
                        <Lock className="w-3.5 h-3.5" /> LOCKED
                      </span>
                    )}
                  </div>
                </div>
                <span className="text-2xl shrink-0" aria-hidden="true">
                  {ach.icon}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
