import React from 'react';

export default function Splash({ onLogin }) {
  return (
    <div className="min-h-screen bg-[#0f172a] text-white flex flex-col items-center justify-center p-6 text-center">
      <h1 className="text-5xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400 mb-8">PHISH POOL</h1>
      <button 
        onClick={onLogin} 
        className="bg-white text-black px-10 py-4 rounded-full font-black shadow-xl transition-transform hover:scale-105"
      >
        SIGN IN WITH GOOGLE
      </button>
    </div>
  );
}
