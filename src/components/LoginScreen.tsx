import React from 'react';
import { motion } from 'motion/react';
import { Lock, AlertCircle, ChevronRight, X } from 'lucide-react';
import { useAppContext } from '../AppContext';

export default function LoginScreen() {
  const {
    accessCodeInput, setAccessCodeInput,
    loginError,
    handleCodeLogin,
    rememberedUsers,
    removeRememberedUser,
    setIsOnboardingOpen,
  } = useAppContext();

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 bg-neutral-50 min-h-[85vh]">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        className="w-full max-w-sm bg-white rounded-2xl border border-neutral-100 shadow-sm p-8 flex flex-col space-y-6 t-slide-up"
      >
        {/* Logo / App name */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 bg-neutral-900 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-bold">O</span>
            </div>
            <span className="text-xl font-bold tracking-tight text-neutral-900">OrbitX</span>
          </div>
          <p className="text-sm text-neutral-400 leading-relaxed">
            Enter your access code to sign in to your workspace.
          </p>
        </div>

        {/* Access code input */}
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-neutral-500 mb-1.5">Access Code</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
              <input
                type="text"
                className={`w-full text-sm pl-10 pr-4 py-3 border rounded-xl focus:outline-none focus:bg-white transition-all uppercase font-mono placeholder:lowercase placeholder:font-sans ${
                  loginError
                    ? 'bg-red-50 border-red-300 focus:border-red-400'
                    : 'bg-neutral-50 border-neutral-200 focus:border-neutral-900'
                }`}
                placeholder="e.g. ECO-WRITE-2"
                value={accessCodeInput}
                onChange={(e) => setAccessCodeInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCodeLogin(accessCodeInput);
                }}
              />
            </div>
          </div>

          {loginError && (
            <p key={loginError} className="text-xs text-red-600 font-medium flex items-center gap-1.5 t-shake">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{loginError}</span>
            </p>
          )}

          <motion.button
            type="button"
            onClick={() => handleCodeLogin(accessCodeInput)}
            whileTap={{ scale: 0.97 }}
            className="w-full bg-neutral-900 hover:bg-neutral-800 text-white text-sm font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-1.5"
          >
            <span>Sign In</span>
            <ChevronRight className="w-4 h-4" />
          </motion.button>
        </div>

        {/* Saved users */}
        <div className="border-t border-neutral-100 pt-5">
          <span className="block text-xs font-bold uppercase tracking-widest text-neutral-400 mb-2">
            Saved on this device
          </span>

          <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin">
            {rememberedUsers.length === 0 ? (
              <p className="text-xs text-neutral-400 text-center py-3 italic">
                No saved profiles on this device.
              </p>
            ) : (
              rememberedUsers.map(user => (
                <div
                  key={user.id}
                  className="flex items-center gap-2 bg-white border border-neutral-200 rounded-xl px-3 py-2 hover:border-neutral-400 transition-colors group"
                >
                  <button
                    type="button"
                    onClick={() => handleCodeLogin(user.accessCode)}
                    className="flex-1 flex items-center gap-2.5 min-w-0 text-left"
                  >
                    <div className="w-6 h-6 rounded-full bg-neutral-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-[10px] font-bold text-neutral-600">
                        {user.username.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span className="text-sm font-medium text-neutral-800 truncate">{user.username}</span>
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeRememberedUser(user.id);
                    }}
                    className="text-neutral-300 hover:text-neutral-600 transition-colors flex-shrink-0"
                    title="Forget this profile"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>

          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => setIsOnboardingOpen(true)}
              className="text-sm text-neutral-400 hover:text-neutral-900 underline underline-offset-2 transition-colors"
            >
              Check-In New User
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
