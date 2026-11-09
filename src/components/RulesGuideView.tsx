import React from 'react';
import { Volume2, Play, Sparkles, CheckCircle2 } from 'lucide-react';
import { soundEngine } from '../utils/soundEngine';

interface RulesGuideViewProps {
  onStartArcade: () => void;
  onStartBalloonPop: () => void;
}

const TO_BE_CARDS = [
  {
    verb: 'AM',
    role: 'FIRST-PERSON SINGULAR',
    pronouns: 'I',
    accentBorder: 'border-cyan-400/50',
    accentText: 'text-cyan-400',
    accentBg: 'bg-cyan-400/10',
    ruleFormula: 'I + AM + complement',
    summary: 'Used exclusively when speaking about yourself in the singular first person.',
    examples: [
      'I am a student.',
      'I am excited to learn English.',
      'I am ten years old.',
    ],
    tip: 'Contraction: "I am" becomes "I’m" (Negative: "I’m not").',
  },
  {
    verb: 'IS',
    role: 'THIRD-PERSON SINGULAR',
    pronouns: 'He · She · It · Singular Noun',
    accentBorder: 'border-purple-400/50',
    accentText: 'text-purple-300',
    accentBg: 'bg-purple-400/10',
    ruleFormula: 'He / She / It + IS + complement',
    summary: 'Used for ONE person, ONE animal, ONE object, or uncountable nouns (weather, music, news).',
    examples: [
      'He is a doctor.',
      'She is very happy today.',
      'The cat is sleeping on the sofa.',
    ],
    tip: 'Contraction: "He is" → "He’s", "Is not" → "isn’t".',
  },
  {
    verb: 'ARE',
    role: 'PLURAL & SECOND PERSON',
    pronouns: 'You · We · They · Plural Nouns',
    accentBorder: 'border-emerald-400/50',
    accentText: 'text-emerald-400',
    accentBg: 'bg-emerald-400/10',
    ruleFormula: 'You / We / They + ARE + complement',
    summary: 'Used with "You" (singular or plural) and any group of two or more people or items.',
    examples: [
      'You are my best friend.',
      'We are ready for the grammar mission.',
      'Tom and Jerry are famous cartoon characters.',
    ],
    tip: 'Contraction: "You are" → "You’re", "Are not" → "aren’t".',
  },
];

const SYNTAX_MATRIX = [
  {
    subject: 'I',
    positive: 'I am ready.',
    negative: 'I am not (I’m not) late.',
    question: 'Am I in the right room?',
  },
  {
    subject: 'He / She / It',
    positive: 'She is a pilot.',
    negative: 'She is not (isn’t) tired.',
    question: 'Is she at home right now?',
  },
  {
    subject: 'You / We / They',
    positive: 'They are teammates.',
    negative: 'They are not (aren’t) afraid.',
    question: 'Are they ready for the test?',
  },
];

