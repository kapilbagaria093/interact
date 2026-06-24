import React, { useState } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  updateProfile 
} from 'firebase/auth';
import { auth, googleAuthProvider } from '../lib/firebase.ts';
import { Sparkles, Mail, Lock, User as UserIcon, LogIn, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';

// A selection of fun, high-quality, pre-defined avatars for new users to choose from
const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150', // Default man
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150', // Elena-style woman
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150', // Liam-style man
  'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150', // Tech professional
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150', // Bright young woman
  'https://images.unsplash.com/photo-1628157582853-a796fa650a6a?w=150', // Avatar cartoon boy
];

interface AuthScreenProps {
  onAuthSuccess: (token: string) => void;
}

export default function AuthScreen({ onAuthSuccess }: AuthScreenProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(PRESET_AVATARS[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Preventative Password Validation
    if (password.length < 6) {
      setError('Password should be at least 6 characters.');
      setLoading(false);
      return;
    }

    try {
      if (isSignUp) {
        if (!name.trim()) {
          throw new Error('Please enter your full name');
        }
        // Sign up
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Set Firebase display name & photo URL
        await updateProfile(user, {
          displayName: name,
          photoURL: selectedAvatar
        });

        // Sync with backend database
        const token = await user.getIdToken();
        const syncRes = await fetch('/api/auth/sync', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ name, avatar: selectedAvatar })
        });

        if (!syncRes.ok) {
          throw new Error('Successfully created account, but profile synchronization failed. Please refresh.');
        }

        onAuthSuccess(token);
      } else {
        // Log in
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        const token = await user.getIdToken();
        // Trigger profile sync to guarantee profile exists in database
        await fetch('/api/auth/sync', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({})
        });

        onAuthSuccess(token);
      }
    } catch (err: any) {
      console.error(err);
      let errMsg = err.message || 'Authentication failed. Please check your details.';
      if (err.code === 'auth/email-already-in-use') {
        errMsg = 'This email is already registered.';
      } else if (err.code === 'auth/invalid-credential') {
        errMsg = 'Incorrect email or password.';
      } else if (err.code === 'auth/weak-password') {
        errMsg = 'Password should be at least 6 characters.';
      } else if (err.code === 'auth/operation-not-allowed') {
        errMsg = 'Email/Password authentication is not enabled. Go to your Firebase Console > Authentication > Sign-in method, and click "Enable" on Email/Password.';
      }
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await signInWithPopup(auth, googleAuthProvider);
      const user = result.user;

      const token = await user.getIdToken();
      // Sync on Postgres backend
      const syncRes = await fetch('/api/auth/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: user.displayName || user.email?.split('@')[0],
          avatar: user.photoURL || PRESET_AVATARS[0]
        })
      });

      if (!syncRes.ok) {
        throw new Error('Successfully logged in with Google, but profile synchronization failed.');
      }

      onAuthSuccess(token);
    } catch (err: any) {
      console.error(err);
      if (err.code !== 'auth/popup-closed-by-user') {
        let errMsg = err.message || 'Google authentication failed.';
        if (err.code === 'auth/operation-not-allowed') {
          errMsg = 'Google authentication is not enabled. Go to your Firebase Console > Authentication > Sign-in method, and click "Add new provider" > "Google" to enable it.';
        }
        setError(errMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#ffff25] flex items-center justify-center p-4 sm:p-6 md:p-8 font-sans overflow-y-auto">
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', damping: 20 }}
        className="w-full max-w-md bg-white border-[4px] border-black p-6 sm:p-8 rounded-[32px] shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-black"
      >
        {/* Title Capsule */}
        <div className="flex flex-col items-center text-center gap-2 mb-6">
          <div className="w-12 h-12 bg-black text-[#ffff25] rounded-2xl flex items-center justify-center font-black border-2 border-black rotate-[-4deg] shadow-[3px_3px_0px_0px_rgba(255,0,127,1)]">
            ⚡
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight font-display flex items-center gap-1.5 justify-center mt-2 leading-none">
              CIVIC HERO <span className="text-[10px] bg-black text-[#ffff25] px-1.5 py-0.5 rounded uppercase tracking-widest font-black shrink-0">LEDGER</span>
            </h1>
            <p className="text-xs text-gray-700 font-bold mt-1.5 uppercase tracking-wide">
              {isSignUp ? 'Join the neighborhood union' : 'Claim your reputation credentials'}
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 bg-[#ff3355] text-white text-xs font-black p-3 border-2 border-black rounded-xl shadow-[2px_2px_0px_rgba(0,0,0,1)] flex items-center gap-2">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* Auth form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-wider text-black">Civic Name / Pseudonym</label>
              <div className="relative">
                <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  placeholder="e.g. Captain Clean"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-white border-2 border-black text-black py-2.5 pl-10 pr-4 rounded-xl focus:outline-none focus:bg-yellow-50 text-xs font-bold transition-colors"
                />
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-wider text-black">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="email"
                placeholder="you@neighborhood.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white border-2 border-black text-black py-2.5 pl-10 pr-4 rounded-xl focus:outline-none focus:bg-yellow-50 text-xs font-bold transition-colors"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-wider text-black">Access Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="password"
                placeholder="••••••••"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white border-2 border-black text-black py-2.5 pl-10 pr-4 rounded-xl focus:outline-none focus:bg-yellow-50 text-xs font-bold transition-colors"
              />
            </div>
          </div>

          {/* Avatar selector on Sign Up */}
          {isSignUp && (
            <div className="space-y-2 pt-1">
              <label className="text-[10px] font-black uppercase tracking-wider text-black block">Choose Your Avatar Avatar</label>
              <div className="flex items-center gap-2 justify-between">
                <img 
                  src={selectedAvatar} 
                  alt="Selected avatar" 
                  className="w-12 h-12 rounded-full border-2 border-black object-cover shrink-0 shadow-[2px_2px_0px_rgba(0,0,0,1)]"
                />
                <div className="flex flex-wrap gap-1.5 max-w-[240px]">
                  {PRESET_AVATARS.map((avUrl, idx) => (
                    <button
                      type="button"
                      key={idx}
                      onClick={() => setSelectedAvatar(avUrl)}
                      className={`w-7 h-7 rounded-full overflow-hidden border-2 transition-transform active:scale-95 ${
                        selectedAvatar === avUrl ? 'border-pink-500 scale-110 shadow-sm ring-1 ring-pink-400' : 'border-black hover:border-gray-500'
                      }`}
                    >
                      <img src={avUrl} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Actions Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-4 bg-[#ff007f] hover:bg-[#e60072] text-white border-[3px] border-black font-black text-xs py-3 rounded-2xl shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? (
              <span className="flex items-center gap-1.5">
                <span className="animate-spin text-sm">⚡</span> Processing ledger...
              </span>
            ) : (
              <>
                <span className="uppercase">{isSignUp ? 'Forge Member Profile' : 'Gain Board Entry'}</span>
                {isSignUp ? <Sparkles className="w-4 h-4" /> : <LogIn className="w-4 h-4" />}
              </>
            )}
          </button>
        </form>

        <div className="relative flex py-4 items-center">
          <div className="flex-grow border-t-2 border-dashed border-gray-300"></div>
          <span className="flex-shrink mx-3 text-[10px] font-black uppercase text-gray-500">or</span>
          <div className="flex-grow border-t-2 border-dashed border-gray-300"></div>
        </div>

        {/* Google sign-in */}
        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          type="button"
          className="w-full bg-white hover:bg-gray-50 text-black border-[3px] border-black font-black text-xs py-2.5 rounded-2xl shadow-[4px_4px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#EA4335"
              d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114-3.553 0-6.433-2.88-6.433-6.433s2.88-6.433 6.433-6.433c1.633 0 3.125.61 4.274 1.62l3.056-3.056C19.263 2.213 15.932 1 12.24 1c-6.075 0-11 4.925-11 11s4.925 11 11 11c5.545 0 10.23-4.015 10.933-9.4h-10.933z"
            />
          </svg>
          <span className="uppercase">Authorize via Google</span>
        </button>

        {/* Toggle */}
        <div className="text-center mt-6">
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-xs font-black uppercase text-[#ff007f] hover:underline flex items-center gap-1 mx-auto cursor-pointer"
          >
            <span>{isSignUp ? 'I have verified credentials' : 'I need a member profile'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </motion.div>
    </div>
  );
}
