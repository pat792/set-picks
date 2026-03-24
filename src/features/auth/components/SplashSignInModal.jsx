import React from 'react';

export default function SplashSignInModal({
  isOpen,
  closeModal,
  busy,
  handleGoogle,
  handleEmailSignIn,
  handleSendPasswordResetEmail,
  email,
  setEmail,
  password,
  setPassword,
  resetLinkNotice,
  error,
}) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="signin-title"
      onClick={(e) => e.target === e.currentTarget && closeModal()}
    >
      <div className="w-full max-w-md rounded-[2rem] border border-white/10 bg-slate-900 p-8 shadow-2xl">
        <div className="flex justify-between items-start mb-6">
          <h3 id="signin-title" className="text-xl font-black text-white">
            Sign in
          </h3>
          <button
            type="button"
            onClick={closeModal}
            className="text-slate-400 hover:text-white text-2xl leading-none px-2"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <button
          type="button"
          onClick={handleGoogle}
          disabled={busy}
          className="w-full bg-white text-slate-900 font-bold py-3.5 rounded-xl flex items-center justify-center gap-3 hover:bg-slate-100 transition-colors disabled:opacity-50 mb-6"
        >
          <img src="https://www.google.com/favicon.ico" alt="" className="w-5 h-5" />
          Sign in with Google
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 h-px bg-slate-700" />
          <span className="text-xs font-bold text-slate-500 uppercase">or email</span>
          <div className="flex-1 h-px bg-slate-700" />
        </div>

        <form onSubmit={handleEmailSignIn} className="space-y-4 text-left">
          <div>
            <label htmlFor="si-email" className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Email
            </label>
            <input
              id="si-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1 w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-3 text-white font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label htmlFor="si-pass" className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Password
            </label>
            <input
              id="si-pass"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-1 w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-3 text-white font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={handleSendPasswordResetEmail}
              disabled={busy}
              className="text-left text-sm font-bold text-amber-400/90 hover:text-amber-300 underline underline-offset-2 disabled:opacity-50"
            >
              Forgot password? Send reset link to your email
            </button>
            {resetLinkNotice.text && (
              <p
                className={`text-sm font-bold ${
                  resetLinkNotice.type === 'error' ? 'text-red-400' : 'text-emerald-400'
                }`}
              >
                {resetLinkNotice.text}
              </p>
            )}
          </div>
          {error && <p className="text-red-400 text-sm font-bold">{error}</p>}
          <button
            type="submit"
            disabled={busy}
            className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-black py-3.5 rounded-xl uppercase tracking-widest disabled:opacity-50"
          >
            {busy ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}
