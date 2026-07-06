import React, { useState } from 'react';
import { usePortfolio } from '../../context/PortfolioContext';
import { Shield, Key, Eye, EyeOff, Lock, Unlock } from 'lucide-react';
import { hasMasterPasswordSet } from '../../services/storage';

export const LockScreen: React.FC = () => {
  const { unlock, enableEncryption } = usePortfolio();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSettingUp, setIsSettingUp] = useState(false);
  const [hasPasswordSet] = useState(hasMasterPasswordSet());

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const success = unlock(password);
    if (!success) {
      setError('Incorrect master password. Please try again.');
      setPassword('');
    }
  };

  const handleSetup = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      enableEncryption(password);
    } catch (err) {
      setError('Failed to setup password. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center relative overflow-hidden px-4">
      {/* Background glowing decorations */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl animate-float"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '-3s' }}></div>

      <div className="w-full max-w-md glass-dark p-8 rounded-3xl border border-slate-800 shadow-2xl relative z-10">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-tr from-violet-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-violet-500/20 mb-4">
            {hasPasswordSet ? (
              <Lock className="w-8 h-8 text-white animate-pulse" />
            ) : (
              <Shield className="w-8 h-8 text-white" />
            )}
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white bg-gradient-to-r from-violet-400 to-indigo-300 bg-clip-text text-transparent">
            ArthSetu Vault
          </h1>
          <p className="text-slate-400 text-xs mt-1 text-center font-mono">
            {hasPasswordSet 
              ? 'AES-256 SECURED LOCAL DATABASE' 
              : 'PRIVATE WEALTH MANAGEMENT SYSTEM'}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-950/50 border border-red-500/30 rounded-xl text-red-200 text-xs text-center">
            {error}
          </div>
        )}

        {hasPasswordSet ? (
          /* Unlock Form */
          <form onSubmit={handleUnlock} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs text-slate-400 font-medium">Enter Master Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-900/80 border border-slate-800 focus:border-violet-500 rounded-xl py-3 px-4 pl-10 text-white text-sm focus:outline-none focus:ring-1 focus:ring-violet-500 transition-all font-mono"
                  placeholder="••••••••"
                  autoFocus
                  required
                />
                <Key className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 w-5 h-5 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-medium py-3 rounded-xl transition-all duration-250 flex items-center justify-center gap-2 text-sm shadow-lg shadow-violet-600/25 hover:shadow-violet-600/35 active:scale-[0.98]"
            >
              <Unlock className="w-4 h-4" /> Unlock Vault
            </button>
          </form>
        ) : isSettingUp ? (
          /* Password Setup Form */
          <form onSubmit={handleSetup} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs text-slate-400 font-medium">Choose Master Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-900/80 border border-slate-800 focus:border-violet-500 rounded-xl py-3 px-4 pl-10 text-white text-sm focus:outline-none focus:ring-1 focus:ring-violet-500 transition-all font-mono"
                  placeholder="New Password (min 6 chars)"
                  required
                />
                <Key className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-slate-400 font-medium">Confirm Master Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-slate-900/80 border border-slate-800 focus:border-violet-500 rounded-xl py-3 px-4 pl-10 text-white text-sm focus:outline-none focus:ring-1 focus:ring-violet-500 transition-all font-mono"
                  placeholder="Confirm Password"
                  required
                />
                <Key className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-medium py-3 rounded-xl transition-all duration-250 flex items-center justify-center gap-2 text-sm shadow-lg shadow-emerald-600/25 active:scale-[0.98]"
            >
              <Shield className="w-4 h-4" /> Initialize & Encrypt
            </button>
            
            <button
              type="button"
              onClick={() => {
                setPassword('');
                setConfirmPassword('');
                setError('');
                setIsSettingUp(false);
              }}
              className="w-full text-slate-400 hover:text-slate-300 transition-colors text-xs text-center block pt-2 underline"
            >
              Go back
            </button>
          </form>
        ) : (
          /* Greeting / Initial Choice Screen */
          <div className="space-y-4">
            <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl text-slate-300 text-xs leading-relaxed space-y-2">
              <p>
                <strong>Welcome!</strong> This is a secure, local-first financial dashboard. 
                Everything remains stored right on your computer.
              </p>
              <p>
                To secure your assets against unauthorized physical access to this computer, you can initialize a master password. 
                This will encrypt your portfolio with AES-256.
              </p>
            </div>

            <button
              onClick={() => {
                setPassword('');
                setConfirmPassword('');
                setError('');
                setIsSettingUp(true);
              }}
              className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-medium py-3 rounded-xl transition-all text-sm flex items-center justify-center gap-2 shadow-lg shadow-violet-600/25 active:scale-[0.98]"
            >
              <Shield className="w-4 h-4" /> Setup Master Password (AES-256)
            </button>

            <button
              onClick={() => {
                unlock(''); // triggers loading and bypasses locking
              }}
              className="w-full bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-200 font-medium py-3 rounded-xl transition-all text-sm flex items-center justify-center gap-2 active:scale-[0.98]"
            >
              Enter Sandbox (No Password / Local Plaintext)
            </button>
          </div>
        )}

        <div className="mt-8 text-center text-[10px] text-slate-500 font-mono tracking-wider uppercase">
          ✦ Zero Tracking • Zero Analytics • Zero Cloud ✦
        </div>
      </div>
    </div>
  );
};
