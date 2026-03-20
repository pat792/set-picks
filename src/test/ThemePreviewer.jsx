import React from 'react';

export default function ThemePreviewer() {
  return (
    <div className="flex flex-col md:flex-row gap-6 p-8 bg-black min-h-screen items-center justify-center">
      
      {/* THEME A: The Kuroda (Neon Phish) */}
      <div className="w-72 bg-indigo-950 border border-indigo-800 p-6 rounded-3xl shadow-[0_0_30px_rgba(34,211,238,0.1)]">
        <h3 className="text-cyan-400 font-black italic text-xl mb-2">The Kuroda</h3>
        <p className="text-indigo-200/70 text-sm font-bold mb-6">Deep venue purple with glowing neon cyan and magenta accents.</p>
        <button className="w-full bg-green-400 hover:bg-green-300 text-green-950 font-black py-3 rounded-xl shadow-[0_0_15px_rgba(74,222,128,0.4)] transition-all">
        LOCK PICKS
        </button>
        </div>

      {/* THEME B: Gamehendge Earth */}
      <div className="w-72 bg-stone-900 border border-stone-700 p-6 rounded-3xl shadow-[0_0_30px_rgba(245,158,11,0.05)]">
        <h3 className="text-amber-500 font-black italic text-xl mb-2">Gamehendge</h3>
        <p className="text-stone-400 text-sm font-bold mb-6">Rich charcoal and forest tones with earthy gold and sunset orange.</p>
        <button className="w-full bg-orange-600 hover:bg-orange-500 text-stone-950 font-black py-3 rounded-xl shadow-lg transition-all">
          LOCK PICKS
        </button>
      </div>

      {/* THEME C: Cyber Stats */}
      <div className="w-72 bg-slate-900 border border-slate-700 p-6 rounded-3xl shadow-[0_0_30px_rgba(16,185,129,0.1)]">
        <h3 className="text-blue-400 font-black italic text-xl mb-2">Cyber Stats</h3>
        <p className="text-slate-400 text-sm font-bold mb-6">Your current dark slate, pushed further with electric blue and mint green.</p>
        <button className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-black py-3 rounded-xl shadow-[0_0_15px_rgba(16,185,129,0.2)] transition-all">
          LOCK PICKS
        </button>
      </div>

    </div>
  );
}