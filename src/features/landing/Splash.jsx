import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { useNavigate } from 'react-router-dom';

export default function Splash() {
  const navigate = useNavigate();

  const handleGoogleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      // App.jsx will automatically handle the routing after this succeeds!
    } catch (error) {
      console.error("Error signing in with Google:", error);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#0f172a] text-white flex flex-col justify-center items-center p-6 relative overflow-hidden">
      {/* Background Glow Effect */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-emerald-500/20 blur-[120px] rounded-full pointer-events-none"></div>

      <div className="max-w-5xl w-full grid grid-cols-1 md:grid-cols-2 gap-12 items-center z-10">
        
        {/* Left Side: Hero Copy */}
        <div className="flex flex-col gap-6 text-center md:text-left">
          <h1 className="text-5xl md:text-7xl font-black italic tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
            SETLIST PICK 'EM
          </h1>
          <p className="text-xl text-slate-300 font-medium">
            Draft your dream setlist. Compete against the global community or your own tour crew. Prove who truly knows the band.
          </p>
          
          <div className="flex flex-col gap-4 mt-4 w-full md:max-w-md mx-auto md:mx-0">
            <button 
              onClick={handleGoogleSignIn}
              className="w-full bg-white text-slate-900 font-bold text-lg py-4 rounded-2xl flex items-center justify-center gap-3 hover:bg-slate-100 transition-all shadow-xl hover:scale-[1.02]"
            >
              <img src="https://www.google.com/favicon.ico" alt="Google" className="w-6 h-6" />
              Sign in with Google
            </button>
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-widest text-center">
              Free to play • No Spam • Just Bragging Rights
            </p>
          </div>
        </div>

        {/* Right Side: How It Works */}
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
                <p className="text-slate-400 text-sm">As the band plays, your live score updates in real-time.</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 font-black shrink-0">3</div>
              <div>
                <h4 className="font-bold text-lg">Claim the Crown</h4>
                <p className="text-slate-400 text-sm">Play in the massive Global Pool or create a private room with a 6-digit code for your friends.</p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}