export const RulesGuideView: React.FC<RulesGuideViewProps> = ({
  onStartArcade,
  onStartBalloonPop,
}) => {
  return (
    <div className="w-full py-2 space-y-8">
      {/* Header & Golden Formula Banner */}
      <div className="bg-[#0f1123] border border-[#1f2444] rounded-2xl p-6 md:p-8 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <div>
          <div className="text-xs font-mono text-cyan-400 mb-2">
            GRAMMAR ACADEMY · INTERACTIVE AUDIO REFERENCE
          </div>
          <h2 className="text-2xl sm:text-4xl font-black text-white mb-2">
            The &ldquo;TO BE&rdquo; & Subject-Verb Rules
          </h2>
          <p className="text-slate-300 text-sm sm:text-base max-w-2xl">
            Formula: <strong className="text-cyan-300 font-mono">Subject + Verb (AM / IS / ARE) + Complement</strong>. Click any speaker icon below to hear natural English pronunciation.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            onClick={onStartArcade}
            className="px-5 py-3 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-mono font-bold text-xs flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
          >
            <Play className="w-4 h-4 fill-current" />
            Test in Grammar Arcade
          </button>
          <button
            onClick={onStartBalloonPop}
            className="px-5 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-mono font-bold text-xs flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
          >
            <Sparkles className="w-4 h-4" />
            Play Subject-Verb Pop
          </button>
        </div>
      </div>

      {/* 3 Core Cards: AM, IS, ARE */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {TO_BE_CARDS.map((card) => (
          <div
            key={card.verb}
            className={`bg-[#0f1123] border-2 ${card.accentBorder} rounded-2xl p-6 flex flex-col justify-between`}
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div
                  className={`w-14 h-14 rounded-2xl ${card.accentBg} border ${card.accentBorder} flex items-center justify-center font-mono font-black text-2xl ${card.accentText}`}
                >
                  {card.verb}
                </div>
                <span className="text-[11px] font-mono text-slate-400">
                  {card.role}
                </span>
              </div>

              <h3 className="text-xl font-extrabold text-white mb-1">
                Used with: <span className={card.accentText}>{card.pronouns}</span>
              </h3>
              <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                {card.summary}
              </p>

              <div className="p-3 rounded-xl bg-[#080915] border border-[#1f2444] font-mono text-xs text-white mb-4">
                {card.ruleFormula}
              </div>

              <div className="space-y-2 mb-4">
                <div className="text-xs font-mono text-slate-400">
                  Interactive Audio Examples:
                </div>
                {card.examples.map((ex) => (
                  <div
                    key={ex}
                    className="p-2.5 rounded-xl bg-[#080915] border border-[#1f2444] flex items-center justify-between gap-2 text-xs text-slate-200"
                  >
                    <span>&ldquo;{ex}&rdquo;</span>
                    <button
                      onClick={() => soundEngine.speak(ex)}
                      aria-label={`Listen to ${ex}`}
                      className={`p-1.5 rounded-lg hover:bg-slate-800 ${card.accentText} transition-colors cursor-pointer shrink-0`}
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-[#1f2444] text-xs text-slate-400">
              {card.tip}
            </div>
          </div>
        ))}
      </div>

      {/* Positive, Negative & Question Syntax Table + Action Verb Agreement */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-[#0f1123] border border-[#1f2444] rounded-2xl p-6">
          <div className="text-xs font-mono text-purple-300 mb-1">
            01. SENTENCE TRANSFORMATIONS
          </div>
          <h3 className="text-xl font-bold text-white mb-4">
            Positive, Negative & Question Forms
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-[#1f2444] text-slate-400 font-mono">
                  <th className="py-2.5 pr-3">Subject</th>
                  <th className="py-2.5 px-3">Positive (+)</th>
                  <th className="py-2.5 px-3">Negative (-)</th>
                  <th className="py-2.5 pl-3">Question (?)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1f2444]">
                {SYNTAX_MATRIX.map((row) => (
                  <tr key={row.subject} className="text-slate-200">
                    <td className="py-3 pr-3 font-mono font-bold text-cyan-300 whitespace-nowrap">
                      {row.subject}
                    </td>
                    <td className="py-3 px-3">{row.positive}</td>
                    <td className="py-3 px-3 text-rose-300">{row.negative}</td>
                    <td className="py-3 pl-3 text-emerald-300">{row.question}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Subject-Verb POP! Action Verb Rules */}
        <div className="lg:col-span-5 bg-[#0f1123] border border-[#1f2444] rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <div className="text-xs font-mono text-amber-300 mb-1">
              02. SUBJECT-VERB POP! GOLDEN RULES
            </div>
            <h3 className="text-xl font-bold text-white mb-4">
              Action Verbs: Singular (-s) vs. Plural
            </h3>
            <div className="space-y-3 text-sm text-slate-300">
              <div className="p-3.5 rounded-xl bg-[#080915] border border-[#1f2444] flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-white">Singular Subject → Add -s / -es</div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    &ldquo;The puppy <strong className="text-amber-300">barks</strong>.&rdquo; · &ldquo;A unicorn <strong className="text-amber-300">spreads</strong> sparkles.&rdquo;
                  </div>
                </div>
              </div>
              <div className="p-3.5 rounded-xl bg-[#080915] border border-[#1f2444] flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-white">Plural Subject → Base Verb (No -s)</div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    &ldquo;Two kittens <strong className="text-cyan-300">drink</strong> milk.&rdquo; · &ldquo;The rockets <strong className="text-cyan-300">zoom</strong>.&rdquo;
                  </div>
                </div>
              </div>
              <div className="p-3.5 rounded-xl bg-[#080915] border border-[#1f2444] flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-white">Compound Subject with &ldquo;AND&rdquo; → Plural</div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    &ldquo;The king and his dragon <strong className="text-emerald-300">dance</strong> together.&rdquo;
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
