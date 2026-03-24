import React from 'react';
import { useSplashAuth } from '../auth/useSplashAuth';
import SplashAuthEntryCard from '../auth/components/SplashAuthEntryCard';
import SplashSignUpModal from '../auth/components/SplashSignUpModal';
import SplashSignInModal from '../auth/components/SplashSignInModal';

export default function Splash() {
  const {
    authModal,
    email,
    setEmail,
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    busy,
    error,
    resetLinkNotice,
    closeModal,
    openSignUpModal,
    openSignInModal,
    handleGoogle,
    handleEmailSignUp,
    handleEmailSignIn,
    handleSendPasswordResetEmail,
  } = useSplashAuth();

  return (
    <div className="min-h-screen w-full bg-[#0f172a] text-white flex flex-col items-center p-6 relative overflow-hidden pb-16">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-emerald-500/20 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-5xl w-full grid grid-cols-1 md:grid-cols-2 gap-12 items-center z-10 mt-8 md:mt-12">
        {/* Hero */}
        <div className="flex flex-col gap-6 text-center md:text-left">
          <h1 className="text-5xl md:text-7xl font-black italic tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
            SETLIST PICK &apos;EM
          </h1>
          <p className="text-xl text-slate-300 font-medium">
            Draft your dream setlist. Compete against the global community or your own tour crew. Prove who truly knows the band.
          </p>
        </div>

        {/* How it works */}
        <div className="flex flex-col gap-6 bg-slate-800/50 p-8 rounded-[2.5rem] border border-white/5 shadow-2xl backdrop-blur-sm">
          <h3 className="text-2xl font-bold mb-2">How It Works</h3>
          <div className="flex flex-col gap-5">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-black shrink-0">1</div>
              <div>
                <h4 className="font-bold text-lg">Lock It In</h4>
                <p className="text-slate-400 text-sm">Predict openers, closers, and wildcards before the lights go down.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-black shrink-0">2</div>
              <div>
                <h4 className="font-bold text-lg">Watch It Unfold</h4>
                <p className="text-slate-400 text-sm">As the band plays, scores update when the official setlist is locked.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 font-black shrink-0">3</div>
              <div>
                <h4 className="font-bold text-lg">Claim the Crown</h4>
                <p className="text-slate-400 text-sm">Play in the Global pool or join private pools with your crew.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <SplashAuthEntryCard onOpenSignUp={openSignUpModal} onOpenSignIn={openSignInModal} />

      {/* About */}
      <section className="z-10 w-full max-w-3xl mt-14 md:mt-16 px-1">
        <h2 className="text-2xl md:text-3xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400 mb-4 text-center md:text-left">
          About Setlist Pick &apos;Em
        </h2>
        <div className="rounded-[2rem] border border-white/10 bg-slate-800/40 p-8 md:p-10 text-slate-300 leading-relaxed space-y-4 text-sm md:text-base">
          <p>
            In <strong className="text-white">2001</strong>, on tour, <strong className="text-white">Ryan M
              </strong>—known to friends as{' '}
            <strong className="text-emerald-400">Beaver</strong>—cooked up a game to pass the miles between shows: a nightly prediction ritual that tested how well you really knew the band, kept the crew laughing, and made every frame of the show worth watching.
          </p>
          <p>
            The format was simple and addictive: pick a <strong className="text-white">first-set opener and closer</strong>, a{' '}
            <strong className="text-white">second-set opener and closer</strong>, plus <strong className="text-white">encore</strong> and a{' '}
            <strong className="text-white">wildcard</strong>. Suddenly every placement mattered—friendly competition, a little glory, and a reason to care where the next song might land.
          </p>
          <p className="text-slate-400 italic border-l-4 border-emerald-500/50 pl-4">
            Setlist Pick &apos;Em carries that same spirit online: know the band, lock your picks, and chase the win—one show at a time.
          </p>
        </div>
      </section>

      <SplashSignUpModal
        isOpen={authModal === 'signup'}
        closeModal={closeModal}
        busy={busy}
        handleGoogle={handleGoogle}
        handleEmailSignUp={handleEmailSignUp}
        email={email}
        setEmail={setEmail}
        password={password}
        setPassword={setPassword}
        confirmPassword={confirmPassword}
        setConfirmPassword={setConfirmPassword}
        error={error}
      />

      <SplashSignInModal
        isOpen={authModal === 'signin'}
        closeModal={closeModal}
        busy={busy}
        handleGoogle={handleGoogle}
        handleEmailSignIn={handleEmailSignIn}
        handleSendPasswordResetEmail={handleSendPasswordResetEmail}
        email={email}
        setEmail={setEmail}
        password={password}
        setPassword={setPassword}
        resetLinkNotice={resetLinkNotice}
        error={error}
      />
    </div>
  );
}
