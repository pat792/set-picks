import React from 'react';

export default function SplashAboutSection({
  sectionRef,
  headingRef,
  onHowItWorksClick,
  onGetStartedClick,
}) {
  const linkButtonClassName =
    'text-sm font-bold text-slate-400 hover:text-white underline underline-offset-2 decoration-slate-500 hover:decoration-white transition-colors outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f172a] rounded-sm';

  return (
    <section
      ref={sectionRef}
      className="relative z-10 w-full bg-[#0f172a] py-20 md:py-24 lg:py-32"
    >
      <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start">
          
          <div className="lg:col-span-5 lg:sticky lg:top-32">
            <h2
              ref={headingRef}
              tabIndex={-1}
              className="font-display text-[6.5vw] sm:text-4xl md:text-5xl lg:text-6xl font-bold italic text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400 mb-8 outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 rounded-md leading-tight whitespace-nowrap sm:whitespace-normal"
            >
              About Setlist Pick &apos;Em
            </h2>
            
            <div className="hidden lg:block mt-12">
              <p className="text-xl text-slate-300 italic border-l-4 border-emerald-500/50 pl-6 leading-relaxed">
                "Lock your picks, ride the scores, run with your crew—one show at a time."
              </p>
            </div>
          </div>

          <div className="lg:col-span-7 text-slate-300 font-normal leading-relaxed space-y-6 text-base md:text-lg">
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
            
            <div className="block lg:hidden mt-10">
              <p className="text-lg text-slate-300 italic border-l-4 border-emerald-500/50 pl-5 leading-relaxed">
                "Lock your picks, ride the scores, run with your crew—one show at a time."
              </p>
            </div>
          </div>
        </div>

        <nav
          className="mt-16 pt-8 border-t border-slate-800 flex flex-wrap items-center justify-start lg:justify-end gap-x-2 gap-y-2 text-center"
          aria-label="Jump to How it works or Get started"
        >
          <button type="button" onClick={onHowItWorksClick} className={linkButtonClassName}>
            How it works
          </button>
          <span className="mx-2 text-slate-700 select-none" aria-hidden>
            ·
          </span>
          <button type="button" onClick={onGetStartedClick} className={linkButtonClassName}>
            Get started
          </button>
        </nav>
      </div>
    </section>
  );
}