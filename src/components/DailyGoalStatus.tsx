import React, { useState, useMemo } from 'react';
import {
  Target,
  CheckCircle2,
  Sparkles,
  ChevronDown,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';
import { soundEngine } from '../utils/soundEngine';
import {
  STREAK_FREEZE_COST,
  MAX_STREAK_FREEZES,
  DailyGoalHistoryEntry,
} from '../data/questions';

interface DailyGoalStatusProps {
  solvedToday: number;
  targetQuestions: number;
  dailyStreak: number;
  rewardClaimed: boolean;
  streakFreezes: number;
  coins: number;
  dailyHistory?: DailyGoalHistoryEntry[];
  onClaimBonus: () => void;
  onBuyStreakFreeze: () => void;
  onChangeTarget?: (newTarget: number) => void;
}

export interface SevenDayPoint {
  date: string;
  dayShort: string;
  solved: number;
  target: number;
  pct: number;
  metGoal: boolean;
  isToday: boolean;
}

const SHORT_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function formatDateYMD(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function calculateAdaptiveDailyGoal(dailyStreak: number, gamesPlayed: number): number {
  const streakBonus = Math.max(0, (dailyStreak - 1) * 2);
  const experienceBonus = Math.min(5, Math.floor(gamesPlayed / 3) * 5);
  return Math.min(30, 10 + streakBonus + experienceBonus);
}

export function buildSevenDaySeries(
  dailyHistory: DailyGoalHistoryEntry[] | undefined,
  solvedToday: number,
  targetToday: number,
  dailyStreak: number
): SevenDayPoint[] {
  const historyMap = new Map<string, DailyGoalHistoryEntry>();
  if (Array.isArray(dailyHistory)) {
    for (const item of dailyHistory) {
      if (item && typeof item.date === 'string') {
        historyMap.set(item.date, item);
      }
    }
  }

  const now = new Date();
  const points: SevenDayPoint[] = [];

  for (let offset = 6; offset >= 0; offset--) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - offset);
    const dateStr = formatDateYMD(d);
    const isToday = offset === 0;
    const stored = historyMap.get(dateStr);

    let solved = 0;
    let target = Math.max(5, targetToday || 10);

    if (isToday) {
      solved = Math.max(0, solvedToday);
      target = Math.max(5, targetToday || 10);
    } else if (stored) {
      solved = Math.max(0, stored.solved || 0);
      target = Math.max(5, stored.target || 10);
    } else if (offset < dailyStreak) {
      // If user has an active multi-day streak covering this past day, reflect completed target
      target = 10;
      solved = 10;
    }

    const pct = Math.min(100, Math.round((solved / target) * 100));
    points.push({
      date: dateStr,
      dayShort: isToday ? 'Today' : SHORT_DAYS[d.getDay()],
      solved,
      target,
      pct,
      metGoal: solved >= target,
      isToday,
    });
  }

  return points;
}

