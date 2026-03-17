import React from 'react';
import { signOut } from 'firebase/auth';

export default function SidebarMenu({
  isMenuOpen,
  setIsMenuOpen,
  userProfile,
  user,
  ADMIN_EMAIL,
  activeTab,
  setActiveTab,
  auth
}) {
  return (
    <div className={`fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[100] transition-opacity duration-300 ${isMenuOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`} onClick={() => setIsMenuOpen(false)}>
      <div className={`absolute right-0 top-0 h-full w-80 bg-slate-800 p-8 flex flex-col transform transition-transform duration-300 shadow-2xl ${isMenuOpen ? "translate-x-0" : "translate-x-full"}`} onClick={(e) => e.stopPropagation()}>
        <button onClick={() => setIsMenuOpen(false)} className="self-end text-slate-400 text-2xl mb-8">✕</button>
        
        <div className="text-center flex-grow">
          <div className="w-24 h-24 bg-gradient-to-tr from-blue-500 to-emerald-500 rounded-full mx-auto flex items-center justify-center text-4xl mb-6 shadow-xl border-4 border-slate-700">👤</div>
          <h2 className="text-2xl font-black text-white">{userProfile?.handle || "Phan"}</h2>
          <p className="text-blue-400 text-[10px] font-black uppercase tracking-widest mt-2">{userProfile?.email}</p>
          
          {user?.email === ADMIN_EMAIL && (
            <button 
              onClick={() => { setActiveTab("admin"); setIsMenuOpen(false); }}
              className={`w-full mt-12 py-4 rounded-2xl font-black uppercase tracking-tighter transition-all border-2 ${activeTab === 'admin' ? 'bg-emerald-500 text-black border-emerald-400' : 'bg-slate-900 text-emerald-500 border-emerald-500/20'}`}
            >
              👑 Admin Control
            </button>
          )}
        </div>

        <button 
          onClick={() => { setIsMenuOpen(false); signOut(auth); }} 
          className="w-full py-5 bg-slate-900 rounded-2xl text-xs font-black uppercase tracking-widest text-red-400 border border-red-900/20"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}