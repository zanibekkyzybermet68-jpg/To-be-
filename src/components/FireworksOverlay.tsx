import React, { useEffect, useRef } from 'react';
import { Sparkles, Trophy, Volume2, X } from 'lucide-react';
import { soundEngine } from '../utils/soundEngine';

interface FireworksOverlayProps {
  active: boolean;
  mode: 'golden' | 'cyber' | null;
  showFiveGoldenModal: boolean;
  onClaimFiveGoldenReward: () => void;
  onCloseModalOnly: () => void;
  onStopFireworks: () => void;
}

interface RocketItem {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  vx: number;
  vy: number;
  color: string;
}

interface ParticleItem {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  alpha: number;
  decay: number;
  size: number;
  glyph?: string;
}

const GOLDEN_COLORS = ['#FFD700', '#FFAE00', '#00F0FF', '#FF007F', '#00FF66', '#FFFFFF'];
const CYBER_GLYPHS = ['0', '1', 'AM', 'IS', 'ARE', '<>', '101', 'S+'];

export const FireworksOverlay: React.FC<FireworksOverlayProps> = ({
  active,
  mode,
  showFiveGoldenModal,
  onClaimFiveGoldenReward,
  onCloseModalOnly,
  onStopFireworks,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const rockets: RocketItem[] = [];
    const particles: ParticleItem[] = [];

    const spawnRocket = (tx?: number, ty?: number) => {
      const startX = canvas.width * (0.15 + Math.random() * 0.7);
      const startY = canvas.height;
      const targetX = tx ?? canvas.width * (0.15 + Math.random() * 0.7);
      const targetY = ty ?? canvas.height * (0.15 + Math.random() * 0.45);
      const speed = 8 + Math.random() * 4;
      const angle = Math.atan2(targetY - startY, targetX - startX);
      rockets.push({
        x: startX,
        y: startY,
        targetX,
        targetY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: GOLDEN_COLORS[Math.floor(Math.random() * GOLDEN_COLORS.length)],
      });
    };

    const explode = (x: number, y: number, baseColor: string) => {
      const count = mode === 'cyber' ? 38 : 48;
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 1.5 + Math.random() * 6.5;
        const useGlyph = mode === 'cyber' && Math.random() > 0.45;
        particles.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          color: Math.random() > 0.3 ? baseColor : GOLDEN_COLORS[Math.floor(Math.random() * GOLDEN_COLORS.length)],
          alpha: 1,
          decay: 0.012 + Math.random() * 0.014,
          size: 2.5 + Math.random() * 3.5,
          glyph: useGlyph ? CYBER_GLYPHS[Math.floor(Math.random() * CYBER_GLYPHS.length)] : undefined,
        });
      }
    };

    // Initial volley
    spawnRocket(canvas.width * 0.3, canvas.height * 0.3);
    spawnRocket(canvas.width * 0.7, canvas.height * 0.28);
    spawnRocket(canvas.width * 0.5, canvas.height * 0.22);

    let animId = 0;
    const loop = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (Math.random() < 0.065) {
        spawnRocket();
      }

      for (let i = rockets.length - 1; i >= 0; i--) {
        const r = rockets[i];
        r.x += r.vx;
        r.y += r.vy;

        ctx.save();
        ctx.fillStyle = r.color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = r.color;
        ctx.beginPath();
        ctx.arc(r.x, r.y, 3.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        if (r.y <= r.targetY) {
          explode(r.x, r.y, r.color);
          rockets.splice(i, 1);
        }
      }

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.vx *= 0.96;
        p.vy *= 0.96;
        p.vy += 0.11;
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= p.decay;

        if (p.alpha <= 0) {
          particles.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.fillStyle = p.color;
        ctx.shadowBlur = 8;
        ctx.shadowColor = p.color;
        if (p.glyph) {
          ctx.font = `bold ${Math.floor(p.size * 4)}px "JetBrains Mono", monospace`;
          ctx.fillText(p.glyph, p.x, p.y);
        } else {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, [active, mode]);

  if (!active && !showFiveGoldenModal) return null;

  return (
    <>
      {active && (
        <canvas
          ref={canvasRef}
          className="fixed inset-0 pointer-events-none z-40"
        />
      )}

      {active && !showFiveGoldenModal && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-slate-900/95 border border-amber-400/50 rounded-xl px-4 py-2.5 shadow-xl">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-medium text-amber-200">
            {mode === 'cyber' ? 'Matrix Binary Burst Active' : 'Golden Fireworks Active'}
          </span>
          <button
            onClick={onStopFireworks}
            className="ml-2 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 transition-colors cursor-pointer"
          >
            Stop FX
          </button>
        </div>
      )}

      {showFiveGoldenModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="relative w-full max-w-lg rounded-2xl bg-[#0f1123] border-2 border-amber-400/80 p-6 md:p-8 text-center shadow-2xl">
            <button
              onClick={onCloseModalOnly}
              aria-label="Close modal"
              className="absolute top-4 right-4 p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mx-auto mb-4 w-16 h-16 rounded-2xl bg-amber-400/15 border border-amber-400/40 flex items-center justify-center text-amber-300">
              <Trophy className="w-9 h-9" />
            </div>

            <div className="text-xs font-mono text-amber-300 mb-1">
              5 GOLDEN BALLOONS MASTERED · GRAND SLAM
            </div>
            <h3 className="text-2xl md:text-3xl font-extrabold text-white mb-2">
              Golden Fireworks Celebration!
            </h3>
            <p className="text-sm text-slate-300 max-w-md mx-auto mb-6">
              You conquered 5 Bonus Golden Balloon grammar riddles! Claim your Royal Grammar Sovereign jackpot reward below.
            </p>

            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-400/30">
                <div className="text-xs text-amber-200/80">Bonus Jackpot Coins</div>
                <div className="text-2xl font-mono font-bold text-amber-300 tabular-nums mt-0.5">
                  +250 Coins
                </div>
              </div>
              <div className="p-3.5 rounded-xl bg-cyan-500/10 border border-cyan-400/30">
                <div className="text-xs text-cyan-200/80">Royal Star Bonus</div>
                <div className="text-2xl font-mono font-bold text-cyan-300 tabular-nums mt-0.5">
                  +10 Stars
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={onClaimFiveGoldenReward}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-sm transition-colors cursor-pointer whitespace-nowrap"
              >
                Claim +250 Coins & +10 Stars
              </button>
              <button
                onClick={() => {
                  soundEngine.playGrandFireworksFanfare();
                }}
                className="w-full sm:w-auto px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
              >
                <Volume2 className="w-4 h-4 text-amber-300" />
                Replay Fanfare
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
