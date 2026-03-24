import React from 'react';

export default function SplashAboutSection({
  sectionRef,
  headingRef,
  onHowItWorksClick,
  onGetStartedClick,
}) {
  const linkButtonClassName =
    'text-sm font-bold text-slate-400 hover:text-white underline underline-offset-2 decoration-slate-500 hover:decoration-white transition-colors outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 rounded-sm';

  return (
    <section
      ref={sectionRef}
      className="relative z-10 w-full flex items-center py-10 md:py-12 lg:py-14 md:min-h-[80vh] lg:min-h-[88vh]"
    >
      <div className="w-full max-w-5xl mx-auto px-1">
        <div className="rounded-[2.5rem] border border-white/10 bg-slate-800/40 p-6 md:p-8 lg:p-10 shadow-2xl">
          <h2
            ref={headingRef}
            tabIndex={-1}
            className="font-display text-display-lg md:text-display-lg-lg font-bold italic text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400 mb-4 text-center outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 rounded-md"
          >
            About Setlist Pick &apos;Em
          </h2>
          <div className="text-slate-300 font-normal leading-relaxed space-y-4 text-sm md:text-base max-w-3xl mx-auto">
            <p>
              In <strong className="text-white">2001</strong>, on{' '}
              <strong className="text-white">Phish tour</strong> that summer,{' '}
              <strong className="text-white">Ryan M</strong>—known to friends as{' '}
              <strong className="text-emerald-400">Beaver</strong>—cooked up a game to pass the miles
              between shows. <strong className="text-white">Glu</strong> and{' '}
              <strong className="text-white">Andy F</strong> rolled with him on the road; in those
              heady years the three of them shaped the ritual—debating picks, refining the format, and
              keeping the crew laughing until the lights went down.
            </p>
            <p>
              The format was simple and addictive: pick a{' '}
              <strong className="text-white">first-set opener and closer</strong>, a{' '}
              <strong className="text-white">second-set opener and closer</strong>, plus{' '}
              <strong className="text-white">encore</strong> and a{' '}
              <strong className="text-white">wildcard</strong>. Suddenly every placement mattered—
              friendly competition, a little glory, and a reason to care where the next song might land.
            </p>
            <p>
              <strong className="text-white">Pat</strong> and Ryan met in{' '}
              <strong className="text-white">kindergarten</strong> and grew up together; Pat was a fan
              of the game from the start. In the <strong className="text-white">2010s</strong>, Pat moved
              it from <strong className="text-white">paper to a spreadsheet</strong> so friends could
              play from different shows and cities—portable, easy to update, and a little more dynamic on
              the road.
            </p>
            <p>
              Pat had always wished it could be <strong className="text-white">more automated</strong>{' '}
              and <strong className="text-white">more interesting</strong>.{' '}
              <strong className="text-emerald-400">Setlist Pick &apos;Em</strong> is that vision taken
              to its logical conclusion: an <strong className="text-white">interactive</strong> home
              for passionate fans who crave <strong className="text-white">competition</strong>,{' '}
              <strong className="text-white">show stats</strong>, and{' '}
              <strong className="text-white">fun with friends</strong>.
            </p>
            <p className="text-slate-400 italic border-l-4 border-emerald-500/50 pl-4">
              Lock your picks, ride the scores, run with your crew—one show at a time.
            </p>
          </div>
          <nav
            className="mt-8 pt-6 border-t border-white/10 flex flex-wrap items-center justify-center gap-x-1 gap-y-2 text-center"
            aria-label="Jump to How it works or Get started"
          >
            <button type="button" onClick={onHowItWorksClick} className={linkButtonClassName}>
              How it works
            </button>
            <span className="mx-2 text-slate-600 select-none" aria-hidden>
              ·
            </span>
            <button type="button" onClick={onGetStartedClick} className={linkButtonClassName}>
              Get started
            </button>
          </nav>
        </div>
      </div>
    </section>
  );
}
