import React from 'react';
import { Lock, AlertCircle, ChevronRight, Layers, X } from 'lucide-react';
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
    <div className="flex-1 flex flex-col items-center justify-center p-6 bg-[#fafafa] min-h-[85vh]">
      <div className="w-full max-w-md bg-white rounded-2xl border border-[#e5e5e5] shadow-xl overflow-hidden p-8 flex flex-col space-y-6">
        <div>
          <div className="flex items-center space-x-2 text-neutral-400 text-xs font-mono uppercase tracking-widest mb-4">
            <Layers className="w-4 h-4 text-emerald-600" />
            <span>Conglomerate Identity</span>
          </div>
          <h2 className="text-2xl font-black tracking-tight leading-tight mb-3 text-neutral-900">
            System Access Portal
          </h2>
          <p className="text-xs text-neutral-500 leading-relaxed">
            Provide your universal access code to mount your clearance across all subsidiary brand workspaces.
          </p>
        </div>

        <div>
          <div className="space-y-3">
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4.5 w-4.5 text-neutral-400" />
              <input
                type="text"
                className="w-full text-sm pl-10 pr-4 py-2.5 bg-neutral-50 border border-[#d4d4d4] rounded-lg focus:outline-none focus:border-neutral-950 focus:bg-white text-neutral-900 uppercase font-mono placeholder:lowercase"
                placeholder={`e.g. ECO-WRITE-2`}
                value={accessCodeInput}
                onChange={(e) => setAccessCodeInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCodeLogin(accessCodeInput);
                }}
              />
            </div>

            {loginError && (
              <p className="text-[10px] text-red-600 font-semibold flex items-center space-x-1">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{loginError}</span>
              </p>
            )}

            <button
              type="button"
              onClick={() => handleCodeLogin(accessCodeInput)}
              className="w-full bg-neutral-900 hover:bg-neutral-800 active:bg-black text-white text-xs font-bold py-2.5 rounded-lg transition-colors flex items-center justify-center space-x-1"
            >
              <span>Authenticate Code</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="border-t border-[#f5f5f5] pt-4">
          <span className="block text-[10px] font-bold text-[#737373] uppercase mb-2 font-mono">
            Saved on this device
          </span>
          
          <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin">
            {rememberedUsers.length === 0 ? (
              <p className="text-[10px] text-neutral-400 text-center py-3 font-mono italic">
                No saved profiles on this device.
              </p>
            ) : (
              rememberedUsers.map(user => (
                <div
                  key={user.id}
                  className="w-full text-left p-2 rounded bg-neutral-50 hover:bg-[#171717] group flex items-center justify-between text-xs transition-colors border border-neutral-200/50"
                >
                  <button
                    type="button"
                    onClick={() => handleCodeLogin(user.accessCode)}
                    className="flex-1 text-left flex items-center justify-between min-w-0"
                  >
                    <div>
                      <strong className="block font-bold text-[11px] text-neutral-800 group-hover:text-white leading-none mb-1">
                        {user.username}
                      </strong>
                      <span className="block text-[9px] text-[#737373] group-hover:text-neutral-300 font-mono tracking-widest uppercase">
                        {user.role}
                      </span>
                    </div>
                    <span className="text-[9px] font-mono tracking-widest bg-white group-hover:bg-neutral-800 border group-hover:border-neutral-600 group-hover:text-white border-[#d4d4d4] text-neutral-600 px-1.5 py-0.5 rounded shadow-xs transition-colors mr-2">
                      {user.accessCode}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeRememberedUser(user.id);
                    }}
                    className="p-0.5 rounded-full hover:bg-red-100 text-neutral-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0"
                    title="Forget this profile"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>

          <div className="mt-3 pt-3 border-t border-neutral-100">
            <button
              type="button"
              onClick={() => setIsOnboardingOpen(true)}
              className="w-full text-xs font-bold text-neutral-800 bg-neutral-100 hover:bg-neutral-200 px-3.5 py-2 rounded-lg border border-neutral-200 transition-all flex items-center justify-center space-x-1"
            >
              <span>➕ Provision New Role Account</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
