import React, { useState } from 'react';
import { Sliders, Volume2, RotateCcw, Sparkles, Music } from 'lucide-react';
import {
  soundEngine,
  EQ_PRESETS,
  EqPresetName,
  EqBands,
} from '../utils/soundEngine';

interface AudioStudioViewProps {
  onTriggerGoldenFireworks: () => void;
  onTriggerCyberBurst: () => void;
}

const BAND_META: Array<{
  key: keyof EqBands;
  label: string;
  freq: string;
  filterType: string;
}> = [
  { key: 'b60', label: 'BASS', freq: '60 Hz', filterType: 'Low-Shelf' },
  { key: 'b250', label: 'LOW-MID', freq: '250 Hz', filterType: 'Peaking' },
  { key: 'b1k', label: 'MID', freq: '1 kHz', filterType: 'Peaking' },
  { key: 'b4k', label: 'HI-MID', freq: '4 kHz', filterType: 'Peaking' },
  { key: 'b12k', label: 'TREBLE', freq: '12 kHz', filterType: 'High-Shelf' },
];

export const AudioStudioView: React.FC<AudioStudioViewProps> = ({
  onTriggerGoldenFireworks,
  onTriggerCyberBurst,
}) => {
  const [preset, setPreset] = useState<EqPresetName>(soundEngine.currentPreset);
  const [bands, setBands] = useState<EqBands>({ ...soundEngine.bands });
  const [sfxVol, setSfxVol] = useState<number>(Math.round(soundEngine.sfxVolume * 100));
  const [lastAuditioned, setLastAuditioned] = useState<string>('Ready to audition Web Audio synthesizer');

  const formatDb = (val: number) => `${val > 0 ? '+' : ''}${val.toFixed(1)} dB`;

  const handleSelectPreset = (p: EqPresetName) => {
    const targetBands = { ...EQ_PRESETS[p].bands };
    setPreset(p);
    setBands(targetBands);
    soundEngine.setBands(targetBands, p);
    soundEngine.playEqPresetPreviewCue(p);
    setLastAuditioned(`Activated ${EQ_PRESETS[p].label} EQ curve`);
  };

  const handleSliderChange = (key: keyof EqBands, val: number) => {
    const next: EqBands = { ...bands, [key]: val };
    setBands(next);
    setPreset('custom');
    soundEngine.setBands(next, 'custom');
  };

  const handleResetFlat = () => {
    const flat: EqBands = { b60: 0, b250: 0, b1k: 0, b4k: 0, b12k: 0 };
    setBands(flat);
    setPreset('custom');
    soundEngine.setBands(flat, 'custom');
    soundEngine.playEqPresetPreviewCue('custom');
    setLastAuditioned('Reset 5-Band BiquadFilterNode chain to Flat (0.0 dB)');
  };

  // Compute SVG coordinates for the 5-band curve (width 500, height 120)
  const gainToY = (db: number) => {
    // +12dB -> y=16, 0dB -> y=60, -12dB -> y=104
    return 60 - (db / 12) * 44;
  };

  const points = [
    { x: 50, y: gainToY(bands.b60) },
    { x: 150, y: gainToY(bands.b250) },
    { x: 250, y: gainToY(bands.b1k) },
    { x: 350, y: gainToY(bands.b4k) },
    { x: 450, y: gainToY(bands.b12k) },
  ];

  const svgLinePath = `M 0 ${points[0].y} L ${points
    .map((p) => `${p.x} ${p.y}`)
    .join(' L ')} L 500 ${points[4].y}`;
  const svgAreaPath = `${svgLinePath} L 500 120 L 0 120 Z`;

  return (
    <div className="w-full py-2 space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 7 Cols: 5-Band Web Audio DSP Equalizer HUD */}
        <div className="lg:col-span-7 bg-[#0f1123] border border-[#1f2444] rounded-2xl p-6 md:p-8">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 mb-6 border-b border-[#1f2444]">
            <div>
              <div className="text-xs font-mono text-cyan-400">
                CYBER AUDIO ENGINE HUD · 5-BAND BIQUAD FILTER CHAIN
              </div>
              <h2 className="text-2xl font-black text-white flex items-center gap-2 mt-0.5">
                <Sliders className="w-6 h-6 text-cyan-400" />
                Custom 5-Band DSP Equalizer
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleResetFlat}
                className="px-3 py-1.5 rounded-lg bg-[#080915] hover:bg-slate-800 border border-[#1f2444] text-xs font-mono text-slate-300 flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                FLAT (0 dB)
              </button>
              <button
                onClick={() => {
                  soundEngine.playEqPresetPreviewCue(preset);
                  setLastAuditioned(`Played test synth chord through ${EQ_PRESETS[preset].label}`);
                }}
                className="px-3.5 py-1.5 rounded-lg bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-mono font-bold text-xs cursor-pointer whitespace-nowrap"
              >
                Test Synth Tone
              </button>
            </div>
          </div>

          {/* Preset Mode Selector */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-6">
            {(['retro', 'synthwave', 'bass', 'custom'] as EqPresetName[]).map((key) => {
              const active = preset === key;
              return (
                <button
                  key={key}
                  onClick={() => handleSelectPreset(key)}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    active
                      ? 'bg-cyan-500/15 border-cyan-400 text-white'
                      : 'bg-[#080915] border-[#1f2444] hover:border-slate-600 text-slate-300'
                  }`}
                >
                  <div className="text-xs font-mono font-bold text-cyan-300">
                    {EQ_PRESETS[key].label}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                    {key === 'custom' ? 'User Fader Curve' : 'DSP Preset'}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Real-time Visual EQ Curve SVG */}
          <div className="p-4 rounded-xl bg-[#080915] border border-[#1f2444] mb-6">
            <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-2">
              <span>REAL-TIME FREQUENCY RESPONSE CURVE</span>
              <span className="text-cyan-300">{EQ_PRESETS[preset].label}</span>
            </div>
            <svg
              viewBox="0 0 500 120"
              className="w-full h-28 overflow-visible"
              aria-label="5-Band Equalizer Frequency Response Curve"
            >
              <defs>
                <linearGradient id="eqGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#00F0FF" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#B026FF" stopOpacity="0.02" />
                </linearGradient>
              </defs>
              {/* 0 dB center reference line */}
              <line
                x1="0"
                y1="60"
                x2="500"
                y2="60"
                stroke="#1f2444"
                strokeDasharray="4 4"
                strokeWidth="1.5"
              />
              <path d={svgAreaPath} fill="url(#eqGrad)" />
              <path
                d={svgLinePath}
                fill="none"
                stroke="#00F0FF"
                strokeWidth="3"
                strokeLinecap="round"
              />
              {points.map((pt, i) => (
                <circle
                  key={i}
                  cx={pt.x}
                  cy={pt.y}
                  r="5"
                  fill="#080915"
                  stroke="#00F0FF"
                  strokeWidth="2.5"
                />
              ))}
            </svg>
            <p className="text-xs text-slate-400 mt-2">
              {EQ_PRESETS[preset].description}
            </p>
          </div>

          {/* 5 Precision Band Fader Sliders */}
          <div className="space-y-4">
            {BAND_META.map((band) => {
              const val = bands[band.key];
              return (
                <div
                  key={band.key}
                  className="p-3.5 rounded-xl bg-[#080915] border border-[#1f2444] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="w-40 shrink-0">
                    <div className="font-mono font-bold text-xs text-white">
                      {band.label} · <span className="text-cyan-300">{band.freq}</span>
                    </div>
                    <div className="text-[11px] text-slate-400">{band.filterType} Filter</div>
                  </div>

                  <div className="flex-1 flex items-center gap-3">
                    <span className="text-[11px] font-mono text-slate-500">-12</span>
                    <input
                      type="range"
                      min={-12}
                      max={12}
                      step={0.5}
                      value={val}
                      aria-label={`${band.label} ${band.freq} gain`}
                      onChange={(e) => handleSliderChange(band.key, parseFloat(e.target.value))}
                      className="w-full accent-cyan-400 cursor-pointer"
                    />
                    <span className="text-[11px] font-mono text-slate-500">+12</span>
                  </div>

                  <div className="w-24 text-right font-mono font-bold text-xs text-cyan-300 tabular-nums shrink-0">
                    {formatDb(val)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 5 Cols: Cartoon & Golden Sound FX Audition Deck */}
        <div className="lg:col-span-5 flex flex-col justify-between gap-6">
          <div className="bg-[#0f1123] border border-[#1f2444] rounded-2xl p-6 flex-1 flex flex-col justify-between">
            <div>
              <div className="text-xs font-mono text-amber-300 mb-1">
                WEB AUDIO SYNTHESIZER · ZERO EXTERNAL FILES
              </div>
              <h3 className="text-xl font-black text-white flex items-center gap-2 mb-2">
                <Music className="w-5 h-5 text-amber-300" />
                Cartoon & Golden SFX Audition Deck
              </h3>
              <p className="text-xs text-slate-400 mb-5">
                Every sound effect in this arcade is synthesized in real time via the Web Audio API and routed through the 5-Band BiquadFilterNode DSP equalizer.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                <button
                  onClick={() => {
                    soundEngine.playGoldenPopSound();
                    setLastAuditioned('Played Special Golden Balloon Pop (Arpeggio + Sub-Bass)');
                  }}
                  className="p-3.5 rounded-xl bg-amber-400/15 hover:bg-amber-400/25 border border-amber-400/40 text-left transition-colors cursor-pointer"
                >
                  <div className="font-mono font-bold text-xs text-amber-300">
                    Golden Balloon Pop
                  </div>
                  <div className="text-[11px] text-slate-300 mt-0.5">
                    Crystalline chime + sub-boom
                  </div>
                </button>

                <button
                  onClick={() => {
                    soundEngine.playCartoonWhooshSound();
                    setLastAuditioned('Played Cartoon Balloon Whoosh Float-In SFX');
                  }}
                  className="p-3.5 rounded-xl bg-[#080915] hover:bg-slate-800 border border-[#1f2444] text-left transition-colors cursor-pointer"
                >
                  <div className="font-mono font-bold text-xs text-cyan-300">
                    Cartoon Whoosh SFX
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Bandpass noise + glide whistle
                  </div>
                </button>

                <button
                  onClick={() => {
                    soundEngine.playCartoonVocalChirp('up');
                    soundEngine.speak('Wheee!', 1.55, 1.2);
                    setLastAuditioned('Played Silly Cartoon Voice "Wheee!" Reaction');
                  }}
                  className="p-3.5 rounded-xl bg-[#080915] hover:bg-slate-800 border border-[#1f2444] text-left transition-colors cursor-pointer"
                >
                  <div className="font-mono font-bold text-xs text-emerald-300">
                    Voice &ldquo;Wheee!&rdquo; Chirp
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Vocal synth chirp + speech
                  </div>
                </button>

                <button
                  onClick={() => {
                    soundEngine.playCartoonBoingSound();
                    setLastAuditioned('Played Comedic Spring Boing Wrong Balloon SFX');
                  }}
                  className="p-3.5 rounded-xl bg-[#080915] hover:bg-slate-800 border border-[#1f2444] text-left transition-colors cursor-pointer"
                >
                  <div className="font-mono font-bold text-xs text-pink-300">
                    Cartoon Spring Boing
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    FM LFO wobble oscillator
                  </div>
                </button>

                <button
                  onClick={() => {
                    soundEngine.playCartoonWompWompSound();
                    setLastAuditioned('Played Sad Trombone Womp-Womp SFX');
                  }}
                  className="p-3.5 rounded-xl bg-[#080915] hover:bg-slate-800 border border-[#1f2444] text-left transition-colors cursor-pointer"
                >
                  <div className="font-mono font-bold text-xs text-rose-300">
                    Sad Trombone Womp
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    4-step sawtooth pitch slide
                  </div>
                </button>

                <button
                  onClick={() => {
                    soundEngine.playCartoonDeflateRaspSound();
                    setLastAuditioned('Played Deflating Balloon Raspberry Sputter');
                  }}
                  className="p-3.5 rounded-xl bg-[#080915] hover:bg-slate-800 border border-[#1f2444] text-left transition-colors cursor-pointer"
                >
                  <div className="font-mono font-bold text-xs text-purple-300">
                    Balloon Deflate Sputter
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Flutter-modulated sawtooth
                  </div>
                </button>

                <button
                  onClick={() => {
                    soundEngine.playCartoonQuackSound();
                    setLastAuditioned('Played Silly Cartoon Duck Quack');
                  }}
                  className="p-3.5 rounded-xl bg-[#080915] hover:bg-slate-800 border border-[#1f2444] text-left transition-colors cursor-pointer"
                >
                  <div className="font-mono font-bold text-xs text-amber-200">
                    Silly Cartoon Quack
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Dual detuned bandpass horn
                  </div>
                </button>

                <button
                  onClick={() => {
                    soundEngine.playGrandFireworksFanfare();
                    setLastAuditioned('Played Grand Fireworks Fanfare Symphony');
                  }}
                  className="p-3.5 rounded-xl bg-[#080915] hover:bg-slate-800 border border-[#1f2444] text-left transition-colors cursor-pointer"
                >
                  <div className="font-mono font-bold text-xs text-yellow-300">
                    Fireworks Fanfare
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Whistle rockets + chord brass
                  </div>
                </button>
              </div>
            </div>

            {/* Master Gain & Visual Celebration Triggers */}
            <div className="space-y-4 pt-4 border-t border-[#1f2444]">
              <div className="flex items-center justify-between gap-4">
                <span className="text-xs font-mono text-slate-300 flex items-center gap-1.5">
                  <Volume2 className="w-4 h-4 text-cyan-400" />
                  Master Gain ({sfxVol}%)
                </span>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={sfxVol}
                  aria-label="Master SFX Volume"
                  onChange={(e) => {
                    const v = parseInt(e.target.value, 10);
                    setSfxVol(v);
                    soundEngine.setSfxVolume(v / 100);
                  }}
                  className="w-40 accent-cyan-400 cursor-pointer"
                />
              </div>

              <div className="p-3 rounded-xl bg-[#080915] border border-[#1f2444] text-xs font-mono text-slate-300">
                Last Action: <span className="text-cyan-300">{lastAuditioned}</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={onTriggerGoldenFireworks}
                  className="py-2.5 px-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-mono font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  Launch Fireworks
                </button>
                <button
                  onClick={onTriggerCyberBurst}
                  className="py-2.5 px-3 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 border border-purple-400/40 text-purple-200 font-mono font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  Matrix Binary Burst
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