export const DailyGoalStatus: React.FC<DailyGoalStatusProps> = ({
  solvedToday,
  targetQuestions,
  dailyStreak,
  rewardClaimed,
  streakFreezes,
  coins,
  dailyHistory,
  onClaimBonus,
  onBuyStreakFreeze,
  onChangeTarget,
}) => {
  const [openDetails, setOpenDetails] = useState<boolean>(false);
  const [selectedDayIdx, setSelectedDayIdx] = useState<number>(6);

  const safeTarget = Math.max(5, targetQuestions || 10);
  const clampedSolved = Math.min(solvedToday, safeTarget);
  const progressPct = Math.min(100, Math.round((clampedSolved / safeTarget) * 100));
  const isCompleted = solvedToday >= safeTarget;
  const remaining = Math.max(0, safeTarget - solvedToday);
  const canAffordFreeze = coins >= STREAK_FREEZE_COST && streakFreezes < MAX_STREAK_FREEZES;

  const sevenDaySeries = useMemo(
    () => buildSevenDaySeries(dailyHistory, solvedToday, safeTarget, dailyStreak),
    [dailyHistory, solvedToday, safeTarget, dailyStreak]
  );

  // Summary stats across the 7-day window
  const daysMetCount = useMemo(
    () => sevenDaySeries.filter((p) => p.metGoal).length,
    [sevenDaySeries]
  );
  const avgSevenDayPct = useMemo(
    () =>
      Math.round(
        sevenDaySeries.reduce((acc, p) => acc + p.pct, 0) / Math.max(1, sevenDaySeries.length)
      ),
    [sevenDaySeries]
  );
  const totalSevenDaySolved = useMemo(
    () => sevenDaySeries.reduce((acc, p) => acc + p.solved, 0),
    [sevenDaySeries]
  );

  // Coordinates for Inline Header Mini-Sparkline (46x16 viewBox)
  const miniSparklineCoords = useMemo(() => {
    const w = 46;
    const h = 16;
    const padX = 3;
    const padY = 3;
    const usableW = w - padX * 2;
    const usableH = h - padY * 2;

    return sevenDaySeries.map((pt, idx) => {
      const x = padX + (idx / 6) * usableW;
      const y = padY + usableH - (pt.pct / 100) * usableH;
      return { x: Number(x.toFixed(1)), y: Number(y.toFixed(1)), pt };
    });
  }, [sevenDaySeries]);

  const miniPolylinePoints = useMemo(
    () => miniSparklineCoords.map((c) => `${c.x},${c.y}`).join(' '),
    [miniSparklineCoords]
  );

  const miniAreaPoints = useMemo(() => {
    if (miniSparklineCoords.length === 0) return '';
    const first = miniSparklineCoords[0];
    const last = miniSparklineCoords[miniSparklineCoords.length - 1];
    return `${first.x},14 ${miniPolylinePoints} ${last.x},14`;
  }, [miniSparklineCoords, miniPolylinePoints]);

  // Coordinates for Popover Detailed 7-Day Sparkline (280x68 viewBox)
  const detailSparklineCoords = useMemo(() => {
    const w = 280;
    const h = 68;
    const padX = 16;
    const padTop = 10;
    const padBottom = 10;
    const usableW = w - padX * 2;
    const usableH = h - padTop - padBottom;

    return sevenDaySeries.map((pt, idx) => {
      const x = padX + (idx / 6) * usableW;
      const y = padTop + usableH - (pt.pct / 100) * usableH;
      return { x: Number(x.toFixed(1)), y: Number(y.toFixed(1)), pt, idx };
    });
  }, [sevenDaySeries]);

  const detailPolylinePoints = useMemo(
    () => detailSparklineCoords.map((c) => `${c.x},${c.y}`).join(' '),
    [detailSparklineCoords]
  );

  const detailAreaPoints = useMemo(() => {
    if (detailSparklineCoords.length === 0) return '';
    const first = detailSparklineCoords[0];
    const last = detailSparklineCoords[detailSparklineCoords.length - 1];
    return `${first.x},58 ${detailPolylinePoints} ${last.x},58`;
  }, [detailSparklineCoords, detailPolylinePoints]);

  const inspectedDay = sevenDaySeries[selectedDayIdx] || sevenDaySeries[6];

  return (
    <div className="relative inline-flex items-center">
      <div className="inline-flex items-center gap-2.5">
        <button
          type="button"
          onClick={() => {
            soundEngine.playClick();
            setSelectedDayIdx(6);
            setOpenDetails((prev) => !prev);
          }}
          title={
            isCompleted
              ? `Daily Goal Complete! (${solvedToday}/${safeTarget} today · ${daysMetCount}/7 days met)`
              : `Solve ${remaining} more question${remaining === 1 ? '' : 's'} today (${daysMetCount}/7 days met)`
          }
          className="inline-flex items-center gap-2 text-xs font-mono cursor-pointer hover:opacity-90 transition-opacity"
        >
          {isCompleted ? (
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          ) : (
            <Target className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          )}
          <span className={isCompleted ? 'text-emerald-300 font-bold' : 'text-slate-200 font-bold'}>
            DAILY GOAL:
          </span>
          <span className="tabular-nums font-bold text-white">
            {solvedToday}/{safeTarget}
          </span>
          <div className="w-14 h-2 bg-[#080915] rounded-full overflow-hidden border border-[#1f2444] p-0.5 hidden sm:block">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                isCompleted
                  ? 'bg-emerald-400'
                  : 'bg-gradient-to-r from-cyan-400 to-purple-400'
              }`}
              style={{ width: `${progressPct}%` }}
            />
          </div>

          {/* Inline 7-Day Mini Sparkline in Status Header */}
          <div
            className="hidden md:flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#080915] border border-[#1f2444]"
            title={`7-Day Trend: ${daysMetCount}/7 goals met · ${avgSevenDayPct}% avg completion`}
          >
            <svg
              width="46"
              height="16"
              viewBox="0 0 46 16"
              className="overflow-visible shrink-0"
              aria-label="7-day completion sparkline"
            >
              <defs>
                <linearGradient id="miniSparkAreaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#00F0FF" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#00F0FF" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              <polygon points={miniAreaPoints} fill="url(#miniSparkAreaGrad)" />
              <polyline
                fill="none"
                stroke={isCompleted ? '#34d399' : '#22d3ee'}
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={miniPolylinePoints}
              />
              {miniSparklineCoords.map((c, idx) => (
                <circle
                  key={c.pt.date}
                  cx={c.x}
                  cy={c.y}
                  r={idx === 6 ? 2.2 : 1.3}
                  fill={c.pt.metGoal ? '#34d399' : idx === 6 ? '#22d3ee' : '#64748b'}
                />
              ))}
            </svg>
            <span className="text-[10px] font-mono text-cyan-300 tabular-nums">
              7d
            </span>
          </div>

          <span className="text-[11px] text-slate-400 tabular-nums hidden lg:inline">
            ({progressPct}%)
          </span>
          <ChevronDown className="w-3 h-3 text-slate-400" />
        </button>

        <span aria-hidden="true" className="text-slate-600">·</span>

        <button
          type="button"
          onClick={() => {
            soundEngine.playClick();
            setOpenDetails((prev) => !prev);
          }}
          title={`Streak Freezes equipped: ${streakFreezes}/${MAX_STREAK_FREEZES}. Protects your streak if you miss a day!`}
          className="inline-flex items-center gap-1 text-xs font-mono text-sky-300 font-bold tabular-nums cursor-pointer hover:text-sky-200 transition-colors"
        >
          <ShieldCheck className="w-3.5 h-3.5 text-sky-400 shrink-0" />
          <span>FREEZE: {streakFreezes}/{MAX_STREAK_FREEZES}</span>
        </button>

        {isCompleted && !rewardClaimed && (
          <button
            type="button"
            onClick={() => {
              soundEngine.playGoldenPopSound();
              onClaimBonus();
            }}
            className="px-2 py-0.5 rounded bg-amber-400 hover:bg-amber-300 text-slate-950 font-mono font-bold text-[11px] flex items-center gap-1 transition-colors cursor-pointer whitespace-nowrap"
          >
            <Sparkles className="w-3 h-3" />
            Claim +30 Coins
          </button>
        )}
      </div>

      {openDetails && (
        <div className="absolute left-0 top-full mt-2 w-80 sm:w-[26rem] rounded-xl bg-[#0f1123] border border-[#1f2444] p-4 shadow-2xl z-40 text-left">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono font-bold text-cyan-400">
              DAILY ENGAGEMENT TARGET
            </span>
            <span className="text-[11px] font-mono text-slate-400 tabular-nums">
              {solvedToday} / {safeTarget} Solved ({progressPct}%)
            </span>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed mb-3">
            {isCompleted
              ? 'Fantastic consistency! You reached today’s target question count.'
              : `Solve ${remaining} more question${remaining === 1 ? '' : 's'} across Grammar Arcade or Balloon Pop today to hit your daily target!`}
          </p>

          <div className="w-full h-2.5 bg-[#080915] rounded-full overflow-hidden border border-[#1f2444] p-0.5 mb-2.5">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                isCompleted
                  ? 'bg-emerald-400'
                  : 'bg-gradient-to-r from-cyan-400 via-purple-400 to-emerald-400'
              }`}
              style={{ width: `${progressPct}%` }}
            />
          </div>

          <div className="text-[11px] font-mono text-slate-400 mb-3">
            Adaptive Pace: Base 10 + Streak Bonus ({dailyStreak}d)
          </div>

          {/* 7-Day Historical Completion Sparkline Chart */}
          <div className="pt-3 pb-3 border-t border-[#1f2444]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono font-bold text-emerald-300 flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                7-DAY CONSISTENCY SPARKLINE
              </span>
              <span className="text-[11px] font-mono text-cyan-300 tabular-nums">
                {daysMetCount}/7 Goal Met · {avgSevenDayPct}% Avg
              </span>
            </div>

            <div className="bg-[#080915] border border-[#1f2444] rounded-xl p-3">
              {/* Inspected Day Telemetry Header */}
              <div className="flex items-center justify-between text-[11px] font-mono mb-2 pb-1.5 border-b border-white/5">
                <span className="text-slate-300 font-bold">
                  {inspectedDay.dayShort} ({inspectedDay.date})
                </span>
                <span
                  className={`tabular-nums font-bold ${
                    inspectedDay.metGoal ? 'text-emerald-400' : 'text-cyan-300'
                  }`}
                >
                  {inspectedDay.solved}/{inspectedDay.target}Q ({inspectedDay.pct}%)
                  {inspectedDay.metGoal ? ' · GOAL MET' : ''}
                </span>
              </div>

              {/* SVG 7-Day Sparkline */}
              <svg
                viewBox="0 0 280 68"
                className="w-full h-16 overflow-visible"
                role="img"
                aria-label="7-day daily goal completion sparkline chart"
              >
                <defs>
                  <linearGradient id="detailSparkAreaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#00F0FF" stopOpacity="0.32" />
                    <stop offset="100%" stopColor="#B026FF" stopOpacity="0.02" />
                  </linearGradient>
                  <linearGradient id="detailSparkLineGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#00F0FF" />
                    <stop offset="60%" stopColor="#B026FF" />
                    <stop offset="100%" stopColor="#00FF66" />
                  </linearGradient>
                </defs>

                {/* 100% Target Reference Dashed Line */}
                <line
                  x1="16"
                  y1="10"
                  x2="264"
                  y2="10"
                  stroke="#1f2444"
                  strokeWidth="1"
                  strokeDasharray="3 3"
                />
                {/* 50% Midline Reference */}
                <line
                  x1="16"
                  y1="34"
                  x2="264"
                  y2="34"
                  stroke="#1f2444"
                  strokeWidth="0.75"
                  strokeDasharray="2 4"
                />
                {/* 0% Baseline */}
                <line x1="16" y1="58" x2="264" y2="58" stroke="#1f2444" strokeWidth="1" />

                {/* Area Fill under Sparkline */}
                <polygon points={detailAreaPoints} fill="url(#detailSparkAreaGrad)" />

                {/* Connecting Sparkline Curve */}
                <polyline
                  fill="none"
                  stroke="url(#detailSparkLineGrad)"
                  strokeWidth="2.25"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={detailPolylinePoints}
                />

                {/* Interactive Data Nodes for Each of the 7 Days */}
                {detailSparklineCoords.map((c) => {
                  const isSelected = c.idx === selectedDayIdx;
                  const nodeColor = c.pt.metGoal
                    ? '#34d399'
                    : c.pt.solved > 0
                    ? '#22d3ee'
                    : '#475569';
                  return (
                    <g
                      key={c.pt.date}
                      className="cursor-pointer"
                      onMouseEnter={() => setSelectedDayIdx(c.idx)}
                      onClick={() => {
                        soundEngine.playClick();
                        setSelectedDayIdx(c.idx);
                      }}
                    >
                      {/* Outer halo for selected or today node */}
                      {(isSelected || c.pt.isToday) && (
                        <circle
                          cx={c.x}
                          cy={c.y}
                          r={isSelected ? 6.5 : 5}
                          fill={nodeColor}
                          fillOpacity="0.22"
                        />
                      )}
                      <circle
                        cx={c.x}
                        cy={c.y}
                        r={isSelected ? 4 : 3}
                        fill={nodeColor}
                        stroke="#080915"
                        strokeWidth="1.25"
                      />
                    </g>
                  );
                })}
              </svg>

              {/* 7-Day X-Axis Labels & Mini Completion Dots */}
              <div className="grid grid-cols-7 gap-1 mt-1 text-center">
                {sevenDaySeries.map((pt, idx) => {
                  const isSelected = idx === selectedDayIdx;
                  return (
                    <button
                      key={pt.date}
                      type="button"
                      onMouseEnter={() => setSelectedDayIdx(idx)}
                      onClick={() => {
                        soundEngine.playClick();
                        setSelectedDayIdx(idx);
                      }}
                      className={`py-1 rounded text-[10px] font-mono transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-cyan-500/15 text-cyan-300 font-bold'
                          : pt.metGoal
                          ? 'text-emerald-300 hover:bg-white/5'
                          : 'text-slate-400 hover:bg-white/5'
                      }`}
                    >
                      <div>{pt.dayShort}</div>
                      <div className="text-[9px] tabular-nums opacity-80">{pt.pct}%</div>
                    </button>
                  );
                })}
              </div>

              <div className="mt-2 pt-2 border-t border-white/5 flex items-center justify-between text-[10px] font-mono text-slate-400">
                <span>7-Day Total Solved:</span>
                <span className="text-white font-bold tabular-nums">
                  {totalSevenDaySolved} Questions
                </span>
              </div>
            </div>
          </div>

          {onChangeTarget && (
            <div className="pt-2.5 pb-3 border-t border-[#1f2444] flex items-center justify-between gap-2">
              <span className="text-[11px] font-mono text-slate-400">Daily Target:</span>
              <div className="flex items-center gap-1.5">
                {[10, 15, 20, 25].map((presetTarget) => (
                  <button
                    key={presetTarget}
                    type="button"
                    onClick={() => {
                      soundEngine.playClick();
                      onChangeTarget(presetTarget);
                    }}
                    className={`px-2 py-1 rounded text-[11px] font-mono cursor-pointer transition-colors ${
                      safeTarget === presetTarget
                        ? 'bg-cyan-400 text-slate-950 font-bold'
                        : 'bg-[#080915] text-slate-300 hover:text-white border border-[#1f2444]'
                    }`}
                  >
                    {presetTarget}Q
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Streak Freeze Shop Section inside Popover */}
          <div className="pt-3 border-t border-[#1f2444]">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-mono font-bold text-sky-300 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-sky-400" />
                Streak Freeze Protection
              </span>
              <span className="text-[11px] font-mono text-sky-200 tabular-nums">
                {streakFreezes} / {MAX_STREAK_FREEZES} Equipped
              </span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed mb-3">
              Automatically consumes 1 Streak Freeze per missed calendar day to prevent your daily streak from resetting.
            </p>
            <button
              type="button"
              disabled={!canAffordFreeze}
              onClick={() => {
                onBuyStreakFreeze();
              }}
              className={`w-full py-2 px-3 rounded-lg font-mono font-bold text-xs flex items-center justify-center gap-2 transition-colors ${
                canAffordFreeze
                  ? 'bg-sky-400 hover:bg-sky-300 text-slate-950 cursor-pointer'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              {streakFreezes >= MAX_STREAK_FREEZES
                ? `Max Streak Freezes Equipped (${MAX_STREAK_FREEZES}/${MAX_STREAK_FREEZES})`
                : coins < STREAK_FREEZE_COST
                ? `Need ${STREAK_FREEZE_COST} Coins (Have ${coins})`
                : `Buy Streak Freeze (${STREAK_FREEZE_COST} Coins)`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
